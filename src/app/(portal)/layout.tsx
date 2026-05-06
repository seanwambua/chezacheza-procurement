
"use client";

import { SidebarNav } from '@/components/layout/SidebarNav';
import { useUserStore } from '@/lib/user-store';
import { cn } from '@/lib/utils';
import { useEffect, useState } from 'react';

export default function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isSidebarCollapsed } = useUserStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Avoid hydration mismatch by rendering a stable structure until mounted
  const sidebarWidth = isSidebarCollapsed ? "w-20" : "w-64";
  const mainMargin = isSidebarCollapsed ? "md:ml-20" : "md:ml-64";

  return (
    <div className="flex min-h-screen bg-background text-foreground overflow-x-hidden">
      <aside className={cn(
        "fixed inset-y-0 hidden md:block z-50 transition-all duration-300 ease-in-out border-r border-sidebar-border",
        mounted ? sidebarWidth : "w-64"
      )}>
        <SidebarNav />
      </aside>
      <main className={cn(
        "flex-1 p-6 md:p-10 max-w-7xl mx-auto w-full transition-all duration-300 ease-in-out",
        mounted ? mainMargin : "md:ml-64"
      )}>
        {children}
      </main>
    </div>
  );
}
