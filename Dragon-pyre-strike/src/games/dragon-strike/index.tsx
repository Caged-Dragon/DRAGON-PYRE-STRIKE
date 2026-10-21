import { useEffect, useRef, useState, type TouchEvent } from 'react'
import { RotateCcw, Play, Heart } from 'lucide-react'
import type { GamePlayProps } from '../registry'
import { sfx } from '@/utils/sound'

const WIDTH = 380
const HEIGHT = 520
const SHIP_Y = HEIGHT - 46
const SHIP_HALF_W = 18
const SHIP_SPEED = 320
const BULLET_SPEED = 480
const BULLET_COOLDOWN = 260
const ENEMY_SPEED = 70
const ENEMY_SPAWN_INTERVAL = 850
const ENEMY_R = 16

interface Bullet {
  x: number
  y: number
}
interface Enemy {
  x: number
  y: number
  r: number
}
interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  life: number
  maxLife: number
  color: string
}
interface Physics {
  shipX: number
  bullets: Bullet[]
  enemies: Enemy[]
  particles: Particle[]
  score: number
  lives: number
  status: 'ready' | 'playing' | 'over'
  lastSpawn: number
  lastShot: number
}

function initPhysics(): Physics {
  return { shipX: WIDTH / 2, bullets: [], enemies: [], particles: [], score: 0, lives: 3, status: 'ready', lastSpawn: 0, lastShot: BULLET_COOLDOWN }
}

function spawnBurst(particles: Particle[], x: number, y: number, color: string) {
  const count = 8
  for (let i = 0; i < count; i++) {
    const angle = (Math.PI * 2 * i) / count + Math.random() * 0.4
    const speed = 60 + Math.random() * 90
    particles.push({ x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, life: 0.4, maxLife: 0.4, color })
  }
}

function draw(ctx: CanvasRenderingContext2D, p: Physics) {
  const bgGrad = ctx.createRadialGradient(WIDTH / 2, HEIGHT * 0.3, 0, WIDTH / 2, HEIGHT / 2, HEIGHT * 0.8)
  bgGrad.addColorStop(0, '#1c1212')
  bgGrad.addColorStop(1, '#0f0909')
  ctx.fillStyle = bgGrad
  ctx.fillRect(0, 0, WIDTH, HEIGHT)

  for (let i = 0; i < 46; i++) {
    const depth = i % 3
    ctx.fillStyle = depth === 0 ? 'rgba(255,255,255,0.12)' : depth === 1 ? 'rgba(255,255,255,0.22)' : 'rgba(255,255,255,0.4)'
    ctx.fillRect((i * 53) % WIDTH, (i * 97 + 30) % HEIGHT, depth === 2 ? 2 : 1, depth === 2 ? 2 : 1)
  }

  p.particles.forEach((particle) => {
    ctx.globalAlpha = Math.max(0, particle.life / particle.maxLife)
    ctx.fillStyle = particle.color
    ctx.beginPath()
    ctx.arc(particle.x, particle.y, 2, 0, Math.PI * 2)
    ctx.fill()
  })
  ctx.globalAlpha = 1

  p.bullets.forEach((b) => {
    ctx.save()
    ctx.shadowColor = '#F59E0B'
    ctx.shadowBlur = 8
    ctx.fillStyle = '#FDE68A'
    ctx.beginPath()
    ctx.roundRect(b.x - 2, b.y - 9, 4, 13, 2)
    ctx.fill()
    ctx.restore()
  })

  p.enemies.forEach((en) => {
    ctx.save()
    ctx.shadowColor = '#6366F1'
    ctx.shadowBlur = 8
    const grad = ctx.createLinearGradient(en.x, en.y - en.r, en.x, en.y + en.r)
    grad.addColorStop(0, '#818CF8')
    grad.addColorStop(1, '#4338CA')
    ctx.fillStyle = grad
    ctx.beginPath()
    ctx.moveTo(en.x, en.y - en.r)
    ctx.lineTo(en.x + en.r, en.y + en.r)
    ctx.lineTo(en.x - en.r, en.y + en.r)
    ctx.closePath()
    ctx.fill()
    ctx.restore()
    ctx.fillStyle = 'rgba(255,255,255,0.5)'
    ctx.beginPath()
    ctx.arc(en.x, en.y + en.r * 0.15, 1.6, 0, Math.PI * 2)
    ctx.fill()
  })

  // Engine glow, drawn first so the hull sits on top of it
  ctx.save()
  ctx.shadowColor = '#F59E0B'
  ctx.shadowBlur = 16
  ctx.fillStyle = 'rgba(34,211,238,0.7)'
  ctx.beginPath()
  ctx.moveTo(p.shipX - 5, SHIP_Y + 12)
  ctx.lineTo(p.shipX, SHIP_Y + 22 + Math.random() * 4)
  ctx.lineTo(p.shipX + 5, SHIP_Y + 12)
  ctx.closePath()
  ctx.fill()
  ctx.restore()

  ctx.save()
  ctx.shadowColor = '#DC2626'
  ctx.shadowBlur = 10
  const shipGrad = ctx.createLinearGradient(p.shipX, SHIP_Y - 18, p.shipX, SHIP_Y + 14)
  shipGrad.addColorStop(0, '#FCA5A5')
  shipGrad.addColorStop(1, '#991B1B')
  ctx.fillStyle = shipGrad
  ctx.beginPath()
  ctx.moveTo(p.shipX, SHIP_Y - 18)
  ctx.lineTo(p.shipX + SHIP_HALF_W, SHIP_Y + 14)
  ctx.lineTo(p.shipX, SHIP_Y + 6)
  ctx.lineTo(p.shipX - SHIP_HALF_W, SHIP_Y + 14)
  ctx.closePath()
  ctx.fill()
  ctx.restore()
  ctx.fillStyle = 'rgba(34,211,238,0.9)'
  ctx.beginPath()
  ctx.arc(p.shipX, SHIP_Y - 4, 2.5, 0, Math.PI * 2)
  ctx.fill()
}

