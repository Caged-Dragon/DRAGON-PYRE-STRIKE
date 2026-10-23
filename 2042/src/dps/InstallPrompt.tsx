import { useEffect, useState } from 'react';
import { useAuth } from './context';
import { usePwaInstall } from './pwa';
import { ECOSYSTEM_SITES, HUB_SLUG } from './config';

/** The "Install this app" sheet: one-tap where the browser allows it, clear steps everywhere else. */
export function InstallPrompt() {
  const { site } = useAuth();
  const { helpOpen, canPrompt, installed, ios, install, closeHelp } = usePwaInstall();
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const title = site === HUB_SLUG ? 'DracoPyre Strike' : ECOSYSTEM_SITES.find((s) => s.slug === site)?.title ?? 'this game';

  useEffect(() => {
    if (!helpOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && closeHelp();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [helpOpen, closeHelp]);

  if (!helpOpen) return null;

  async function go() {
    setBusy(true);
    const r = await install();
    setBusy(false);
    if (r === 'accepted') setDone(true);
  }

  return (
    <div className="dps-backdrop" onMouseDown={(e) => e.target === e.currentTarget && closeHelp()}>
      <div className="dps-card dps-install" role="dialog" aria-modal="true" aria-labelledby="dps-install-title">
        <button type="button" className="dps-x" aria-label="Close" onClick={closeHelp}>
          ×
        </button>
        <h2 className="dps-title" id="dps-install-title">
          {installed || done ? `${title} is installed` : `Install ${title}`}
        </h2>

        {installed || done ? (
          <p className="dps-sub">Find it with your other apps — it opens full-screen and keeps working offline.</p>
        ) : (
          <>
            <p className="dps-sub">Play it like a normal app: its own icon, full screen, and it works offline after the first load.</p>
            {canPrompt ? (
              <button type="button" className="dps-primary" disabled={busy} onClick={go}>
                {busy ? 'Installing…' : `Install ${title}`}
              </button>
            ) : ios ? (
              <ol className="dps-steps">
                <li>Tap the <b>Share</b> button in Safari (the square with an arrow).</li>
                <li>Choose <b>Add to Home Screen</b>.</li>
                <li>Tap <b>Add</b>. Open {title} from your home screen.</li>
              </ol>
            ) : (
              <ol className="dps-steps">
                <li>Open your browser menu (⋮ or ⋯, or the install icon in the address bar).</li>
                <li>Choose <b>Install app</b> (or <b>Add to Home screen</b>).</li>
                <li>Confirm. Chrome, Edge, Safari and most Android browsers support this; Firefox on desktop does not.</li>
              </ol>
            )}
          </>
        )}
        <button type="button" className="dps-ghost dps-install-close" onClick={closeHelp}>
          {installed || done ? 'Done' : 'Not now'}
        </button>
      </div>
    </div>
  );
}
