
"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { 
  LayoutDashboard, 
  FileText, 
  CheckSquare, 
  ShoppingCart, 
  Truck, 
  Users, 
  CreditCard,
  Settings
} from 'lucide-react';

const navItems = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Requisitions', href: '/requisitions', icon: FileText },
  { name: 'Approvals', href: '/approvals', icon: CheckSquare },
  { name: 'LPOs', href: '/lpos', icon: ShoppingCart },
  { name: 'Deliveries (GRN)', href: '/deliveries', icon: Truck },
  { name: 'Vendors', href: '/vendors', icon: Users },
  { name: 'Payments & Closure', href: '/payments', icon: CreditCard },
];

export function SidebarNav() {
  const pathname = usePathname();

  return (
    <div className="flex flex-col h-full bg-sidebar border-r border-sidebar-border">
      <div className="p-6">
        <h1 className="text-xl font-headline font-bold text-primary tracking-tighter">
          CPP <span className="text-accent">Portal</span>
        </h1>
        <p className="text-[10px] text-muted-foreground uppercase tracking-widest mt-1">Chezacheza Procurement</p>
      </div>
      
      <nav className="flex-1 px-4 space-y-1">
        {navItems.map((item) => {
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

      <div className="p-4 mt-auto border-t border-sidebar-border">
        <Link
          href="/settings"
          className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-sidebar-foreground rounded-md hover:bg-sidebar-accent transition-all duration-200"
        >
          <Settings className="w-4 h-4" />
          Settings
        </Link>
        <div className="mt-4 flex items-center gap-3 px-3 py-2">
          <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center text-white text-xs font-bold">
            JD
          </div>
          <div className="flex flex-col overflow-hidden">
            <span className="text-xs font-semibold truncate text-sidebar-foreground">Jane Doe</span>
            <span className="text-[10px] text-muted-foreground truncate uppercase">Administrator</span>
          </div>
        </div>
      </div>
    </div>
  );
}