export default function SpaceShooter({ onScore, soundOn }: GamePlayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const physicsRef = useRef<Physics>(initPhysics())
  const rafRef = useRef<number | null>(null)
  const lastTimeRef = useRef<number | null>(null)
  const keysRef = useRef<Set<string>>(new Set())
  const pointerXRef = useRef<number | null>(null)
  const touchActiveRef = useRef(false)
  const [, forceRender] = useState(0)
  const [best, setBest] = useState(0)

  function startGame() {
    const p = physicsRef.current
    if (p.status === 'ready') {
      p.status = 'playing'
      lastTimeRef.current = null
    }
  }

  function restart() {
    physicsRef.current = initPhysics()
    lastTimeRef.current = null
    forceRender((n) => n + 1)
  }

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      keysRef.current.add(e.key === ' ' ? ' ' : e.key)
      if (e.code === 'Space' || ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) e.preventDefault()
      if (e.code === 'Space') startGame()
      if (['ArrowLeft', 'ArrowRight', 'a', 'A', 'd', 'D'].includes(e.key)) pointerXRef.current = null
    }
    function onKeyUp(e: KeyboardEvent) {
      keysRef.current.delete(e.key === ' ' ? ' ' : e.key)
    }
    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
    }
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!

    const lastStatusRef = { current: physicsRef.current.status }
    const lastScoreRef = { current: physicsRef.current.score }
    const lastLivesRef = { current: physicsRef.current.lives }

    function step(time: number) {
      const p = physicsRef.current
      const last = lastTimeRef.current ?? time
      const dt = Math.min(0.033, (time - last) / 1000)
      lastTimeRef.current = time

      if (p.status === 'playing') {
        if (keysRef.current.has('ArrowLeft') || keysRef.current.has('a') || keysRef.current.has('A')) p.shipX -= SHIP_SPEED * dt
        if (keysRef.current.has('ArrowRight') || keysRef.current.has('d') || keysRef.current.has('D')) p.shipX += SHIP_SPEED * dt
        if (pointerXRef.current !== null) {
          p.shipX += (pointerXRef.current - p.shipX) * Math.min(1, dt * 14)
        }
        p.shipX = Math.max(SHIP_HALF_W, Math.min(WIDTH - SHIP_HALF_W, p.shipX))

        p.lastShot += dt * 1000
        const wantsFire = keysRef.current.has(' ') || touchActiveRef.current
        if (wantsFire && p.lastShot > BULLET_COOLDOWN) {
          p.lastShot = 0
          p.bullets.push({ x: p.shipX, y: SHIP_Y - 16 })
          if (soundOn) sfx.blip()
        }

        p.bullets.forEach((b) => (b.y -= BULLET_SPEED * dt))
        p.bullets = p.bullets.filter((b) => b.y > -10)

        p.lastSpawn += dt * 1000
        if (p.lastSpawn > ENEMY_SPAWN_INTERVAL) {
          p.lastSpawn = 0
          p.enemies.push({ x: 24 + Math.random() * (WIDTH - 48), y: -20, r: ENEMY_R })
        }
        p.enemies.forEach((en) => (en.y += ENEMY_SPEED * dt))

        const survivingEnemies: Enemy[] = []
        for (const en of p.enemies) {
          let destroyed = false
          p.bullets = p.bullets.filter((b) => {
            if (!destroyed && Math.hypot(b.x - en.x, b.y - en.y) < en.r + 4) {
              destroyed = true
              return false
            }
            return true
          })
          if (destroyed) {
            p.score += 10
            spawnBurst(p.particles, en.x, en.y, '#818CF8')
            if (soundOn) sfx.score()
          } else {
            survivingEnemies.push(en)
          }
        }
        p.enemies = survivingEnemies

        const remaining: Enemy[] = []
        for (const en of p.enemies) {
          const reachedBottom = en.y > HEIGHT + en.r
          const hitShip = !reachedBottom && en.y + en.r > SHIP_Y - 14 && Math.abs(en.x - p.shipX) < SHIP_HALF_W + en.r
          if (reachedBottom || hitShip) {
            p.lives -= 1
            if (soundOn) sfx.hit()
          } else {
            remaining.push(en)
          }
        }
        p.enemies = remaining

        if (p.lives <= 0) {
          p.status = 'over'
          if (soundOn) sfx.gameOver()
          onScore?.(p.score)
          setBest((b) => Math.max(b, p.score))
        }
      }

      p.particles.forEach((particle) => {
        particle.x += particle.vx * dt
        particle.y += particle.vy * dt
        particle.life -= dt
      })
      p.particles = p.particles.filter((particle) => particle.life > 0)

      draw(ctx, p)
      rafRef.current = requestAnimationFrame(step)

      if (p.status !== lastStatusRef.current || p.score !== lastScoreRef.current || p.lives !== lastLivesRef.current) {
        lastStatusRef.current = p.status
        lastScoreRef.current = p.score
        lastLivesRef.current = p.lives
        forceRender((n) => n + 1)
      }
    }

    rafRef.current = requestAnimationFrame(step)
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [soundOn])

  function mapTouchX(clientX: number): number {
    const rect = canvasRef.current?.getBoundingClientRect()
    if (!rect) return WIDTH / 2
    return ((clientX - rect.left) / rect.width) * WIDTH
  }

  function onTouchStart(e: TouchEvent) {
    e.preventDefault()
    touchActiveRef.current = true
    pointerXRef.current = mapTouchX(e.touches[0].clientX)
    startGame()
  }
  function onTouchMove(e: TouchEvent) {
    pointerXRef.current = mapTouchX(e.touches[0].clientX)
  }
  function onTouchEnd() {
    touchActiveRef.current = false
    pointerXRef.current = null
  }

  const status = physicsRef.current.status
  const score = physicsRef.current.score
  const lives = physicsRef.current.lives

  return (
    <div className="flex w-full max-w-md flex-col items-center gap-3 py-4">
      <div className="stat-mono flex w-full items-center justify-between text-sm">
        <span className="rounded-lg bg-surface2 px-3 py-1.5 font-bold text-secondary">Score: {score}</span>
        <span className="flex items-center gap-1 rounded-lg bg-surface2 px-3 py-1.5">
          {Array.from({ length: 3 }).map((_, i) => (
            <Heart key={i} className={`h-3.5 w-3.5 ${i < lives ? 'fill-danger text-danger' : 'text-muted'}`} />
          ))}
        </span>
        <span className="rounded-lg bg-surface2 px-3 py-1.5 font-bold text-textMuted">Best: {best}</span>
      </div>

      <div className="relative select-none" onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd}>
        <canvas
          ref={canvasRef}
          width={WIDTH}
          height={HEIGHT}
          className="max-h-[70vh] w-full max-w-[340px] touch-none rounded-xl sm:max-w-[380px]"
        />
        {status !== 'playing' && (
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-3 rounded-xl bg-black/60 backdrop-blur-sm">
            {status === 'over' ? (
              <>
                <p className="font-display text-lg font-bold text-white">Score: {score}</p>
                <button
                  onClick={restart}
                  className="btn-focus pointer-events-auto flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-primary2"
                >
                  <RotateCcw className="h-4 w-4" /> Try Again
                </button>
              </>
            ) : (
              <button
                onClick={startGame}
                className="btn-focus pointer-events-auto flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-primary2"
              >
                <Play className="h-4 w-4 fill-white" /> Start
              </button>
            )}
          </div>
        )}
      </div>

      <p className="text-center text-xs text-muted">← → or A/D to move, Space to fire · Drag + hold on mobile</p>
    </div>
  )
}
