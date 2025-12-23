/**
 * GET/POST /api/copy-trade/tick-cron
 * Background cron job (runs every 5 minutes)
 * - Updates PnL for all active positions
 * - Checks for auto-liquidation
 * - Processes waitlist (notify next person when spot opens)
 * - Expires old claims (24hr timeout)
 * - Updates trader stats
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { COPY_TRADE_ENABLED } from "@/lib/feature-flags";
import { createAdminClient } from "@/lib/supabase/admin";
import { Resend } from "resend";
import { calculatePnLUpdate } from "@/lib/copy-trade/pnl-simulator";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function GET(request: NextRequest) {
  return handleTickCron(request);
}

export async function POST(request: NextRequest) {
  return handleTickCron(request);
}

async function handleTickCron(request: NextRequest) {
  try {
    console.log("Copy-trade tick cron started");
    // Feature flag check
    if (!COPY_TRADE_ENABLED) {
      console.log("Copy trade feature is disabled");
      return NextResponse.json(
        { error: "Feature not available" },
        { status: 404 }
      );
    }

    // Verify cron authorization
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      if (process.env.NODE_ENV === "production") {
        console.log("Unauthorized cron request in production");
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    }

    const supabase =  createAdminClient();
    const now = new Date();

    let pnlUpdatesCount = 0;
    let liquidationsCount = 0;
    let waitlistNotificationsCount = 0;
    let expiredClaimsCount = 0;

    // ──── 1. UPDATE PNL FOR ALL ACTIVE POSITIONS ────

    console.log("Starting PnL updates for active positions");
    const { data: activePositions, error: positionsError } = await supabase
      .from("user_copy_positions")
      .select(
        `
        *,
        trader:traders(*)
      `
      )
      .eq("status", "active");

    if (positionsError) {
      console.error("Error fetching active positions:", positionsError);
    }

    console.log(`Found ${activePositions?.length || 0} active positions`);

    if (!positionsError && activePositions) {
      for (const position of activePositions) {
        const trader = position.trader;
        if (!trader) {
          console.log(`Skipping position ${position.id}: no trader found`);
          continue;
        }

        const allocation = Number(position.allocation_usdt);
        const currentPnl = Number(position.current_pnl);
        const params = position.simulation_params;

        // Skip positions without simulation params (migration safety)
        if (!params || !params.daily_drift) {
          console.log(
            `Position ${position.id} missing simulation params, skipping`
          );
          continue;
        }

        // Calculate new P&L using realistic algorithm
        const { newPnl, newMomentum } = calculatePnLUpdate(
          allocation,
          currentPnl,
          params,
          new Date(position.started_at),
          position.trader_id
        );

        const pnlChange = newPnl - currentPnl;
        const changePercent = ((pnlChange / allocation) * 100).toFixed(4);
        const totalReturnPercent = ((newPnl / allocation) * 100).toFixed(2);

        console.log(`Position ${position.id}:`, {
          allocation: allocation.toFixed(2),
          previousPnl: currentPnl.toFixed(2),
          newPnl: newPnl.toFixed(2),
          change: pnlChange.toFixed(2),
          changePercent: `${changePercent}%`,
          totalReturn: `${totalReturnPercent}%`,
          momentum: newMomentum.toFixed(3),
        });

        // Update position with new P&L and momentum
        const { error: updateError } = await supabase
          .from("user_copy_positions")
          .update({
            current_pnl: newPnl,
            simulation_params: {
              ...params,
              momentum: newMomentum,
            },
          })
          .eq("id", position.id);

        if (updateError) {
          console.error(
            `Failed to update PnL for position ${position.id}:`,
            updateError
          );
        } else {
          console.log(
            `Successfully updated PnL for position ${position.id}: ${currentPnl.toFixed(2)} -> ${newPnl.toFixed(2)} (${pnlChange >= 0 ? '+' : ''}${pnlChange.toFixed(2)})`
          );
          pnlUpdatesCount++;
        }
      }
    }

    console.log(`Completed ${pnlUpdatesCount} PnL updates`);

    // ──── 2. CHECK FOR AUTO-LIQUIDATION ────

    console.log("Checking for auto-liquidation");
    const { data: positionsForLiquidation } = await supabase
      .from("user_copy_positions")
      .select(
        `
        *,
        trader:traders(*)
      `
      )
      .eq("status", "active");

    console.log(
      `Checking ${positionsForLiquidation?.length || 0} positions for liquidation`
    );

    if (positionsForLiquidation) {
      for (const position of positionsForLiquidation) {
        // Get user's current USDT balance from user_balances
        const { data: userBalance } = await supabase
          .from("user_balances")
          .select("id, balance, base_token_id, base_tokens!inner(symbol)")
          .eq("user_id", position.user_id)
          .eq("base_tokens.symbol", "USDT")
          .single();

        if (!userBalance) {
          console.log(`No USDT balance found for user ${position.user_id}`);
          continue;
        }

        const balance = parseFloat(String(userBalance.balance));
        const allocation = Number(position.allocation_usdt);
        const currentPnl = Number(position.current_pnl);

        // Liquidate if balance drops below 10% of allocation (example threshold)
        const liquidationThreshold = allocation * 0.1;

        console.log(`Position ${position.id} liquidation check:`, {
          balance,
          allocation,
          currentPnl,
          liquidationThreshold,
          shouldLiquidate: balance < liquidationThreshold && currentPnl < 0,
        });

        if (balance < liquidationThreshold && currentPnl < 0) {
          // Force stop - liquidate at current loss
          const trader = position.trader;
          if (!trader) continue;

          const profit = 0; // No performance fee on liquidation losses
          const userReceives = allocation + currentPnl;

          // Credit user (even if negative PnL) using database function
          const { error: balanceUpdateError } = await supabase.rpc(
            "update_user_balance",
            {
              p_user_id: position.user_id,
              p_base_token_id: userBalance.base_token_id,
              p_amount: userReceives,
              p_operation: "credit",
            }
          );

          if (balanceUpdateError) {
            console.error(
              `Failed to update balance for user ${position.user_id}:`,
              balanceUpdateError
            );
          }

          // Update position to liquidated
          const { error: positionUpdateError } = await supabase
            .from("user_copy_positions")
            .update({
              status: "liquidated",
              stopped_at: now.toISOString(),
              final_pnl: currentPnl,
              performance_fee_paid: 0,
            })
            .eq("id", position.id);

          if (positionUpdateError) {
            console.error(
              `Failed to liquidate position ${position.id}:`,
              positionUpdateError
            );
          } else {
            console.log(
              `Successfully liquidated position ${position.id} with PnL: ${currentPnl}`
            );
          }

          // Update trader stats
          const currentCopiers = Number(trader.current_copiers);
          const newCopiers = Math.max(0, currentCopiers - 1);
          const currentAum = Number(trader.aum_usdt);
          const newAum = Math.max(0, currentAum - allocation);

          const { error: traderUpdateError } = await supabase
            .from("traders")
            .update({
              current_copiers: newCopiers,
              aum_usdt: newAum,
            })
            .eq("id", trader.id);

          if (traderUpdateError) {
            console.error(
              `Failed to update trader ${trader.id} stats:`,
              traderUpdateError
            );
          }

          liquidationsCount++;
        }
      }
    }

    console.log(`Processed ${liquidationsCount} liquidations`);

    // ──── 3. PROCESS WAITLIST - NOTIFY NEXT PERSON ────

    console.log("Processing waitlist");
    // Find traders with available capacity and waitlist
    const { data: traders } = await supabase.from("traders").select("*");

    console.log(`Found ${traders?.length || 0} traders`);

    if (traders) {
      for (const trader of traders) {
        const currentCopiers = Number(trader.current_copiers);
        const maxCopiers = Number(trader.max_copiers);

        console.log(
          `Trader ${trader.name}: ${currentCopiers}/${maxCopiers} copiers`
        );

        if (currentCopiers < maxCopiers) {
          // Get first person in waitlist
          const { data: nextInLine, error: waitlistError } = await supabase
            .from("trader_waitlist")
            .select(
              `
              *,
              profile:profiles(email, full_name)
            `
            )
            .eq("trader_id", trader.id)
            .eq("status", "waiting")
            .order("created_at", { ascending: true })
            .limit(1)
            .single();

          if (waitlistError) {
            console.log(
              `No waitlist entries found for trader ${trader.name}:`,
              waitlistError.message
            );
          }

          if (!waitlistError && nextInLine) {
            console.log(
              `Found next in line for trader ${trader.name}:`,
              nextInLine.id
            );

            // Generate claim token and expiry
            const claimToken = crypto.randomUUID();
            const claimExpiresAt = new Date(
              now.getTime() + 24 * 60 * 60 * 1000
            ); // 24 hours

            // Update waitlist entry
            const { error: waitlistUpdateError } = await supabase
              .from("trader_waitlist")
              .update({
                status: "notified",
                claim_token: claimToken,
                claim_expires_at: claimExpiresAt.toISOString(),
                notified_at: now.toISOString(),
              })
              .eq("id", nextInLine.id);

            if (waitlistUpdateError) {
              console.error(
                `Failed to update waitlist entry ${nextInLine.id}:`,
                waitlistUpdateError
              );
              continue;
            }

            // TODO: Convert to use proper email template instead of inline HTML
            // Template needed: CopyTradeSpotAvailableEmail
            // Send email notification
            try {
              const claimUrl = `${process.env.NEXT_PUBLIC_APP_URL}/copy-trade/claim/${claimToken}`;

              console.log(
                `Sending email notification to ${nextInLine.profile?.email} for trader ${trader.name}`
              );

              // TODO: Replace with: await sendCopyTradeSpotAvailableEmail({...})
              await resend.emails.send({
                from: "Copy Trade <noreply@yourdomain.com>",
                to: nextInLine.profile?.email || "",
                subject: `Your spot is ready - ${trader.name} | Copy Trading`,
                html: `
                  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2>Good News! Your Spot is Ready</h2>
                    <p>Hi ${nextInLine.profile?.full_name || "there"},</p>
                    <p>A spot has opened up for <strong>${trader.name}</strong>!</p>

                    <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
                      <h3>${trader.name}</h3>
                      <p><strong>Strategy:</strong> ${trader.strategy}</p>
                      <p><strong>Monthly ROI:</strong> ${trader.historical_roi_min}% - ${trader.historical_roi_max}%</p>
                      <p><strong>Performance Fee:</strong> ${trader.performance_fee_percent}%</p>
                      <p><strong>Risk Level:</strong> ${trader.risk_level}</p>
                    </div>

                    <p><strong>You have 24 hours to claim this spot.</strong></p>

                    <a href="${claimUrl}" style="display: inline-block; background: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0;">
                      Claim Your Spot
                    </a>

                    <p style="color: #666; font-size: 14px;">
                      If you don't claim within 24 hours, this spot will be offered to the next person in line.
                    </p>
                  </div>
                `,
              });

              console.log(
                `Successfully sent waitlist notification for trader ${trader.name}`
              );
              waitlistNotificationsCount++;
            } catch (emailError) {
              console.error("Failed to send waitlist email:", emailError);
            }
          }
        }
      }
    }

    console.log(`Sent ${waitlistNotificationsCount} waitlist notifications`);

    // ──── 4. EXPIRE OLD CLAIMS (24hr timeout) ────

    console.log("Checking for expired claims");
    const { data: expiredClaims, error: expiredError } = await supabase
      .from("trader_waitlist")
      .select("*")
      .eq("status", "notified")
      .lt("claim_expires_at", now.toISOString());

    if (expiredError) {
      console.error("Error fetching expired claims:", expiredError);
    }

    console.log(`Found ${expiredClaims?.length || 0} expired claims`);

    if (!expiredError && expiredClaims) {
      for (const claim of expiredClaims) {
        const { error: updateError } = await supabase
          .from("trader_waitlist")
          .update({ status: "expired" })
          .eq("id", claim.id);

        if (updateError) {
          console.error(`Failed to expire claim ${claim.id}:`, updateError);
        } else {
          console.log(`Successfully expired claim ${claim.id}`);
          expiredClaimsCount++;
        }
      }
    }

    console.log(`Expired ${expiredClaimsCount} claims`);

    // ──── 5. UPDATE TRADER STATS ────

    console.log("Updating trader stats");
    if (traders) {
      for (const trader of traders) {
        // Ensure monthly_roi stays within range
        const stats = trader.stats || {};
        const currentRoi = stats.monthly_roi || 0;
        const min = Number(trader.historical_roi_min);
        const max = Number(trader.historical_roi_max);

        // Ensure ROI is within bounds
        const boundedRoi = Math.max(min, Math.min(max, currentRoi));

        const { error: traderUpdateError } = await supabase
          .from("traders")
          .update({
            stats: {
              ...stats,
              monthly_roi: boundedRoi,
            },
            updated_at: now.toISOString(),
          })
          .eq("id", trader.id);

        if (traderUpdateError) {
          console.error(
            `Failed to update trader ${trader.id} stats:`,
            traderUpdateError
          );
        }
      }
    }

    console.log("Copy-trade tick cron completed");

    return NextResponse.json({
      success: true,
      message: "Tick cron completed successfully",
      stats: {
        pnl_updates: pnlUpdatesCount,
        liquidations: liquidationsCount,
        waitlist_notifications: waitlistNotificationsCount,
        expired_claims: expiredClaimsCount,
      },
      timestamp: now.toISOString(),
    });
  } catch (error) {
    console.error("Copy-trade tick cron error:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
