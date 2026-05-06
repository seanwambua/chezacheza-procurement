
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
  Settings,
  Wallet,
  UserRound,
  ChevronDown,
  Building2,
  Maximize2,
  Minimize2,
  ChevronRight
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

const navGroups = [
  {
    id: 'workspace',
    label: 'Workspace',
    items: [
      { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, roles: ['Admin', 'Manager', 'Staff', 'Finance'] as UserRole[] },
    ]
  },
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

export function SidebarNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { currentUser, users, setCurrentUser, viewPreference, setViewPreference } = useUserStore();
  const [mounted, setMounted] = useState(false);
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({
    workspace: true,
    procurement: true,
    strategy: true,
    admin: true
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
        <div className="flex-1 px-4 space-y-2">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="h-10 bg-muted rounded w-full" />
          ))}
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

  const toggleGroup = (id: string) => {
    setOpenGroups(prev => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="flex flex-col h-full bg-sidebar border-r border-sidebar-border">
      <div className="p-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-headline font-bold text-primary tracking-tighter">
            CPP <span className="text-accent">Portal</span>
          </h1>
          <p className="text-[10px] text-muted-foreground uppercase tracking-widest mt-1">Chezacheza Procurement</p>
        </div>
        <div className="flex items-center gap-1">
          <Button 
            variant="ghost" 
            size="icon" 
            className="w-8 h-8"
            onClick={toggleView}
            title={viewPreference === 'detailed' ? 'Switch to Simple View' : 'Switch to Detailed View'}
          >
            {viewPreference === 'detailed' ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </Button>
          <ThemeToggle />
        </div>
      </div>
      
      <div className="flex-1 px-4 space-y-4 overflow-y-auto custom-scrollbar">
        {navGroups.map((group) => {
          const visibleItems = group.items.filter(item => item.roles.includes(currentUser.role));
          if (visibleItems.length === 0) return null;

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
                      <item.icon className={cn("w-4 h-4", isActive ? "text-primary-foreground" : "text-accent")} />
                      {item.name}
                    </Link>
                  );
                })}
              </CollapsibleContent>
            </Collapsible>
          );
        })}
      </div>

      <div className="p-4 mt-auto border-t border-sidebar-border space-y-4 bg-sidebar">
        <div className="px-3">
           <p className="text-[9px] text-muted-foreground uppercase font-bold mb-2">Impersonate User (Demo)</p>
           <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center justify-between w-full p-2 bg-muted/50 rounded-md text-xs hover:bg-muted transition-colors border border-transparent hover:border-sidebar-border">
                <span className="truncate">{currentUser.name} ({currentUser.role})</span>
                <ChevronDown className="w-3 h-3 ml-2 opacity-50" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>Select User Perspective</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {users.map(user => (
                <DropdownMenuItem key={user.id} onClick={() => handleUserSwitch(user)}>
                  <div className="flex flex-col">
                    <span className="font-medium text-xs">{user.name}</span>
                    <span className="text-[10px] text-muted-foreground">{user.role} • {user.department}</span>
                  </div>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
}
