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
  Target,
  Building2,
  PieChart as PieChartIcon,
  FileText,
  Trash2,
  Pencil
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
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
  SheetDescription
} from "@/components/ui/sheet";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { calculatePRTotal, FiscalYear } from '@/lib/types';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useToast } from '@/hooks/use-toast';
import { RoleGuard } from '@/components/auth/RoleGuard';
import { Separator } from '@/components/ui/separator';

const fiscalYearSchema = z.object({
  year: z.string().min(4, "Year is required"),
  globalTarget: z.coerce.number().min(1, "Target must be greater than zero"),
  strategy: z.enum(['Growth', 'Conservative', 'Balanced']),
  departments: z.array(z.string()).min(1, "Select at least one department"),
  q1Weight: z.coerce.number().min(0).max(100),
  q2Weight: z.coerce.number().min(0).max(100),
  q3Weight: z.coerce.number().min(0).max(100),
  q4Weight: z.coerce.number().min(0).max(100),
}).refine((data) => (data.q1Weight + data.q2Weight + data.q3Weight + data.q4Weight) === 100, {
  message: "Quarterly weights must total 100%",
  path: ["q1Weight"]
});

type FiscalYearValues = z.infer<typeof fiscalYearSchema>;

const DEPARTMENTS = ['IT', 'Operations', 'Marketing', 'Finance', 'Programs', 'HR'];

