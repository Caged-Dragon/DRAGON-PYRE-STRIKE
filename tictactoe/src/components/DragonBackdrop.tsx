import React from "react";
import { DRAGON_REALMS } from "../config/dragonRealms";
import { DragonSilhouette } from "./DragonSilhouette";
import type { DragonRealmId } from "../types/game";

interface DragonBackdropProps {
  realm: DragonRealmId;
}

const EMBERS = [
  { left: "7%", bottom: "8%", size: 3, duration: "6.5s", delay: "0s" },
  { left: "16%", bottom: "6%", size: 4, duration: "7.8s", delay: "1.6s" },
  { left: "29%", bottom: "4%", size: 3, duration: "6.9s", delay: "3.1s" },
  { left: "47%", bottom: "3%", size: 5, duration: "7.2s", delay: "2.1s" },
  { left: "67%", bottom: "5%", size: 3, duration: "7.4s", delay: "0.9s" },
  { left: "81%", bottom: "8%", size: 4, duration: "6.2s", delay: "2.4s" },
  { left: "92%", bottom: "12%", size: 3, duration: "8.1s", delay: "4.0s" },
  { left: "38%", bottom: "15%", size: 3, duration: "5.8s", delay: "1.2s" },
  { left: "58%", bottom: "14%", size: 4, duration: "7.0s", delay: "2.8s" },
];

export const DragonBackdrop: React.FC<DragonBackdropProps> = ({ realm }) => {
  const cfg = DRAGON_REALMS[realm];

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden transition-all duration-500"
      style={{ background: cfg.canvasBg }}
    >
      <div
        className="absolute inset-0 transition-all duration-500"
        style={{ background: cfg.radialBackdrop }}
      />

      <div className="absolute inset-0 bg-dot-grid-dark mask-radial-fade" />

      {/* Giant dragon silhouette rising from the bottom */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[min(130vh,110vw)] aspect-square">
        <DragonSilhouette realm={realm} className="w-full h-full" />
      </div>

      {/* Floating breath / ember particles */}
      {EMBERS.map((ember, idx) => (
        <span
          key={idx}
          className="animate-ember absolute rounded-full"
          style={
            {
              left: ember.left,
              bottom: ember.bottom,
              width: `${ember.size}px`,
              height: `${ember.size}px`,
              backgroundImage: `radial-gradient(circle, ${cfg.emberFrom} 0%, ${cfg.emberFrom} 45%, ${cfg.emberTo} 100%)`,
              boxShadow: `0 0 ${ember.size * 2}px ${cfg.emberFrom}80`,
              ["--ember-duration" as string]: ember.duration,
              ["--ember-delay" as string]: ember.delay,
            } as React.CSSProperties
          }
        />
      ))}

      {/* Soft breath glows in corners */}
      <div
        className="absolute -left-40 top-1/4 h-[480px] w-[480px] rounded-full blur-3xl animate-float-slow"
        style={{ backgroundColor: `${cfg.xAccent}22` }}
      />
      <div
        className="absolute -right-40 bottom-0 h-[520px] w-[520px] rounded-full blur-3xl animate-float-slow"
        style={{ backgroundColor: `${cfg.oAccent}1A`, animationDelay: "-4s" }}
      />

      {/* Edge vignette */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_55%,rgba(0,0,0,0.55)_100%)]" />
    </div>
  );
};

export const ClassicBackdrop: React.FC = () => (
  <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
    <div className="absolute inset-0 bg-dot-grid mask-radial-fade" />
    <div className="absolute -left-32 -top-40 h-[520px] w-[520px] rounded-full bg-blue-400/15 blur-3xl animate-float-slow" />
    <div
      className="absolute -bottom-48 -right-32 h-[560px] w-[560px] rounded-full bg-rose-300/20 blur-3xl animate-float-slow"
      style={{ animationDelay: "-4s" }}
    />
    <div className="absolute right-1/4 top-1/3 h-[320px] w-[320px] rounded-full bg-indigo-300/10 blur-3xl" />
  </div>
);
