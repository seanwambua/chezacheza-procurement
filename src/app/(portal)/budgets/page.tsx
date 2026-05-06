"use client";

import { useState, useEffect } from 'react';
import { useStore } from '@/lib/store';
import { useUserStore } from '@/lib/user-store';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatCard } from '@/components/dashboard/StatCard';
import { 
  PieChart, 
  TrendingUp, 
  Lock, 
  Plus, 
  Pencil, 
  Trash2, 
  MoreVertical, 
  Info,
  PauseCircle,
  PlayCircle,
  ArrowRight,
  FileText,
  ShoppingCart,
  CheckCircle2,
  Clock
} from 'lucide-react';
import { Button } from '@/components/ui/button';
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
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { RoleGuard } from '@/components/auth/RoleGuard';
import { Budget, getBudgetStats } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

const budgetSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  department: z.string().min(1, "Department is required"),
  fiscalYear: z.string().min(4, "Fiscal year is required"),
  description: z.string().max(200, "Description too long"),
  q1Allocation: z.coerce.number().min(0),
  q2Allocation: z.coerce.number().min(0),
  q3Allocation: z.coerce.number().min(0),
  q4Allocation: z.coerce.number().min(0),
});

type BudgetFormValues = z.infer<typeof budgetSchema>;

export default function BudgetsPage() {
  const { budgets, prs, lpos, addBudget, updateBudget, deleteBudget } = useStore();
  const { currentUser, viewPreference } = useUserStore();
  const [mounted, setMounted] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null);

  const isDetailed = viewPreference === 'detailed';

  const form = useForm<BudgetFormValues>({
    resolver: zodResolver(budgetSchema),
    defaultValues: {
      name: '',
      department: '',
      fiscalYear: '2024',
      description: '',
      q1Allocation: 0,
      q2Allocation: 0,
      q3Allocation: 0,
      q4Allocation: 0,
    },
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (editingBudget) {
      form.reset({
        name: editingBudget.name,
        department: editingBudget.department,
        fiscalYear: editingBudget.fiscalYear,
        description: editingBudget.description,
        q1Allocation: editingBudget.q1Allocation,
        q2Allocation: editingBudget.q2Allocation,
        q3Allocation: editingBudget.q3Allocation,
        q4Allocation: editingBudget.q4Allocation,
      });
    } else {
      form.reset({
        name: '',
        department: '',
        fiscalYear: '2024',
        description: '',
        q1Allocation: 0,
        q2Allocation: 0,
        q3Allocation: 0,
        q4Allocation: 0,
      });
    }
  }, [editingBudget, form, isDialogOpen]);

  if (!mounted) return null;

  if (currentUser && !['Admin', 'Finance', 'Manager'].includes(currentUser.role)) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center space-y-4 px-4">
        <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center">
          <Lock className="w-8 h-8 text-muted-foreground" />
        </div>
        <h2 className="text-xl font-bold">Financial Access Restricted</h2>
        <p className="text-muted-foreground max-w-sm">You do not have the required permissions to view departmental budgets.</p>
        <Button variant="outline" onClick={() => window.history.back()}>Go Back</Button>
      </div>
    );
  }

  const budgetMetrics = budgets.map(b => getBudgetStats(b));
  const totalAllocation = budgetMetrics.reduce((acc, m) => acc + m.totalAllocation, 0);
  const totalUsed = budgetMetrics.reduce((acc, m) => acc + m.totalUsed, 0);
  const overallUtilization = totalAllocation > 0 ? Math.round((totalUsed / totalAllocation) * 100) : 0;
  const pausedBudgetsCount = budgetMetrics.filter(m => m.isPaused).length;

  const onSubmit = (values: BudgetFormValues) => {
    if (editingBudget) {
      updateBudget(editingBudget.id, values);
    } else {
      addBudget(values);
    }
    setIsDialogOpen(false);
    setEditingBudget(null);
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this budget? All historical data will be removed.')) {
      deleteBudget(id);
    }
  };

  const getBudgetDetails = (budgetName: string) => {
    const relatedPrs = prs.filter(pr => pr.budgetLine === budgetName);
    const relatedPrIds = relatedPrs.map(pr => pr.id);
    const relatedLpos = lpos.filter(lpo => relatedPrIds.includes(lpo.prId));

    return {
      prsRequested: relatedPrs.length,
      prsApproved: relatedPrs.filter(pr => pr.status === 'Approved' || pr.status === 'LPO Generated').length,
      prsFulfilled: relatedPrs.filter(pr => pr.status === 'LPO Generated').length,
      lposPending: relatedLpos.filter(lpo => lpo.status === 'Dispatched' || lpo.status === 'Draft').length,
      lposDelivered: relatedLpos.filter(lpo => ['Fulfilled', 'Matched', 'Closed'].includes(lpo.status)).length,
    };
  };

  return (
    <div className="space-y-6 md:space-y-8 animate-in fade-in duration-500 pb-10 max-w-full overflow-hidden">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="min-w-0 flex-1">
          <h2 className={cn(
            "font-headline font-bold text-primary tracking-tighter leading-tight truncate",
            isDetailed ? "text-2xl md:text-3xl" : "text-3xl md:text-4xl"
          )}>
            {isDetailed ? 'Budget & Quarterly Planning' : 'Budgets'}
          </h2>
          <p className="text-muted-foreground text-sm font-medium">
            {isDetailed 
              ? 'Rolling quarterly allocations with automatic procurement pausing.' 
              : 'Review departmental spend and remaining funds.'}
          </p>
        </div>
        
        <RoleGuard allowedRoles={['Admin', 'Finance']}>
          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) setEditingBudget(null);
          }}>
            <DialogTrigger asChild>
              <Button className="w-full md:w-auto bg-primary font-bold uppercase text-xs h-10 shadow-sm">
                <Plus className="w-4 h-4 mr-2" />
                Plan Budget
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl w-[95vw] max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-xl md:text-2xl font-black tracking-tight">{editingBudget ? 'Update Budget Plan' : 'Establish New Budget Plan'}</DialogTitle>
                <DialogDescription className="text-xs font-medium">
                  Configure quarterly allocations. Unused funds roll over to the next quarter.
                </DialogDescription>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 py-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                    <FormField control={form.control} name="name" render={({ field }) => (
                      <FormItem><FormLabel className="text-[10px] uppercase font-bold text-muted-foreground">Budget Name</FormLabel><FormControl><Input placeholder="IT Hardware" {...field} className="h-10 text-xs" /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={form.control} name="department" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[10px] uppercase font-bold text-muted-foreground">Department</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl><SelectTrigger className="h-10 text-xs"><SelectValue placeholder="Select" /></SelectTrigger></FormControl>
                          <SelectContent>
                            {['IT', 'Operations', 'Marketing', 'Finance', 'Programs'].map(d => <SelectItem key={d} value={d} className="text-xs">{d}</SelectItem>)}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )} />
                  </div>

                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 p-4 bg-muted/30 rounded-lg border border-border/50">
                    <FormField control={form.control} name="q1Allocation" render={({ field }) => (
                      <FormItem><FormLabel className="text-[9px] uppercase font-bold">Q1</FormLabel><FormControl><Input type="number" {...field} className="h-9 text-xs" /></FormControl></FormItem>
                    )} />
                    <FormField control={form.control} name="q2Allocation" render={({ field }) => (
                      <FormItem><FormLabel className="text-[9px] uppercase font-bold">Q2</FormLabel><FormControl><Input type="number" {...field} className="h-9 text-xs" /></FormControl></FormItem>
                    )} />
                    <FormField control={form.control} name="q3Allocation" render={({ field }) => (
                      <FormItem><FormLabel className="text-[9px] uppercase font-bold">Q3</FormLabel><FormControl><Input type="number" {...field} className="h-9 text-xs" /></FormControl></FormItem>
                    )} />
                    <FormField control={form.control} name="q4Allocation" render={({ field }) => (
                      <FormItem><FormLabel className="text-[9px] uppercase font-bold">Q4</FormLabel><FormControl><Input type="number" {...field} className="h-9 text-xs" /></FormControl></FormItem>
                    )} />
                  </div>

                  <FormField control={form.control} name="description" render={({ field }) => (
                    <FormItem><FormLabel className="text-[10px] uppercase font-bold text-muted-foreground">Purpose & Scope</FormLabel><FormControl><Textarea {...field} className="min-h-[80px] text-xs" /></FormControl><FormMessage /></FormItem>
                  )} />

                  <DialogFooter className="gap-2 sm:gap-0 flex-col sm:flex-row border-t pt-6">
                    <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)} className="w-full sm:w-auto font-bold uppercase text-xs h-10">Cancel</Button>
                    <Button type="submit" className="w-full sm:w-auto bg-primary shadow-md font-bold uppercase text-xs h-10">Authorize Budget</Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </RoleGuard>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
        <Card className="md:col-span-2 border-primary/10 bg-gradient-to-br from-primary/5 to-transparent relative overflow-hidden group">
          <CardHeader className="py-4">
             <CardTitle className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest text-center sm:text-left">
               {isDetailed ? 'Global Fiscal Status' : 'Overall Spend'}
             </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row items-center gap-6 sm:gap-10">
              <div className={cn(
                "relative shrink-0",
                isDetailed ? "w-28 h-28 md:w-36 md:h-36" : "w-32 h-32 md:w-40 md:h-40"
              )}>
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                  <circle className="text-muted/20 stroke-current" strokeWidth="8" fill="transparent" r="40" cx="50" cy="50" />
                  <circle
                    className="text-primary stroke-current transition-all duration-1000"
                    strokeWidth="8"
                    strokeDasharray={`${overallUtilization * 2.512} 251.2`}
                    strokeLinecap="round"
                    fill="transparent"
                    r="40" cx="50" cy="50"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className={cn(
                    "font-black tracking-tight",
                    isDetailed ? "text-lg md:text-2xl" : "text-xl md:text-3xl"
                  )}>{overallUtilization}%</span>
                  <span className="text-[8px] uppercase font-bold text-muted-foreground">Total Use</span>
                </div>
              </div>
              <div className="flex-1 space-y-4 min-w-0 w-full mt-2 sm:mt-0">
                <div className="text-center sm:text-left space-y-1">
                  <p className={cn(
                    "font-black text-primary tracking-tighter truncate leading-tight",
                    isDetailed ? "text-2xl md:text-3xl" : "text-3xl md:text-4xl"
                  )}>
                    Ksh {totalAllocation.toLocaleString()}
                  </p>
                  <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-tight">Consolidated Annual Pool</p>
                </div>
                {isDetailed && (
                  <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border/50">
                    <div className="text-center sm:text-left">
                        <p className="text-sm font-bold text-destructive">{pausedBudgetsCount}</p>
                        <p className="text-[9px] uppercase font-bold text-muted-foreground">Paused Budgets</p>
                    </div>
                    <div className="text-center sm:text-left">
                        <p className="text-sm font-bold text-accent">Q{Math.floor(new Date().getMonth() / 3) + 1}</p>
                        <p className="text-[9px] uppercase font-bold text-muted-foreground">Active Quarter</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-1 gap-4 md:gap-6">
          <StatCard 
            title="Total Utilized" 
            value={`Ksh ${totalUsed.toLocaleString()}`} 
            icon={TrendingUp} 
          />
          <StatCard 
            title="Remaining" 
            value={`Ksh ${(totalAllocation - totalUsed).toLocaleString()}`} 
            icon={PieChart} 
          />
        </div>
      </div>

      <Card className="border-border shadow-none bg-card overflow-hidden">
        <CardHeader className="border-b border-border/50 py-4 px-4 md:px-6">
          <CardTitle className="text-base md:text-lg font-headline">
            {isDetailed ? 'Budget Analysis & Quarterly Health' : 'Budget Health'}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto w-full">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30 border-none">
                  <TableHead className="min-w-[180px] font-bold uppercase text-[10px]">Budget</TableHead>
                  <TableHead className="min-w-[140px] font-bold uppercase text-[10px]">Status</TableHead>
                  {isDetailed && <TableHead className="text-right min-w-[120px] font-bold uppercase text-[10px]">Q Allocation</TableHead>}
                  <TableHead className="text-right min-w-[140px] font-bold uppercase text-[10px]">Remaining in Q</TableHead>
                  {isDetailed && <TableHead className="text-right min-w-[140px] font-bold uppercase text-[10px]">Annual Pool</TableHead>}
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {budgets.map((b) => {
                  const stats = getBudgetStats(b);
                  const details = getBudgetDetails(b.name);
                  return (
                    <TableRow key={b.id} className="group hover:bg-muted/5">
                      <TableCell>
                        <TooltipProvider>
                          <Tooltip delayDuration={0}>
                            <TooltipTrigger asChild>
                              <div className="flex flex-col cursor-help">
                                <span className={cn(
                                  "font-bold text-primary flex items-center gap-2 whitespace-nowrap",
                                  !isDetailed && "text-sm"
                                )}>
                                  {b.name}
                                  {stats.isPaused ? (
                                    <PauseCircle className="w-3.5 h-3.5 text-destructive" />
                                  ) : (
                                    <PlayCircle className="w-3.5 h-3.5 text-accent" />
                                  )}
                                </span>
                                <span className="text-[10px] text-muted-foreground uppercase font-medium">{b.department}</span>
                              </div>
                            </TooltipTrigger>
                            <TooltipContent side="right" className="w-80 p-0 overflow-hidden border-primary/20 shadow-2xl bg-card text-foreground hidden sm:block">
                              <div className="bg-primary p-4 text-primary-foreground">
                                <h4 className="font-bold text-sm uppercase tracking-tight">{b.name} Metrics</h4>
                                <p className="text-[10px] opacity-70 mt-1 line-clamp-2">{b.description}</p>
                              </div>
                              <div className="p-4 space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                  <div className="space-y-1">
                                    <p className="text-[9px] uppercase font-bold text-muted-foreground">Requisitions</p>
                                    <div className="flex items-center gap-2 text-xs font-semibold">
                                      <FileText className="w-3 h-3 text-accent" />
                                      <span>{details.prsRequested} Requested</span>
                                    </div>
                                  </div>
                                  <div className="space-y-1">
                                    <p className="text-[9px] uppercase font-bold text-muted-foreground">LPO Status</p>
                                    <div className="flex items-center gap-2 text-xs font-semibold">
                                      <ShoppingCart className="w-3 h-3 text-accent" />
                                      <span>{details.lposPending + details.lposDelivered} Total</span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 min-w-[120px]">
                           <div className="h-1.5 flex-1 bg-muted rounded-full overflow-hidden flex">
                              <div 
                                className={`h-full transition-all duration-500 ${stats.isPaused ? 'bg-destructive' : 'bg-accent'}`}
                                style={{ width: `${Math.min(100, (stats.totalUsed / stats.cumulativeAllocation) * 100)}%` }}
                              />
                           </div>
                           <Badge variant={stats.isPaused ? "destructive" : "secondary"} className="text-[9px] px-1.5 py-0 h-4 whitespace-nowrap tracking-tighter">
                              {stats.isPaused ? "PAUSED" : "ACTIVE"}
                           </Badge>
                        </div>
                      </TableCell>
                      {isDetailed && (
                        <TableCell className="text-right font-bold text-[10px] whitespace-nowrap uppercase text-muted-foreground">
                          Ksh {(b as any)[`q${stats.currentQ}Allocation`].toLocaleString()}
                        </TableCell>
                      )}
                      <TableCell className="text-right">
                        <div className="flex flex-col items-end">
                          <span className={cn(
                            "font-black tracking-tighter whitespace-nowrap",
                            isDetailed ? "text-xs" : "text-sm text-primary"
                          )}>
                            Ksh {stats.remainingInQuarter.toLocaleString()}
                          </span>
                        </div>
                      </TableCell>
                      {isDetailed && (
                        <TableCell className="text-right text-muted-foreground text-[10px] font-bold whitespace-nowrap tracking-tighter">
                          Ksh {stats.totalAllocation.toLocaleString()}
                        </TableCell>
                      )}
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 md:opacity-0 group-hover:opacity-100 transition-opacity"><MoreVertical className="w-4 h-4" /></Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => {setEditingBudget(b); setIsDialogOpen(true);}} className="text-xs font-bold">
                              <Pencil className="w-4 h-4 mr-2" /> Edit Plan
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDelete(b.id)} className="text-destructive text-xs font-bold">
                              <Trash2 className="w-4 h-4 mr-2" /> Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
