import { DragonSkin, Gate, RealmConfig, Particle } from '../types/game';

const DRAGON_R = 18;

function roundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  const radius = Math.min(r, Math.abs(w) / 2, Math.abs(h) / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + w - radius, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + radius);
  ctx.lineTo(x + w, y + h - radius);
  ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
  ctx.lineTo(x + radius, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

export function drawBackground(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  realm: RealmConfig,
  time: number
) {
  const sky = ctx.createLinearGradient(0, 0, 0, height);
  sky.addColorStop(0, realm.bgGradient[0]);
  sky.addColorStop(0.5, realm.bgGradient[1]);
  sky.addColorStop(1, realm.bgGradient[2]);
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, width, height);

  ctx.save();

  if (realm.obstacleType === 'volcanic') {
    const moonGrad = ctx.createRadialGradient(width - 80, 80, 5, width - 80, 80, 50);
    moonGrad.addColorStop(0, 'rgba(251, 146, 60, 0.4)');
    moonGrad.addColorStop(1, 'rgba(251, 146, 60, 0)');
    ctx.fillStyle = moonGrad;
    ctx.beginPath();
    ctx.arc(width - 80, 80, 50, 0, Math.PI * 2);
    ctx.fill();
  } else if (realm.obstacleType === 'crystal') {
    const moonGrad = ctx.createRadialGradient(width - 90, 90, 5, width - 90, 90, 60);
    moonGrad.addColorStop(0, 'rgba(56, 189, 248, 0.5)');
    moonGrad.addColorStop(1, 'rgba(56, 189, 248, 0)');
    ctx.fillStyle = moonGrad;
    ctx.beginPath();
    ctx.arc(width - 90, 90, 60, 0, Math.PI * 2);
    ctx.fill();
  } else if (realm.obstacleType === 'storm') {
    if (Math.sin(time / 180) > 0.94) {
      ctx.fillStyle = 'rgba(254, 240, 138, 0.15)';
      ctx.fillRect(0, 0, width, height);
    }
  } else if (realm.obstacleType === 'void') {
    const portal = ctx.createRadialGradient(width / 2, 110, 10, width / 2, 110, 80);
    portal.addColorStop(0, 'rgba(192, 132, 252, 0.35)');
    portal.addColorStop(0.5, 'rgba(126, 34, 206, 0.15)');
    portal.addColorStop(1, 'transparent');
    ctx.fillStyle = portal;
    ctx.beginPath();
    ctx.arc(width / 2, 110, 80, 0, Math.PI * 2);
    ctx.fill();
  } else if (realm.obstacleType === 'temple') {
    const sun = ctx.createRadialGradient(90, 90, 5, 90, 90, 55);
    sun.addColorStop(0, 'rgba(74, 222, 128, 0.4)');
    sun.addColorStop(1, 'transparent');
    ctx.fillStyle = sun;
    ctx.beginPath();
    ctx.arc(90, 90, 55, 0, Math.PI * 2);
    ctx.fill();
  }

  // Stars scale with any width
  const starCount = Math.ceil(width / 12);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
  for (let i = 0; i < starCount; i++) {
    const x = (i * 79 + 31) % width;
    const y = (i * 43 + 19) % (height - 120);
    const twinkle = 0.4 + Math.sin(time / 420 + i) * 0.4;
    ctx.globalAlpha = Math.max(0.1, twinkle);
    ctx.beginPath();
    ctx.arc(x, y, i % 4 === 0 ? 1.8 : 1.1, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  // Parallax distant mountain layer (procedural, spans any width)
  const farGrad = ctx.createLinearGradient(0, height - 220, 0, height);
  farGrad.addColorStop(0, 'rgba(20, 16, 34, 0.35)');
  farGrad.addColorStop(1, 'rgba(6, 4, 12, 0.7)');
  ctx.fillStyle = farGrad;
  ctx.beginPath();
  ctx.moveTo(0, height);
  const farScroll = (time * 0.008) % 240;
  for (let x = -240; x <= width + 240; x += 12) {
    const wx = x - farScroll;
    const y =
      height -
      130 -
      Math.sin(wx * 0.011) * 34 -
      Math.sin(wx * 0.027 + 1.7) * 18;
    ctx.lineTo(x, y);
  }
  ctx.lineTo(width, height);
  ctx.closePath();
  ctx.fill();

  // Near mountain silhouettes (procedural, scrolling)
  const mountainGrad = ctx.createLinearGradient(0, height - 160, 0, height);
  mountainGrad.addColorStop(0, 'rgba(15, 12, 25, 0.5)');
  mountainGrad.addColorStop(1, 'rgba(3, 2, 7, 0.96)');
  ctx.fillStyle = mountainGrad;
  ctx.beginPath();
  ctx.moveTo(0, height);
  const nearScroll = (time * 0.02) % 320;
  for (let x = -320; x <= width + 320; x += 10) {
    const wx = x - nearScroll;
    const y =
      height -
      95 -
      Math.abs(Math.sin(wx * 0.016)) * 55 -
      Math.sin(wx * 0.041 + 0.8) * 14;
    ctx.lineTo(x, y);
  }
  ctx.lineTo(width, height);
  ctx.closePath();
  ctx.fill();

  ctx.restore();
}

export function drawDragon(
  ctx: CanvasRenderingContext2D,
  dragonX: number,
  y: number,
  velocity: number,
  flame: number,
  skin: DragonSkin,
  hasShield: boolean,
  time: number
) {
  const tilt = Math.max(-0.55, Math.min(1.05, velocity / 480));
  const wingBeat = Math.sin(time / 85) * 0.42;

  ctx.save();
  ctx.translate(dragonX, y);
  ctx.rotate(tilt);

  if (hasShield) {
    ctx.save();
    ctx.shadowColor = '#38bdf8';
    ctx.shadowBlur = 18;
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.85)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(0, 0, DRAGON_R + 14, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = 'rgba(56, 189, 248, 0.15)';
    ctx.beginPath();
    ctx.arc(0, 0, DRAGON_R + 14, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  const flameLength = 22 + flame * 36 + Math.max(0, velocity) * 0.02;
  const flameGradient = ctx.createLinearGradient(-DRAGON_R - flameLength, 0, -8, 0);
  flameGradient.addColorStop(0, 'rgba(255, 255, 255, 0)');
  flameGradient.addColorStop(0.35, skin.flameColors[0]);
  flameGradient.addColorStop(0.7, skin.flameColors[1]);
  flameGradient.addColorStop(1, skin.flameColors[2]);
  ctx.fillStyle = flameGradient;
  ctx.beginPath();
  ctx.moveTo(-DRAGON_R - flameLength, 0);
  ctx.quadraticCurveTo(-26, -12 - flame * 12, -10, -3);
  ctx.quadraticCurveTo(-26, 13 + flame * 12, -DRAGON_R - flameLength, 0);
  ctx.fill();

  ctx.fillStyle = skin.secondaryColor;
  ctx.beginPath();
  ctx.moveTo(-16, 0);
  ctx.quadraticCurveTo(-38, -5, -52, -18);
  ctx.quadraticCurveTo(-44, 2, -54, 18);
  ctx.quadraticCurveTo(-35, 8, -14, 8);
  ctx.fill();

  ctx.fillStyle = skin.secondaryColor;
  ctx.strokeStyle = skin.hornColor;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-8, -4);
  ctx.quadraticCurveTo(-36, -20 - wingBeat * 22, -60, -42 - wingBeat * 22);
  ctx.quadraticCurveTo(-38, 0, -6, 6);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  const bodyGrad = ctx.createLinearGradient(-18, -18, 30, 18);
  bodyGrad.addColorStop(0, skin.hornColor);
  bodyGrad.addColorStop(0.4, skin.primaryColor);
  bodyGrad.addColorStop(1, skin.secondaryColor);

  ctx.shadowColor = skin.glowColor;
  ctx.shadowBlur = 16;
  ctx.fillStyle = bodyGrad;
  ctx.beginPath();
  ctx.ellipse(0, 0, DRAGON_R + 9, DRAGON_R - 1, 0.08, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;

  ctx.fillStyle = 'rgba(255, 255, 255, 0.22)';
  ctx.beginPath();
  ctx.arc(-4, -5, 3, 0, Math.PI);
  ctx.arc(4, -3, 3, 0, Math.PI);
  ctx.fill();

  ctx.fillStyle = skin.primaryColor;
  ctx.beginPath();
  ctx.ellipse(20, -3, 16, 12, -0.15, 0, Math.PI * 2);
  ctx.fill();

  ctx.beginPath();
  ctx.ellipse(32, -1, 7, 6, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = skin.hornColor;
  ctx.beginPath();
  ctx.moveTo(20, -14);
  ctx.quadraticCurveTo(24, -28, 29, -32);
  ctx.quadraticCurveTo(31, -22, 28, -13);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(9, -13);
  ctx.quadraticCurveTo(11, -24, 15, -28);
  ctx.quadraticCurveTo(17, -20, 16, -12);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = skin.eyeColor;
  ctx.shadowColor = skin.eyeColor;
  ctx.shadowBlur = 8;
  ctx.beginPath();
  ctx.ellipse(25, -6, 4, 3, 0.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;

  ctx.fillStyle = '#050308';
  ctx.beginPath();
  ctx.ellipse(26, -6, 1.2, 2.5, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = 'rgba(254, 240, 138, 0.85)';
  ctx.beginPath();
  ctx.ellipse(3, 4, 10, 5, -0.2, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = skin.primaryColor;
  ctx.strokeStyle = skin.hornColor;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(-6, -2);
  ctx.quadraticCurveTo(-26, -30 - wingBeat * 24, -54, -52 - wingBeat * 24);
  ctx.quadraticCurveTo(-32, -18, -24, 2);
  ctx.quadraticCurveTo(-14, 12, 0, 6);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  if (flame > 0.4) {
    ctx.fillStyle = skin.flameColors[0];
    ctx.beginPath();
    ctx.arc(38, 1, 2.5 + flame * 2, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

export function drawGate(
  ctx: CanvasRenderingContext2D,
  gate: Gate,
  height: number,
  realm: RealmConfig,
  gateGap: number,
  time: number
) {
  const gateWidth = 72;
  const topH = Math.max(0, gate.gapY - 16);
  const bottomY = gate.gapY + gateGap + 16;
  const bottomH = Math.max(0, height - bottomY);

  ctx.save();

  if (realm.obstacleType === 'volcanic') {
    const stone = ctx.createLinearGradient(gate.x, 0, gate.x + gateWidth, 0);
    stone.addColorStop(0, '#1c1917');
    stone.addColorStop(0.5, '#44403c');
    stone.addColorStop(1, '#1c1917');
    ctx.fillStyle = stone;

    roundedRect(ctx, gate.x, -10, gateWidth, topH + 10, 8);
    ctx.fill();
    roundedRect(ctx, gate.x - 6, topH, gateWidth + 12, 18, 6);
    ctx.fillStyle = '#dc2626';
    ctx.fill();

    ctx.fillStyle = stone;
    roundedRect(ctx, gate.x, bottomY, gateWidth, bottomH + 10, 8);
    ctx.fill();
    roundedRect(ctx, gate.x - 6, gate.gapY + gateGap, gateWidth + 12, 18, 6);
    ctx.fillStyle = '#dc2626';
    ctx.fill();

    const glow = 0.5 + Math.sin(time / 200 + gate.x / 40) * 0.35;
    ctx.strokeStyle = `rgba(249, 115, 22, ${glow})`;
    ctx.lineWidth = 2.5;
    for (let y = 30; y < topH - 20; y += 45) {
      ctx.beginPath();
      ctx.moveTo(gate.x + 15, y);
      ctx.lineTo(gate.x + 36, y + 14);
      ctx.lineTo(gate.x + 55, y);
      ctx.stroke();
    }
    for (let y = bottomY + 30; y < height - 30; y += 45) {
      ctx.beginPath();
      ctx.moveTo(gate.x + 15, y + 14);
      ctx.lineTo(gate.x + 36, y);
      ctx.lineTo(gate.x + 55, y + 14);
      ctx.stroke();
    }
  } else if (realm.obstacleType === 'crystal') {
    const crystalGrad = ctx.createLinearGradient(gate.x, 0, gate.x + gateWidth, 0);
    crystalGrad.addColorStop(0, '#0284c7');
    crystalGrad.addColorStop(0.4, '#38bdf8');
    crystalGrad.addColorStop(0.8, '#818cf8');
    crystalGrad.addColorStop(1, '#1e1b4b');
    ctx.fillStyle = crystalGrad;

    ctx.beginPath();
    ctx.moveTo(gate.x, 0);
    ctx.lineTo(gate.x + gateWidth, 0);
    ctx.lineTo(gate.x + gateWidth - 8, topH - 15);
    ctx.lineTo(gate.x + gateWidth / 2, topH);
    ctx.lineTo(gate.x + 8, topH - 15);
    ctx.closePath();
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(gate.x + 8, bottomY + 15);
    ctx.lineTo(gate.x + gateWidth / 2, bottomY);
    ctx.lineTo(gate.x + gateWidth - 8, bottomY + 15);
    ctx.lineTo(gate.x + gateWidth, height);
    ctx.lineTo(gate.x, height);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(gate.x + gateWidth / 2, 0);
    ctx.lineTo(gate.x + gateWidth / 2, topH);
    ctx.moveTo(gate.x + gateWidth / 2, bottomY);
    ctx.lineTo(gate.x + gateWidth / 2, height);
    ctx.stroke();
  } else if (realm.obstacleType === 'storm') {
    const metal = ctx.createLinearGradient(gate.x, 0, gate.x + gateWidth, 0);
    metal.addColorStop(0, '#1e293b');
    metal.addColorStop(0.5, '#64748b');
    metal.addColorStop(1, '#0f172a');
    ctx.fillStyle = metal;

    roundedRect(ctx, gate.x + 10, -10, gateWidth - 20, topH + 10, 6);
    ctx.fill();
    roundedRect(ctx, gate.x, topH - 14, gateWidth, 14, 4);
    ctx.fill();

    roundedRect(ctx, gate.x + 10, bottomY, gateWidth - 20, bottomH + 10, 6);
    ctx.fill();
    roundedRect(ctx, gate.x, bottomY, gateWidth, 14, 4);
    ctx.fill();

    ctx.fillStyle = '#facc15';
    ctx.beginPath();
    ctx.arc(gate.x + gateWidth / 2, topH - 7, 9, 0, Math.PI * 2);
    ctx.arc(gate.x + gateWidth / 2, bottomY + 7, 9, 0, Math.PI * 2);
    ctx.fill();

    if (Math.random() < 0.6) {
      ctx.strokeStyle = '#fef08a';
      ctx.shadowColor = '#facc15';
      ctx.shadowBlur = 12;
      ctx.lineWidth = 2;
      ctx.beginPath();
      let currX = gate.x + gateWidth / 2;
      let currY = topH;
      ctx.moveTo(currX, currY);
      const steps = 5;
      const segH = gateGap / steps;
      for (let s = 1; s <= steps; s++) {
        currX += (Math.random() - 0.5) * 26;
        currY += segH;
        ctx.lineTo(currX, currY);
      }
      ctx.stroke();
      ctx.shadowBlur = 0;
    }
  } else if (realm.obstacleType === 'void') {
    const voidGrad = ctx.createLinearGradient(gate.x, 0, gate.x + gateWidth, 0);
    voidGrad.addColorStop(0, '#1e1035');
    voidGrad.addColorStop(0.5, '#581c87');
    voidGrad.addColorStop(1, '#090314');
    ctx.fillStyle = voidGrad;

    roundedRect(ctx, gate.x + 6, -10, gateWidth - 12, topH + 10, 10);
    ctx.fill();
    roundedRect(ctx, gate.x + 6, bottomY, gateWidth - 12, bottomH + 10, 10);
    ctx.fill();

    ctx.fillStyle = '#c084fc';
    ctx.shadowColor = '#a855f7';
    ctx.shadowBlur = 14;
    ctx.beginPath();
    ctx.ellipse(gate.x + gateWidth / 2, topH, gateWidth / 2 - 2, 8, 0, 0, Math.PI * 2);
    ctx.ellipse(gate.x + gateWidth / 2, bottomY, gateWidth / 2 - 2, 8, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
  } else if (realm.obstacleType === 'temple') {
    const stone = ctx.createLinearGradient(gate.x, 0, gate.x + gateWidth, 0);
    stone.addColorStop(0, '#064e3b');
    stone.addColorStop(0.4, '#047857');
    stone.addColorStop(1, '#022c22');
    ctx.fillStyle = stone;

    roundedRect(ctx, gate.x, -10, gateWidth, topH + 10, 8);
    ctx.fill();
    roundedRect(ctx, gate.x - 4, topH - 18, gateWidth + 8, 18, 6);
    ctx.fill();

    roundedRect(ctx, gate.x, bottomY, gateWidth, bottomH + 10, 8);
    ctx.fill();
    roundedRect(ctx, gate.x - 4, bottomY, gateWidth + 8, 18, 6);
    ctx.fill();

    ctx.fillStyle = '#fde047';
    ctx.font = '700 16px sans-serif';
    ctx.textAlign = 'center';
    for (let y = 40; y < topH - 30; y += 45) {
      ctx.fillText('⚡', gate.x + gateWidth / 2, y);
    }
    for (let y = bottomY + 45; y < height - 30; y += 45) {
      ctx.fillText('🐉', gate.x + gateWidth / 2, y);
    }

    ctx.strokeStyle = '#4ade80';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(gate.x - 2, 0);
    ctx.quadraticCurveTo(gate.x + 25, topH / 2, gate.x + gateWidth + 2, topH);
    ctx.stroke();
  }

  if (gate.item && !gate.item.collected) {
    const itemX = gate.x + gateWidth / 2;
    const itemY = gate.item.y;
    const pulse = Math.sin(time / 140) * 3;

    ctx.save();
    ctx.translate(itemX, itemY + pulse);

    if (gate.item.type === 'shield') {
      ctx.shadowColor = '#38bdf8';
      ctx.shadowBlur = 12;
      ctx.fillStyle = '#0284c7';
      ctx.beginPath();
      ctx.arc(0, 0, 14, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#bae6fd';
      ctx.font = '700 14px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('🛡️', 0, 1);
    } else if (gate.item.type === 'star') {
      ctx.shadowColor = '#facc15';
      ctx.shadowBlur = 12;
      ctx.fillStyle = '#eab308';
      ctx.beginPath();
      ctx.arc(0, 0, 14, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#fef08a';
      ctx.font = '700 14px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('⭐', 0, 1);
    } else if (gate.item.type === 'slow') {
      ctx.shadowColor = '#c084fc';
      ctx.shadowBlur = 12;
      ctx.fillStyle = '#9333ea';
      ctx.beginPath();
      ctx.arc(0, 0, 14, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#f5d0fe';
      ctx.font = '700 14px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('⏳', 0, 1);
    }
    ctx.restore();
  }

  ctx.restore();
}

export function drawParticles(ctx: CanvasRenderingContext2D, particles: Particle[]) {
  particles.forEach((p) => {
    ctx.save();
    ctx.globalAlpha = Math.max(0, p.life / p.maxLife);
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  });
}
