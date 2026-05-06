
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
  TrendingDown, 
  Lock, 
  Plus, 
  Pencil, 
  Trash2, 
  MoreVertical, 
  Landmark, 
  Info,
  CalendarDays,
  PauseCircle,
  PlayCircle,
  ArrowRight
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
  const { budgets, addBudget, updateBudget, deleteBudget } = useStore();
  const { currentUser } = useUserStore();
  const [mounted, setMounted] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null);

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
  }, [editingBudget, form]);

  if (!mounted) return null;

  if (currentUser && !['Admin', 'Finance', 'Manager'].includes(currentUser.role)) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center space-y-4">
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

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-headline font-bold text-primary">Budget & Quarterly Planning</h2>
          <p className="text-muted-foreground">Rolling quarterly allocations with automatic procurement pausing.</p>
        </div>
        
        <RoleGuard allowedRoles={['Admin', 'Finance']}>
          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) setEditingBudget(null);
          }}>
            <DialogTrigger asChild>
              <Button className="bg-primary">
                <Plus className="w-4 h-4 mr-2" />
                Plan Budget
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl">
              <DialogHeader>
                <DialogTitle>{editingBudget ? 'Update Budget Plan' : 'Establish New Budget Plan'}</DialogTitle>
                <DialogDescription>
                  Configure quarterly allocations. Unused funds roll over to the next quarter.
                </DialogDescription>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 py-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField control={form.control} name="name" render={({ field }) => (
                      <FormItem><FormLabel>Budget Name</FormLabel><FormControl><Input placeholder="IT Hardware" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={form.control} name="department" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Department</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger></FormControl>
                          <SelectContent>
                            {['IT', 'Operations', 'Marketing', 'Finance', 'Programs'].map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )} />
                  </div>

                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 p-4 bg-muted/30 rounded-lg border border-border/50">
                    <FormField control={form.control} name="q1Allocation" render={({ field }) => (
                      <FormItem><FormLabel className="text-[10px] uppercase">Q1 (Jan-Mar)</FormLabel><FormControl><Input type="number" {...field} /></FormControl></FormItem>
                    )} />
                    <FormField control={form.control} name="q2Allocation" render={({ field }) => (
                      <FormItem><FormLabel className="text-[10px] uppercase">Q2 (Apr-Jun)</FormLabel><FormControl><Input type="number" {...field} /></FormControl></FormItem>
                    )} />
                    <FormField control={form.control} name="q3Allocation" render={({ field }) => (
                      <FormItem><FormLabel className="text-[10px] uppercase">Q3 (Jul-Sep)</FormLabel><FormControl><Input type="number" {...field} /></FormControl></FormItem>
                    )} />
                    <FormField control={form.control} name="q4Allocation" render={({ field }) => (
                      <FormItem><FormLabel className="text-[10px] uppercase">Q4 (Oct-Dec)</FormLabel><FormControl><Input type="number" {...field} /></FormControl></FormItem>
                    )} />
                  </div>

                  <FormField control={form.control} name="description" render={({ field }) => (
                    <FormItem><FormLabel>Purpose</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem>
                  )} />

                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                    <Button type="submit">Authorize Budget</Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </RoleGuard>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-2 border-primary/10 bg-gradient-to-br from-primary/5 to-transparent relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
            <CalendarDays className="w-32 h-32" />
          </div>
          <CardHeader>
             <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Global Fiscal Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row items-center gap-10">
              <div className="relative w-36 h-36">
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
                  <span className="text-2xl font-black">{overallUtilization}%</span>
                  <span className="text-[8px] uppercase font-bold text-muted-foreground">Total Use</span>
                </div>
              </div>
              <div className="flex-1 space-y-4">
                <div>
                  <p className="text-3xl font-black text-primary tracking-tighter">Ksh {totalAllocation.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground font-medium uppercase tracking-tight">Consolidated Annual Pool</p>
                </div>
                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border/50">
                   <div>
                      <p className="text-sm font-bold text-destructive">{pausedBudgetsCount}</p>
                      <p className="text-[9px] uppercase font-bold text-muted-foreground">Paused Budgets</p>
                   </div>
                   <div>
                      <p className="text-sm font-bold text-accent">Q{new Date().getMonth() / 3 + 1 | 0 + 1}</p>
                      <p className="text-[9px] uppercase font-bold text-muted-foreground">Active Quarter</p>
                   </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        <div className="space-y-6">
          <StatCard title="Total Utilized" value={`Ksh ${totalUsed.toLocaleString()}`} icon={TrendingDown} />
          <StatCard title="Remaining" value={`Ksh ${(totalAllocation - totalUsed).toLocaleString()}`} icon={PieChart} />
        </div>
      </div>

      <Card className="border-none shadow-none bg-white overflow-hidden">
        <CardHeader className="border-b border-border/50 py-4">
          <CardTitle className="text-lg">Budget Analysis & Quarterly Health</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30">
                <TableHead>Budget</TableHead>
                <TableHead>Current Q Health</TableHead>
                <TableHead className="text-right">Q Allocation</TableHead>
                <TableHead className="text-right">Available in Q</TableHead>
                <TableHead className="text-right">Total Annual Pool</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {budgets.map((b) => {
                const stats = getBudgetStats(b);
                return (
                  <TableRow key={b.id} className="group hover:bg-muted/10">
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-bold text-primary flex items-center gap-2">
                          {b.name}
                          {stats.isPaused ? (
                             <TooltipProvider>
                               <Tooltip>
                                 <TooltipTrigger><PauseCircle className="w-3.5 h-3.5 text-destructive" /></TooltipTrigger>
                                 <TooltipContent className="bg-destructive text-white border-none">
                                   <p className="text-xs">Procurements Paused: Allocation exhausted for Q{stats.currentQ}.</p>
                                 </TooltipContent>
                               </Tooltip>
                             </TooltipProvider>
                          ) : (
                             <PlayCircle className="w-3.5 h-3.5 text-green-500" />
                          )}
                        </span>
                        <span className="text-[10px] text-muted-foreground uppercase">{b.department}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                         <div className="h-1.5 flex-1 bg-muted rounded-full overflow-hidden flex">
                            <div 
                              className={`h-full transition-all duration-500 ${stats.isPaused ? 'bg-destructive' : 'bg-accent'}`}
                              style={{ width: `${Math.min(100, (stats.totalUsed / stats.cumulativeAllocation) * 100)}%` }}
                            />
                         </div>
                         <Badge variant={stats.isPaused ? "destructive" : "secondary"} className="text-[9px] px-1.5 py-0">
                            {stats.isPaused ? "EXHAUSTED" : "HEALTHY"}
                         </Badge>
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      Ksh {(b as any)[`q${stats.currentQ}Allocation`].toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex flex-col items-end">
                        <span className={`font-black ${stats.isPaused ? 'text-destructive' : 'text-primary'}`}>
                          Ksh {stats.remainingInQuarter.toLocaleString()}
                        </span>
                        {stats.isPaused && (
                           <span className="text-[9px] text-muted-foreground uppercase flex items-center gap-1">
                             Forwarding to Q{stats.currentQ + 1} <ArrowRight className="w-2 h-2" />
                           </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground text-xs">
                      Ksh {stats.totalAllocation.toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon"><MoreVertical className="w-4 h-4" /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => {setEditingBudget(b); setIsDialogOpen(true);}}>
                            <Pencil className="w-4 h-4 mr-2" /> Edit Plan
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDelete(b.id)} className="text-destructive">
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
        </CardContent>
      </Card>
    </div>
  );
}
