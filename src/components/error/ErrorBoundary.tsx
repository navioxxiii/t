/**
 * Error Boundary Component
 * Catches React errors and displays a fallback UI
 */

"use client";

import React from "react";
import { AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { branding } from "@/config/branding";
import Link from "next/link";

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{ error: Error; resetError: () => void }>;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorId: string;
}

export class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorId: "",
    };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      error,
      errorId: Date.now().toString(36), // Generate error ID here, not during render
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error to console in development
    console.error("ErrorBoundary caught an error:", error, errorInfo);

    // In production, you could send this to an error reporting service
    // e.g., Sentry, LogRocket, etc.
  }

  resetError = () => {
    this.setState({ hasError: false, error: null, errorId: "" });
  };

  render() {
    if (this.state.hasError && this.state.error) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        const FallbackComponent = this.props.fallback;
        return (
          <FallbackComponent
            error={this.state.error}
            resetError={this.resetError}
          />
        );
      }

      // Default fallback UI
      return (
        <DefaultErrorFallback
          error={this.state.error}
          resetError={this.resetError}
          errorId={this.state.errorId}
        />
      );
    }

    return this.props.children;
  }
}

export function DefaultErrorFallback({
  error,
  resetError,
  errorId,
}: {
  error: Error;
  resetError: () => void;
  errorId: string;
}) {
  const handleGoHome = () => {
    window.location.href = "/";
  };

  const handleGoDashboard = () => {
    window.location.href = "/dashboard";
  };

  const handleReload = () => {
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-bg-primary flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-action-red/5 rounded-full blur-3xl animate-pulse" />
        <div
          className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-action-red/3 rounded-full blur-3xl animate-pulse"
          style={{ animationDelay: "1s" }}
        />
      </div>

      <div className="max-w-2xl w-full space-y-8 relative z-10">
        {/* Icon */}
        <div className="flex justify-center animate-fade-in">
          <div className="relative">
            <div className="w-24 h-24 rounded-full bg-bg-secondary border-2 border-bg-tertiary flex items-center justify-center">
              <AlertCircle className="w-12 h-12 text-action-red animate-pulse" />
            </div>
            <div className="absolute -inset-3 bg-action-red/20 rounded-full blur-xl animate-pulse" />
          </div>
        </div>

        {/* Title and Message */}
        <div
          className="text-center space-y-3 animate-fade-in"
          style={{ animationDelay: "0.1s" }}
        >
          <h1 className="text-3xl md:text-4xl font-bold text-text-primary">
            Oops! Something Went Wrong
          </h1>
          <p className="text-lg text-text-secondary max-w-md mx-auto">
            We&apos;re sorry for the inconvenience. An unexpected error occurred
            while processing your request.
          </p>
        </div>

        {/* Error details (development only) */}
        {process.env.NODE_ENV === "development" && (
          <div className="animate-fade-in" style={{ animationDelay: "0.2s" }}>
            <Alert
              variant="destructive"
              className="bg-red-500/10 border-red-500/20"
            >
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="font-mono text-xs break-all">
                <strong className="block mb-1 text-sm">
                  Error Details (Dev Mode):
                </strong>
                {error.message}
                {error.stack && (
                  <details className="mt-2">
                    <summary className="cursor-pointer hover:text-text-primary">
                      Stack Trace
                    </summary>
                    <pre className="mt-2 text-[10px] overflow-auto max-h-40">
                      {error.stack}
                    </pre>
                  </details>
                )}
              </AlertDescription>
            </Alert>
          </div>
        )}

        {/* Actions */}
        <div
          className="space-y-4 animate-fade-in"
          style={{ animationDelay: "0.3s" }}
        >
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              onClick={resetError}
              size="lg"
              className="flex-1 gap-2 group"
            >
              <RefreshCw className="w-5 h-5 group-hover:rotate-180 transition-transform duration-500" />
              Try Again
            </Button>
            <Button
              variant="outline"
              onClick={handleReload}
              size="lg"
              className="flex-1 gap-2"
            >
              <RefreshCw className="w-5 h-5" />
              Reload Page
            </Button>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              variant="outline"
              onClick={handleGoDashboard}
              className="flex-1"
            >
              Go to Dashboard
            </Button>
            <Button variant="outline" onClick={handleGoHome} className="flex-1">
              Go to Home
            </Button>
          </div>
        </div>

        {/* Support section */}
        <div
          className="pt-8 border-t border-bg-tertiary space-y-4 animate-fade-in"
          style={{ animationDelay: "0.4s" }}
        >
          <div className="text-center">
            <h3 className="text-sm font-semibold text-text-primary mb-2">
              Need Help?
            </h3>
            <p className="text-sm text-text-secondary mb-4">
              If this error continues to occur, our support team is here to
              help.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center items-center text-sm">
            <a
              href={`mailto:${branding.company.email}`}
              className="px-6 py-2 rounded-lg bg-bg-secondary border border-bg-tertiary hover:border-brand-primary/50 text-text-secondary hover:text-text-primary transition-all hover:scale-105"
            >
              Contact Support
            </a>
            <Link
              href="/"
              className="px-6 py-2 rounded-lg bg-bg-secondary border border-bg-tertiary hover:border-brand-primary/50 text-text-secondary hover:text-text-primary transition-all hover:scale-105"
            >
              Visit Help Center
            </Link>
          </div>
        </div>

        {/* Additional info */}
        <div
          className="text-center text-xs text-text-tertiary animate-fade-in"
          style={{ animationDelay: "0.5s" }}
        >
          <p>Error ID: {errorId}</p>
          <p className="mt-1">
            This error has been logged and will be reviewed by our team.
          </p>
        </div>
      </div>
    </div>
  );
}
