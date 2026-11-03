import React from 'react';
import Navbar from '@theme-original/Navbar';
import type NavbarType from '@theme/Navbar';
import type { WrapperProps } from '@docusaurus/types';
import { useLocation } from '@docusaurus/router';

type Props = WrapperProps<typeof NavbarType>;

export default function NavbarWrapper(props: Props): React.JSX.Element | null {
  const location = useLocation();

  // If on the CMS UI landing page, suppress the default Docusaurus navbar completely
  if (location.pathname === '/cms-ui' || location.pathname === '/cms-ui/') {
    return null;
  }

  return <Navbar {...props} />;
}
