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
  Trash2
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
} from "@/select";
import { 
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
  SheetDescription
} from "@/sheet";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/form";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/alert-dialog";
import { Input } from '@/input';
import { Button } from '@/button';
import { Checkbox } from '@/checkbox';
import { calculatePRTotal } from '@/lib/types';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useToast } from '@/hooks/use-toast';
import { RoleGuard } from '@/components/auth/RoleGuard';
import { Separator } from '@/separator';

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
  const { prs, budgets, vendors, lpos, grns, addBudget, selectedYear, setSelectedYear, deleteFiscalYear } = useStore();
  const { viewPreference, currentUser } = useUserStore();
  const { toast } = useToast();
  const [mounted, setMounted] = useState(false);
  
  const availableYears = Array.from(new Set(budgets.map(b => b.fiscalYear))).sort((a, b) => Number(b) - Number(a));
  
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [wizardStep, setWizardStep] = useState(1);
  const [yearToDelete, setYearToDelete] = useState<string | null>(null);

  const form = useForm<FiscalYearValues>({
    resolver: zodResolver(fiscalYearSchema),
    defaultValues: {
      year: '2025',
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
    
    toast({
      title: "Fiscal Year Strategic Onboarding Complete",
      description: `Established FY ${values.year} with ${deptCount} departmental budgets.`,
    });
    setIsWizardOpen(false);
    setWizardStep(1);
    form.reset();
  };

  const nextStep = async () => {
    let fieldsToValidate: (keyof FiscalYearValues)[] = [];
    if (wizardStep === 1) fieldsToValidate = ['year'];
    if (wizardStep === 2) fieldsToValidate = ['globalTarget', 'strategy'];
    if (wizardStep === 3) fieldsToValidate = ['departments'];
    if (wizardStep === 4) fieldsToValidate = ['q1Weight', 'q2Weight', 'q3Weight', 'q4Weight'];
    
    const isValid = await form.trigger(fieldsToValidate);
    
    if (isValid) {
      if (wizardStep === 4) {
        const { q1Weight, q2Weight, q3Weight, q4Weight } = form.getValues();
        if ((q1Weight + q2Weight + q3Weight + q4Weight) !== 100) {
          form.setError('q1Weight', { message: 'Weights must total exactly 100%' });
          return;
        }
      }
      setWizardStep(prev => prev + 1);
    }
  };

  const handleDeleteYear = () => {
    if (!yearToDelete) return;
    
    deleteFiscalYear(yearToDelete);
    toast({
      variant: "destructive",
      title: "Fiscal Year Purged",
      description: `All associated budgets and commitments for FY ${yearToDelete} have been permanently removed.`,
    });
    
    if (yearToDelete === selectedYear) {
      const remainingYears = availableYears.filter(y => y !== yearToDelete);
      if (remainingYears.length > 0) {
        setSelectedYear(remainingYears[0]);
      }
    }
    setYearToDelete(null);
  };

  return (
    <div className="space-y-6 md:space-y-8 animate-in fade-in duration-500 pb-10 max-w-full overflow-hidden">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="space-y-1">
          <h2 className={cn(
            "font-headline font-bold text-primary tracking-tighter leading-none",
            isDetailed ? "text-2xl md:text-3xl" : "text-3xl md:text-4xl"
          )}>
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
                {availableYears.map(year => (
                  <SelectItem key={year} value={year} className="text-xs group">
                    <div className="flex items-center justify-between w-full gap-2 min-w-[120px]">
                      <span>FY {year}</span>
                      {currentUser?.role === 'Admin' && (
                        <span 
                          className="p-1 hover:bg-destructive/10 rounded-md text-destructive transition-colors opacity-0 group-hover:opacity-100"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setYearToDelete(year);
                          }}
                        >
                          <Trash2 className="w-3 h-3" />
                        </span>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <RoleGuard allowedRoles={['Admin', 'Finance']}>
            <div className="flex items-center gap-2">
              <Sheet open={isWizardOpen} onOpenChange={(open) => {
                setIsWizardOpen(open);
                if (!open) {
                  setWizardStep(1);
                  form.reset();
                }
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
                      Strategic FY Onboarding
                    </SheetTitle>
                    <SheetDescription className="text-xs font-medium">
                      Configure the strategic foundation for the upcoming fiscal cycle.
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
                            <div className="space-y-4">
                              <h3 className="text-lg font-bold text-primary flex items-center gap-2">
                                <CalendarDays className="w-5 h-5" /> 1. Period Selection
                              </h3>
                              <FormField control={form.control} name="year" render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="text-[10px] uppercase font-bold text-muted-foreground">Target Fiscal Year</FormLabel>
                                  <Select onValueChange={field.onChange} value={field.value}>
                                    <FormControl><SelectTrigger className="h-12 text-sm font-bold"><SelectValue placeholder="Select Year" /></SelectTrigger></FormControl>
                                    <SelectContent>
                                      <SelectItem value="2025" className="text-sm font-medium">Fiscal Year 2025</SelectItem>
                                      <SelectItem value="2026" className="text-sm font-medium">Fiscal Year 2026</SelectItem>
                                      <SelectItem value="2027" className="text-sm font-medium">Fiscal Year 2027</SelectItem>
                                    </SelectContent>
                                  </Select>
                                  <FormMessage />
                                </FormItem>
                              )} />
                              <div className="p-4 bg-muted/30 rounded-xl border border-border/50">
                                <p className="text-xs font-medium text-muted-foreground leading-relaxed">
                                  Establishing a new period allows departmental managers to draft preliminary budgets and requisitions for the upcoming fiscal cycle.
                                </p>
                              </div>
                            </div>
                          </div>
                        )}

                        {wizardStep === 2 && (
                          <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                            <h3 className="text-lg font-bold text-primary flex items-center gap-2">
                              <TrendingUp className="w-5 h-5" /> 2. Strategic Posture
                            </h3>
                            <FormField control={form.control} name="globalTarget" render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-[10px] uppercase font-bold text-muted-foreground">Global Allocation Target (Ksh)</FormLabel>
                                <FormControl><Input type="number" {...field} className="h-12 font-black tracking-tight" /></FormControl>
                                <FormDescription className="text-[10px]">Total organizational spend cap for the year.</FormDescription>
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
                            <h3 className="text-lg font-bold text-primary flex items-center gap-2">
                              <Building2 className="w-5 h-5" /> 3. Departmental Seeding
                            </h3>
                            <div className="grid grid-cols-1 gap-3">
                              {DEPARTMENTS.map((dept) => (
                                <FormField
                                  key={dept}
                                  control={form.control}
                                  name="departments"
                                  render={({ field }) => {
                                    return (
                                      <FormItem key={dept} className="flex flex-row items-center space-x-3 space-y-0 p-4 bg-card border rounded-xl hover:bg-muted/50 transition-colors cursor-pointer">
                                        <FormControl>
                                          <Checkbox
                                            checked={field.value?.includes(dept)}
                                            onCheckedChange={(checked) => {
                                              return checked
                                                ? field.onChange([...field.value, dept])
                                                : field.onChange(field.value?.filter((value) => value !== dept))
                                            }}
                                          />
                                        </FormControl>
                                        <FormLabel className="text-sm font-bold cursor-pointer flex-1">
                                          {dept} Department
                                        </FormLabel>
                                      </FormItem>
                                    )
                                  }}
                                />
                              ))}
                              <FormMessage />
                            </div>
                          </div>
                        )}

                        {wizardStep === 4 && (
                          <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                            <h3 className="text-lg font-bold text-primary flex items-center gap-2">
                              <PieChartIcon className="w-5 h-5" /> 4. Quarterly Phasing
                            </h3>
                            <p className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest px-1">Weight Distribution (%)</p>
                            <div className="grid grid-cols-2 gap-4">
                              <FormField control={form.control} name="q1Weight" render={({ field }) => (
                                <FormItem><FormLabel className="text-[10px] font-black">Q1 Weight</FormLabel><FormControl><Input type="number" {...field} className="h-12" /></FormControl></FormItem>
                              )} />
                              <FormField control={form.control} name="q2Weight" render={({ field }) => (
                                <FormItem><FormLabel className="text-[10px] font-black">Q2 Weight</FormLabel><FormControl><Input type="number" {...field} className="h-12" /></FormControl></FormItem>
                              )} />
                              <FormField control={form.control} name="q3Weight" render={({ field }) => (
                                <FormItem><FormLabel className="text-[10px] font-black">Q3 Weight</FormLabel><FormControl><Input type="number" {...field} className="h-12" /></FormControl></FormItem>
                              )} />
                              <FormField control={form.control} name="q4Weight" render={({ field }) => (
                                <FormItem><FormLabel className="text-[10px] font-black">Q4 Weight</FormLabel><FormControl><Input type="number" {...field} className="h-12" /></FormControl></FormItem>
                              )} />
                            </div>
                            <div className="p-4 bg-accent/5 rounded-xl border border-accent/20">
                              <div className="flex justify-between items-center text-xs font-bold">
                                <span>Total Distribution Check</span>
                                <span className={cn(
                                  (Number(form.watch('q1Weight')) + Number(form.watch('q2Weight')) + Number(form.watch('q3Weight')) + Number(form.watch('q4Weight'))) === 100 
                                  ? "text-accent" : "text-destructive"
                                )}>
                                  {Number(form.watch('q1Weight')) + Number(form.watch('q2Weight')) + Number(form.watch('q3Weight')) + Number(form.watch('q4Weight'))}%
                                </span>
                              </div>
                            </div>
                            <FormMessage />
                          </div>
                        )}

                        {wizardStep === 5 && (
                          <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                            <h3 className="text-lg font-bold text-primary flex items-center gap-2">
                              <ShieldCheck className="w-5 h-5" /> 5. Review & Authorize
                            </h3>
                            <div className="space-y-4 p-6 bg-muted/30 border border-border/50 rounded-2xl">
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
                                  <span className="font-black text-primary tracking-tighter">Ksh {Number(form.getValues().globalTarget).toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between items-center text-xs">
                                  <span className="text-muted-foreground font-bold">Depts Seeded</span>
                                  <span className="font-black text-accent">{form.getValues().departments.length} Branches</span>
                                </div>
                                <div className="flex justify-between items-center text-xs">
                                  <span className="text-muted-foreground font-bold">Allocation per Dept</span>
                                  <span className="font-black text-primary tracking-tighter">Ksh {(Number(form.getValues().globalTarget) / form.getValues().departments.length).toLocaleString()}</span>
                                </div>
                              </div>

                              <Separator />

                              <div className="grid grid-cols-4 gap-2 pt-2">
                                <div className="text-center">
                                  <p className="text-[10px] font-bold text-muted-foreground uppercase">Q1</p>
                                  <p className="text-sm font-black">{form.getValues().q1Weight}%</p>
                                </div>
                                <div className="text-center">
                                  <p className="text-[10px] font-bold text-muted-foreground uppercase">Q2</p>
                                  <p className="text-sm font-black">{form.getValues().q2Weight}%</p>
                                </div>
                                <div className="text-center">
                                  <p className="text-[10px] font-bold text-muted-foreground uppercase">Q3</p>
                                  <p className="text-sm font-black">{form.getValues().q3Weight}%</p>
                                </div>
                                <div className="text-center">
                                  <p className="text-[10px] font-bold text-muted-foreground uppercase">Q4</p>
                                  <p className="text-sm font-black">{form.getValues().q4Weight}%</p>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </form>
                    </Form>
                  </div>

                  <SheetFooter className="pt-6 border-t flex-col sm:flex-row gap-2">
                    {wizardStep > 1 && (
                      <Button type="button" variant="outline" onClick={() => setWizardStep(prev => prev - 1)} className="w-full sm:w-auto font-bold uppercase text-xs h-11">
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back
                      </Button>
                    )}
                    <div className="flex-1" />
                    {wizardStep < 5 ? (
                      <Button type="button" onClick={nextStep} className="w-full sm:w-auto bg-primary font-bold uppercase text-xs h-11 shadow-md">
                        Continue
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    ) : (
                      <Button 
                        type="button" 
                        onClick={() => onWizardSubmit(form.getValues())}
                        className="w-full sm:w-auto bg-accent hover:bg-accent/90 text-white font-bold uppercase text-xs h-11 shadow-xl"
                      >
                        Establish Fiscal Year
                        <ShieldCheck className="w-4 h-4 ml-2" />
                      </Button>
                    )}
                  </SheetFooter>
                </SheetContent>
              </Sheet>
            </div>
          </RoleGuard>
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
            tooltip="The actual verified expenditure across all departmental budgets for the selected fiscal period."
            description={isDetailed ? "Verified actuals for current selection" : "Actual verified expenditure"}
          />
        </div>

        <div className="md:col-span-1">
          <StatCard 
            title="Pending Approvals" 
            value={pendingApprovals} 
            description={isDetailed ? "Awaiting review for this period" : undefined}
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
              <CardTitle className="text-base md:text-lg font-headline">Recent Requisitions ({selectedYear})</CardTitle>
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
                    <p className="text-sm font-medium">No requisitions found for FY {selectedYear}.</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <AlertDialog open={!!yearToDelete} onOpenChange={(open) => !open && setYearToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-destructive flex items-center gap-2">
              <AlertCircle className="w-5 h-5" />
              Critical Action: Purge Fiscal Period?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs">
              This will permanently delete the entire **FY {yearToDelete}** fiscal period. 
              All associated budgets, requisitions, and purchase orders will be lost. This action is irreversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="text-xs font-bold uppercase">Keep Period</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteYear}
              className="bg-destructive hover:bg-destructive/90 text-white text-xs font-bold uppercase"
            >
              Purge FY {yearToDelete}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
