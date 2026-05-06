
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
import { Wallet, PieChart, TrendingDown, ArrowUpRight, Lock, Plus, Pencil, Trash2, MoreVertical } from 'lucide-react';
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
          <h2 className="text-2xl font-headline font-bold text-primary">Budget Management</h2>
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

      {/* Bento Layout for Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Total Allocation" 
          value={`Ksh ${totalAllocation.toLocaleString()}`} 
          icon={Wallet} 
        />
        <StatCard 
          title="Total Spent" 
          value={`Ksh ${totalSpent.toLocaleString()}`} 
          icon={TrendingDown} 
        />
        <StatCard 
          title="Committed (PO/PR)" 
          value={`Ksh ${totalCommitted.toLocaleString()}`} 
          icon={ArrowUpRight} 
        />
        <StatCard 
          title="Remaining" 
          value={`Ksh ${remainingTotal.toLocaleString()}`} 
          icon={PieChart} 
        />
      </div>

      <Card className="shadow-none border border-border overflow-hidden">
        <CardHeader>
          <CardTitle className="text-lg">Budget Lines Overview</CardTitle>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          <Table className="min-w-[800px]">
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead>Budget Category</TableHead>
                <TableHead className="text-right">Allocation (Ksh)</TableHead>
                <TableHead className="text-right">Spent (Ksh)</TableHead>
                <TableHead className="text-right">Committed (Ksh)</TableHead>
                <TableHead className="w-[200px]">Utilization</TableHead>
                <TableHead className="text-right">Remaining (Ksh)</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {budgetLines.map((bl) => {
                const totalUsed = bl.spent + bl.committed;
                const percentage = Math.min(100, (totalUsed / bl.allocation) * 100);
                const remaining = bl.allocation - totalUsed;
                
                return (
                  <TableRow key={bl.id}>
                    <TableCell className="font-semibold">{bl.name}</TableCell>
                    <TableCell className="text-right">{bl.allocation.toLocaleString()}</TableCell>
                    <TableCell className="text-right">{bl.spent.toLocaleString()}</TableCell>
                    <TableCell className="text-right">{bl.committed.toLocaleString()}</TableCell>
                    <TableCell>
                      <div className="space-y-1.5">
                        <div className="flex justify-between text-[10px] text-muted-foreground uppercase font-bold">
                          <span>{percentage.toFixed(1)}%</span>
                          <span>{totalUsed.toLocaleString()} Used</span>
                        </div>
                        <Progress value={percentage} className="h-1.5" />
                      </div>
                    </TableCell>
                    <TableCell className={`text-right font-bold ${remaining < 0 ? 'text-destructive' : 'text-primary'}`}>
                      {remaining.toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <RoleGuard allowedRoles={['Admin', 'Finance']}>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
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
