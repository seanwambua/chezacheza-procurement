
"use client";

import { SidebarNav } from '@/components/layout/SidebarNav';
import { useUserStore } from '@/lib/user-store';
import { cn } from '@/lib/utils';
import { useEffect, useState } from 'react';
import { Menu, ShieldCheck, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
  SheetDescription,
} from "@/components/ui/sheet";

export default function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isSidebarCollapsed, hasConsentedToDataProtection, setConsent } = useUserStore();
  const [mounted, setMounted] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const defaultSidebarWidth = "w-20";
  const defaultMainMargin = "md:ml-20";

  const sidebarWidth = isSidebarCollapsed ? "w-20" : "w-64";
  const mainMargin = isSidebarCollapsed ? "md:ml-20" : "md:ml-64";

  if (!mounted) return null;

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
        sidebarWidth
      )}>
        <SidebarNav />
      </aside>

      {/* Main Content */}
      <main className={cn(
        "flex-1 p-6 md:p-10 max-w-7xl mx-auto w-full transition-all duration-300 ease-in-out mt-16 md:mt-0",
        mainMargin
      )}>
        {children}
      </main>

      {/* Global Data Protection Consent Sheet */}
      <Sheet open={!hasConsentedToDataProtection} onOpenChange={(open) => !open && setConsent(true)}>
        <SheetContent side="bottom" className="h-auto max-h-[90vh] p-0 border-t-accent shadow-2xl overflow-y-auto">
          <div className="max-w-4xl mx-auto w-full p-6 sm:p-10 space-y-8">
            <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
              <div className="p-4 bg-accent/10 rounded-2xl text-accent shrink-0 shadow-inner">
                <ShieldCheck className="w-8 h-8" />
              </div>
              <div className="space-y-2">
                <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-primary leading-none">
                  Privacy & Data Consent
                </h2>
                <p className="text-sm sm:text-base text-muted-foreground font-medium leading-relaxed max-w-2xl">
                  Chezacheza is committed to protecting your professional data. By accessing the CPP Portal, 
                  you acknowledge the collection of procurement-related information for organizational transparency and audit.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-5 bg-muted/30 rounded-2xl border border-border/50 group hover:border-accent/20 transition-colors">
                <h4 className="text-[10px] font-black uppercase text-accent tracking-[0.1em] mb-2">Purpose of Collection</h4>
                <p className="text-xs text-muted-foreground leading-relaxed font-medium">
                  We process user identity, departmental logs, and vendor data to ensure fiscal responsibility and procurement efficiency.
                </p>
              </div>
              <div className="p-5 bg-muted/30 rounded-2xl border border-border/50 group hover:border-accent/20 transition-colors">
                <h4 className="text-[10px] font-black uppercase text-accent tracking-[0.1em] mb-2">Your Professional Rights</h4>
                <p className="text-xs text-muted-foreground leading-relaxed font-medium">
                  You maintain the right to view or request removal of your professional identity logs by contacting the System Administrator.
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-6 pt-6 border-t">
              <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider opacity-60">
                © 2024 Chezacheza Organizational Policy
              </p>
              <Button 
                className="w-full sm:w-auto bg-primary text-primary-foreground font-black uppercase text-xs h-12 px-10 rounded-xl shadow-xl hover:shadow-primary/20 transition-all"
                onClick={() => setConsent(true)}
              >
                Accept & Enter Portal
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
