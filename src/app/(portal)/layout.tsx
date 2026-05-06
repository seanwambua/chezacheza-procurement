
"use client";

import { SidebarNav } from '@/components/layout/SidebarNav';
import { useUserStore } from '@/lib/user-store';
import { cn } from '@/lib/utils';
import { useEffect, useState } from 'react';
import { Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";

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
      {/* Mobile Header */}
      <header className="md:hidden fixed top-0 left-0 right-0 h-16 bg-card border-b z-40 flex items-center justify-between px-6">
        <h1 className="text-xl font-headline font-bold text-primary tracking-tighter">
          CPP <span className="text-accent">Portal</span>
        </h1>
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon">
              <Menu className="w-6 h-6" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-72">
            <SidebarNav forceExpanded />
          </SheetContent>
        </Sheet>
      </header>

      {/* Desktop Sidebar */}
      <aside className={cn(
        "fixed inset-y-0 hidden md:block z-50 transition-all duration-300 ease-in-out border-r border-sidebar-border",
        mounted ? sidebarWidth : "w-20"
      )}>
        <SidebarNav />
      </aside>

      {/* Main Content */}
      <main className={cn(
        "flex-1 p-6 md:p-10 max-w-7xl mx-auto w-full transition-all duration-300 ease-in-out mt-16 md:mt-0",
        mounted ? mainMargin : "md:ml-20"
      )}>
        {children}
      </main>
    </div>
  );
}

