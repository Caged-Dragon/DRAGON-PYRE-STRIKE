import React from "react";
import {
  Crown,
  Home,
  Settings,
  Swords,
  Volume2,
  VolumeX,
  type LucideIcon,
} from "lucide-react";
import { DRAGON_REALMS } from "../config/dragonRealms";
import { getUiTokens } from "../config/uiTokens";
import type { AppScreen, DragonRealmId, SubscriptionState, ThemeId } from "../types/game";
import { DragonSilhouette } from "./DragonSilhouette";

interface HeaderProps {
  screen: AppScreen;
  theme: ThemeId;
  realm: DragonRealmId;
  subscription: SubscriptionState;
  soundEnabled: boolean;
  matchLive: boolean;
  onNavigate: (screen: AppScreen) => void;
  onOpenSubscriptionModal: () => void;
  onToggleSound: () => void;
}

const NAV_ITEMS: { id: AppScreen; label: string; icon: LucideIcon }[] = [
  { id: "menu", label: "Menu", icon: Home },
  { id: "arena", label: "Play", icon: Swords },
  { id: "settings", label: "Settings", icon: Settings },
];

export const Header: React.FC<HeaderProps> = ({
  screen,
  theme,
  realm,
  subscription,
  soundEnabled,
  matchLive,
  onNavigate,
  onOpenSubscriptionModal,
  onToggleSound,
}) => {
  const t = getUiTokens(theme, realm);
  const r = DRAGON_REALMS[realm];
  const isDragon = t.isDragon;

  const passLabel = subscription.isSubscribed
    ? "Pass Active"
    : subscription.trialMatchesRemaining > 0
    ? `Trial · ${subscription.trialMatchesRemaining}`
    : "Unlock Dragon";

  const passClass = subscription.isSubscribed
    ? t.chip
    : "bg-gradient-to-r from-amber-400 to-orange-500 text-slate-950 shadow-[0_8px_20px_-10px_rgba(245,158,11,0.9)] hover:from-amber-300 hover:to-orange-400";

  return (
    <header
      className={`sticky top-0 z-30 w-full border-b transition-colors duration-300 ${t.headerBar}`}
    >
      <div className="mx-auto flex h-[clamp(56px,7.5dvh,66px)] w-full max-w-[min(96vw,1400px)] items-center gap-2 px-2 sm:gap-3 sm:px-4">
        {/* Brand */}
        <button
          type="button"
          onClick={() => onNavigate("menu")}
          aria-label="Go to main menu"
          className="flex min-w-0 shrink-0 items-center gap-2.5 rounded-xl cursor-pointer focus:outline-none"
        >
          <span
            className={`relative flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br shadow-md ${
              isDragon ? r.swatchGradient : "from-blue-500 via-indigo-500 to-violet-600"
            }`}
          >
            {isDragon ? (
              <DragonSilhouette realm={realm} solidColor="#ffffff" className="h-7 w-7" />
            ) : (
              <svg
                viewBox="0 0 24 24"
                className="h-5 w-5"
                fill="none"
                stroke="white"
                strokeWidth="2"
                strokeLinecap="round"
                aria-hidden="true"
              >
                <path d="M9 3v18M15 3v18M3 9h18M3 15h18" strokeOpacity="0.45" />
                <path d="M4.3 4.3l2.9 2.9M7.2 4.3L4.3 7.2" />
                <circle cx="18" cy="18" r="1.9" />
              </svg>
            )}
          </span>
          <span className="hidden min-w-0 text-left leading-tight md:block">
            <span
              className={`block truncate text-[15px] font-extrabold tracking-tight ${t.textStrong} ${t.displayFont}`}
            >
              {isDragon ? "Dragon Arena" : "Tic·Tac·Toe"}
            </span>
            <span className={`block truncate text-[11px] font-medium ${t.textMuted}`}>
              {isDragon ? r.name : "Classic Studio"}
            </span>
          </span>
        </button>

        {/* Primary navigation */}
        <nav aria-label="Primary" className="flex flex-1 justify-center">
          <div className={`inline-flex items-center gap-0.5 rounded-xl p-1 ${t.segTrack}`}>
            {NAV_ITEMS.map((item) => {
              const active = screen === item.id;
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  type="button"
                  aria-current={active ? "page" : undefined}
                  onClick={() => onNavigate(item.id)}
                  className={`relative flex items-center gap-1.5 rounded-[9px] px-2.5 py-1.5 text-xs font-semibold transition-all duration-200 cursor-pointer sm:px-3.5 sm:text-sm ${
                    active ? t.segActive : t.segIdle
                  }`}
                >
                  <Icon className="h-3.5 w-3.5 shrink-0" />
                  <span className="hidden min-[420px]:inline">{item.label}</span>
                  {item.id === "arena" && matchLive && !active && (
                    <span className="absolute right-1 top-1 flex h-2 w-2">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-70" />
                      <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </nav>

        {/* Right cluster */}
        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
          <button
            type="button"
            onClick={onOpenSubscriptionModal}
            title={passLabel}
            aria-label={passLabel}
            className={`inline-flex h-9 items-center gap-1.5 rounded-xl px-2.5 text-xs font-bold transition-all duration-200 cursor-pointer sm:px-3 ${passClass}`}
          >
            <Crown
              className={`h-3.5 w-3.5 shrink-0 ${subscription.isSubscribed ? "text-amber-400" : ""}`}
            />
            <span className="hidden sm:inline">{passLabel}</span>
          </button>

          <button
            type="button"
            onClick={onToggleSound}
            aria-label={soundEnabled ? "Mute sound effects" : "Enable sound effects"}
            title={soundEnabled ? "Sound on" : "Sound muted"}
            className={`flex h-9 w-9 items-center justify-center rounded-xl transition-colors cursor-pointer ${t.secondaryBtn}`}
          >
            {soundEnabled ? (
              <Volume2 className="h-4 w-4" />
            ) : (
              <VolumeX className="h-4 w-4 opacity-60" />
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
