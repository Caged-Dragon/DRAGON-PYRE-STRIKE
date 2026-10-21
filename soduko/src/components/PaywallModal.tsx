import { useState } from "react";
import { Check, Crown, Flame, Sparkles, X } from "lucide-react";
import { cn } from "../utils/cn";
import type { Theme } from "../themes";
import { DragonCrestEmblem, RuneRing } from "./DragonArt";

interface Props {
  open: boolean;
  subscribed: boolean;
  onClose: () => void;
  onSubscribe: () => void;
  onCancelSubscription: () => void;
  theme: Theme;
}

const FEATURES = [
  "Animated volcanic Dragon Cave backdrop with rising embers",
  "Carved obsidian runestones & molten-gold Cinzel numerals",
  "Gilded bronze 3×3 guide box lines & claw corner clasps",
  "All four Dragon Trial crests (Hatchling to Elder Wyrm)",
];

export function PaywallModal({
  open,
  subscribed,
  onClose,
  onSubscribe,
  onCancelSubscription,
}: Props) {
  const [plan, setPlan] = useState<"monthly" | "annual">("annual");

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md"
      onClick={onClose}
    >
      <div
        className="anim-pop relative w-full max-w-md overflow-hidden rounded-2xl border border-amber-500/60 bg-[linear-gradient(160deg,#230d0b_0%,#130505_58%,#270e0c_100%)] text-amber-50 shadow-[0_0_80px_-10px_rgba(249,115,22,0.45)]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Close modal"
          className="absolute right-3.5 top-3.5 z-20 flex h-8 w-8 items-center justify-center rounded-full border border-amber-700/40 bg-black/40 text-amber-200/80 transition-colors hover:border-amber-400 hover:text-amber-100"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Subtle ambient cave ornament */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="scale-pattern absolute inset-0 opacity-55" />
          <RuneRing className="absolute -right-16 -top-16 h-52 w-52 opacity-45" />
          <div className="anim-lava absolute -bottom-16 left-1/2 h-40 w-[130%] -translate-x-1/2 rounded-[50%] bg-[radial-gradient(ellipse_at_center,rgba(249,115,22,0.48)_0%,transparent_72%)] blur-2xl" />
        </div>

        <div className="relative z-10 p-6 sm:p-7">
          <div className="flex flex-col items-center text-center">
            <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl border border-amber-400/60 bg-[#1a0807] shadow-[0_0_24px_rgba(245,158,11,0.35)]">
              <DragonCrestEmblem className="h-9 w-9" />
            </div>

            <div className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-[linear-gradient(90deg,#fde68a,#f59e0b)] px-3 py-0.5 text-[10px] font-extrabold uppercase tracking-[0.16em] text-[#1a0806]">
              <Crown className="h-3 w-3" />
              <span>{subscribed ? "Dragon Pass Active" : "Subscription Theme"}</span>
            </div>

            <h2 className="font-dragon-display text-2xl font-black text-amber-50 sm:text-[26px]">
              {subscribed ? "Dragon Cave Unlocked" : "Unlock Dragon Cave"}
            </h2>
            <p className="mt-1 max-w-xs text-xs text-amber-200/75 sm:text-sm">
              {subscribed
                ? "Your Dragon Pass subscription is active. Enjoy full access to the obsidian board and cave animations."
                : "Transform your Sudoku board into an ancient dragon hoard with animated embers and gilded guide lines."}
            </p>
          </div>

          {/* Feature Checklist */}
          <div className="mt-5 space-y-2.5 rounded-xl border border-amber-700/40 bg-black/40 p-4">
            {FEATURES.map((item) => (
              <div key={item} className="flex items-start gap-2.5">
                <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-amber-500/20 text-amber-400">
                  <Check className="h-3 w-3" />
                </span>
                <span className="text-xs leading-snug text-amber-100/90">
                  {item}
                </span>
              </div>
            ))}
          </div>

          {!subscribed ? (
            <>
              {/* Plan Selector */}
              <div className="mt-4 grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => setPlan("monthly")}
                  className={cn(
                    "rounded-xl border p-3 text-left transition-all",
                    plan === "monthly"
                      ? "border-amber-400 bg-amber-500/15 ring-1 ring-amber-400"
                      : "border-amber-800/45 bg-black/30 hover:border-amber-600/70"
                  )}
                >
                  <div className="text-[11px] font-semibold text-amber-200/70">
                    Monthly
                  </div>
                  <div className="mt-0.5 text-base font-extrabold text-amber-50">
                    $2.99
                    <span className="text-xs font-normal text-amber-200/60">
                      /mo
                    </span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setPlan("annual")}
                  className={cn(
                    "relative rounded-xl border p-3 text-left transition-all",
                    plan === "annual"
                      ? "border-amber-400 bg-amber-500/15 ring-1 ring-amber-400"
                      : "border-amber-800/45 bg-black/30 hover:border-amber-600/70"
                  )}
                >
                  <span className="absolute -top-2 right-2 rounded-full bg-amber-400 px-2 py-[1px] text-[9px] font-extrabold uppercase text-[#1a0806]">
                    Save 33%
                  </span>
                  <div className="text-[11px] font-semibold text-amber-200/70">
                    Annual Pass
                  </div>
                  <div className="mt-0.5 text-base font-extrabold text-amber-50">
                    $23.99
                    <span className="text-xs font-normal text-amber-200/60">
                      /yr
                    </span>
                  </div>
                </button>
              </div>

              <div className="mt-4 flex flex-col gap-2">
                <button
                  type="button"
                  onClick={onSubscribe}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[linear-gradient(100deg,#b45309,#ea580c_50%,#c2410c)] px-4 py-3.5 text-sm font-bold text-amber-50 shadow-lg shadow-orange-950/60 transition-all hover:brightness-110 active:scale-[0.99]"
                >
                  <Flame className="h-4 w-4 fill-current" />
                  <span>
                    Activate Dragon Pass (
                    {plan === "annual" ? "$23.99/yr" : "$2.99/mo"})
                  </span>
                </button>

                <button
                  type="button"
                  onClick={onClose}
                  className="w-full rounded-xl py-2 text-xs font-medium text-amber-200/60 transition-colors hover:text-amber-100"
                >
                  Continue with Classic Theme
                </button>
              </div>
            </>
          ) : (
            <div className="mt-5 flex flex-col gap-2">
              <button
                type="button"
                onClick={onSubscribe}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[linear-gradient(100deg,#b45309,#ea580c)] px-4 py-3 text-sm font-bold text-amber-50 transition-all hover:brightness-110"
              >
                <Sparkles className="h-4 w-4" />
                <span>Apply Dragon Cave Theme</span>
              </button>
              <button
                type="button"
                onClick={onCancelSubscription}
                className="w-full rounded-xl py-2 text-xs font-medium text-amber-200/55 transition-colors hover:text-red-300"
              >
                Switch back to Free tier (Preview lock)
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
