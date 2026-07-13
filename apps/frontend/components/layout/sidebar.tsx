import { SidebarNav } from '@/components/layout/sidebar-nav';

export function Sidebar() {
  return (
    <aside className="bg-background hidden w-64 shrink-0 border-r md:flex md:flex-col">
      <SidebarNav />
    </aside>
  );
}
