"use client";

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { 
  LayoutDashboard, 
  FileText, 
  CheckSquare, 
  ShoppingCart, 
  Truck, 
  Users, 
  CreditCard,
  Wallet,
  UserRound,
  Building2,
  Maximize2,
  Minimize2,
  PanelLeftClose,
  PanelLeft,
  ChevronDown,
  Check,
  PackageSearch
} from 'lucide-react';
import { useUserStore } from '@/lib/user-store';
import { UserRole, User } from '@/lib/types';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useEffect, useState } from 'react';
import { ThemeToggle } from './ThemeToggle';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipProvider,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";

const navGroups = [
  {
    id: 'procurement',
    label: 'Procurement Cycle',
    items: [
      { name: 'Orders Hub', href: '/lpos', icon: PackageSearch, roles: ['Admin', 'Manager', 'Staff', 'Finance'] as UserRole[] },
      { name: 'Approvals', href: '/approvals', icon: CheckSquare, roles: ['Admin', 'Manager', 'Finance'] as UserRole[] },
      { name: 'Deliveries (GRN)', href: '/deliveries', icon: Truck, roles: ['Admin', 'Manager', 'Finance'] as UserRole[] },
    ]
  },
  {
    id: 'strategy',
    label: 'Strategic Assets',
    items: [
      { name: 'Budgets', href: '/budgets', icon: Wallet, roles: ['Admin', 'Finance', 'Manager'] as UserRole[] },
      { name: 'Departments', href: '/departments', icon: Building2, roles: ['Admin', 'Finance', 'Manager'] as UserRole[] },
      { name: 'Vendors', href: '/vendors', icon: Users, roles: ['Admin', 'Manager', 'Finance'] as UserRole[] },
    ]
  },
  {
    id: 'admin',
    label: 'Administration',
    items: [
      { name: 'Users', href: '/users', icon: UserRound, roles: ['Admin'] as UserRole[] },
      { name: 'Payments', href: '/payments', icon: CreditCard, roles: ['Admin', 'Finance'] as UserRole[] },
    ]
  }
];

interface SidebarNavProps {
  forceExpanded?: boolean;
  onAction?: () => void;
}

