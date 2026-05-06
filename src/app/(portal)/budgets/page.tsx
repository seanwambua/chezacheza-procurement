
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
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatCard } from '@/components/dashboard/StatCard';
import { Wallet, PieChart, TrendingDown, ArrowUpRight, Lock, Plus, Pencil, Trash2, MoreVertical, Landmark } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { RoleGuard } from '@/components/auth/RoleGuard';
import { BudgetLine } from '@/lib/types';

const budgetSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  allocation: z.coerce.number().min(1, "Allocation must be at least 1"),
});

type BudgetFormValues = z.infer<typeof budgetSchema>;

export default function BudgetsPage() {
  const { budgetLines, addBudgetLine, updateBudgetLine, deleteBudgetLine } = useStore();
  const { currentUser } = useUserStore();
  const [mounted, setMounted] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState<BudgetLine | null>(null);

  const form = useForm<BudgetFormValues>({
    resolver: zodResolver(budgetSchema),
    defaultValues: {
      name: '',
      allocation: 0,
    },
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (editingBudget) {
      form.reset({
        name: editingBudget.name,
        allocation: editingBudget.allocation,
      });
    } else {
      form.reset({
        name: '',
        allocation: 0,
      });
    }
  }, [editingBudget, form]);

  if (!mounted) return null;

  // Final Safety Check
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

  const totalAllocation = budgetLines.reduce((acc, bl) => acc + bl.allocation, 0);
  const totalSpent = budgetLines.reduce((acc, bl) => acc + bl.spent, 0);
  const totalCommitted = budgetLines.reduce((acc, bl) => acc + bl.committed, 0);
  const remainingTotal = totalAllocation - totalSpent - totalCommitted;
  const utilizationPercentage = totalAllocation > 0 ? Math.round(((totalSpent + totalCommitted) / totalAllocation) * 100) : 0;

  const onSubmit = (values: BudgetFormValues) => {
    if (editingBudget) {
      updateBudgetLine(editingBudget.id, values);
    } else {
      addBudgetLine(values);
    }
    setIsDialogOpen(false);
    setEditingBudget(null);
  };

  const handleEdit = (bl: BudgetLine) => {
    setEditingBudget(bl);
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this budget line? This will affect historical tracking.')) {
      deleteBudgetLine(id);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-headline font-bold text-primary">Budget Management</h2>
          <p className="text-muted-foreground">Monitor departmental allocations and expenditure tracking.</p>
        </div>
        
        <RoleGuard allowedRoles={['Admin', 'Finance']}>
          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) setEditingBudget(null);
          }}>
            <DialogTrigger asChild>
              <Button className="bg-primary hover:bg-primary/90">
                <Plus className="w-4 h-4 mr-2" />
                New Budget Line
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingBudget ? 'Edit Budget' : 'Add Budget Line'}</DialogTitle>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Category Name</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. Office Supplies" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="allocation"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Total Allocation (Ksh)</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="100000" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <DialogFooter className="pt-4">
                    <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                    <Button type="submit">{editingBudget ? 'Update' : 'Create'}</Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </RoleGuard>
      </div>

      {/* Redesigned Bento Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 border-primary/10 bg-gradient-to-br from-primary/5 via-transparent to-transparent shadow-sm border overflow-hidden relative group">
          <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
            <Landmark className="w-32 h-32" />
          </div>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Departmental Health Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row items-center gap-10">
              <div className="relative w-40 h-40 shrink-0">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                  <circle className="text-muted/20 stroke-current" strokeWidth="8" fill="transparent" r="40" cx="50" cy="50" />
                  <circle
                    className="text-accent stroke-current"
                    strokeWidth="8"
                    strokeDasharray={`${utilizationPercentage * 2.512} 251.2`}
                    strokeLinecap="round"
                    fill="transparent"
                    r="40"
                    cx="50"
                    cy="50"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-3xl font-black text-primary">{utilizationPercentage}%</span>
                  <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-tighter">Utilization</span>
                </div>
              </div>
              <div className="flex-1 space-y-6 w-full">
                <div>
                  <p className="text-4xl font-black text-primary tracking-tight">Ksh {totalAllocation.toLocaleString()}</p>
                  <p className="text-sm text-muted-foreground font-medium">Total Departmental Allocation</p>
                </div>
                <div className="grid grid-cols-2 gap-8 pt-6 border-t border-border/50">
                  <div className="space-y-1">
                    <p className="text-lg font-bold text-primary">Ksh {remainingTotal.toLocaleString()}</p>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-green-500" />
                      <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">Available Funds</p>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <p className="text-lg font-bold text-accent">Ksh {totalCommitted.toLocaleString()}</p>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-accent" />
                      <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">Reserved (PO/PR)</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6 flex flex-col justify-between">
          <StatCard 
            title="Actual Expenditure" 
            value={`Ksh ${totalSpent.toLocaleString()}`} 
            icon={TrendingDown}
            description="Total funds disbursed to date"
          />
          <StatCard 
            title="Remaining Budget" 
            value={`Ksh ${remainingTotal.toLocaleString()}`} 
            icon={PieChart}
            description="Net liquid capital available"
          />
        </div>
      </div>

      <Card className="shadow-none border border-border overflow-hidden bg-white">
        <CardHeader className="flex flex-row items-center justify-between border-b border-border/50 py-4">
          <CardTitle className="text-lg font-headline">Budget Lines Analysis</CardTitle>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
             <div className="flex items-center gap-1"><div className="w-2 h-2 bg-primary rounded-full" /> Spent</div>
             <div className="flex items-center gap-1"><div className="w-2 h-2 bg-accent rounded-full" /> Committed</div>
          </div>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          <Table className="min-w-[900px]">
            <TableHeader>
              <TableRow className="bg-muted/30">
                <TableHead className="font-bold">Budget Category</TableHead>
                <TableHead className="text-right font-bold">Allocation (Ksh)</TableHead>
                <TableHead className="text-right font-bold">Spent (Ksh)</TableHead>
                <TableHead className="text-right font-bold">Committed (Ksh)</TableHead>
                <TableHead className="w-[220px] font-bold">Utilization</TableHead>
                <TableHead className="text-right font-bold">Remaining (Ksh)</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {budgetLines.map((bl) => {
                const totalUsed = bl.spent + bl.committed;
                const spentPercentage = (bl.spent / bl.allocation) * 100;
                const committedPercentage = (bl.committed / bl.allocation) * 100;
                const totalPercentage = Math.min(100, (totalUsed / bl.allocation) * 100);
                const remaining = bl.allocation - totalUsed;
                
                return (
                  <TableRow key={bl.id} className="hover:bg-muted/10 transition-colors">
                    <TableCell className="font-semibold text-primary">{bl.name}</TableCell>
                    <TableCell className="text-right font-medium">{bl.allocation.toLocaleString()}</TableCell>
                    <TableCell className="text-right text-muted-foreground">{bl.spent.toLocaleString()}</TableCell>
                    <TableCell className="text-right text-accent font-medium">{bl.committed.toLocaleString()}</TableCell>
                    <TableCell>
                      <div className="space-y-1.5 py-2">
                        <div className="flex justify-between text-[9px] uppercase font-black tracking-tighter">
                          <span className="text-primary">{totalPercentage.toFixed(0)}% Utilized</span>
                          <span className="text-muted-foreground">{totalUsed.toLocaleString()} Used</span>
                        </div>
                        <div className="relative h-2 w-full bg-muted rounded-full overflow-hidden flex">
                          <div 
                            className="h-full bg-primary transition-all duration-500" 
                            style={{ width: `${spentPercentage}%` }} 
                          />
                          <div 
                            className="h-full bg-accent transition-all duration-500" 
                            style={{ width: `${committedPercentage}%` }} 
                          />
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className={`text-right font-black ${remaining < 0 ? 'text-destructive' : 'text-primary'}`}>
                      {remaining.toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <RoleGuard allowedRoles={['Admin', 'Finance']}>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="hover:bg-muted">
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEdit(bl)}>
                              <Pencil className="w-4 h-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDelete(bl.id)} className="text-destructive focus:text-destructive">
                              <Trash2 className="w-4 h-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </RoleGuard>
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
