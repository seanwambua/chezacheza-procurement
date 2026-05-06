
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
  ChevronDown,
  Building2,
  Maximize2,
  Minimize2,
  ChevronRight,
  ChevronLeft,
  PanelLeftClose,
  PanelLeft
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
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const navGroups = [
  {
    id: 'workspace',
    label: 'Workspace',
    collapsible: false,
    items: [
      { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, roles: ['Admin', 'Manager', 'Staff', 'Finance'] as UserRole[] },
    ]
  },
  {
    id: 'procurement',
    label: 'Procurement Cycle',
    collapsible: true,
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
    collapsible: true,
    items: [
      { name: 'Budgets', href: '/budgets', icon: Wallet, roles: ['Admin', 'Finance', 'Manager'] as UserRole[] },
      { name: 'Departments', href: '/departments', icon: Building2, roles: ['Admin', 'Finance', 'Manager'] as UserRole[] },
      { name: 'Vendors', href: '/vendors', icon: Users, roles: ['Admin', 'Manager', 'Finance'] as UserRole[] },
    ]
  },
  {
    id: 'admin',
    label: 'Administration',
    collapsible: true,
    items: [
      { name: 'Users', href: '/users', icon: UserRound, roles: ['Admin'] as UserRole[] },
      { name: 'Payments', href: '/payments', icon: CreditCard, roles: ['Admin', 'Finance'] as UserRole[] },
    ]
  }
];

export function SidebarNav() {
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
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({
    workspace: true,
    procurement: false,
    strategy: false,
    admin: false
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="flex flex-col h-full bg-sidebar border-r border-sidebar-border animate-pulse">
        <div className="p-6">
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

  const toggleGroup = (id: string) => {
    setOpenGroups(prev => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <TooltipProvider delayDuration={0}>
      <div className={cn(
        "flex flex-col h-full bg-sidebar transition-all duration-300",
        isSidebarCollapsed ? "items-center" : "w-full"
      )}>
        <div className={cn(
          "p-6 flex items-center justify-between w-full",
          isSidebarCollapsed && "flex-col gap-4 p-4"
        )}>
          {!isSidebarCollapsed ? (
            <div>
              <h1 className="text-xl font-headline font-bold text-primary tracking-tighter">
                CPP <span className="text-accent">Portal</span>
              </h1>
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest mt-1">Chezacheza</p>
            </div>
          ) : (
            <div className="text-center">
              <h1 className="text-xl font-headline font-bold text-primary tracking-tighter">CPP</h1>
            </div>
          )}
        </div>
        
        <div className="flex-1 px-4 space-y-4 overflow-hidden">
          {navGroups.map((group) => {
            const visibleItems = group.items.filter(item => item.roles.includes(currentUser.role));
            if (visibleItems.length === 0) return null;

            if (!group.collapsible || isSidebarCollapsed) {
              return (
                <div key={group.id} className="space-y-1">
                  {!isSidebarCollapsed && !group.collapsible && (
                    <p className="px-3 text-[9px] font-bold uppercase text-muted-foreground tracking-widest mb-1">{group.label}</p>
                  )}
                  {visibleItems.map((item) => {
                    const isActive = pathname === item.href;
                    const linkContent = (
                      <Link
                        key={item.name}
                        href={item.href}
                        className={cn(
                          "flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-all duration-200",
                          isActive 
                            ? "bg-primary text-primary-foreground shadow-sm" 
                            : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                          isSidebarCollapsed && "justify-center px-0 w-10 h-10"
                        )}
                      >
                        <item.icon className={cn("w-4 h-4 shrink-0", isActive ? "text-primary-foreground" : "text-accent")} />
                        {!isSidebarCollapsed && item.name}
                      </Link>
                    );

                    if (isSidebarCollapsed) {
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
            }

            return (
              <Collapsible
                key={group.id}
                open={openGroups[group.id]}
                onOpenChange={() => toggleGroup(group.id)}
                className="space-y-1"
              >
                <CollapsibleTrigger asChild>
                  <Button 
                    variant="ghost" 
                    className="w-full flex items-center justify-between px-3 py-2 h-auto text-[10px] font-bold uppercase tracking-widest text-muted-foreground hover:bg-sidebar-accent hover:text-primary transition-all group"
                  >
                    {group.label}
                    {openGroups[group.id] ? (
                      <ChevronDown className="w-3 h-3 transition-transform duration-200 group-hover:text-accent" />
                    ) : (
                      <ChevronRight className="w-3 h-3 transition-transform duration-200 group-hover:text-accent" />
                    )}
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="space-y-1 animate-in slide-in-from-top-2 duration-300">
                  {visibleItems.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                      <Link
                        key={item.name}
                        href={item.href}
                        className={cn(
                          "flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-all duration-200 ml-1",
                          isActive 
                            ? "bg-primary text-primary-foreground shadow-sm" 
                            : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                        )}
                      >
                        <item.icon className={cn("w-4 h-4 shrink-0", isActive ? "text-primary-foreground" : "text-accent")} />
                        {item.name}
                      </Link>
                    );
                  })}
                </CollapsibleContent>
              </Collapsible>
            );
          })}
        </div>

        <div className={cn(
          "p-4 mt-auto border-t border-sidebar-border space-y-4 bg-sidebar w-full",
          isSidebarCollapsed && "p-2 items-center"
        )}>
          <div className={cn("flex items-center gap-1 justify-center", isSidebarCollapsed && "flex-col")}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="w-8 h-8"
                  onClick={toggleSidebar}
                >
                  {isSidebarCollapsed ? <PanelLeft className="w-4 h-4" /> : <PanelLeftClose className="w-4 h-4" />}
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right" className="text-[10px] font-bold">
                {isSidebarCollapsed ? 'Expand Menu' : 'Collapse Menu'}
              </TooltipContent>
            </Tooltip>
            
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
                {viewPreference === 'detailed' ? 'Simple View' : 'Detailed View'}
              </TooltipContent>
            </Tooltip>
            
            <ThemeToggle />
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className={cn(
                "flex items-center justify-between p-2 bg-muted/50 rounded-md text-xs hover:bg-muted transition-colors border border-transparent hover:border-sidebar-border w-full",
                isSidebarCollapsed && "justify-center"
              )}>
                {!isSidebarCollapsed ? (
                  <>
                    <span className="truncate">{currentUser.name.split(' ')[0]}</span>
                    <ChevronDown className="w-3 h-3 ml-2 opacity-50" />
                  </>
                ) : (
                  <UserRound className="w-4 h-4 text-accent" />
                )}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align={isSidebarCollapsed ? "right" : "end"} className="w-56">
              <DropdownMenuLabel>Perspective Switch</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {users.map(user => (
                <DropdownMenuItem key={user.id} onClick={() => handleUserSwitch(user)}>
                  <div className="flex flex-col">
                    <span className="font-medium text-xs">{user.name}</span>
                    <span className="text-[10px] text-muted-foreground">{user.role}</span>
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
