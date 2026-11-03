import React, { useState } from 'react';
import { CopyIcon, CheckIcon, TerminalIcon } from './icons';
import styles from './quickstart.module.css';

type PkgType = 'pnpm' | 'npm' | 'docker' | 'git';

const COMMANDS: Record<PkgType, { cmd: string; desc: string }> = {
  pnpm: {
    cmd: 'pnpm --filter @agentic/cms-ui dev',
    desc: 'Runs the Vite development server with hot-reload at http://localhost:3003',
  },
  npm: {
    cmd: 'cd apps/cms-ui && npm run dev',
    desc: 'Starts the CMS UI standalone development server',
  },
  docker: {
    cmd: 'docker compose up cms-ui -d',
    desc: 'Launches containerized CMS UI linked to your backend and Redis',
  },
  git: {
    cmd: 'git clone https://github.com/mindfiredigital/agentic-headless-cms.git',
    desc: 'Clones the complete monorepo including Core, Backend, and CMS UI',
  },
};

export function CmsUiQuickstartSection() {
  const [activePkg, setActivePkg] = useState<PkgType>('pnpm');
  const [copied, setCopied] = useState(false);

  const activeCmd = COMMANDS[activePkg];

  const handleCopy = () => {
    navigator.clipboard.writeText(activeCmd.cmd);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <section className={styles.section} aria-label="CMS UI Quickstart">
      <div className={styles.inner}>
        {/* Section Header */}
        <div className={styles.header}>
          <div className={styles.eyebrow}>
            <TerminalIcon size={14} />
            <span>Developer Quickstart</span>
          </div>
          <h2 className={styles.title}>
            Launch in <span className={styles.gradientWord}>Seconds</span>
          </h2>
          <p className={styles.subtitle}>
            Clone and run the CMS UI studio directly on your machine. Pre-configured to instantly bind to your local backend.
          </p>
        </div>

        {/* Terminal Container */}
        <div className={styles.terminal}>
          {/* Header Bar */}
          <div className={styles.terminalHeader}>
            <div className={styles.dots}>
              <span className={styles.dotRed} />
              <span className={styles.dotYellow} />
              <span className={styles.dotGreen} />
            </div>

            {/* Package Manager Switcher Tabs */}
            <div className={styles.pkgTabs}>
              {(['pnpm', 'npm', 'docker', 'git'] as PkgType[]).map((pkg) => (
                <button
                  key={pkg}
                  type="button"
                  onClick={() => setActivePkg(pkg)}
                  className={`${styles.pkgBtn} ${activePkg === pkg ? styles.pkgBtnActive : ''}`}
                >
                  {pkg}
                </button>
              ))}
            </div>
          </div>

          {/* Terminal Body */}
          <div className={styles.terminalBody}>
            <div className={styles.codeLine}>
              <div>
                <span className={styles.promptSymbol}>❯</span>
                <span className={styles.commandCode}>{activeCmd.cmd}</span>
              </div>
              <button
                type="button"
                onClick={handleCopy}
                className={styles.copyBtn}
                title={copied ? 'Copied!' : 'Copy command'}
                aria-label="Copy command"
              >
                {copied ? (
                  <>
                    <CheckIcon size={13} style={{ color: '#34d399' }} /> Copied
                  </>
                ) : (
                  <>
                    <CopyIcon size={13} /> Copy
                  </>
                )}
              </button>
            </div>

            {/* Output log */}
            <div className={styles.terminalOutput}>
              <div># {activeCmd.desc}</div>
              <div className={styles.outputSuccess}>
                ✓ Local server: http://localhost:3003
              </div>
              <div>➜ Network: http://192.168.1.45:3003</div>
              <div>➜ press h + enter to show help</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
