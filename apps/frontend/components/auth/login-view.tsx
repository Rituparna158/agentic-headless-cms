'use client';

import { Suspense } from 'react';
import { LoginForm } from '@/components/auth/login-form';
import { Sparkles, ShieldCheck, Globe2, Zap } from 'lucide-react';

export function LoginView() {
  return (
    <div className="min-h-screen w-full flex flex-col lg:flex-row bg-background">
      {/* Left Column: Sleek Brand Visual (Desktop lg:flex) */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-center p-12 lg:p-16 bg-[#09090b] text-white border-r border-zinc-800 relative overflow-hidden select-none">
        {/* Ambient Glow & Grid Accents */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_60%_at_50%_-10%,rgba(99,102,241,0.22),transparent)] pointer-events-none" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#27272a_1px,transparent_1px),linear-gradient(to_bottom,#27272a_1px,transparent_1px)] bg-[size:3.5rem_3.5rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-20 pointer-events-none" />

        {/* Content Showcase */}
        <div className="relative z-10 space-y-8 max-w-lg mx-auto">
          <div className="space-y-3">
            <h2 className="text-3xl lg:text-4xl font-bold tracking-tight text-zinc-100 leading-tight">
              Build, manage, and scale content with autonomous precision.
            </h2>
            <p className="text-zinc-400 text-sm leading-relaxed">
              The modern headless platform designed for speed, flexibility, and
              global reach.
            </p>
          </div>

          {/* Clean Feature Highlights */}
          <div className="grid gap-3">
            <div className="p-3.5 rounded-xl border border-zinc-800/80 bg-zinc-900/60 backdrop-blur-xs flex items-center gap-3.5 transition-colors hover:border-zinc-700">
              <div className="size-8 rounded-lg bg-indigo-500/15 text-indigo-400 flex items-center justify-center shrink-0 border border-indigo-500/20">
                <Globe2 className="size-4" />
              </div>
              <div>
                <div className="text-xs font-medium text-zinc-200">
                  Multilingual Auto-Translation
                </div>
                <div className="text-[11px] text-zinc-400">
                  AST-aware translation for rich text and localized fields.
                </div>
              </div>
            </div>

            <div className="p-3.5 rounded-xl border border-zinc-800/80 bg-zinc-900/60 backdrop-blur-xs flex items-center gap-3.5 transition-colors hover:border-zinc-700">
              <div className="size-8 rounded-lg bg-emerald-500/15 text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/20">
                <ShieldCheck className="size-4" />
              </div>
              <div>
                <div className="text-xs font-medium text-zinc-200">
                  Role-Based Governance & Security
                </div>
                <div className="text-[11px] text-zinc-400">
                  Granular permissions, comprehensive audit logs, and MFA.
                </div>
              </div>
            </div>

            <div className="p-3.5 rounded-xl border border-zinc-800/80 bg-zinc-900/60 backdrop-blur-xs flex items-center gap-3.5 transition-colors hover:border-zinc-700">
              <div className="size-8 rounded-lg bg-amber-500/15 text-amber-400 flex items-center justify-center shrink-0 border border-amber-500/20">
                <Zap className="size-4" />
              </div>
              <div>
                <div className="text-xs font-medium text-zinc-200">
                  Real-time Delivery & Webhooks
                </div>
                <div className="text-[11px] text-zinc-400">
                  Fast REST and GraphQL APIs with instant webhook events.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Column: Focused Authentication Card */}
      <div className="w-full lg:w-1/2 flex flex-col justify-between p-6 sm:p-10 lg:p-16 min-h-screen">
        {/* Clean Brand Header */}
        <div className="flex items-center gap-3">
          <div className="size-9 rounded-xl bg-primary flex items-center justify-center text-primary-foreground shadow-xs">
            <Sparkles className="size-4" />
          </div>
          <span className="font-semibold text-base tracking-tight text-foreground">
            Headless CMS
          </span>
        </div>

        {/* Form Container */}
        <div className="my-auto py-8 max-w-sm w-full mx-auto">
          <Suspense
            fallback={
              <div className="flex flex-col items-center justify-center py-12 space-y-3">
                <div className="size-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
              </div>
            }
          >
            <LoginForm />
          </Suspense>
        </div>

        {/* Minimal Footer */}
        <div className="text-xs text-muted-foreground">
          <span>Headless CMS</span>
        </div>
      </div>
    </div>
  );
}
