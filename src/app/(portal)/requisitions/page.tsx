
"use client";

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, Filter, MoreVertical, Pencil, Trash2, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { Input } from '@/components/ui/input';
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useStore } from '@/lib/store';
import { useUserStore } from '@/lib/user-store';
import { PurchaseRequisition, getBudgetStats } from '@/lib/types';
import { RoleGuard } from '@/components/auth/RoleGuard';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const requisitionSchema = z.object({
  itemDescription: z.string().min(3, "Description must be at least 3 characters"),
  quantity: z.coerce.number().min(1, "Quantity must be at least 1"),
  estimatedCost: z.coerce.number().min(0.01, "Cost must be greater than 0"),
  budgetLine: z.string().min(1, "Please select a budget"),
});

type RequisitionFormValues = z.infer<typeof requisitionSchema>;

export default function RequisitionsPage() {
  const { prs, budgets, addPR, updatePR, deletePR, updatePRStatus } = useStore();
  const { currentUser } = useUserStore();
  const [search, setSearch] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPr, setEditingPr] = useState<PurchaseRequisition | null>(null);
  const [mounted, setMounted] = useState(false);

  const form = useForm<RequisitionFormValues>({
    resolver: zodResolver(requisitionSchema),
    defaultValues: {
      itemDescription: '',
      quantity: 1,
      estimatedCost: 0,
      budgetLine: '',
    },
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (editingPr) {
      form.reset({
        itemDescription: editingPr.itemDescription,
        quantity: editingPr.quantity,
        estimatedCost: editingPr.estimatedCost,
        budgetLine: editingPr.budgetLine,
      });
    } else {
      form.reset({
        itemDescription: '',
        quantity: 1,
        estimatedCost: 0,
        budgetLine: '',
      });
    }
  }, [editingPr, form]);

  if (!mounted || !currentUser) return null;

  const filteredPrs = prs.filter(pr => {
    const matchesSearch = pr.itemDescription.toLowerCase().includes(search.toLowerCase()) || 
                          pr.refNumber.toLowerCase().includes(search.toLowerCase());
    
    if (currentUser.role === 'Staff') {
      return matchesSearch && pr.requesterName === currentUser.name;
    }
    
    return matchesSearch;
  });

  // Check if selected budget is paused
  const selectedBudgetName = form.watch('budgetLine');
  const selectedBudget = budgets.find(b => b.name === selectedBudgetName);
  const budgetStats = selectedBudget ? getBudgetStats(selectedBudget) : null;
  const isBudgetPaused = budgetStats?.isPaused;

  const onSubmit = (values: RequisitionFormValues) => {
    if (isBudgetPaused && !editingPr) return; // Block submission if paused

    if (editingPr) {
      updatePR(editingPr.id, values);
    } else {
      addPR({
        ...values,
        requesterName: currentUser.name,
        status: 'Pending Manager',
      });
    }
    setIsDialogOpen(false);
    setEditingPr(null);
  };

  const handleEdit = (pr: PurchaseRequisition) => {
    setEditingPr(pr);
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this requisition?')) {
      deletePR(id);
    }
  };

  const handleApprove = (id: string) => {
    const pr = prs.find(p => p.id === id);
    const budget = budgets.find(b => b.name === pr?.budgetLine);
    if (budget && getBudgetStats(budget).isPaused) {
      alert("Cannot approve: This budget is currently exhausted for the quarter.");
      return;
    }
    updatePRStatus(id, 'Approved');
  };

  const handleReject = (id: string) => {
    const reason = prompt('Please enter rejection reason:');
    if (reason) {
      updatePRStatus(id, 'Rejected');
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-headline font-bold text-primary">Purchase Requisitions</h2>
          <p className="text-muted-foreground">Manage and track internal purchase requests.</p>
        </div>
        
        <RoleGuard permission="create_requisitions">
          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) setEditingPr(null);
          }}>
            <DialogTrigger asChild>
              <Button className="bg-primary" onClick={() => setEditingPr(null)}>
                <Plus className="w-4 h-4 mr-2" />
                New Requisition
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>{editingPr ? 'Edit Requisition' : 'Submit New PR'}</DialogTitle>
                <DialogDescription>
                  Procurements are subject to quarterly budget availability.
                </DialogDescription>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
                  {isBudgetPaused && (
                    <Alert variant="destructive" className="bg-red-50">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertTitle>Budget Exhausted</AlertTitle>
                      <AlertDescription>
                        The selected budget ({selectedBudgetName}) has exhausted its allocation for the current quarter. Submissions are paused.
                      </AlertDescription>
                    </Alert>
                  )}
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                      <FormField
                        control={form.control}
                        name="itemDescription"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Item Description</FormLabel>
                            <FormControl>
                              <Input placeholder="e.g. 10x Office Keyboards" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <FormField
                      control={form.control}
                      name="quantity"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Quantity</FormLabel>
                          <FormControl>
                            <Input type="number" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="estimatedCost"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Estimated Unit Cost (Ksh)</FormLabel>
                          <FormControl>
                            <Input type="number" step="0.01" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="col-span-2">
                      <FormField
                        control={form.control}
                        name="budgetLine"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Budget</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select budget" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {budgets.map(b => (
                                  <SelectItem key={b.id} value={b.name}>{b.name}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                  <DialogFooter className="pt-4">
                    <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                    <Button type="submit" disabled={isBudgetPaused && !editingPr}>
                      {editingPr ? 'Update Requisition' : 'Submit for Approval'}
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </RoleGuard>
      </div>

      <div className="flex items-center gap-4 bg-white p-4 rounded-lg border border-border">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            placeholder="Search by description or REF#" 
            className="pl-9" 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Button variant="outline" size="icon">
          <Filter className="w-4 h-4" />
        </Button>
      </div>

      <div className="bg-white rounded-lg border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>REF Number</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Requested By</TableHead>
              <TableHead>Budget</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Est. Total</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredPrs.length > 0 ? (
              filteredPrs.map((pr) => {
                const budget = budgets.find(b => b.name === pr.budgetLine);
                const isPaused = budget ? getBudgetStats(budget).isPaused : false;
                
                return (
                  <TableRow key={pr.id}>
                    <TableCell className="font-medium">{pr.refNumber}</TableCell>
                    <TableCell>{pr.itemDescription}</TableCell>
                    <TableCell>{pr.requesterName}</TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="text-xs">{pr.budgetLine}</span>
                        {isPaused && <span className="text-[9px] text-destructive font-bold uppercase">Budget Paused</span>}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={
                        pr.status === 'Approved' ? 'secondary' : 
                        pr.status === 'Rejected' ? 'destructive' : 'outline'
                      }>
                        {pr.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-semibold">Ksh {(pr.estimatedCost * pr.quantity).toLocaleString()}</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <RoleGuard permission="approve_requisitions">
                            {pr.status === 'Pending Manager' && (
                              <>
                                <DropdownMenuItem onClick={() => handleApprove(pr.id)} className="text-green-600">
                                  <CheckCircle className="w-4 h-4 mr-2" />
                                  Approve
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleReject(pr.id)} className="text-red-600">
                                  <XCircle className="w-4 h-4 mr-2" />
                                  Reject
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                              </>
                            )}
                          </RoleGuard>

                          <RoleGuard allowedRoles={['Admin', 'Staff']}>
                            {(pr.status === 'Draft' || currentUser.role === 'Admin') && (
                               <DropdownMenuItem onClick={() => handleEdit(pr)}>
                                <Pencil className="w-4 h-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                            )}
                          </RoleGuard>

                          <RoleGuard allowedRoles={['Admin']}>
                            <DropdownMenuItem onClick={() => handleDelete(pr.id)} className="text-destructive focus:text-destructive">
                              <Trash2 className="w-4 h-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </RoleGuard>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                  No requisitions found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
