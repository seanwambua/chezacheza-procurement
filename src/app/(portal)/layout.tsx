
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
        <SheetContent side="bottom" className="h-auto sm:h-[40vh] p-6 sm:p-10 flex flex-col justify-center border-t-accent shadow-2xl">
          <div className="max-w-4xl mx-auto w-full space-y-6">
            <SheetHeader className="text-left">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-accent/10 rounded-xl text-accent">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <SheetTitle className="text-2xl font-black tracking-tight text-primary">Data Protection & Privacy Consent</SheetTitle>
              </div>
              <SheetDescription className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                Chezacheza is committed to protecting your professional and personal data. By using the CPP Portal, 
                you acknowledge that we collect procurement-related data, including user identity, departmental 
                requisitions, and vendor contact information for audit and organizational efficiency purposes.
              </SheetDescription>
            </SheetHeader>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
              <div className="p-4 bg-muted/30 rounded-xl border border-border/50">
                <p className="text-[10px] font-black uppercase text-primary mb-1">Purpose of Collection</p>
                <p className="text-xs text-muted-foreground">Internal procurement management, budget verification, and vendor audit tracking.</p>
              </div>
              <div className="p-4 bg-muted/30 rounded-xl border border-border/50">
                <p className="text-[10px] font-black uppercase text-primary mb-1">Your Rights</p>
                <p className="text-xs text-muted-foreground">You may request access to your recorded data or its removal by contacting the System Administrator.</p>
              </div>
            </div>
            <SheetFooter className="flex flex-col sm:flex-row gap-3 pt-6 border-t">
              <Button 
                className="w-full bg-primary font-black uppercase text-xs h-12 shadow-lg"
                onClick={() => setConsent(true)}
              >
                I Acknowledge & Accept
              </Button>
            </SheetFooter>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
