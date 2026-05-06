
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
  ChevronDown
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
      { name: 'Requisitions', href: '/requisitions', icon: FileText, roles: ['Admin', 'Manager', 'Staff', 'Finance'] as UserRole[] },
      { name: 'Approvals', href: '/approvals', icon: CheckSquare, roles: ['Admin', 'Manager', 'Finance'] as UserRole[] },
      { name: 'LPOs', href: '/lpos', icon: ShoppingCart, roles: ['Admin', 'Manager', 'Finance'] as UserRole[] },
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

export function SidebarNav({ forceExpanded = false }: { forceExpanded?: boolean }) {
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
        {/* Header - Fixed */}
        <div className={cn(
          "p-4 flex items-center justify-between w-full shrink-0",
          collapsed && "flex-col gap-2 p-2"
        )}>
          {!collapsed ? (
            <div>
              <h1 className="text-xl font-headline font-bold text-primary tracking-tighter">
                CPP <span className="text-accent">Portal</span>
              </h1>
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest mt-0.5">Chezacheza</p>
            </div>
          ) : (
            <div className="text-center">
              <h1 className="text-xl font-headline font-bold text-primary tracking-tighter">CPP</h1>
            </div>
          )}
        </div>
        
        {/* Navigation Items - Scrollable */}
        <div className="flex-1 overflow-y-auto px-3 py-1 space-y-2 scrollbar-thin scrollbar-thumb-muted-foreground/20 hover:scrollbar-thumb-muted-foreground/40">
          <div className="space-y-0.5">
            <Link
              href="/dashboard"
              className={cn(
                "flex items-center gap-3 px-3 py-1.5 text-sm font-medium rounded-md transition-all duration-200",
                pathname === '/dashboard' 
                  ? "bg-primary text-primary-foreground shadow-sm" 
                  : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                collapsed && "justify-center px-0 w-9 h-9"
              )}
            >
              <LayoutDashboard className={cn("w-4 h-4 shrink-0", pathname === '/dashboard' ? "text-primary-foreground" : "text-accent")} />
              {!collapsed && <span className="truncate font-bold">Dashboard</span>}
            </Link>
          </div>

          {navGroups.map((group) => {
            const visibleItems = group.items.filter(item => item.roles.includes(currentUser.role));
            if (visibleItems.length === 0) return null;

            return (
              <div key={group.id} className="space-y-0.5">
                {!collapsed && (
                  <p className="px-3 text-[9px] font-bold uppercase text-muted-foreground tracking-widest mb-1 mt-3 opacity-60">
                    {group.label}
                  </p>
                )}
                {visibleItems.map((item) => {
                  const isActive = pathname === item.href;
                  const linkContent = (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={cn(
                        "flex items-center gap-3 px-3 py-1.5 text-sm font-medium rounded-md transition-all duration-200",
                        isActive 
                          ? "bg-primary text-primary-foreground shadow-sm" 
                          : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                        collapsed && "justify-center px-0 w-9 h-9"
                      )}
                    >
                      <item.icon className={cn("w-4 h-4 shrink-0", isActive ? "text-primary-foreground" : "text-accent")} />
                      {!collapsed && <span className="truncate">{item.name}</span>}
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

        {/* Footer - Pinned */}
        <div className={cn(
          "p-3 mt-auto border-t border-sidebar-border space-y-3 bg-sidebar w-full shrink-0 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]",
          collapsed && "p-1.5 items-center"
        )}>
          <div className={cn("flex items-center gap-1 justify-center", collapsed && "flex-col")}>
            {!forceExpanded && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="w-8 h-8"
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
                  className="w-8 h-8"
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
              <button className={cn(
                "flex items-center justify-between p-1.5 bg-muted/50 rounded-md text-xs hover:bg-muted transition-colors border border-transparent hover:border-sidebar-border w-full",
                collapsed && "justify-center"
              )}>
                {!collapsed ? (
                  <>
                    <div className="flex flex-col items-start min-w-0">
                      <span className="truncate font-bold text-primary">{currentUser.name.split(' ')[0]}</span>
                      <span className="text-[9px] text-muted-foreground uppercase">{currentUser.role}</span>
                    </div>
                    <ChevronDown className="w-3 h-3 ml-2 opacity-50" />
                  </>
                ) : (
                  <UserRound className="w-4 h-4 text-accent" />
                )}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align={collapsed ? "right" : "end"} className="w-56">
              <DropdownMenuLabel className="text-[10px] uppercase text-muted-foreground">Switch Perspective</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {users.map(user => (
                <DropdownMenuItem key={user.id} onClick={() => handleUserSwitch(user)} className="cursor-pointer">
                  <div className="flex flex-col">
                    <span className="font-bold text-xs">{user.name}</span>
                    <span className="text-[9px] text-muted-foreground uppercase">{user.role} • {user.department}</span>
                  </div>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </TooltipProvider>
  );
}
