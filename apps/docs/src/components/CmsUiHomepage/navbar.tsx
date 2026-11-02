import React, { useEffect } from 'react';
import Link from '@docusaurus/Link';
import useBaseUrl from '@docusaurus/useBaseUrl';
import NavbarColorModeToggle from '@theme/Navbar/ColorModeToggle';
import { GitHubIcon, ArrowRightIcon } from './icons';
import styles from './navbar.module.css';

export function CmsUiNavbar() {
  const logoUrl = useBaseUrl('/img/logo.png');

  useEffect(() => {
    document.body.classList.add('has-custom-navbar');
    return () => {
      document.body.classList.remove('has-custom-navbar');
    };
  }, []);

  return (
    <nav className={styles.navbar} aria-label="CMS UI Navigation">
      <div className={styles.inner}>
        {/* Brand */}
        <Link to="/cms-ui" className={styles.brand}>
          <img src={logoUrl} alt="Agentic CMS Flame Logo" className={styles.logoImg} />
          <span className={styles.brandTitle}>Agentic CMS</span>
          <span className={styles.brandBadge}>UI Studio</span>
        </Link>

        {/* Center Links */}
        <div className={styles.navLinks}>
          <a href="#features" className={styles.navLink}>
            Features
          </a>
          <Link to="/cms-ui/docs/getting-started/introduction" className={styles.navLink}>
            Studio Docs
          </Link>
          <Link to="/" className={styles.navLink}>
            CMS Core
          </Link>
          <Link to="/docs/getting-started/introduction" className={styles.navLink}>
            Core Docs
          </Link>
        </div>

        {/* Right Actions */}
        <div className={styles.rightActions}>
          <NavbarColorModeToggle className={styles.colorModeToggle} />

          <Link
            to="https://github.com/mindfiredigital/agentic-headless-cms"
            className={styles.githubBtn}
            title="View on GitHub"
            aria-label="GitHub Repository"
          >
            <GitHubIcon size={18} />
          </Link>

          <Link
            to="/cms-ui/docs/getting-started/introduction"
            className={styles.ctaBtn}
          >
            Explore Docs <ArrowRightIcon size={13} />
          </Link>
        </div>
      </div>
    </nav>
  );
}
