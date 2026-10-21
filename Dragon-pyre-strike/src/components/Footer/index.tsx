import { Link } from 'react-router-dom'
import { FullLockup } from '@/components/Logo'
import StarRating from '@/components/StarRating'
import { SITE_CONFIG, FOOTER_LINKS } from '@/data/configuration'
import { useRating } from '@/hooks/usePlayerData'

export default function Footer() {
  const [rating, setRating] = useRating()

  return (
    <footer className="footer-forge mt-[var(--section-y)]">
      <div className="container-fluid py-[clamp(2rem,1.2rem+3vw,4rem)]">
        <div className="footer-grid">
          <div className="min-w-0">
            <FullLockup className="w-40 sm:w-44" />
            <p className="mt-4 max-w-xs text-sm text-textMuted">{SITE_CONFIG.description}</p>
            <p className="eyebrow mt-5">{SITE_CONFIG.studioLine}</p>

            <div className="mt-5">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">
                {rating > 0 ? 'Your rating — thanks!' : 'Rate DracoPyre Strike'}
              </p>
              <StarRating value={rating} onChange={setRating} size="md" label="Rate DracoPyre Strike out of 5 stars" />
              <Link to="/feedback" className="btn-focus mt-2 inline-block rounded text-xs font-semibold text-primary hover:text-secondary">
                Leave a comment too →
              </Link>
            </div>
          </div>
          <FooterCol title="Platform" links={FOOTER_LINKS.platform} />
          <FooterCol title="Company" links={FOOTER_LINKS.company} />
          <FooterCol title="Legal" links={FOOTER_LINKS.legal} />
        </div>
        <div className="mt-10 flex flex-col items-center justify-between gap-3 border-t border-text/5 pt-6 text-xs text-muted sm:flex-row">
          <p>
            © {SITE_CONFIG.year} {SITE_CONFIG.studioName}. All rights reserved.
          </p>
          <p className="stat-mono">v{SITE_CONFIG.version} · Built for the browser. No install required.</p>
        </div>
      </div>
    </footer>
  )
}

function FooterCol({ title, links }: { title: string; links: readonly { label: string; to: string }[] }) {
  return (
    <div>
      <h3 className="eyebrow mb-3">{title}</h3>
      <ul className="space-y-2.5">
        {links.map((l) => (
          <li key={l.label}>
            <Link to={l.to} className="link-slide btn-focus rounded text-sm text-textMuted hover:text-text">
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
