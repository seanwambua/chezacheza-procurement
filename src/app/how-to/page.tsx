
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { 
  ArrowLeft, 
  FileText, 
  CheckCircle2, 
  ShoppingCart, 
  Truck, 
  Wallet, 
  Users,
  Info,
  ChevronRight,
  ShieldCheck,
  Zap
} from 'lucide-react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function HowToPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Simple Header */}
      <nav className="border-b bg-card/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <h1 className="text-xl font-headline font-bold text-primary tracking-tighter">
              CPP <span className="text-accent">Portal</span>
            </h1>
          </Link>
          <Link href="/dashboard">
            <Button size="sm" className="font-bold uppercase text-[10px]">
              Go to Portal
            </Button>
          </Link>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-6 py-16 space-y-12">
        <div className="space-y-4">
          <Link href="/" className="text-accent text-sm font-bold flex items-center gap-2 hover:underline">
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>
          <h1 className="text-4xl md:text-5xl font-black text-primary tracking-tighter">
            User Guide & Documentation
          </h1>
          <p className="text-lg text-muted-foreground">
            Everything you need to know about navigating the Chezacheza Procurement Portal.
          </p>
        </div>

        {/* Feature Breakdown */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="border-border shadow-none">
            <CardHeader>
              <FileText className="w-8 h-8 text-accent mb-2" />
              <CardTitle className="text-lg">Requisitions</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground leading-relaxed">
              Create multi-item purchase requests. Each request is linked to a specific budget line and requires justification.
            </CardContent>
          </Card>
          <Card className="border-border shadow-none">
            <CardHeader>
              <CheckCircle2 className="w-8 h-8 text-green-600 mb-2" />
              <CardTitle className="text-lg">Approvals</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground leading-relaxed">
              A transparent multi-tier pipeline. Requests move from Departmental Managers to Finance for final authorization.
            </CardContent>
          </Card>
          <Card className="border-border shadow-none">
            <CardHeader>
              <ShoppingCart className="w-8 h-8 text-primary mb-2" />
              <CardTitle className="text-lg">LPOs</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground leading-relaxed">
              Approved requests are converted into Local Purchase Orders (LPOs) and dispatched to verified vendors.
            </CardContent>
          </Card>
          <Card className="border-border shadow-none">
            <CardHeader>
              <Wallet className="w-8 h-8 text-accent mb-2" />
              <CardTitle className="text-lg">Budget Control</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground leading-relaxed">
              Rolling quarterly allocations. The system automatically pauses spending if a budget line is exhausted.
            </CardContent>
          </Card>
        </div>

        <section className="space-y-6">
          <h2 className="text-2xl font-black text-primary tracking-tight">The Procurement Lifecycle</h2>
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="step-1">
              <AccordionTrigger className="font-bold text-base">1. Internal Requisition (Drafting)</AccordionTrigger>
              <AccordionContent className="text-muted-foreground space-y-4 pt-2">
                <p>Staff members identify a need and draft a Purchase Requisition (PR). You must specify the items, estimated quantities, and the target Budget Line.</p>
                <div className="p-4 bg-muted/30 rounded-lg border flex items-start gap-3">
                  <Info className="w-5 h-5 text-accent mt-0.5" />
                  <p className="text-xs"><strong>Tip:</strong> Always check if your target budget has remaining funds for the current quarter before submitting.</p>
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="step-2">
              <AccordionTrigger className="font-bold text-base">2. Approval Pipeline</AccordionTrigger>
              <AccordionContent className="text-muted-foreground space-y-4 pt-2">
                <p>Once submitted, the PR enters the approval queue:</p>
                <ul className="list-disc pl-5 space-y-2">
                  <li><strong>Manager Review:</strong> The department head verifies the operational need.</li>
                  <li><strong>Finance Review:</strong> Verify budget availability and price reasonableness.</li>
                  <li><strong>Admin Authorization:</strong> Final stamp for high-value items.</li>
                </ul>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="step-3">
              <AccordionTrigger className="font-bold text-base">3. LPO Generation & Vendor Dispatch</AccordionTrigger>
              <AccordionContent className="text-muted-foreground space-y-4 pt-2">
                <p>Authorized requisitions are converted into official LPOs. This document is the legal commitment from Chezacheza to the vendor.</p>
                <p>LPOs include specific payment terms (e.g., 30 Days Net) and delivery instructions.</p>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="step-4">
              <AccordionTrigger className="font-bold text-base">4. Delivery & GRN Verification</AccordionTrigger>
              <AccordionContent className="text-muted-foreground space-y-4 pt-2">
                <p>When goods arrive, the receiving officer creates a <strong>Goods Received Note (GRN)</strong>. They must verify quality and quantity against the original LPO.</p>
                <div className="p-4 bg-destructive/5 rounded-lg border border-destructive/10 flex items-start gap-3">
                  <ShieldCheck className="w-5 h-5 text-destructive mt-0.5" />
                  <p className="text-xs font-bold text-destructive uppercase">Dispute Management: If items are damaged or incorrect, a dispute flag must be raised on the GRN.</p>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </section>

        <section className="space-y-6">
          <h2 className="text-2xl font-black text-primary tracking-tight">Understanding User Roles</h2>
          <div className="space-y-4">
            {[
              { role: 'Admin', icon: ShieldCheck, desc: 'Full system access, user management, and global audit capabilities.' },
              { role: 'Manager', icon: Users, desc: 'Approves departmental requests and monitors budget utilization.' },
              { role: 'Finance', icon: Wallet, desc: 'Manages allocations, verifies payments, and analyzes fiscal health.' },
              { role: 'Staff', icon: Zap, desc: 'Creates requisitions and manages receiving of goods.' },
            ].map((r, i) => (
              <div key={i} className="flex items-start gap-4 p-4 rounded-xl border border-border/50 hover:bg-muted/30 transition-colors">
                <div className="p-2 bg-accent/10 rounded-lg">
                  <r.icon className="w-5 h-5 text-accent" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-primary">{r.role}</h4>
                  <p className="text-xs text-muted-foreground mt-1">{r.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="p-8 bg-primary rounded-2xl text-primary-foreground space-y-4">
          <h2 className="text-2xl font-black tracking-tight">Need further assistance?</h2>
          <p className="text-primary-foreground/70 text-sm">Our IT and Finance teams are available for hands-on training or to resolve technical issues.</p>
          <div className="flex gap-4 pt-2">
            <Button variant="secondary" className="font-bold">Contact Support</Button>
            <Link href="/dashboard">
              <Button variant="ghost" className="font-bold text-white hover:bg-white/10">Launch Portal</Button>
            </Link>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t py-12 bg-card">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-8">
          <div>
            <p className="text-sm font-bold text-primary uppercase tracking-tighter">CPP Portal</p>
            <p className="text-xs text-muted-foreground mt-1">© 2024 Chezacheza Procurement.</p>
          </div>
          <div className="flex gap-8">
            <Link href="/" className="text-xs font-bold uppercase text-muted-foreground hover:text-accent transition-colors">Home</Link>
            <Link href="/dashboard" className="text-xs font-bold uppercase text-muted-foreground hover:text-accent transition-colors">Portal</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
