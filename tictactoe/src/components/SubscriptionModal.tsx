import React, { useEffect, useState } from "react";
import {
  CheckCircle2,
  CreditCard,
  Crown,
  Flame,
  Gift,
  Lock,
  Play,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  Wallet,
  X,
} from "lucide-react";
import { DRAGON_REALM_LIST, DRAGON_REALMS } from "../config/dragonRealms";
import { DragonSilhouette } from "./DragonSilhouette";
import type {
  DragonRealmId,
  PaymentMethod,
  SubscriptionPlan,
  SubscriptionState,
} from "../types/game";
import { GamePiece } from "./Pieces";

interface SubscriptionModalProps {
  isOpen: boolean;
  subscription: SubscriptionState;
  initialRealm?: DragonRealmId;
  onClose: () => void;
  onCompletePayment: (payload: {
    plan: SubscriptionPlan;
    realm: DragonRealmId;
    paymentMethod: PaymentMethod;
    amountPaid: string;
  }) => void;
  onStartTrialMatches: (realm: DragonRealmId) => void;
  onCancelSubscription: () => void;
  onEnterArena?: () => void;
}

export const SubscriptionModal: React.FC<SubscriptionModalProps> = ({
  isOpen,
  subscription,
  initialRealm = "inferno",
  onClose,
  onCompletePayment,
  onStartTrialMatches,
  onCancelSubscription,
  onEnterArena,
}) => {
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan>(
    subscription.plan || "annual"
  );
  const [previewRealm, setPreviewRealm] = useState<DragonRealmId>(initialRealm);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("card");

  // Pre-filled sandbox card fields so user can click "Pay" immediately without typing
  const [cardName, setCardName] = useState("Test Challenger");
  const [cardNumber, setCardNumber] = useState("4242 •••• •••• 4242");
  const [cardExpiry, setCardExpiry] = useState("12/29");
  const [cardCvc, setCardCvc] = useState("888");

  const [promoCode, setPromoCode] = useState("");
  const [promoApplied, setPromoApplied] = useState(false);
  const [paymentStage, setPaymentStage] = useState<
    "idle" | "processing" | "approved"
  >("idle");

  useEffect(() => {
    setPreviewRealm(initialRealm);
    setPaymentStage("idle");
  }, [initialRealm, isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const realmCfg = DRAGON_REALMS[previewRealm];

  const handleApplyPromo = (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = promoCode.trim().toUpperCase();
    if (cleaned === "DRAGON" || cleaned === "VIP" || cleaned === "FREE") {
      setPromoApplied(true);
    }
  };

  const priceDisplay: Record<SubscriptionPlan, string> = {
    monthly: promoApplied ? "$1.49" : "$2.99",
    annual: promoApplied ? "$4.99" : "$9.99",
    lifetime: promoApplied ? "$9.99" : "$19.99",
  };

  const handlePayNow = (e: React.FormEvent) => {
    e.preventDefault();
    if (paymentStage !== "idle") return;

    setPaymentStage("processing");
    setTimeout(() => {
      setPaymentStage("approved");
      setTimeout(() => {
        onCompletePayment({
          plan: selectedPlan,
          realm: previewRealm,
          paymentMethod,
          amountPaid: priceDisplay[selectedPlan],
        });
        setPaymentStage("idle");
      }, 360);
    }, 420);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="dragon-pass-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-5 bg-slate-950/80 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className={`relative w-full max-w-xl max-h-[93dvh] overflow-y-auto rounded-3xl bg-[#100D18] text-slate-100 border ${realmCfg.boardBorder} shadow-2xl p-4 sm:p-6 transition-colors duration-300`}
      >
        <div className="pointer-events-none absolute -right-8 -bottom-16 w-40 h-40 opacity-25">
          <DragonSilhouette realm={initialRealm} className="w-full h-full" />
        </div>
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Close checkout dialog"
          className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-white/8 text-slate-300 hover:bg-white/15 hover:text-white transition-colors cursor-pointer"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Top Emblem + Test Mode Pill */}
        <div className="flex flex-wrap items-center gap-2 mb-2 pr-9">
          <div
            className={`flex h-8 w-8 items-center justify-center rounded-xl bg-white/8 border ${realmCfg.boardBorder} ${realmCfg.accentText}`}
          >
            <Crown className="h-4 w-4" />
          </div>
          <span
            className={`text-xs font-bold uppercase tracking-widest ${realmCfg.accentText}`}
          >
            Dragon Pass Checkout
          </span>
          <span className="rounded-full bg-emerald-500/15 border border-emerald-400/35 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-300">
            Test Mode · No Real Charge
          </span>
        </div>

        <h2
          id="dragon-pass-title"
          className="font-display-dragon text-xl sm:text-2xl font-bold text-white leading-snug"
        >
          {subscription.isSubscribed
            ? "Dragon Theme Unlocked & Active"
            : "Unlock Dragon Theme Arena"}
        </h2>
        <p className="mt-0.5 text-xs sm:text-sm text-slate-400">
          {subscription.isSubscribed
            ? "Switch freely between all 4 mythic Dragon Realms or re-lock anytime to test payment again."
            : "Click Pay below using pre-filled sandbox credentials to immediately unlock all 4 Dragon Realms."}
        </p>

        {/* Interactive 4-Realm Preview Bar */}
        <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-1.5">
          {DRAGON_REALM_LIST.map((r) => {
            const active = previewRealm === r.id;
            return (
              <button
                key={r.id}
                type="button"
                onClick={() => setPreviewRealm(r.id)}
                className={`flex items-center gap-1.5 rounded-xl px-2.5 py-2 border text-xs font-semibold transition-all cursor-pointer ${
                  active
                    ? "bg-white/15 border-white/45 text-white"
                    : "bg-white/[0.03] border-white/10 text-slate-400 hover:text-white"
                }`}
              >
                <span
                  className={`h-3 w-3 shrink-0 rounded-full bg-gradient-to-br ${r.swatchGradient}`}
                />
                <span className="truncate">{r.name.split(" ")[0]}</span>
              </button>
            );
          })}
        </div>

        {/* Compact Live Token Showcase */}
        <div
          style={{ background: realmCfg.boardBg }}
          className={`mt-2.5 grid grid-cols-2 gap-2.5 rounded-2xl border ${realmCfg.boardBorder} p-2.5 transition-colors duration-300`}
        >
          <div className="flex items-center gap-3 rounded-xl bg-black/30 border border-white/8 py-2 px-3">
            <GamePiece
              player="X"
              theme="dragon"
              realm={previewRealm}
              animate={false}
              className="h-9 w-9 shrink-0"
            />
            <div className="min-w-0">
              <div className="text-xs font-semibold text-white truncate">
                Dragon Claws (X)
              </div>
              <div className="text-[11px] text-slate-400 truncate">
                {realmCfg.name}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 rounded-xl bg-black/30 border border-white/8 py-2 px-3">
            <GamePiece
              player="O"
              theme="dragon"
              realm={previewRealm}
              animate={false}
              className="h-9 w-9 shrink-0"
            />
            <div className="min-w-0">
              <div className="text-xs font-semibold text-white truncate">
                Ouroboros Crest (O)
              </div>
              <div className="text-[11px] text-slate-400 truncate">
                Molten Win Beams
              </div>
            </div>
          </div>
        </div>

        {subscription.isSubscribed ? (
          /* ACTIVE RECEIPT & REALM MANAGEMENT VIEW */
          <div className="mt-4 space-y-3">
            <div className="rounded-2xl bg-emerald-500/10 border border-emerald-400/30 p-3.5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-300">
                  <CheckCircle2 className="h-4 w-4" />
                  Sandbox Payment Verified
                </span>
                <span className="font-tabular text-xs text-slate-300">
                  {subscription.transactionId || "TXN-DRG-TEST"}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 pt-1 border-t border-white/10 text-xs">
                <div>
                  <span className="text-slate-400 block text-[10px]">Plan</span>
                  <strong className="capitalize text-white">
                    {subscription.plan}
                  </strong>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">
                    Test Amount
                  </span>
                  <strong className="font-tabular text-white">
                    {subscription.amountPaid || "$9.99"} (Demo)
                  </strong>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">
                    Method
                  </span>
                  <strong className="capitalize text-white">
                    {subscription.paymentMethod === "wallet"
                      ? "Instant Wallet"
                      : "Card •••• 4242"}
                  </strong>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  onCompletePayment({
                    plan: subscription.plan,
                    realm: previewRealm,
                    paymentMethod: subscription.paymentMethod || "card",
                    amountPaid: subscription.amountPaid || "$9.99",
                  });
                  if (onEnterArena) onEnterArena();
                }}
                className={`flex-1 min-w-[180px] flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r ${realmCfg.buttonGradient} py-3 px-4 text-sm font-bold transition-all cursor-pointer`}
              >
                <Play className="h-4 w-4 fill-current" />
                <span>Play with {realmCfg.name}</span>
              </button>

              <button
                type="button"
                onClick={onCancelSubscription}
                title="Re-lock Dragon Theme to test the payment button again"
                className="inline-flex items-center justify-center gap-1.5 rounded-2xl border border-white/15 bg-white/5 py-3 px-3.5 text-xs font-medium text-slate-300 hover:bg-white/10 hover:text-white transition-colors cursor-pointer"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span>Reset / Re-lock (Test)</span>
              </button>
            </div>
          </div>
        ) : (
          /* SIMULATED TEST CHECKOUT FORM */
          <form onSubmit={handlePayNow} className="mt-3.5 space-y-3">
            {/* 3-Tier Plan Selection */}
            <div className="grid grid-cols-3 gap-2">
              {(
                [
                  { id: "monthly", title: "Monthly", sub: "/mo", badge: null },
                  {
                    id: "annual",
                    title: "Annual",
                    sub: "/yr",
                    badge: "Popular",
                  },
                  {
                    id: "lifetime",
                    title: "Lifetime",
                    sub: " once",
                    badge: "VIP",
                  },
                ] as const
              ).map((tier) => {
                const active = selectedPlan === tier.id;
                return (
                  <button
                    key={tier.id}
                    type="button"
                    onClick={() => setSelectedPlan(tier.id)}
                    className={`flex flex-col items-start rounded-2xl p-2.5 border text-left transition-all cursor-pointer ${
                      active
                        ? "bg-white/14 border-amber-400 text-white"
                        : "bg-white/[0.03] border-white/10 text-slate-300 hover:border-white/25"
                    }`}
                  >
                    <div className="flex items-center justify-between w-full gap-1">
                      <span className="text-[11px] font-medium text-slate-400">
                        {tier.title}
                      </span>
                      {tier.badge && (
                        <span className="rounded bg-amber-400/20 px-1.5 py-0.5 text-[9px] font-bold uppercase text-amber-300">
                          {tier.badge}
                        </span>
                      )}
                    </div>
                    <div className="font-tabular mt-0.5 text-base sm:text-lg font-bold text-white">
                      {priceDisplay[tier.id]}
                      <span className="text-[11px] font-normal text-slate-400">
                        {tier.sub}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Sandbox Payment Method Switcher */}
            <div className="rounded-2xl bg-white/[0.04] border border-white/12 p-3 space-y-2.5">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                  <Lock className="h-3.5 w-3.5 text-emerald-400" />
                  Test Payment Method (Pre-filled)
                </span>

                <div className="inline-flex rounded-lg bg-black/40 p-0.5 border border-white/10">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod("card")}
                    className={`inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-[11px] font-semibold transition-colors cursor-pointer ${
                      paymentMethod === "card"
                        ? "bg-white text-slate-950"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    <CreditCard className="h-3 w-3" />
                    Test Card
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod("wallet")}
                    className={`inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-[11px] font-semibold transition-colors cursor-pointer ${
                      paymentMethod === "wallet"
                        ? "bg-white text-slate-950"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    <Wallet className="h-3 w-3" />
                    1-Tap Wallet
                  </button>
                </div>
              </div>

              {paymentMethod === "card" ? (
                <div className="grid grid-cols-12 gap-2">
                  <input
                    type="text"
                    value={cardName}
                    onChange={(e) => setCardName(e.target.value)}
                    aria-label="Cardholder Name"
                    placeholder="Cardholder Name"
                    className="col-span-12 sm:col-span-5 rounded-xl bg-black/40 border border-white/12 px-3 py-2 text-xs text-white outline-none focus:border-amber-400/60"
                  />
                  <input
                    type="text"
                    value={cardNumber}
                    onChange={(e) => setCardNumber(e.target.value)}
                    aria-label="Test Card Number"
                    placeholder="4242 •••• •••• 4242"
                    className="col-span-6 sm:col-span-4 font-tabular rounded-xl bg-black/40 border border-white/12 px-3 py-2 text-xs text-white outline-none focus:border-amber-400/60"
                  />
                  <input
                    type="text"
                    value={cardExpiry}
                    onChange={(e) => setCardExpiry(e.target.value)}
                    aria-label="Expiry Date"
                    placeholder="MM/YY"
                    className="col-span-3 sm:col-span-2 font-tabular rounded-xl bg-black/40 border border-white/12 px-2.5 py-2 text-xs text-white text-center outline-none focus:border-amber-400/60"
                  />
                  <input
                    type="text"
                    value={cardCvc}
                    onChange={(e) => setCardCvc(e.target.value)}
                    aria-label="CVC"
                    placeholder="CVC"
                    className="col-span-3 sm:col-span-1 font-tabular rounded-xl bg-black/40 border border-white/12 px-1.5 py-2 text-xs text-white text-center outline-none focus:border-amber-400/60"
                  />
                </div>
              ) : (
                <div className="flex items-center justify-between rounded-xl bg-black/35 border border-white/10 px-3 py-2 text-xs text-slate-300">
                  <span>Sandbox Express Wallet (`demo@dragon-arena.test`)</span>
                  <span className="text-emerald-400 font-semibold">Ready</span>
                </div>
              )}

              {/* Promo Code Row */}
              <div className="flex gap-2 pt-0.5">
                <div className="relative flex-1">
                  <Gift className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Optional promo code (try DRAGON)"
                    value={promoCode}
                    onChange={(e) => setPromoCode(e.target.value)}
                    className="w-full rounded-xl bg-black/35 border border-white/10 pl-8 pr-3 py-1.5 text-xs text-white placeholder:text-slate-500 outline-none focus:border-amber-400/60"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleApplyPromo}
                  className="rounded-xl border border-white/15 bg-white/8 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:bg-white/15 transition-colors cursor-pointer"
                >
                  {promoApplied ? "50% Off!" : "Apply"}
                </button>
              </div>
            </div>

            {/* Primary PAY & UNLOCK NOW CTA */}
            <div className="flex flex-col gap-2">
              <button
                type="submit"
                disabled={paymentStage !== "idle"}
                className={`flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r ${realmCfg.buttonGradient} py-3.5 px-5 text-sm font-bold shadow-lg disabled:opacity-75 transition-all cursor-pointer active:scale-[0.99]`}
              >
                {paymentStage === "approved" ? (
                  <>
                    <Sparkles className="h-4 w-4 shrink-0" />
                    <span>Payment Approved! Dragon Theme Unlocked!</span>
                  </>
                ) : paymentStage === "processing" ? (
                  <>
                    <Flame className="h-4 w-4 shrink-0 animate-spin" />
                    <span>Authorizing Test Payment...</span>
                  </>
                ) : (
                  <>
                    <Flame className="h-4 w-4 shrink-0" />
                    <span>
                      Pay {priceDisplay[selectedPlan]} &amp; Unlock Dragon Theme Now
                    </span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => onStartTrialMatches(previewRealm)}
                className="w-full rounded-2xl border border-white/15 bg-white/[0.04] py-2 px-4 text-xs font-semibold text-amber-300 hover:bg-white/[0.08] transition-colors cursor-pointer"
              >
                Or Preview 3 Free Trial Matches First
              </button>
            </div>

            <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-500">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
              <span>
                Sandbox demo checkout — clicking Pay unlocks Dragon Theme immediately with $0 real charge
              </span>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
