'use client';

import { usePathname } from 'next/navigation';
import NavBar from './NavBar';

export default function NavBarWrapper() {
  const pathname = usePathname();

  // Don't render NavBar on '/account' path
  if (pathname === '/account') {
    return null;
  }

  return <NavBar />;
}