'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  Bell,
  HelpCircle,
  LogOut,
  Menu,
  Search,
  Settings,
  User,
} from 'lucide-react';

import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
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
          <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
            <SheetContent side="left" className="w-64 p-0">
              <SheetHeader className="border-b">
                <SheetTitle>Agentic CMS</SheetTitle>
              </SheetHeader>
              <SidebarNav onNavigate={() => setMobileNavOpen(false)} />
            </SheetContent>
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setMobileNavOpen(true)}
              aria-label="Open navigation"
            >
              <Menu className="size-5" />
            </Button>
          </Sheet>
          <span className="hidden font-semibold md:inline">Agentic CMS</span>
        </>
      ) : (
        <span className="font-semibold">Agentic CMS</span>
      )}

      {hasRoles && (
        <div className="relative ml-2 hidden max-w-sm flex-1 md:block">
          <Search className="text-muted-foreground absolute top-1/2 left-2.5 size-4 -translate-y-1/2" />
          <Input placeholder="Search" className="pl-8" />
        </div>
      )}

      <div className="ml-auto flex items-center gap-1">
        <Button variant="ghost" size="icon" aria-label="Help">
          <HelpCircle className="size-4" />
        </Button>
        <Button variant="ghost" size="icon" aria-label="Notifications">
          <Bell className="size-4" />
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="gap-2 px-2">
              <Avatar className="size-7">
                <AvatarFallback>
                  {initialsFor(user?.firstName ?? null, user?.email ?? '??')}
                </AvatarFallback>
              </Avatar>
              <span className="hidden text-sm font-medium lg:inline">
                {displayName}
              </span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuLabel>{displayName}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => router.push('/settings')}>
              <User />
              Profile
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => router.push('/settings')}>
              <Settings />
              Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              variant="destructive"
              onClick={() => void handleLogout()}
            >
              <LogOut />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
