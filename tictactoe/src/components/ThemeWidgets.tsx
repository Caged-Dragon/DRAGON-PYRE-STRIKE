import React from "react";
import { Check, CheckCircle2, Lock } from "lucide-react";
import { DRAGON_REALM_LIST, DRAGON_REALMS } from "../config/dragonRealms";
import { getUiTokens } from "../config/uiTokens";
import type {
  DragonRealmId,
  Player,
  ScoreBoard,
  SubscriptionState,
  ThemeId,
} from "../types/game";
import { GamePiece } from "./Pieces";

const PREVIEW: Player[] = ["X", "O", "X"];

function hasDragonAccess(sub: SubscriptionState) {
  return sub.isSubscribed || sub.trialMatchesRemaining > 0;
}

interface ThemeChoiceProps {
  theme: ThemeId;
  realm: DragonRealmId;
  subscription: SubscriptionState;
  onSelectTheme: (theme: ThemeId) => void;
}

export const ThemeChoiceCards: React.FC<ThemeChoiceProps> = ({
  theme,
  realm,
  subscription,
  onSelectTheme,
}) => {
  const t = getUiTokens(theme, realm);
  const r = DRAGON_REALMS[realm];
  const access = hasDragonAccess(subscription);

  const dragonBadge = subscription.isSubscribed
    ? { text: "Unlocked", cls: "bg-emerald-500/15 text-emerald-500 ring-emerald-500/30" }
    : subscription.trialMatchesRemaining > 0
    ? {
        text: `Trial · ${subscription.trialMatchesRemaining}`,
        cls: "bg-amber-500/15 text-amber-500 ring-amber-500/30",
      }
    : { text: "Premium", cls: "bg-amber-500/15 text-amber-500 ring-amber-500/30" };

  const cards: {
    id: ThemeId;
    title: string;
    desc: string;
    badge: { text: string; cls: string };
    previewClass: string;
    previewStyle: React.CSSProperties | undefined;
    cellClass: string;
    locked: boolean;
  }[] = [
    {
      id: "classic",
      title: "Classic",
      desc: "Clean studio look",
      badge: { text: "Free", cls: "bg-blue-500/10 text-blue-500 ring-blue-500/25" },
      previewClass: "bg-gradient-to-br from-white to-slate-100",
      previewStyle: undefined,
      cellClass: "bg-white ring-1 ring-slate-200 shadow-sm",
      locked: false,
    },
    {
      id: "dragon",
      title: "Dragon",
      desc: r.name,
      badge: dragonBadge,
      previewClass: "",
      previewStyle: {
        background: `radial-gradient(circle at 50% 0%, ${r.xStops[1]}55, ${r.canvasBg} 72%)`,
      },
      cellClass: "bg-black/35 ring-1 ring-white/10",
      locked: !access,
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-2.5">
      {cards.map((card) => {
        const active = theme === card.id;
        return (
          <button
            key={card.id}
            type="button"
            aria-pressed={active}
            onClick={() => onSelectTheme(card.id)}
            className={`group relative flex min-w-0 flex-col overflow-hidden rounded-2xl border text-left transition-all duration-200 cursor-pointer focus:outline-none focus-visible:ring-2 ${t.ring} ${
              active ? t.cardActive : t.cardIdle
            }`}
          >
            <div
              style={card.previewStyle}
              className={`relative flex h-[66px] items-center justify-center gap-1.5 ${card.previewClass}`}
            >
              {PREVIEW.map((p, i) => (
                <span
                  key={i}
                  className={`flex h-8 w-8 items-center justify-center rounded-lg transition-transform duration-300 group-hover:-translate-y-0.5 sm:h-9 sm:w-9 ${card.cellClass}`}
                  style={{ transitionDelay: `${i * 40}ms` }}
                >
                  <GamePiece
                    player={p}
                    theme={card.id}
                    realm={realm}
                    animate={false}
                    className="h-[68%] w-[68%]"
                  />
                </span>
              ))}
              {card.locked && (
                <span className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-[1.5px]">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-black/60 text-amber-300 ring-1 ring-white/20">
                    <Lock className="h-3.5 w-3.5" />
                  </span>
                </span>
              )}
              {active && (
                <CheckCircle2 className="absolute right-2 top-2 h-4.5 w-4.5 rounded-full bg-white text-emerald-500 shadow" />
              )}
            </div>
            <div className="flex items-center justify-between gap-2 px-3 py-2.5">
              <div className="min-w-0">
                <div className={`text-[13px] font-bold ${t.textStrong}`}>{card.title}</div>
                <div className={`truncate text-[11px] ${t.textMuted}`}>{card.desc}</div>
              </div>
              <span
                className={`shrink-0 rounded-full px-2 py-0.5 text-[9.5px] font-bold uppercase tracking-wide ring-1 ring-inset ${card.badge.cls}`}
              >
                {card.badge.text}
              </span>
            </div>
          </button>
        );
      })}
    </div>
  );
};

interface RealmPickerProps {
  theme: ThemeId;
  realm: DragonRealmId;
  subscription: SubscriptionState;
  onSelectRealm: (realm: DragonRealmId) => void;
}

export const RealmPicker: React.FC<RealmPickerProps> = ({
  theme,
  realm,
  subscription,
  onSelectRealm,
}) => {
  const t = getUiTokens(theme, realm);
  const access = hasDragonAccess(subscription);

  return (
    <div className="grid grid-cols-2 gap-2">
      {DRAGON_REALM_LIST.map((rr) => {
        const active = t.isDragon && realm === rr.id;
        return (
          <button
            key={rr.id}
            type="button"
            aria-pressed={active}
            onClick={() => onSelectRealm(rr.id)}
            className={`group flex min-w-0 items-center gap-2.5 rounded-xl border p-2 text-left transition-all duration-200 cursor-pointer focus:outline-none focus-visible:ring-2 ${t.ring} ${
              active ? t.cardActive : t.cardIdle
            }`}
          >
            <span
              className={`relative h-8 w-8 shrink-0 rounded-lg bg-gradient-to-br ${rr.swatchGradient} shadow-[inset_0_1px_0_rgba(255,255,255,0.35)] transition-transform duration-200 group-hover:scale-105`}
            >
              {active && (
                <Check className="absolute inset-0 m-auto h-4 w-4 text-white drop-shadow" />
              )}
            </span>
            <span className="min-w-0 flex-1">
              <span className={`block truncate text-xs font-semibold ${t.textStrong}`}>
                {rr.name}
              </span>
              <span className={`block truncate text-[10.5px] ${t.textMuted}`}>
                {rr.badgeText} realm
              </span>
            </span>
            {!access && <Lock className={`h-3 w-3 shrink-0 ${t.textMuted}`} />}
          </button>
        );
      })}
    </div>
  );
};

interface OutcomeBarProps {
  scores: ScoreBoard;
  theme: ThemeId;
  realm: DragonRealmId;
}

export const OutcomeBar: React.FC<OutcomeBarProps> = ({ scores, theme, realm }) => {
  const t = getUiTokens(theme, realm);
  const total = scores.X + scores.O + scores.draws;
  const pct = (n: number) => (total ? Math.round((n / total) * 100) : 0);
  const drawColor = t.isDragon ? "rgba(148,163,184,0.45)" : "#CBD5E1";

  const legend = [
    { label: "X", value: pct(scores.X), color: t.xColor },
    { label: "Draw", value: pct(scores.draws), color: drawColor },
    { label: "O", value: pct(scores.O), color: t.oColor },
  ];

  return (
    <div>
      <div
        className={`flex h-2.5 w-full gap-0.5 overflow-hidden rounded-full ${
          t.isDragon ? "bg-white/[0.06]" : "bg-slate-100"
        }`}
      >
        {total > 0 &&
          legend.map((seg) =>
            seg.value > 0 ? (
              <div
                key={seg.label}
                className="h-full transition-all duration-500"
                style={{ width: `${seg.value}%`, backgroundColor: seg.color }}
              />
            ) : null
          )}
      </div>
      <div className="mt-1.5 flex items-center justify-between text-[10.5px] font-semibold">
        {legend.map((seg) => (
          <span key={seg.label} className={`inline-flex items-center gap-1.5 ${t.textBody}`}>
            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: seg.color }} />
            {seg.label}
            <span className={`font-tabular ${t.textMuted}`}>{seg.value}%</span>
          </span>
        ))}
      </div>
    </div>
  );
};
