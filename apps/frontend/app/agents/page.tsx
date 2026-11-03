import type { Metadata } from 'next';
import { AgentsView } from './agents-view';

export const metadata: Metadata = {
  title: 'Autonomous Agents — Agentic CMS',
};

export default function AgentsPage() {
  return <AgentsView />;
}
