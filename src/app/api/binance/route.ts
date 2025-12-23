import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const ping = searchParams.get("ping");
    const symbol = searchParams.get("symbol");
    const symbols = searchParams.get("symbols");

    let url: string;

    // Handle ping requests
    if (ping === "true") {
      url = "https://api.binance.us/api/v3/ping";
    } else if (symbols) {
      // Batch request for multiple symbols
      url = `https://api.binance.us/api/v3/ticker/24hr?symbols=${encodeURIComponent(
        symbols
      )}`;
    } else if (symbol) {
      // Single symbol request
      url = `https://api.binance.us/api/v3/ticker/24hr?symbol=${symbol}`;
    } else {
      // Default to BTCUSD if no symbol specified
      url = "https://api.binance.us/api/v3/ticker/24hr?symbol=BTCUSD";
    }
    // Validate the symbol format for single symbol requests
    if (symbol && !/^[A-Z0-9]+$/.test(symbol)) {
      return NextResponse.json(
        { error: "Invalid symbol format" },
        {
          status: 400,
          headers: {
            "Access-Control-Allow-Origin": "*",
          },
        }
      );
    }

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });
    if (!response.ok) {
      throw new Error(`Binance API responded with status: ${response.status}`);
    }

    const data = await response.json();

    return NextResponse.json(data, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      },
    });
  } catch (error) {
    console.error("Error fetching from Binance:", error);
    return NextResponse.json(
      { error: "Failed to fetch data from Binance" },
      {
        status: 500,
        headers: {
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
}
