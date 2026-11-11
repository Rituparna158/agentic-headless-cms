import type { Metadata } from 'next';
import { LoginView } from '@/components/auth/login-view';

export const metadata: Metadata = {
  title: 'Sign in — Headless CMS',
  description: 'Sign-in portal for Headless CMS',
};

export default function LoginPage() {
  return <LoginView />;
}
