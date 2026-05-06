
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

const navItems = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, roles: ['Admin', 'Manager', 'Staff', 'Finance'] as UserRole[] },
  { name: 'Budgets', href: '/budgets', icon: Wallet, roles: ['Admin', 'Finance', 'Manager'] as UserRole[] },
  { name: 'Requisitions', href: '/requisitions', icon: FileText, roles: ['Admin', 'Manager', 'Staff', 'Finance'] as UserRole[] },
  { name: 'Approvals', href: '/approvals', icon: CheckSquare, roles: ['Admin', 'Manager', 'Finance'] as UserRole[] },
  { name: 'LPOs', href: '/lpos', icon: ShoppingCart, roles: ['Admin', 'Manager', 'Finance'] as UserRole[] },
  { name: 'Deliveries (GRN)', href: '/deliveries', icon: Truck, roles: ['Admin', 'Manager', 'Finance'] as UserRole[] },
  { name: 'Vendors', href: '/vendors', icon: Users, roles: ['Admin', 'Manager', 'Finance'] as UserRole[] },
  { name: 'Users', href: '/users', icon: UserRound, roles: ['Admin'] as UserRole[] },
  { name: 'Payments', href: '/payments', icon: CreditCard, roles: ['Admin', 'Finance'] as UserRole[] },
];

export function SidebarNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { currentUser, users, setCurrentUser } = useUserStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Use a loading state for SSR to avoid hydration mismatch
  if (!mounted || !currentUser) {
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

  const filteredNavItems = navItems.filter(item => item.roles.includes(currentUser.role));

  const handleUserSwitch = (user: User) => {
    setCurrentUser(user);
    // Force a fresh navigation to the dashboard to reset any role-specific state
    router.push('/dashboard');
    router.refresh();
  };

  return (
    <div className="flex flex-col h-full bg-sidebar border-r border-sidebar-border">
      <div className="p-6">
        <h1 className="text-xl font-headline font-bold text-primary tracking-tighter">
          CPP <span className="text-accent">Portal</span>
        </h1>
        <p className="text-[10px] text-muted-foreground uppercase tracking-widest mt-1">Chezacheza Procurement</p>
      </div>
      
      <nav className="flex-1 px-4 space-y-1">
        {filteredNavItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-all duration-200",
                isActive 
                  ? "bg-primary text-primary-foreground shadow-sm" 
                  : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              )}
            >
              <item.icon className="w-4 h-4" />
              {item.name}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 mt-auto border-t border-sidebar-border space-y-4">
        <div className="px-3">
           <p className="text-[9px] text-muted-foreground uppercase font-bold mb-2">Impersonate User (Demo)</p>
           <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center justify-between w-full p-2 bg-muted/50 rounded-md text-xs hover:bg-muted transition-colors">
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

        <Link
          href="/settings"
          className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-sidebar-foreground rounded-md hover:bg-sidebar-accent transition-all duration-200"
        >
          <Settings className="w-4 h-4" />
          Settings
        </Link>
        
        <div className="flex items-center gap-3 px-3 py-2">
          <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center text-white text-xs font-bold shrink-0">
            {currentUser.name.charAt(0)}
          </div>
          <div className="flex flex-col overflow-hidden">
            <span className="text-xs font-semibold truncate text-sidebar-foreground">{currentUser.name}</span>
            <span className="text-[10px] text-muted-foreground truncate uppercase">{currentUser.role}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