export function SidebarNav({ forceExpanded = false, onAction }: SidebarNavProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { 
    currentUser, 
    users, 
    setCurrentUser, 
    viewPreference, 
    setViewPreference,
    isSidebarCollapsed,
    setSidebarCollapsed
  } = useUserStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="flex flex-col h-full bg-sidebar border-r border-sidebar-border animate-pulse">
        <div className="p-4">
          <div className="h-8 w-32 bg-muted rounded" />
        </div>
      </div>
    );
  }

  if (!currentUser) return null;

  const handleUserSwitch = (user: User) => {
    setCurrentUser(user);
    if (onAction) onAction();
    router.push('/dashboard');
    router.refresh();
  };

  const toggleView = () => {
    setViewPreference(viewPreference === 'detailed' ? 'simple' : 'detailed');
  };

  const toggleSidebar = () => {
    setSidebarCollapsed(!isSidebarCollapsed);
  };

  const collapsed = forceExpanded ? false : isSidebarCollapsed;

  return (
    <TooltipProvider delayDuration={0}>
      <div className={cn(
        "flex flex-col h-full bg-sidebar transition-all duration-300",
        collapsed ? "items-center" : "w-full"
      )}>
        {/* Header */}
        <div className={cn(
          "px-5 pt-8 pb-6 flex items-center justify-between w-full shrink-0 border-b border-sidebar-border/30",
          collapsed && "flex-col gap-2 px-2 pt-6 pb-4 border-none"
        )}>
          {!collapsed ? (
            <div>
              <h1 className="text-xl font-headline font-bold text-primary tracking-tighter leading-none">
                CPP <span className="text-accent">Portal</span>
              </h1>
              <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest mt-1.5 opacity-60">Chezacheza</p>
            </div>
          ) : (
            <div className="text-center">
              <h1 className="text-xl font-headline font-bold text-primary tracking-tighter">CPP</h1>
            </div>
          )}
        </div>
        
        {/* Navigation Items */}
        <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6 scrollbar-thin scrollbar-thumb-muted-foreground/20 hover:scrollbar-thumb-muted-foreground/40">
          <div className="space-y-1">
            <Link
              href="/dashboard"
              onClick={onAction}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-xl transition-all duration-200",
                pathname === '/dashboard' 
                  ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20" 
                  : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                collapsed && "justify-center px-0 w-10 h-10 rounded-lg"
              )}
            >
              <LayoutDashboard className={cn("w-4 h-4 shrink-0", pathname === '/dashboard' ? "text-primary-foreground" : "text-accent")} />
              {!collapsed && <span className="truncate font-bold tracking-tight">Dashboard</span>}
            </Link>
          </div>

          {navGroups.map((group) => {
            const visibleItems = group.items.filter(item => item.roles.includes(currentUser.role));
            if (visibleItems.length === 0) return null;

            return (
              <div key={group.id} className="space-y-1">
                {!collapsed && (
                  <p className="px-3 text-[9px] font-black uppercase text-muted-foreground/40 tracking-[0.15em] mb-2.5">
                    {group.label}
                  </p>
                )}
                {visibleItems.map((item) => {
                  const isActive = pathname === item.href;
                  const linkContent = (
                    <Link
                      key={item.name}
                      href={item.href}
                      onClick={onAction}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-xl transition-all duration-200",
                        isActive 
                          ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20" 
                          : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                        collapsed && "justify-center px-0 w-10 h-10 rounded-lg"
                      )}
                    >
                      <item.icon className={cn("w-4 h-4 shrink-0", isActive ? "text-primary-foreground" : "text-accent")} />
                      {!collapsed && <span className="truncate font-medium">{item.name}</span>}
                    </Link>
                  );

                  if (collapsed) {
                    return (
                      <Tooltip key={item.name}>
                        <TooltipTrigger asChild>
                          {linkContent}
                        </TooltipTrigger>
                        <TooltipContent side="right" className="text-xs font-bold">
                          {item.name}
                        </TooltipContent>
                      </Tooltip>
                    );
                  }

                  return linkContent;
                })}
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className={cn(
          "p-4 mt-auto border-t border-sidebar-border bg-sidebar w-full shrink-0 shadow-[0_-4px_12px_-4px_rgba(0,0,0,0.05)]",
          collapsed && "p-2 items-center"
        )}>
          <div className={cn("flex items-center gap-2 justify-center mb-4", collapsed && "flex-col gap-1 mb-2")}>
            {!forceExpanded && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="w-9 h-9 rounded-lg hover:bg-accent/10"
                    onClick={toggleSidebar}
                  >
                    {collapsed ? <PanelLeft className="w-4 h-4" /> : <PanelLeftClose className="w-4 h-4" />}
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right" className="text-[10px] font-bold">
                  {collapsed ? 'Expand Menu' : 'Collapse Menu'}
                </TooltipContent>
              </Tooltip>
            )}
            
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="w-9 h-9 rounded-lg hover:bg-accent/10"
                  onClick={toggleView}
                >
                  {viewPreference === 'detailed' ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right" className="text-[10px] font-bold">
                {viewPreference === 'detailed' ? 'Switch to Simple View' : 'Switch to Detailed View'}
              </TooltipContent>
            </Tooltip>
            
            <ThemeToggle />
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button 
                type="button"
                className={cn(
                  "flex items-center justify-between p-2 bg-muted/40 rounded-xl text-xs hover:bg-muted/60 transition-all border border-transparent hover:border-sidebar-border w-full group outline-none",
                  collapsed && "justify-center p-1.5"
                )}
              >
                {!collapsed ? (
                  <>
                    <div className="flex flex-col items-start min-w-0 text-left">
                      <span className="truncate font-bold text-primary group-hover:text-accent transition-colors">{currentUser.name}</span>
                      <span className="text-[9px] text-muted-foreground uppercase font-black tracking-tight">{currentUser.role}</span>
                    </div>
                    <ChevronDown className="w-3.5 h-3.5 ml-2 opacity-40 group-hover:opacity-100 transition-opacity" />
                  </>
                ) : (
                  <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center text-accent">
                    <UserRound className="w-4 h-4" />
                  </div>
                )}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align={collapsed ? "right" : "end"} className="w-64 p-2 rounded-xl shadow-xl border-primary/10">
              <DropdownMenuLabel className="text-[10px] uppercase font-black text-muted-foreground/60 tracking-widest px-2 py-1.5">Switch Perspective</DropdownMenuLabel>
              <DropdownMenuSeparator className="my-1 bg-primary/5" />
              <div className="space-y-1">
                {users.map(user => (
                  <DropdownMenuItem 
                    key={user.id} 
                    onClick={() => handleUserSwitch(user)} 
                    className="cursor-pointer rounded-lg px-2 py-2 focus:bg-accent/10 flex items-center justify-between group"
                  >
                    <div className="flex flex-col min-w-0">
                      <span className={cn(
                        "font-bold text-xs transition-colors",
                        currentUser.id === user.id ? "text-accent" : "text-primary"
                      )}>
                        {user.name}
                      </span>
                      <span className="text-[9px] text-muted-foreground uppercase font-bold truncate opacity-70">{user.role} • {user.department}</span>
                    </div>
                    {currentUser.id === user.id && <Check className="w-4 h-4 text-accent" />}
                  </DropdownMenuItem>
                ))}
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </TooltipProvider>
  );
}
