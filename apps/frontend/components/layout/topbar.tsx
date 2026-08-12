'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Bell, HelpCircle, LogOut, Menu, Search, Settings } from 'lucide-react';

import {
  Avatar,
  Button,
  Dropdown,
  DropdownItem,
  Input,
  Drawer,
} from '@repo/shared-ui';
import { SidebarNav } from '@/components/layout/sidebar-nav';
import { useAuthStore } from '@/stores/auth-store';

function initialsFor(name: string | null, email: string): string {
  if (name) {
    return name
      .split(' ')
      .map((part) => part[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();
  }
  return email.slice(0, 2).toUpperCase();
}

export function Topbar() {
  const router = useRouter();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  async function handleLogout() {
    await logout();
    router.push('/login');
  }

  const displayName = user
    ? [user.firstName, user.lastName].filter(Boolean).join(' ') || user.email
    : 'Not signed in';

  const hasRoles = mounted ? !!(user && user.roles.length > 0) : true;

  return (
    <header className="bg-background flex h-14 shrink-0 items-center gap-3 border-b px-4">
      {hasRoles ? (
        <>
          <Drawer
            isOpen={mobileNavOpen}
            onClose={() => setMobileNavOpen(false)}
            position="left"
          >
            <div className="w-64 p-0 h-full bg-background">
              <div className="border-b p-4">
                <h2 className="text-lg font-semibold">Agentic CMS</h2>
              </div>
              <SidebarNav onNavigate={() => setMobileNavOpen(false)} />
            </div>
          </Drawer>
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setMobileNavOpen(true)}
            aria-label="Open navigation"
          >
            <Menu className="size-5" />
          </Button>
          <span className="hidden font-semibold md:inline">Agentic CMS</span>
        </>
      ) : (
        <span className="font-semibold">Agentic CMS</span>
      )}

      {hasRoles && (
        <div className="relative ml-2 hidden max-w-sm flex-1 md:block">
          <Input
            value=""
            onChange={() => {}}
            placeholder="Search"
            variant="default"
            icon={Search}
            className="mb-0"
          />
        </div>
      )}

      <div className="ml-auto flex items-center gap-1">
        <Button variant="ghost" size="icon" aria-label="Help">
          <HelpCircle className="size-4" />
        </Button>
        <Button variant="ghost" size="icon" aria-label="Notifications">
          <Bell className="size-4" />
        </Button>

        <Dropdown
          trigger={
            <Button
              variant="ghost"
              className="relative size-8 rounded-full"
              aria-label={displayName}
            >
              <Avatar
                className="size-8"
                letters={initialsFor(displayName, user?.email ?? '??')}
              />
            </Button>
          }
        >
          <DropdownItem onSelect={() => router.push('/settings')}>
            <Settings className="mr-2 size-4" />
            <span>Settings</span>
          </DropdownItem>
          <DropdownItem onSelect={() => {}}>
            <HelpCircle className="mr-2 size-4" />
            <span>Help & Support</span>
          </DropdownItem>
          <DropdownItem onSelect={handleLogout}>
            <LogOut className="mr-2 size-4" />
            <span>Log out</span>
          </DropdownItem>
        </Dropdown>
      </div>
    </header>
  );
}
