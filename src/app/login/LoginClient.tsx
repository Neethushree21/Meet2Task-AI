"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";
import { Github, Zap, ArrowRight, CheckCircle2, Bot, GitBranch, FileText } from "lucide-react";

const features = [
  { icon: Bot, text: "AI-powered task extraction from meetings" },
  { icon: GitBranch, text: "Auto-create GitHub issues & Jira tickets" },
  { icon: FileText, text: "Push meeting notes to Notion automatically" },
];

export function LoginClient() {
  const [loading, setLoading] = useState(false);

  const handleSignIn = async () => {
    setLoading(true);
    await signIn("github", { callbackUrl: "/dashboard" });
  };

  return (
    <div className="min-h-screen bg-surface flex">
      {/* Left Panel */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden flex-col items-center justify-center p-12">
        <div className="absolute inset-0 bg-gradient-to-br from-brand-900/80 via-surface to-surface" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-brand-600/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-purple-600/10 rounded-full blur-3xl" />

        <div className="relative z-10 max-w-md">
          {/* Logo */}
          <div className="flex items-center gap-3 mb-12">
            <div className="w-12 h-12 gradient-brand rounded-xl flex items-center justify-center">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-text-primary">Meet2Task AI</h1>
              <p className="text-sm text-text-muted">Engineering Meeting Intelligence</p>
            </div>
          </div>

          {/* Headline */}
          <h2 className="text-4xl font-bold text-text-primary leading-tight mb-4">
            Turn meetings into{" "}
            <span className="text-gradient">developer tasks</span>{" "}
            automatically
          </h2>
          <p className="text-text-secondary mb-10 leading-relaxed">
            Upload or record your engineering meetings. Our AI extracts tasks, bugs, and
            decisions — then pushes them directly to GitHub, Jira, and Notion.
          </p>

          {/* Features */}
          <div className="space-y-4">
            {features.map((feature, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-8 h-8 bg-brand-600/20 rounded-lg flex items-center justify-center flex-shrink-0">
                  <feature.icon className="w-4 h-4 text-brand-400" />
                </div>
                <span className="text-sm text-text-secondary">{feature.text}</span>
              </div>
            ))}
          </div>

          {/* Pipeline visual */}
          <div className="mt-12 p-5 card">
            <p className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-4">
              Workflow Pipeline
            </p>
            <div className="flex items-center gap-2 flex-wrap">
              {["Meeting", "Sarvam AI", "Gemini AI", "GitHub", "Jira", "Notion"].map(
                (step, i, arr) => (
                  <div key={step} className="flex items-center gap-2">
                    <span className="text-xs bg-surface-elevated border border-surface-border px-2.5 py-1 rounded-full text-text-secondary">
                      {step}
                    </span>
                    {i < arr.length - 1 && (
                      <ArrowRight className="w-3 h-3 text-text-muted flex-shrink-0" />
                    )}
                  </div>
                )
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="flex items-center gap-3 mb-8 lg:hidden">
            <div className="w-10 h-10 gradient-brand rounded-xl flex items-center justify-center">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-text-primary">Meet2Task AI</h1>
            </div>
          </div>

          <div className="card p-8">
            <div className="mb-8">
              <h3 className="text-2xl font-bold text-text-primary mb-2">
                Welcome back
              </h3>
              <p className="text-text-secondary text-sm">
                Sign in with your GitHub account to continue
              </p>
            </div>

            <button
              onClick={handleSignIn}
              disabled={loading}
              id="github-signin-btn"
              className="w-full flex items-center justify-center gap-3 bg-[#24292f] hover:bg-[#2d333b] border border-[#444c56] text-white font-medium py-3 px-6 rounded-xl transition-all duration-200 mb-6 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? (
                <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
              ) : (
                <Github className="w-5 h-5" />
              )}
              {loading ? "Signing in..." : "Continue with GitHub"}
            </button>

            <div className="space-y-3">
              {[
                "Automatic task assignment from meeting context",
                "GitHub issues created with correct assignees",
                "Team collaboration across projects",
              ].map((benefit, i) => (
                <div key={i} className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-brand-400 mt-0.5 flex-shrink-0" />
                  <span className="text-xs text-text-secondary">{benefit}</span>
                </div>
              ))}
            </div>

            <p className="text-xs text-text-muted mt-6 text-center">
              By signing in, you agree to our{" "}
              <span className="text-brand-400 cursor-pointer hover:underline">Terms of Service</span>
              {" "}and{" "}
              <span className="text-brand-400 cursor-pointer hover:underline">Privacy Policy</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
