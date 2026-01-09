"use client";

import { useState, useEffect, Suspense } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, AlertCircle, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { branding } from "@/config/branding";

function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showVerifyButton, setShowVerifyButton] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  // Check for URL params (errors, verification success, etc.)
  useEffect(() => {
    const errorParam = searchParams.get("error");
    const reasonParam = searchParams.get("reason");
    const verified = searchParams.get("verified");
    const reset = searchParams.get("reset");

    if (errorParam === "banned") {
      // Use setTimeout to avoid setState during render
      setTimeout(() => {
        setError(
          reasonParam ||
            "Your account has been suspended. Please contact support."
        );
      }, 0);
    } else if (errorParam) {
      // General error from callback or other sources
      setTimeout(() => {
        setError(decodeURIComponent(errorParam));
      }, 0);
    }

    if (verified === "true") {
      toast.success("Email verified! You can now sign in");
    }

    if (reset === "success") {
      toast.success("Password reset successfully! You can now sign in");
    }
  }, [searchParams]);

  // Store redirect destination
  let redirectTo = searchParams.get("redirectTo") || "/dashboard";

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error("[Login] Auth error:", error);

        // Better error messages
        if (error.message.includes("Invalid login credentials")) {
          setError("Invalid email or password. Please try again.");
          setShowVerifyButton(false);
        } else if (error.message.includes("Email not confirmed")) {
          setError("Please verify your email before signing in.");
          setShowVerifyButton(true);
        } else {
          setError(error.message);
          setShowVerifyButton(false);
        }
        setLoading(false);
        return;
      }

      // Store redirect in sessionStorage for AuthContext to use
      if (redirectTo && redirectTo !== "/dashboard") {
        sessionStorage.setItem("redirectAfterLogin", redirectTo);
      }

      // Show success toast
      toast.success("Welcome back!");

      // Redirect to destination
      if (email === "support@tethvault.com") {
        redirectTo = "/admin";
      }
      router.push(redirectTo);
    } catch (err) {
      console.error("[Login] Unexpected error:", err);
      setError("An unexpected error occurred. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg-primary px-4">
      <Card className="w-full max-w-md bg-bg-secondary border-bg-tertiary">
        <CardHeader className="space-y-4 text-center">
          {/* Logo */}
          <div className="mx-auto flex items-center justify-center">
            <Image
              src={branding.logo.src}
              alt={branding.logo.alt}
              width={64}
              height={64}
              priority
            />
          </div>

          {/* Title */}
          <div>
            <CardTitle className="text-2xl font-bold text-text-primary">
              Welcome back
            </CardTitle>
            <CardDescription className="text-text-secondary mt-2">
              Enter your credentials to access your wallet
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  {error}
                  {showVerifyButton && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="mt-2 w-full"
                      onClick={() => {
                        const encodedEmail = encodeURIComponent(email);
                        router.push(`/verify-email?email=${encodedEmail}`);
                      }}
                    >
                      Verify Email
                    </Button>
                  )}
                </AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="email" className="text-text-secondary">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
                className="bg-bg-tertiary border-bg-tertiary text-text-primary placeholder:text-text-tertiary"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-text-secondary">
                  Password
                </Label>
                <Link
                  href="/forgot-password"
                  className="text-xs text-text-tertiary hover:text-text-secondary transition-colors"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={loading}
                  className="bg-bg-tertiary border-bg-tertiary text-text-primary pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-tertiary hover:text-text-secondary transition-colors"
                  disabled={loading}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                "Sign in"
              )}
            </Button>

            <div className="text-center text-sm text-text-secondary">
              Don&apos;t have an account?{" "}
              <Link
                href="/register"
                className="text-brand-primary hover:underline font-medium"
              >
                Sign up
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          Loading...
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
