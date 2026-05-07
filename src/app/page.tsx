import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { 
  BarChart3, 
  ShieldCheck, 
  Zap, 
  ArrowRight, 
  LayoutDashboard,
  Building2,
  FileText,
  HelpCircle
} from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Navigation */}
      <nav className="border-b bg-card/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-headline font-bold text-primary tracking-tighter">
              CPP <span className="text-accent">Portal</span>
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/how-to" className="flex items-center gap-1.5 text-[10px] sm:text-xs font-bold uppercase text-muted-foreground hover:text-accent transition-colors">
              <HelpCircle className="w-3.5 h-3.5" />
              <span className="hidden xs:inline">How it works</span>
            </Link>
            <Link href="/dashboard">
              <Button variant="ghost" className="font-bold uppercase text-xs h-9">
                Launch Portal
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="flex-1">
        <section className="py-12 sm:py-20 px-4 sm:px-6">
          <div className="max-w-4xl mx-auto text-center space-y-6 sm:space-y-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/10 border border-accent/20 text-accent text-[10px] sm:text-xs font-bold uppercase tracking-widest">
              <Zap className="w-3 h-3" />
              Enterprise Procurement
            </div>
            <h1 className="text-4xl sm:6xl md:text-7xl font-black text-primary tracking-tighter leading-[1.0] sm:leading-[0.9]">
              Strategic Control Over Every <span className="text-accent">Commitment.</span>
            </h1>
            <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto font-medium px-4">
              A unified portal for Chezacheza staff and leadership to manage requisitions, 
              track quarterly budgets, and optimize vendor performance with data.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 pt-4 px-4">
              <Link href="/dashboard" className="w-full sm:w-auto">
                <Button size="lg" className="h-12 sm:h-14 w-full px-8 text-base font-bold bg-primary shadow-xl hover:shadow-accent/20 transition-all group">
                  Enter Portal <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Link href="/how-to" className="w-full sm:w-auto">
                <Button variant="outline" size="lg" className="h-12 sm:h-14 w-full px-8 text-base font-bold border-2">
                  View Guide
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Features Grid */}
        <section className="py-12 sm:py-20 bg-muted/30 border-y px-4 sm:px-6">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8 sm:gap-12">
              <div className="space-y-3 sm:space-y-4">
                <div className="p-3 bg-accent/10 rounded-xl w-fit text-accent">
                  <BarChart3 className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-primary">Budget Governance</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Real-time quarterly tracking with automated spending pauses. 
                  Prevent over-expenditure before it happens.
                </p>
              </div>

              <div className="space-y-3 sm:space-y-4">
                <div className="p-3 bg-accent/10 rounded-xl w-fit text-accent">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-primary">Unified Approvals</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Multi-tier approval pipelines for Departmental Managers, 
                  Finance, and Admin. Full transparency on every request.
                </p>
              </div>

              <div className="space-y-3 sm:space-y-4">
                <div className="p-3 bg-accent/10 rounded-xl w-fit text-accent">
                  <Zap className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-primary">Vendor Intel</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Performance summaries and dispute tracking. 
                  Optimize your supply chain with data-driven insights.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Quick Stats Section */}
        <section className="py-12 sm:py-20 px-4 sm:px-6">
          <div className="max-w-7xl mx-auto">
            <div className="bg-primary rounded-2xl sm:rounded-3xl p-6 sm:p-12 md:p-16 text-primary-foreground flex flex-col lg:flex-row items-center justify-between gap-10 sm:gap-12 overflow-hidden relative">
              <div className="relative z-10 max-w-lg space-y-4 sm:space-y-6 text-center lg:text-left">
                <h2 className="text-3xl sm:text-4xl font-black tracking-tighter leading-none">
                  Ready to optimize your procurement cycle?
                </h2>
                <p className="text-primary-foreground/70 text-sm sm:text-base font-medium">
                  Access departmental budgets, manage LPOs, and verify goods received 
                  all in one high-performance interface.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-2">
                  <Link href="/dashboard" className="w-full sm:w-auto">
                    <Button variant="secondary" size="lg" className="w-full font-bold">
                      Go to Dashboard
                    </Button>
                  </Link>
                  <Link href="/how-to" className="w-full sm:w-auto">
                    <Button variant="outline" size="lg" className="w-full font-bold bg-transparent border-white/20 text-white hover:bg-white/10">
                      Read Guide
                    </Button>
                  </Link>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-3 sm:gap-4 w-full md:w-auto relative z-10">
                <div className="p-4 sm:p-6 bg-white/10 rounded-xl sm:rounded-2xl backdrop-blur-sm border border-white/20 text-center hover:scale-105 transition-transform duration-300">
                  <LayoutDashboard className="w-5 h-5 sm:w-6 sm:h-6 mx-auto mb-2 opacity-70" />
                  <p className="text-xl sm:text-2xl font-black tracking-tighter">Live</p>
                  <p className="text-[9px] sm:text-[10px] uppercase font-bold opacity-50">Dashboard</p>
                </div>
                <div className="p-4 sm:p-6 bg-white/10 rounded-xl sm:rounded-2xl backdrop-blur-sm border border-white/20 text-center hover:scale-105 transition-transform duration-300">
                  <Building2 className="w-5 h-5 sm:w-6 sm:h-6 mx-auto mb-2 opacity-70" />
                  <p className="text-xl sm:text-2xl font-black tracking-tighter">5+</p>
                  <p className="text-[9px] sm:text-[10px] uppercase font-bold opacity-50">Depts</p>
                </div>
                <div className="p-4 sm:p-6 bg-white/10 rounded-xl sm:rounded-2xl backdrop-blur-sm border border-white/20 text-center hover:scale-105 transition-transform duration-300">
                  <FileText className="w-5 h-5 sm:w-6 sm:h-6 mx-auto mb-2 opacity-70" />
                  <p className="text-xl sm:text-2xl font-black tracking-tighter">100%</p>
                  <p className="text-[9px] sm:text-[10px] uppercase font-bold opacity-50">Audited</p>
                </div>
                <div className="p-4 sm:p-6 bg-white/10 rounded-xl sm:rounded-2xl backdrop-blur-sm border border-white/20 text-center hover:scale-105 transition-transform duration-300">
                  <ShieldCheck className="w-5 h-5 sm:w-6 sm:h-6 mx-auto mb-2 opacity-70" />
                  <p className="text-xl sm:text-2xl font-black tracking-tighter">RBAC</p>
                  <p className="text-[9px] sm:text-[10px] uppercase font-bold opacity-50">Secured</p>
                </div>
              </div>
              {/* Background Decoration */}
              <div className="absolute top-0 right-0 w-96 h-96 bg-accent/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 hidden sm:block" />
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t py-8 sm:py-12 bg-card px-4 sm:px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 sm:gap-8">
          <div className="text-center md:text-left">
            <p className="text-sm font-bold text-primary uppercase tracking-tighter">CPP Portal</p>
            <p className="text-xs text-muted-foreground mt-1">© 2026 Chezacheza Procurement.</p>
          </div>
          <div className="flex flex-wrap justify-center gap-6 sm:gap-8">
            <Link href="/how-to" className="text-[10px] sm:text-xs font-bold uppercase text-muted-foreground hover:text-accent transition-colors">How it works</Link>
            <Link href="/settings" className="text-[10px] sm:text-xs font-bold uppercase text-muted-foreground hover:text-accent transition-colors">Settings</Link>
            <Link href="/users" className="text-[10px] sm:text-xs font-bold uppercase text-muted-foreground hover:text-accent transition-colors">Users</Link>
            <Link href="/vendors" className="text-[10px] sm:text-xs font-bold uppercase text-muted-foreground hover:text-accent transition-colors">Vendors</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
