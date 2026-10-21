import { createElement, useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react'

interface RevealProps {
  children: ReactNode
  delay?: number
  className?: string
  as?: 'div' | 'section' | 'li' | 'article' | 'header'
  from?: 'up' | 'left' | 'right'
}

/** Fades/slides content in the first time it scrolls into view. */
export default function Reveal({ children, delay = 0, className = '', as = 'div', from = 'up' }: RevealProps) {
  const ref = useRef<HTMLElement>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (!('IntersectionObserver' in window)) {
      setVisible(true)
      return
    }
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true)
          io.disconnect()
        }
      },
      { threshold: 0.1, rootMargin: '0px 0px -5% 0px' },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])

  return createElement(
    as,
    {
      ref,
      className: `reveal ${from === 'left' ? 'reveal-left' : from === 'right' ? 'reveal-right' : ''} ${visible ? 'is-visible' : ''} ${className}`,
      style: { '--d': `${delay}ms` } as CSSProperties,
    },
    children,
  )
}
