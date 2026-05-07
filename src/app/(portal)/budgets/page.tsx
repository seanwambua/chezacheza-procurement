"use client";

import { useState, useEffect } from 'react';
import { useStore } from '@/lib/store';
import { useUserStore } from '@/lib/user-store';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent } from '@/components/ui/card';
import { StatCard } from '@/components/dashboard/StatCard';
import { PieChart, TrendingUp, Plus, Pencil, Trash2, MoreVertical, PauseCircle, PlayCircle, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
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
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { Input } from '@/components/ui/input';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { RoleGuard } from '@/components/auth/RoleGuard';
import { Budget, getBudgetStats } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';

const budgetSchema = z.object({
  name: z.string().min(2, "Name required"),
  department: z.string().min(1, "Department required"),
  fiscalYear: z.string().min(4, "Year required"),
  description: z.string().max(200),
  q1Allocation: z.coerce.number().min(0),
  q2Allocation: z.coerce.number().min(0),
  q3Allocation: z.coerce.number().min(0),
  q4Allocation: z.coerce.number().min(0),
});

type BudgetFormValues = z.infer<typeof budgetSchema>;

export default function BudgetsPage() {
  const { budgets, addBudget, updateBudget, deleteBudget, selectedYear } = useStore();
  const { currentUser, viewPreference } = useUserStore();
  const { toast } = useToast();
  const [mounted, setMounted] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null);
  const [budgetToDelete, setBudgetToDelete] = useState<Budget | null>(null);

  const isDetailed = viewPreference === 'detailed';

  const form = useForm<BudgetFormValues>({
    resolver: zodResolver(budgetSchema),
    defaultValues: {
      name: '',
      department: '',
      fiscalYear: selectedYear,
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
      form.reset(editingBudget);
    } else {
      form.reset({
        name: '',
        department: '',
        fiscalYear: selectedYear,
        description: '',
        q1Allocation: 0,
        q2Allocation: 0,
        q3Allocation: 0,
        q4Allocation: 0,
      });
    }
  }, [editingBudget, form, isDialogOpen, selectedYear]);

  if (!mounted) return null;

  if (currentUser && !['Admin', 'Finance', 'Manager'].includes(currentUser.role)) {
    return <div className="p-10 text-center font-bold">Access Restricted</div>;
  }

  const filteredBudgets = budgets.filter(b => b.fiscalYear === selectedYear);
  const budgetMetrics = filteredBudgets.map(b => getBudgetStats(b));
  const totalAllocation = budgetMetrics.reduce((acc, m) => acc + m.totalAllocation, 0);
  const totalUsed = budgetMetrics.reduce((acc, m) => acc + m.totalUsed, 0);
  const overallUtilization = totalAllocation > 0 ? Math.round((totalUsed / totalAllocation) * 100) : 0;

  const onSubmit = (values: BudgetFormValues) => {
    if (editingBudget) updateBudget(editingBudget.id, values);
    else addBudget(values);
    setIsDialogOpen(false);
    setEditingBudget(null);
  };

  const confirmDeleteBudget = () => {
    if (budgetToDelete) {
      deleteBudget(budgetToDelete.id);
      toast({
        variant: "destructive",
        title: "Budget Purged",
        description: `The budget '${budgetToDelete.name}' and all associated commitments have been removed.`,
      });
      setBudgetToDelete(null);
    }
  };

  return (
    <div className="space-y-6 md:space-y-8 animate-in fade-in duration-500 pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="min-w-0 flex-1">
          <h2 className="text-3xl md:text-4xl font-headline font-bold text-primary tracking-tighter">Budgets</h2>
          <p className="text-muted-foreground text-sm font-medium">Managing period FY {selectedYear}.</p>
        </div>
        
        <RoleGuard allowedRoles={['Admin', 'Finance']}>
          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) setEditingBudget(null);
          }}>
            <DialogTrigger asChild>
              <Button className="font-bold uppercase text-xs h-10 shadow-sm"><Plus className="w-4 h-4 mr-2" /> Plan Budget</Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl w-[95vw]">
              <DialogHeader><DialogTitle className="text-xl font-black">{editingBudget ? 'Edit Plan' : `Establish FY ${selectedYear} Plan`}</DialogTitle></DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField control={form.control} name="name" render={({ field }) => (
                      <FormItem><FormLabel className="text-[10px] font-bold">Name</FormLabel><FormControl><Input {...field} className="h-10 text-xs" /></FormControl></FormItem>
                    )} />
                    <FormField control={form.control} name="department" render={({ field }) => (
                      <FormItem><FormLabel className="text-[10px] font-bold">Dept</FormLabel><FormControl><Input {...field} className="h-10 text-xs" /></FormControl></FormItem>
                    )} />
                  </div>
                  <div className="grid grid-cols-4 gap-2 p-3 bg-muted/30 rounded-lg">
                    {['q1Allocation', 'q2Allocation', 'q3Allocation', 'q4Allocation'].map(q => (
                      <FormField key={q} control={form.control} name={q as any} render={({ field }) => (
                        <FormItem><FormLabel className="text-[9px] font-bold uppercase">{q.substring(0,2)}</FormLabel><FormControl><Input type="number" {...field} className="h-9 text-xs" /></FormControl></FormItem>
                      )} />
                    ))}
                  </div>
                  <DialogFooter className="gap-2">
                    <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)} className="text-xs font-bold uppercase">Cancel</Button>
                    <Button type="submit" className="text-xs font-bold uppercase">Authorize</Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </RoleGuard>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-2 border-primary/10 bg-gradient-to-br from-primary/5 to-transparent">
          <CardContent className="p-6 flex items-center gap-10">
            <div className="relative w-32 h-32 shrink-0">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                <circle className="text-muted/20 stroke-current" strokeWidth="8" fill="transparent" r="40" cx="50" cy="50" />
                <circle className="text-primary stroke-current" strokeWidth="8" strokeDasharray={`${overallUtilization * 2.512} 251.2`} strokeLinecap="round" fill="transparent" r="40" cx="50" cy="50" />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="font-black text-2xl">{overallUtilization}%</span>
                <span className="text-[8px] font-bold uppercase opacity-50">Used</span>
              </div>
            </div>
            <div>
              <p className="text-3xl font-black text-primary tracking-tighter">Ksh {totalAllocation.toLocaleString()}</p>
              <p className="text-[10px] font-bold uppercase opacity-50">FY {selectedYear} Consolidated Target</p>
            </div>
          </CardContent>
        </Card>
        <div className="grid gap-6">
          <StatCard title="Actual Spend" value={`Ksh ${totalUsed.toLocaleString()}`} icon={TrendingUp} />
          <StatCard title="Remaining Pool" value={`Ksh ${(totalAllocation - totalUsed).toLocaleString()}`} icon={PieChart} />
        </div>
      </div>

      <TooltipProvider delayDuration={100}>
        <Card className="border-border shadow-none overflow-hidden bg-card">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30">
                <TableHead className="font-bold uppercase text-[10px]">Budget</TableHead>
                <TableHead className="font-bold uppercase text-[10px]">Utilization</TableHead>
                <TableHead className="text-right font-bold uppercase text-[10px]">Remaining (Q)</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredBudgets.map((b) => {
                const stats = getBudgetStats(b);
                return (
                  <TableRow key={b.id} className="group hover:bg-muted/5">
                    <TableCell>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className={cn("flex flex-col", isDetailed && "cursor-help")}>
                            <span className="font-bold text-primary flex items-center gap-2">
                              {b.name} {stats.isPaused ? <PauseCircle className="w-3.5 h-3.5 text-destructive" /> : <PlayCircle className="w-3.5 h-3.5 text-accent" />}
                            </span>
                            <span className="text-[9px] uppercase font-bold opacity-50">{b.department}</span>
                          </div>
                        </TooltipTrigger>
                        {isDetailed && (
                          <TooltipContent className="max-w-[200px] text-[10px] space-y-1">
                            <p className="font-bold uppercase tracking-wider text-accent">Strategic Context</p>
                            <p className="font-medium">{b.description || 'No strategic description provided.'}</p>
                          </TooltipContent>
                        )}
                      </Tooltip>
                    </TableCell>
                    <TableCell>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className={cn("flex items-center gap-2", isDetailed && "cursor-help")}>
                            <div className="h-1.5 flex-1 bg-muted rounded-full overflow-hidden">
                              <div className={`h-full ${stats.isPaused ? 'bg-destructive' : 'bg-accent'}`} style={{ width: `${Math.min(100, stats.utilization)}%` }} />
                            </div>
                            <Badge variant={stats.isPaused ? "destructive" : "secondary"} className="text-[9px] h-4">
                              {stats.isPaused ? "PAUSED" : "ACTIVE"}
                            </Badge>
                          </div>
                        </TooltipTrigger>
                        {isDetailed && (
                          <TooltipContent className="text-[10px] space-y-2 p-3">
                            <p className="font-bold uppercase tracking-wider text-accent border-b pb-1">Allocation Breakdown</p>
                            <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                              <span>Q1:</span> <span className="font-bold text-right">Ksh {b.q1Allocation.toLocaleString()}</span>
                              <span>Q2:</span> <span className="font-bold text-right">Ksh {b.q2Allocation.toLocaleString()}</span>
                              <span>Q3:</span> <span className="font-bold text-right">Ksh {b.q3Allocation.toLocaleString()}</span>
                              <span>Q4:</span> <span className="font-bold text-right">Ksh {b.q4Allocation.toLocaleString()}</span>
                            </div>
                          </TooltipContent>
                        )}
                      </Tooltip>
                    </TableCell>
                    <TableCell className="text-right font-black text-xs">
                      Ksh {stats.remainingInQuarter.toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100"><MoreVertical className="w-4 h-4" /></Button></DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => {setEditingBudget(b); setIsDialogOpen(true);}} className="text-xs font-bold"><Pencil className="w-4 h-4 mr-2" /> Edit</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setBudgetToDelete(b)} className="text-destructive text-xs font-bold"><Trash2 className="w-4 h-4 mr-2" /> Purge</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Card>
      </TooltipProvider>

      <AlertDialog open={!!budgetToDelete} onOpenChange={(open) => !open && setBudgetToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-destructive flex items-center gap-2">
              <AlertCircle className="w-5 h-5" />
              Purge Budget?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs">
              This will permanently delete the budget **{budgetToDelete?.name}**. 
              **Cascading Impact:** All associated requisitions, purchase orders, and receipts will also be removed from the system. 
              This action is irreversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="text-xs font-bold uppercase">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteBudget} className="bg-destructive hover:bg-destructive/90 text-white text-xs font-bold uppercase">
              Purge Budget
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
