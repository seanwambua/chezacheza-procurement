
import { SidebarNav } from '@/components/layout/SidebarNav';

export default function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <aside className="w-64 fixed inset-y-0 hidden md:block z-50">
        <SidebarNav />
      </aside>
      <main className="flex-1 md:ml-64 p-6 md:p-10 max-w-7xl mx-auto w-full">
        {children}
      </main>
    </div>
  );
}
