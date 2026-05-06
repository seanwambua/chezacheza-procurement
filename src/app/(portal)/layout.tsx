
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
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

export default function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isSidebarCollapsed } = useUserStore();
  const [mounted, setMounted] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const defaultSidebarWidth = "w-20";
  const defaultMainMargin = "md:ml-20";

  // Match the collapsed default from the store
  const sidebarWidth = isSidebarCollapsed ? "w-20" : "w-64";
  const mainMargin = isSidebarCollapsed ? "md:ml-20" : "md:ml-64";

  return (
    <div className="flex min-h-screen bg-background text-foreground overflow-x-hidden">
      {/* Mobile Header */}
      <header className="md:hidden fixed top-0 left-0 right-0 h-16 bg-card border-b z-40 flex items-center justify-between px-6">
        <h1 className="text-xl font-headline font-bold text-primary tracking-tighter">
          CPP <span className="text-accent">Portal</span>
        </h1>
        <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="hover:bg-accent/10">
              <Menu className="w-6 h-6 text-primary" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-[280px] sm:w-[320px] border-r-primary/10">
            <SheetHeader className="sr-only">
              <SheetTitle>Navigation Menu</SheetTitle>
            </SheetHeader>
            <SidebarNav 
              forceExpanded 
              onAction={() => setIsMobileMenuOpen(false)} 
            />
          </SheetContent>
        </Sheet>
      </header>

      {/* Desktop Sidebar */}
      <aside className={cn(
        "fixed inset-y-0 hidden md:block z-50 transition-all duration-300 ease-in-out border-r border-sidebar-border",
        mounted ? sidebarWidth : defaultSidebarWidth
      )}>
        <SidebarNav />
      </aside>

      {/* Main Content */}
      <main className={cn(
        "flex-1 p-6 md:p-10 max-w-7xl mx-auto w-full transition-all duration-300 ease-in-out mt-16 md:mt-0",
        mounted ? mainMargin : defaultMainMargin
      )}>
        {children}
      </main>
    </div>
  );
}
