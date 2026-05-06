
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { 
  BarChart3, 
  ShieldCheck, 
  Zap, 
  ArrowRight, 
  LayoutDashboard,
  Building2,
  FileText
} from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Navigation */}
      <nav className="border-b bg-card/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-headline font-bold text-primary tracking-tighter">
              CPP <span className="text-accent">Portal</span>
            </h1>
          </div>
          <Link href="/dashboard">
            <Button variant="ghost" size="sm" className="font-bold uppercase text-[10px]">
              Sign In
            </Button>
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="flex-1">
        <section className="py-20 px-6">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/10 border border-accent/20 text-accent text-xs font-bold uppercase tracking-widest">
              <Zap className="w-3 h-3" />
              Enterprise Procurement Management
            </div>
            <h1 className="text-5xl md:text-7xl font-black text-primary tracking-tighter leading-[0.9]">
              Strategic Control Over Every <span className="text-accent">Commitment.</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto font-medium">
              A unified portal for Chezacheza staff and leadership to manage requisitions, 
              track quarterly budgets, and optimize vendor performance with AI.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
              <Link href="/dashboard">
                <Button size="lg" className="h-14 px-8 text-base font-bold bg-primary shadow-xl hover:shadow-accent/20 transition-all">
                  Enter Portal <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
              <Link href="/requisitions">
                <Button variant="outline" size="lg" className="h-14 px-8 text-base font-bold border-2">
                  New Requisition
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Features Grid */}
        <section className="py-20 bg-muted/30 border-y">
          <div className="max-w-7xl mx-auto px-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
              <div className="space-y-4">
                <div className="p-3 bg-accent/10 rounded-xl w-fit text-accent">
                  <BarChart3 className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-primary">Budget Governance</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Real-time quarterly tracking with automated spending pauses. 
                  Prevent over-expenditure before it happens.
                </p>
              </div>

              <div className="space-y-4">
                <div className="p-3 bg-accent/10 rounded-xl w-fit text-accent">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-primary">Unified Approvals</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Multi-tier approval pipelines for Departmental Managers, 
                  Finance, and Admin. Full transparency on every request.
                </p>
              </div>

              <div className="space-y-4">
                <div className="p-3 bg-accent/10 rounded-xl w-fit text-accent">
                  <Zap className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-primary">Vendor Intel</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  AI-powered performance summaries and dispute tracking. 
                  Optimize your supply chain with data-driven insights.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Quick Stats Section */}
        <section className="py-20">
          <div className="max-w-7xl mx-auto px-6">
            <div className="bg-primary rounded-3xl p-8 md:p-16 text-primary-foreground flex flex-col md:flex-row items-center justify-between gap-12 overflow-hidden relative">
              <div className="relative z-10 max-w-lg space-y-6">
                <h2 className="text-4xl font-black tracking-tighter leading-none">
                  Ready to optimize your procurement cycle?
                </h2>
                <p className="text-primary-foreground/70 font-medium">
                  Access departmental budgets, manage LPOs, and verify goods received 
                  all in one high-performance interface.
                </p>
                <Link href="/dashboard" className="block">
                  <Button variant="secondary" size="lg" className="font-bold">
                    Go to Dashboard
                  </Button>
                </Link>
              </div>
              <div className="grid grid-cols-2 gap-4 w-full md:w-auto relative z-10">
                <div className="p-6 bg-white/5 rounded-2xl backdrop-blur-sm border border-white/10 text-center">
                  <LayoutDashboard className="w-6 h-6 mx-auto mb-2 opacity-50" />
                  <p className="text-2xl font-black tracking-tighter">Live</p>
                  <p className="text-[10px] uppercase font-bold opacity-50">Dashboard</p>
                </div>
                <div className="p-6 bg-white/5 rounded-2xl backdrop-blur-sm border border-white/10 text-center">
                  <Building2 className="w-6 h-6 mx-auto mb-2 opacity-50" />
                  <p className="text-2xl font-black tracking-tighter">5+</p>
                  <p className="text-[10px] uppercase font-bold opacity-50">Depts</p>
                </div>
                <div className="p-6 bg-white/5 rounded-2xl backdrop-blur-sm border border-white/10 text-center">
                  <FileText className="w-6 h-6 mx-auto mb-2 opacity-50" />
                  <p className="text-2xl font-black tracking-tighter">100%</p>
                  <p className="text-[10px] uppercase font-bold opacity-50">Audited</p>
                </div>
                <div className="p-6 bg-white/5 rounded-2xl backdrop-blur-sm border border-white/10 text-center">
                  <ShieldCheck className="w-6 h-6 mx-auto mb-2 opacity-50" />
                  <p className="text-2xl font-black tracking-tighter">RBAC</p>
                  <p className="text-[10px] uppercase font-bold opacity-50">Secured</p>
                </div>
              </div>
              {/* Background Decoration */}
              <div className="absolute top-0 right-0 w-96 h-96 bg-accent/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t py-12 bg-card">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-8">
          <div>
            <p className="text-sm font-bold text-primary uppercase tracking-tighter">CPP Portal</p>
            <p className="text-xs text-muted-foreground mt-1">© 2024 Chezacheza Procurement. All rights reserved.</p>
          </div>
          <div className="flex gap-8">
            <Link href="/settings" className="text-xs font-bold uppercase text-muted-foreground hover:text-accent transition-colors">Settings</Link>
            <Link href="/users" className="text-xs font-bold uppercase text-muted-foreground hover:text-accent transition-colors">User Management</Link>
            <Link href="/vendors" className="text-xs font-bold uppercase text-muted-foreground hover:text-accent transition-colors">Vendor Database</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
