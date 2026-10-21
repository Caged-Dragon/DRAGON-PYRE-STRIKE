import { Link } from 'react-router-dom'
import { Compass } from 'lucide-react'
import { Mark } from '@/components/Logo'
import { useDocumentMeta } from '@/hooks/useDocumentMeta'

export default function NotFound() {
  useDocumentMeta('Page Not Found — DracoPyre Strike')
  return (
    <div className="mx-auto flex min-h-[70vh] max-w-lg flex-col items-center justify-center px-4 text-center">
      <Mark className="h-14 w-auto opacity-90" />
      <h1 className="stat-mono text-gradient mt-6 text-5xl font-bold">404</h1>
      <h2 className="mt-3 font-display text-xl font-bold">This page wandered off the map</h2>
      <p className="mt-2 text-sm text-textMuted">The page you're looking for doesn't exist or may have moved.</p>
      <Link
        to="/games"
        className="btn-focus mt-6 flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-primary2"
      >
        <Compass className="h-4 w-4" /> Browse Games
      </Link>
    </div>
  )
}