export default function DashboardPage() {
  const { 
    prs, 
    budgets, 
    vendors, 
    lpos, 
    grns, 
    addBudget, 
    fiscalYears, 
    selectedYear, 
    setSelectedYear, 
    deleteFiscalYear, 
    addFiscalYear, 
    updateFiscalYear 
  } = useStore();
  const { viewPreference, currentUser } = useUserStore();
  const { toast } = useToast();
  const [mounted, setMounted] = useState(false);
  
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [wizardStep, setWizardStep] = useState(1);
  const [yearToDelete, setYearToDelete] = useState<string | null>(null);
  const [editingYear, setEditingYear] = useState<FiscalYear | null>(null);

  const form = useForm<FiscalYearValues>({
    resolver: zodResolver(fiscalYearSchema),
    defaultValues: {
      year: '',
      globalTarget: 10000000,
      strategy: 'Balanced',
      departments: ['Operations', 'IT'],
      q1Weight: 25,
      q2Weight: 25,
      q3Weight: 25,
      q4Weight: 25,
    },
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (editingYear) {
      const yearBudgets = budgets.filter(b => b.fiscalYear === editingYear.year);
      const yearDepts = Array.from(new Set(yearBudgets.map(b => b.department)));
      
      form.reset({
        year: editingYear.year,
        globalTarget: editingYear.globalTarget,
        strategy: editingYear.strategy,
        departments: yearDepts,
        q1Weight: editingYear.q1Weight,
        q2Weight: editingYear.q2Weight,
        q3Weight: editingYear.q3Weight,
        q4Weight: editingYear.q4Weight,
      });
    } else {
      form.reset({
        year: String(new Date().getFullYear() + 1),
        globalTarget: 10000000,
        strategy: 'Balanced',
        departments: ['Operations', 'IT'],
        q1Weight: 25,
        q2Weight: 25,
        q3Weight: 25,
        q4Weight: 25,
      });
    }
  }, [editingYear, form]);

  if (!mounted) return null;

  const isDetailed = viewPreference === 'detailed';
  const filteredBudgets = budgets.filter(b => b.fiscalYear === selectedYear);
  const totalSpendVal = filteredBudgets.reduce((acc, bl) => acc + (bl.spent || 0), 0);
  const filteredPrs = prs.filter(pr => pr.fiscalYear === selectedYear);
  const pendingApprovals = filteredPrs.filter(pr => pr.status?.includes('Pending')).length;
  
  const filteredLpos = lpos.filter(lpo => lpo.fiscalYear === selectedYear);
  const activeLposCount = filteredLpos.filter(lpo => lpo.status !== 'Closed').length;
  const awaitingDelivery = filteredLpos.filter(lpo => lpo.status === 'Dispatched').length;
  
  const filteredGrns = grns.filter(grn => grn.fiscalYear === selectedYear);
  const activeDisputes = filteredGrns.filter(grn => grn.disputeFlag).length;

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

  const recentPrs = filteredPrs.slice(0, isDetailed ? 5 : 3);

  const onWizardSubmit = (values: FiscalYearValues) => {
    if (wizardStep < 5) {
      nextStep();
      return;
    }

    if (editingYear) {
      updateFiscalYear(editingYear.id, {
        globalTarget: values.globalTarget,
        strategy: values.strategy,
        q1Weight: values.q1Weight,
        q2Weight: values.q2Weight,
        q3Weight: values.q3Weight,
        q4Weight: values.q4Weight,
      });
      toast({ title: "Fiscal Year Strategy Updated" });
    } else {
      addFiscalYear({
        year: values.year,
        globalTarget: values.globalTarget,
        strategy: values.strategy,
        status: 'Open',
        q1Weight: values.q1Weight,
        q2Weight: values.q2Weight,
        q3Weight: values.q3Weight,
        q4Weight: values.q4Weight,
      });

      const deptCount = values.departments.length;
      values.departments.forEach(dept => {
        addBudget({
          name: `${dept} General - ${values.year}`,
          department: dept,
          fiscalYear: values.year,
          description: `Strategic initialized budget for FY ${values.year}. Strategy: ${values.strategy}.`,
          q1Allocation: (values.globalTarget * (values.q1Weight / 100)) / deptCount,
          q2Allocation: (values.globalTarget * (values.q2Weight / 100)) / deptCount,
          q3Allocation: (values.globalTarget * (values.q3Weight / 100)) / deptCount,
          q4Allocation: (values.globalTarget * (values.q4Weight / 100)) / deptCount,
        });
      });

      setSelectedYear(values.year);
      toast({ title: "New Fiscal Year Established" });
    }

    setIsWizardOpen(false);
    setWizardStep(1);
    setEditingYear(null);
    form.reset();
  };

  const nextStep = async () => {
    let fieldsToValidate: (keyof FiscalYearValues)[] = [];
    if (wizardStep === 1) fieldsToValidate = ['year'];
    if (wizardStep === 2) fieldsToValidate = ['globalTarget', 'strategy'];
    if (wizardStep === 3) fieldsToValidate = ['departments'];
    if (wizardStep === 4) fieldsToValidate = ['q1Weight', 'q2Weight', 'q3Weight', 'q4Weight'];
    
    const isValid = await form.trigger(fieldsToValidate);
    if (isValid) setWizardStep(prev => prev + 1);
  };

  const handleDeleteYear = () => {
    if (!yearToDelete) return;
    deleteFiscalYear(yearToDelete);
    toast({ variant: "destructive", title: "Fiscal Year Purged" });
    if (yearToDelete === selectedYear && fiscalYears.length > 1) {
      setSelectedYear(fiscalYears.find(f => f.year !== yearToDelete)?.year || '');
    } else if (fiscalYears.length === 1) {
       setSelectedYear('');
    }
    setYearToDelete(null);
  };

  const openEditWizard = (fy: FiscalYear) => {
    setEditingYear(fy);
    setWizardStep(1);
    setIsWizardOpen(true);
  };

  return (
    <div className="space-y-6 md:space-y-8 animate-in fade-in duration-500 pb-10 max-w-full overflow-hidden">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="space-y-1">
          <h2 className={cn("font-headline font-bold text-primary tracking-tighter leading-none", isDetailed ? "text-2xl md:text-3xl" : "text-3xl md:text-4xl")}>
            Overview
          </h2>
          <p className="text-sm text-muted-foreground font-medium">Strategic procurement metrics for FY {selectedYear}.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <CalendarDays className="w-4 h-4 text-muted-foreground" />
            <Select value={selectedYear} onValueChange={setSelectedYear}>
              <SelectTrigger className="w-[140px] md:w-[180px] h-9 text-[10px] font-bold uppercase tracking-wider bg-card shadow-sm">
                <SelectValue placeholder="Fiscal Year" />
              </SelectTrigger>
              <SelectContent>
                {fiscalYears.map(fy => (
                  <div key={fy.id} className="relative flex items-center justify-between w-full p-1 hover:bg-muted/50 transition-colors">
                    <SelectItem value={fy.year} className="flex-1 text-xs">
                      FY {fy.year}
                    </SelectItem>
                    {currentUser?.role === 'Admin' && (
                      <div className="flex items-center gap-1 ml-2 pr-2">
                        <button 
                          className="p-1 hover:bg-accent/20 rounded-md text-accent transition-colors"
                          onClick={(e) => { e.preventDefault(); e.stopPropagation(); openEditWizard(fy); }}
                          title="Edit Strategy"
                        >
                          <Pencil className="w-3 h-3" />
                        </button>
                        <button 
                          className="p-1 hover:bg-destructive/20 rounded-md text-destructive transition-colors"
                          onClick={(e) => { e.preventDefault(); e.stopPropagation(); setYearToDelete(fy.year); }}
                          title="Delete Period"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <RoleGuard allowedRoles={['Admin', 'Finance']}>
            <Sheet open={isWizardOpen} onOpenChange={(open) => {
              setIsWizardOpen(open);
              if (!open) { setWizardStep(1); setEditingYear(null); form.reset(); }
            }}>
              <SheetTrigger asChild>
                <Button variant="outline" className="h-9 gap-2 bg-card shadow-sm hover:bg-accent hover:text-white transition-all group">
                  <Plus className="w-4 h-4" />
                  <span className="hidden md:inline text-[10px] font-bold uppercase tracking-widest">New Fiscal Year</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="sm:max-w-xl w-[95vw] overflow-y-auto flex flex-col h-full border-l-primary/10">
                <SheetHeader className="pb-6 border-b">
                  <SheetTitle className="text-2xl font-black tracking-tight flex items-center gap-2">
                    <Target className="w-6 h-6 text-accent" />
                    {editingYear ? `Refine FY ${editingYear.year}` : 'Strategic FY Onboarding'}
                  </SheetTitle>
                  <SheetDescription className="text-xs font-medium">
                    {editingYear ? 'Update strategic parameters for this period.' : 'Configure the strategic foundation for the upcoming fiscal cycle.'}
                  </SheetDescription>
                </SheetHeader>

                <div className="flex-1 py-8">
                  <div className="flex items-center gap-2 mb-10 px-2">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <div key={s} className="flex-1 flex items-center gap-2">
                        <div className={cn(
                          "w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-black transition-all",
                          wizardStep === s ? "bg-accent text-white scale-110 shadow-lg" : 
                          wizardStep > s ? "bg-primary text-white" : "bg-muted text-muted-foreground"
                        )}>
                          {wizardStep > s ? <CheckCircle2 className="w-4 h-4" /> : s}
                        </div>
                        {s < 5 && <div className={cn("flex-1 h-0.5 rounded-full", wizardStep > s ? "bg-primary" : "bg-muted")} />}
                      </div>
                    ))}
                  </div>

                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onWizardSubmit)} className="space-y-8" onKeyDown={(e) => { if (e.key === 'Enter') e.preventDefault(); }}>
                      {wizardStep === 1 && (
                        <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                          <FormField control={form.control} name="year" render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-[10px] uppercase font-bold text-muted-foreground">Target Fiscal Year</FormLabel>
                              <FormControl><Input {...field} disabled={!!editingYear} placeholder="e.g. 2025" className="h-12 text-sm font-bold" /></FormControl>
                              <FormMessage />
                            </FormItem>
                          )} />
                        </div>
                      )}

                      {wizardStep === 2 && (
                        <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                          <FormField control={form.control} name="globalTarget" render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-[10px] uppercase font-bold text-muted-foreground">Global Allocation Target (Ksh)</FormLabel>
                              <FormControl><Input type="number" {...field} className="h-12 font-black tracking-tight" /></FormControl>
                              <FormMessage />
                            </FormItem>
                          )} />
                          <FormField control={form.control} name="strategy" render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-[10px] uppercase font-bold text-muted-foreground">Strategic Posture</FormLabel>
                              <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl><SelectTrigger className="h-12 text-sm"><SelectValue placeholder="Select Strategy" /></SelectTrigger></FormControl>
                                <SelectContent>
                                  <SelectItem value="Growth" className="text-sm">Growth-Oriented (Aggressive)</SelectItem>
                                  <SelectItem value="Balanced" className="text-sm">Balanced Approach</SelectItem>
                                  <SelectItem value="Conservative" className="text-sm">Conservative (Cost-Control)</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )} />
                        </div>
                      )}

                      {wizardStep === 3 && (
                        <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                          <div className="grid grid-cols-1 gap-3">
                            {DEPARTMENTS.map((dept) => (
                              <FormField
                                key={dept}
                                control={form.control}
                                name="departments"
                                render={({ field }) => (
                                  <FormItem key={dept} className="flex flex-row items-center space-x-3 space-y-0 p-4 bg-card border rounded-xl hover:bg-muted/50 transition-colors cursor-pointer">
                                    <FormControl>
                                      <Checkbox
                                        disabled={!!editingYear}
                                        checked={field.value?.includes(dept)}
                                        onCheckedChange={(checked) => checked ? field.onChange([...field.value, dept]) : field.onChange(field.value?.filter((value) => value !== dept))}
                                      />
                                    </FormControl>
                                    <FormLabel className="text-sm font-bold cursor-pointer flex-1">{dept} Department</FormLabel>
                                  </FormItem>
                                )}
                              />
                            ))}
                          </div>
                        </div>
                      )}

                      {wizardStep === 4 && (
                        <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                          <div className="grid grid-cols-2 gap-4">
                            {['q1Weight', 'q2Weight', 'q3Weight', 'q4Weight'].map(q => (
                              <FormField key={q} control={form.control} name={q as any} render={({ field }) => (
                                <FormItem><FormLabel className="text-[10px] font-black uppercase">{q}</FormLabel><FormControl><Input type="number" {...field} className="h-12" /></FormControl></FormItem>
                              )} />
                            ))}
                          </div>
                        </div>
                      )}

                      {wizardStep === 5 && (
                        <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                          <div className="p-6 bg-muted/30 border border-border/50 rounded-2xl space-y-4">
                            <div className="flex items-center gap-4 pb-4 border-b">
                              <div className="w-14 h-14 bg-primary text-white rounded-2xl flex items-center justify-center font-black text-xl">
                                {form.getValues().year.substring(2)}
                              </div>
                              <div>
                                <p className="text-base font-black text-primary">FY {form.getValues().year} Strategy</p>
                                <Badge variant="secondary" className="text-[10px] font-bold uppercase">{form.getValues().strategy}</Badge>
                              </div>
                            </div>
                            <div className="space-y-3 pt-2">
                              <div className="flex justify-between items-center text-xs">
                                <span className="text-muted-foreground font-bold">Global Cap</span>
                                <span className="font-black text-primary">Ksh {Number(form.getValues().globalTarget).toLocaleString()}</span>
                              </div>
                              <div className="flex justify-between items-center text-xs">
                                <span className="text-muted-foreground font-bold">Depts Involved</span>
                                <span className="font-black text-accent">{form.getValues().departments.length} Branches</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </form>
                  </Form>
                </div>

                <SheetFooter className="pt-6 border-t flex-col sm:flex-row gap-2">
                  {wizardStep > 1 && <Button variant="outline" onClick={() => setWizardStep(prev => prev - 1)} className="font-bold uppercase text-xs h-11">Back</Button>}
                  <div className="flex-1" />
                  {wizardStep < 5 ? (
                    <Button onClick={nextStep} className="bg-primary font-bold uppercase text-xs h-11">Continue</Button>
                  ) : (
                    <Button onClick={() => onWizardSubmit(form.getValues())} className="bg-accent text-white font-bold uppercase text-xs h-11">
                      {editingYear ? 'Update Strategy' : 'Establish Fiscal Year'}
                    </Button>
                  )}
                </SheetFooter>
              </SheetContent>
            </Sheet>
          </RoleGuard>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <div className={cn("md:col-span-2", isDetailed ? "lg:col-span-2" : "lg:col-span-4")}>
          <StatCard title={`Total Spend (Actual - ${selectedYear})`} value={`Ksh ${totalSpendVal.toLocaleString()}`} trend={{ value: 12, isUp: true }} icon={TrendingUp} />
        </div>
        <div className="md:col-span-1"><StatCard title="Pending Approvals" value={pendingApprovals} icon={Clock} /></div>
        <div className="md:col-span-1"><StatCard title="Active LPOs" value={activeLposCount} icon={ShoppingCart} /></div>
      </div>

      <div className={cn("grid grid-cols-1 gap-6", isDetailed ? "lg:grid-cols-3" : "")}>
        {isDetailed && (
          <div className="lg:col-span-2">
            <Card className="h-full shadow-none border border-border">
              <CardHeader><CardTitle className="text-base font-headline">Budget Utilization</CardTitle></CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={budgetData} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} opacity={0.3} />
                      <XAxis type="number" hide />
                      <YAxis dataKey="name" type="category" width={100} fontSize={10} fontWeight={600} axisLine={false} tickLine={false} />
                      <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ borderRadius: '8px', border: 'none', backgroundColor: 'hsl(var(--card))' }} formatter={(v: any) => [`Ksh ${v.toLocaleString()}`, 'Spent']} />
                      <Bar dataKey="spent" fill="hsl(var(--accent))" radius={[0, 4, 4, 0]} barSize={20} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        <div className={isDetailed ? "lg:col-span-1" : "col-span-1"}>
          <Card className="shadow-none border border-border overflow-hidden">
            <CardHeader><CardTitle className="text-base font-headline">Recent Activity</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {recentPrs.length > 0 ? recentPrs.map(req => (
                <Link key={req.id} href={`/requisitions?id=${req.id}`} className="flex items-center justify-between p-3 rounded-xl hover:bg-muted/50 border border-border/50 group">
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-xs truncate">{req.items?.[0]?.description || 'Untitled'}</p>
                    <p className="text-[9px] text-muted-foreground uppercase font-bold">{req.refNumber}</p>
                  </div>
                  <div className="text-right ml-4">
                    <p className="font-black text-xs tracking-tighter">Ksh {calculatePRTotal(req).toLocaleString()}</p>
                    <Badge variant="outline" className="text-[8px] h-3.5 px-1 py-0">{req.status}</Badge>
                  </div>
                </Link>
              )) : (
                <div className="py-10 text-center opacity-30 italic text-xs">No recent activity</div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <AlertDialog open={!!yearToDelete} onOpenChange={(open) => !open && setYearToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-destructive flex items-center gap-2">
              <AlertCircle className="w-5 h-5" /> 
              Purge Fiscal Period FY {yearToDelete}?
            </AlertDialogTitle>
            <div className="text-sm text-muted-foreground space-y-3">
              <p>This will **permanently delete** the entire fiscal period and all its associated data. This action cannot be undone.</p>
              <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg space-y-1">
                <p className="font-black uppercase text-[10px]">Cascading Impact:</p>
                <ul className="list-disc pl-4 text-[9px] font-bold">
                  <li>All departmental budget lines for {yearToDelete}</li>
                  <li>All purchase requisitions and approval logs</li>
                  <li>All Local Purchase Orders (LPOs) and GRNs</li>
                </ul>
              </div>
            </div>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="text-xs font-bold uppercase">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteYear} className="bg-destructive hover:bg-destructive/90 text-white text-xs font-bold uppercase">
              Purge FY {yearToDelete}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
