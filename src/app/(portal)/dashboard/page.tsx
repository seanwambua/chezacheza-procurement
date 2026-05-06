"use client";

import { useEffect, useState } from 'react';
import { StatCard } from '@/components/dashboard/StatCard';
import { 
  ShoppingCart, 
  FileCheck, 
  Clock, 
  AlertCircle,
  TrendingUp,
  Users,
  CalendarDays,
  ArrowRight,
  Plus,
  ArrowLeft,
  ShieldCheck,
  CheckCircle2,
  TrendingDown,
  Target
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useStore } from '@/lib/store';
import { useUserStore } from '@/lib/user-store';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogDescription
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { calculatePRTotal } from '@/lib/types';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useToast } from '@/hooks/use-toast';

const fiscalYearSchema = z.object({
  year: z.string().min(4, "Year is required"),
  globalTarget: z.coerce.number().min(1, "Target must be greater than zero"),
  strategy: z.enum(['Growth', 'Conservative', 'Balanced']),
});

type FiscalYearValues = z.infer<typeof fiscalYearSchema>;

export default function DashboardPage() {
  const { prs, budgets, vendors, lpos, grns } = useStore();
  const { viewPreference } = useUserStore();
  const { toast } = useToast();
  const [mounted, setMounted] = useState(false);
  const [selectedYear, setSelectedYear] = useState('2024');
  
  // Wizard state
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [wizardStep, setWizardStep] = useState(1);

  const form = useForm<FiscalYearValues>({
    resolver: zodResolver(fiscalYearSchema),
    defaultValues: {
      year: '2025',
      globalTarget: 5000000,
      strategy: 'Balanced',
    },
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const isDetailed = viewPreference === 'detailed';
  const filteredBudgets = budgets.filter(b => b.fiscalYear === selectedYear);
  const totalSpendVal = filteredBudgets.reduce((acc, bl) => acc + (bl.spent || 0), 0);
  const pendingApprovals = prs.filter(pr => pr.status?.includes('Pending')).length;
  const activeLposCount = lpos.filter(lpo => lpo.status !== 'Closed').length;
  const awaitingDelivery = lpos.filter(lpo => lpo.status === 'Dispatched').length;
  const activeDisputes = grns.filter(grn => grn.disputeFlag).length;

  const budgetData = filteredBudgets.map(bl => ({
    name: bl.name,
    spent: bl.spent || 0,
    budget: [bl.q1Allocation || 0, bl.q2Allocation || 0, bl.q3Allocation || 0, bl.q4Allocation || 0].reduce((a, b) => a + b, 0)
  }));

  const vendorPerformance = [
    { name: 'Top Performing', value: vendors.filter(v => v.rating >= 4.5).length, color: 'hsl(var(--accent))' },
    { name: 'Average', value: vendors.filter(v => v.rating >= 3 && v.rating < 4.5).length, color: 'hsl(var(--primary))' },
    { name: 'Needs Review', value: vendors.filter(v => v.rating < 3).length, color: 'hsl(var(--chart-3))' },
  ];

  const recentPrs = prs.slice(0, isDetailed ? 5 : 3);

  const onWizardSubmit = (values: FiscalYearValues) => {
    toast({
      title: "Fiscal Year Established",
      description: `Strategy for FY ${values.year} has been successfully initialized.`,
    });
    setIsWizardOpen(false);
    setWizardStep(1);
    form.reset();
  };

  const nextStep = async () => {
    let isValid = false;
    if (wizardStep === 1) isValid = await form.trigger(['year']);
    if (wizardStep === 2) isValid = await form.trigger(['globalTarget', 'strategy']);
    if (isValid) setWizardStep(prev => prev + 1);
  };

  return (
    <div className="space-y-6 md:space-y-8 animate-in fade-in duration-500 pb-10">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="space-y-1">
          <h2 className={cn(
            "font-headline font-bold text-primary tracking-tighter leading-none",
            isDetailed ? "text-2xl md:text-3xl" : "text-3xl md:text-4xl"
          )}>
            Overview
          </h2>
          <p className="text-sm text-muted-foreground font-medium">Strategic procurement metrics and fiscal health.</p>
        </div>
        <div className="flex items-center gap-2">
          <CalendarDays className="w-4 h-4 text-muted-foreground" />
          <Select value={selectedYear} onValueChange={setSelectedYear}>
            <SelectTrigger className="w-full md:w-[160px] h-9 text-[10px] font-bold uppercase tracking-wider bg-card shadow-sm">
              <SelectValue placeholder="Fiscal Year" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="2023">FY 2023</SelectItem>
              <SelectItem value="2024">FY 2024</SelectItem>
              <SelectItem value="2025">FY 2025</SelectItem>
            </SelectContent>
          </Select>
          
          <Dialog open={isWizardOpen} onOpenChange={(open) => {
            setIsWizardOpen(open);
            if (!open) {
              setWizardStep(1);
              form.reset();
            }
          }}>
            <DialogTrigger asChild>
              <Button size="icon" variant="outline" className="h-9 w-9 bg-card shadow-sm hover:bg-accent hover:text-white transition-all">
                <Plus className="w-4 h-4" />
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-xl w-[95vw] max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-xl md:text-2xl font-black tracking-tight">Establish Fiscal Year</DialogTitle>
                <DialogDescription className="text-xs font-medium">
                  Step {wizardStep} of 3: {wizardStep === 1 ? 'Period Definition' : wizardStep === 2 ? 'Strategic Posture' : 'Review & Authorization'}
                </DialogDescription>
              </DialogHeader>

              <div className="py-4">
                <div className="flex items-center gap-2 mb-8 px-2">
                  {[1, 2, 3].map((s) => (
                    <div key={s} className="flex-1 flex items-center gap-2">
                      <div className={cn(
                        "w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-black transition-all",
                        wizardStep === s ? "bg-accent text-white scale-110 shadow-lg" : 
                        wizardStep > s ? "bg-primary text-white" : "bg-muted text-muted-foreground"
                      )}>
                        {wizardStep > s ? <CheckCircle2 className="w-3.5 h-3.5" /> : s}
                      </div>
                      {s < 3 && <div className={cn("flex-1 h-0.5 rounded-full", wizardStep > s ? "bg-primary" : "bg-muted")} />}
                    </div>
                  ))}
                </div>

                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onWizardSubmit)} className="space-y-6">
                    {wizardStep === 1 && (
                      <div className="space-y-4 animate-in slide-in-from-right-4 duration-300">
                        <FormField control={form.control} name="year" render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-[10px] uppercase font-bold text-muted-foreground">Target Fiscal Period</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl><SelectTrigger className="h-10 text-xs"><SelectValue placeholder="Select Year" /></SelectTrigger></FormControl>
                              <SelectContent>
                                <SelectItem value="2025" className="text-xs">Fiscal Year 2025</SelectItem>
                                <SelectItem value="2026" className="text-xs">Fiscal Year 2026</SelectItem>
                                <SelectItem value="2027" className="text-xs">Fiscal Year 2027</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )} />
                        <div className="p-4 bg-muted/30 rounded-xl border border-border/50">
                          <p className="text-[10px] font-medium text-muted-foreground leading-relaxed">
                            Establishing a new period allows departmental managers to draft preliminary budgets and requisitions for the upcoming fiscal cycle.
                          </p>
                        </div>
                      </div>
                    )}

                    {wizardStep === 2 && (
                      <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                        <FormField control={form.control} name="globalTarget" render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-[10px] uppercase font-bold text-muted-foreground">Global Allocation Target (Ksh)</FormLabel>
                            <FormControl><Input type="number" {...field} className="h-10 text-xs font-bold" /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )} />
                        
                        <FormField control={form.control} name="strategy" render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-[10px] uppercase font-bold text-muted-foreground">Strategic Posture</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl><SelectTrigger className="h-10 text-xs"><SelectValue placeholder="Select Strategy" /></SelectTrigger></FormControl>
                              <SelectContent>
                                <SelectItem value="Growth" className="text-xs flex items-center gap-2">
                                  <div className="flex items-center gap-2"><TrendingUp className="w-3 h-3 text-accent" /> Growth-Oriented</div>
                                </SelectItem>
                                <SelectItem value="Conservative" className="text-xs">
                                  <div className="flex items-center gap-2"><TrendingDown className="w-3 h-3 text-destructive" /> Conservative</div>
                                </SelectItem>
                                <SelectItem value="Balanced" className="text-xs">
                                  <div className="flex items-center gap-2"><Target className="w-3 h-3 text-primary" /> Balanced</div>
                                </SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )} />
                      </div>
                    )}

                    {wizardStep === 3 && (
                      <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                        <div className="p-6 bg-muted/30 border border-border/50 rounded-xl space-y-4">
                          <div className="flex items-center gap-4 pb-4 border-b border-border/50">
                            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center text-primary">
                              <Target className="w-6 h-6" />
                            </div>
                            <div>
                              <p className="text-sm font-black text-primary">FY {form.getValues().year} Initialization</p>
                              <p className="text-[10px] text-muted-foreground uppercase font-bold">{form.getValues().strategy} Posture</p>
                            </div>
                          </div>
                          <div className="space-y-2">
                            <div className="flex justify-between items-center text-xs">
                              <span className="text-muted-foreground font-bold uppercase tracking-tight">Cap Target</span>
                              <span className="font-black text-primary tracking-tighter">Ksh {Number(form.getValues().globalTarget).toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between items-center text-xs">
                              <span className="text-muted-foreground font-bold uppercase tracking-tight">Status</span>
                              <Badge variant="outline" className="text-[9px] uppercase font-bold px-1.5 h-4">Pending Authorization</Badge>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    <DialogFooter className="gap-2 sm:gap-0 pt-6 flex-col sm:flex-row border-t">
                      {wizardStep > 1 && (
                        <Button type="button" variant="outline" onClick={() => setWizardStep(prev => prev - 1)} className="w-full sm:w-auto font-bold uppercase text-xs h-10">
                          <ArrowLeft className="w-3.5 h-3.5 mr-2" />
                          Previous
                        </Button>
                      )}
                      <div className="flex-1" />
                      {wizardStep < 3 ? (
                        <Button type="button" onClick={nextStep} className="w-full sm:w-auto bg-primary font-bold uppercase text-xs h-10 shadow-md">
                          Continue
                          <ArrowRight className="w-3.5 h-3.5 ml-2" />
                        </Button>
                      ) : (
                        <Button type="submit" className="w-full sm:w-auto bg-accent hover:bg-accent/90 text-white font-bold uppercase text-xs h-10 shadow-md">
                          Confirm & Establish
                        </Button>
                      )}
                    </DialogFooter>
                  </form>
                </Form>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <div className={cn(
          "md:col-span-2",
          isDetailed ? "lg:col-span-2" : "lg:col-span-4"
        )}>
          <StatCard 
            title={`Total Spend (Actual - ${selectedYear})`} 
            value={`Ksh ${totalSpendVal.toLocaleString()}`} 
            trend={{ value: 12, isUp: true }}
            icon={TrendingUp} 
            tooltip="The actual verified expenditure across all departmental budgets for the current fiscal period."
            description={isDetailed ? "Verified actuals vs last month" : "Actual verified expenditure"}
          />
        </div>

        <div className="md:col-span-1">
          <StatCard 
            title="Pending Approvals" 
            value={pendingApprovals} 
            description={isDetailed ? "Awaiting your review" : undefined}
            icon={Clock} 
          />
        </div>
        <div className="md:col-span-1">
          <StatCard 
            title="Active LPOs" 
            value={activeLposCount} 
            description={isDetailed ? `${awaitingDelivery} out for delivery` : undefined}
            icon={ShoppingCart} 
          />
        </div>

        {isDetailed && (
          <>
            <div className="md:col-span-2 lg:row-span-2">
              <Card className="h-full shadow-none border border-border">
                <CardHeader className="py-4">
                  <CardTitle className="text-base md:text-lg font-headline">Budget Utilization vs Allocation</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[250px] md:h-[320px]">
                    {budgetData.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={budgetData} layout="vertical" margin={{ left: -10, right: 20 }}>
                          <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} opacity={0.3} />
                          <XAxis type="number" hide />
                          <YAxis 
                            dataKey="name" 
                            type="category" 
                            width={100} 
                            axisLine={false}
                            tickLine={false}
                            fontSize={10}
                            fontWeight={600}
                          />
                          <Tooltip 
                            cursor={{ fill: 'transparent' }}
                            contentStyle={{ borderRadius: '8px', border: '1px solid hsl(var(--border))', backgroundColor: 'hsl(var(--card))' }}
                            formatter={(value: any) => [`Ksh ${value.toLocaleString()}`, '']}
                          />
                          <Bar dataKey="spent" fill="hsl(var(--accent))" radius={[0, 4, 4, 0]} barSize={20} />
                          <Bar dataKey="budget" fill="hsl(var(--muted))" radius={[0, 4, 4, 0]} barSize={6} />
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="flex flex-col items-center justify-center h-full text-muted-foreground space-y-2 opacity-50">
                        <AlertCircle className="w-8 h-8" />
                        <p className="text-xs">No budget data for {selectedYear}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="md:col-span-1">
               <StatCard 
                title="GRN Disputes" 
                value={activeDisputes} 
                icon={AlertCircle} 
              />
            </div>

            <div className="md:col-span-1 lg:row-span-2">
              <Card className="h-full shadow-none border border-border overflow-hidden">
                <CardHeader className="py-4">
                  <CardTitle className="text-base md:text-lg font-headline">Vendor Quality</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col items-center pb-6">
                  <div className="h-[160px] md:h-[180px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={vendorPerformance}
                          innerRadius={50}
                          outerRadius={70}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {vendorPerformance.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="w-full space-y-2 mt-2">
                    {vendorPerformance.map((p, i) => (
                      <div key={i} className="flex items-center justify-between text-[10px] font-bold">
                        <div className="flex items-center gap-1.5">
                          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
                          <span className="text-muted-foreground">{p.name}</span>
                        </div>
                        <span>{p.value}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="md:col-span-1">
               <StatCard 
                title="Onboarded Vendors" 
                value={vendors.length} 
                icon={Users} 
              />
            </div>
          </>
        )}

        <div className={cn(
          "md:col-span-2",
          isDetailed ? "lg:col-span-3" : "lg:col-span-4"
        )}>
          <Card className="shadow-none border border-border overflow-hidden bg-card">
            <CardHeader className="flex flex-row items-center justify-between py-4 px-6 border-b border-border/50">
              <CardTitle className="text-base md:text-lg font-headline">Recent Requisitions</CardTitle>
              <Link href="/requisitions" className="text-xs font-bold text-accent flex items-center gap-1 hover:underline group">
                View All <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </CardHeader>
            <CardContent className="p-2 sm:p-6">
              <div className="space-y-3">
                {recentPrs.length > 0 ? (
                  recentPrs.map((req) => (
                    <Link 
                      key={req.id} 
                      href={`/requisitions?id=${req.id}`}
                      className="flex items-center justify-between p-3 sm:p-4 rounded-xl hover:bg-muted/50 transition-all border border-border/50 group bg-background/50"
                    >
                      <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
                        <div className="p-2 bg-muted rounded-lg shrink-0 group-hover:bg-accent/10 transition-colors">
                          <FileCheck className="w-4 h-4 text-primary group-hover:text-accent" />
                        </div>
                        <div className="overflow-hidden min-w-0">
                          <p className="font-bold text-xs sm:text-sm truncate pr-2">{req.items?.[0]?.description || 'Untitled Request'}</p>
                          <p className="text-[9px] sm:text-[10px] text-muted-foreground uppercase font-bold tracking-tight truncate opacity-70">
                            {req.refNumber} • {req.budgetLine}
                          </p>
                        </div>
                      </div>
                      <div className="text-right shrink-0 ml-2 sm:ml-4 flex flex-col items-end gap-1 sm:gap-1.5 justify-center min-w-[90px] sm:min-w-[120px]">
                        <p className={cn(
                          "font-black tracking-tighter text-primary truncate w-full",
                          isDetailed ? "text-xs sm:text-sm" : "text-sm sm:text-lg"
                        )}>
                          Ksh {calculatePRTotal(req).toLocaleString()}
                        </p>
                        <Badge 
                          variant={req.status === 'Approved' ? 'secondary' : 'outline'} 
                          className="text-[8px] sm:text-[9px] px-1 sm:px-1.5 py-0 h-4 uppercase tracking-tighter whitespace-nowrap"
                        >
                          {req.status}
                        </Badge>
                      </div>
                    </Link>
                  ))
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-center space-y-2 opacity-50">
                    <FileCheck className="w-8 h-8 text-muted-foreground" />
                    <p className="text-sm font-medium">No recent requisitions found.</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
