import { useCallback, useRef, type PointerEvent } from 'react'

/**
 * Pointer-driven 3D tilt + spotlight for cards. Mouse only (touch never tilts),
 * and a no-op when the visitor prefers reduced motion. Writes CSS variables
 * (--rx --ry --mx --my) that the .game-card / .tilt / .spot styles read.
 */
export function useTilt<T extends HTMLElement>(max = 7) {
  const ref = useRef<T>(null)

  const onPointerMove = useCallback(
    (e: PointerEvent<T>) => {
      if (e.pointerType !== 'mouse') return
      const el = ref.current
      if (!el || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
      const r = el.getBoundingClientRect()
      const x = (e.clientX - r.left) / r.width
      const y = (e.clientY - r.top) / r.height
      el.style.setProperty('--ry', `${((x - 0.5) * 2 * max).toFixed(2)}deg`)
      el.style.setProperty('--rx', `${(-(y - 0.5) * 2 * max).toFixed(2)}deg`)
      el.style.setProperty('--mx', `${(x * 100).toFixed(1)}%`)
      el.style.setProperty('--my', `${(y * 100).toFixed(1)}%`)
    },
    [max],
  )

  const onPointerLeave = useCallback(() => {
    const el = ref.current
    if (!el) return
    el.style.setProperty('--rx', '0deg')
    el.style.setProperty('--ry', '0deg')
  }, [])

  return { ref, onPointerMove, onPointerLeave }
}
