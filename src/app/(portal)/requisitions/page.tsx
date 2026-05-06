"use client";

import { useState, useEffect, Suspense } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/button';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/table';
import { Card } from '@/card';
import { Badge } from '@/badge';
import { Plus, Search, Filter, MoreVertical, Pencil, Trash2, CheckCircle, XCircle, AlertTriangle, PlusCircle, Trash } from 'lucide-react';
import { Input } from '@/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogDescription
} from "@/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/dropdown-menu";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/select';
import { useStore } from '@/lib/store';
import { useUserStore } from '@/lib/user-store';
import { PurchaseRequisition, getBudgetStats, calculatePRTotal } from '@/lib/types';
import { RoleGuard } from '@/components/auth/RoleGuard';
import { Alert, AlertDescription, AlertTitle } from '@/alert';
import { useSearchParams, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';

const requisitionSchema = z.object({
  budgetLine: z.string().min(1, "Please select a budget"),
  items: z.array(z.object({
    description: z.string().min(3, "Description required"),
    quantity: z.coerce.number().min(1, "Qty >= 1"),
    estimatedUnitPrice: z.coerce.number().min(0.01, "Cost required"),
  })).min(1, "At least one item is required"),
});

type RequisitionFormValues = z.infer<typeof requisitionSchema>;

function RequisitionsContent() {
  const { prs, budgets, addPR, updatePR, deletePR, updatePRStatus, selectedYear } = useStore();
  const { currentUser, viewPreference } = useUserStore();
  const [search, setSearch] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPr, setEditingPr] = useState<PurchaseRequisition | null>(null);
  const [prToDelete, setPrToDelete] = useState<PurchaseRequisition | null>(null);
  const [mounted, setMounted] = useState(false);

  const isDetailed = viewPreference === 'detailed';
  const searchParams = useSearchParams();
  const router = useRouter();

  const form = useForm<RequisitionFormValues>({
    resolver: zodResolver(requisitionSchema),
    defaultValues: {
      budgetLine: '',
      items: [{ description: '', quantity: 1, estimatedUnitPrice: 0 }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items",
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted) {
      const prId = searchParams.get('id');
      if (prId) {
        const foundPr = prs.find(p => p.id === prId);
        if (foundPr) {
          setEditingPr(foundPr);
          setIsDialogOpen(true);
        }
      }
    }
  }, [mounted, searchParams, prs]);

  useEffect(() => {
    if (editingPr) {
      form.reset({
        budgetLine: editingPr.budgetLine,
        items: editingPr.items || [{ description: '', quantity: 1, estimatedUnitPrice: 0 }],
      });
    } else {
      form.reset({
        budgetLine: '',
        items: [{ description: '', quantity: 1, estimatedUnitPrice: 0 }],
      });
    }
  }, [editingPr, form]);

  if (!mounted || !currentUser) return null;

  const filteredPrs = prs.filter(pr => {
    const isCurrentYear = pr.fiscalYear === selectedYear;
    const searchLower = search.toLowerCase();
    const items = pr.items || [];
    const matchesSearch = items.some(item => item.description?.toLowerCase().includes(searchLower)) || 
                          pr.refNumber?.toLowerCase().includes(searchLower);
    
    if (currentUser.role === 'Staff') {
      return isCurrentYear && matchesSearch && pr.requesterName === currentUser.name;
    }
    
    return isCurrentYear && matchesSearch;
  });

  const selectedBudgetName = form.watch('budgetLine');
  const selectedBudget = budgets.find(b => b.name === selectedBudgetName && b.fiscalYear === selectedYear);
  const budgetStats = selectedBudget ? getBudgetStats(selectedBudget) : null;
  const isBudgetPaused = budgetStats?.isPaused;

  const formItems = form.watch('items') || [];
  const currentTotal = formItems.reduce((acc, item) => acc + ((item.quantity || 0) * (item.estimatedUnitPrice || 0)), 0);

  const onSubmit = (values: RequisitionFormValues) => {
    if (isBudgetPaused && !editingPr) return;

    if (editingPr) {
      updatePR(editingPr.id, {
        budgetLine: values.budgetLine,
        items: values.items.map((item, idx) => ({ ...item, id: editingPr.items?.[idx]?.id || `item-${Math.random()}` }))
      });
    } else {
      addPR({
        budgetLine: values.budgetLine,
        items: values.items.map(item => ({ ...item, id: `item-${Math.random()}` })),
        requesterName: currentUser.name,
        status: 'Pending Manager',
      });
    }
    handleCloseDialog();
  };

  const handleEdit = (pr: PurchaseRequisition) => {
    setEditingPr(pr);
    setIsDialogOpen(true);
  };

  const confirmDelete = () => {
    if (prToDelete) {
      deletePR(prToDelete.id);
      setPrToDelete(null);
    }
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingPr(null);
    if (searchParams.get('id')) {
      router.replace('/requisitions');
    }
  };

  return (
    <div className="space-y-6 md:space-y-8 animate-in fade-in duration-500 pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <h2 className={cn(
            "font-headline font-bold text-primary tracking-tighter leading-tight",
            isDetailed ? "text-2xl md:text-3xl" : "text-3xl md:text-4xl"
          )}>
            Purchase Requisitions
          </h2>
          <p className="text-sm text-muted-foreground font-medium">Requisitions for FY {selectedYear}.</p>
        </div>
        
        <RoleGuard permission="create_requisitions">
          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            if (!open) handleCloseDialog();
            else setIsDialogOpen(true);
          }}>
            <DialogTrigger asChild>
              <Button className="w-full md:w-auto bg-primary shadow-sm font-bold uppercase text-xs h-10" onClick={() => setEditingPr(null)}>
                <Plus className="w-4 h-4 mr-2" />
                New Requisition
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl w-[95vw] max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-xl md:text-2xl font-black">{editingPr ? 'Review Requisition' : 'Draft New Requisition'}</DialogTitle>
                <DialogDescription className="text-xs">
                  FY {selectedYear} procurement draft. Total cost is subject to quarterly budget limits.
                </DialogDescription>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 py-4">
                  <div className="p-4 bg-muted/30 rounded-lg border border-border/50 space-y-4">
                    <FormField
                      control={form.control}
                      name="budgetLine"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-[10px] uppercase font-bold text-muted-foreground">Target Budget Line (FY {selectedYear})</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger className="bg-background">
                                <SelectValue placeholder="Select budget" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {budgets.filter(b => b.fiscalYear === selectedYear).map(b => (
                                <SelectItem key={b.id} value={b.name}>
                                  {b.name} ({b.department})
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {isBudgetPaused && (
                      <Alert variant="destructive" className="bg-destructive/10 border-destructive/20">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertTitle className="text-[10px] font-bold uppercase">Budget Cap Reached</AlertTitle>
                        <AlertDescription className="text-[10px]">
                          This budget line has exhausted its allocation for this quarter.
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Line Items</h3>
                      <Button type="button" variant="outline" size="sm" onClick={() => append({ description: '', quantity: 1, estimatedUnitPrice: 0 })} className="h-8 text-[10px] font-bold uppercase">
                        <PlusCircle className="w-3.5 h-3.5 mr-1.5" />
                        Add Item
                      </Button>
                    </div>
                    
                    <div className="space-y-3">
                      {fields.map((field, index) => (
                        <div key={field.id} className="grid grid-cols-1 md:grid-cols-12 gap-3 items-start bg-muted/10 p-3 rounded-md border border-border/40 group">
                          <div className="md:col-span-6">
                            <FormField
                              control={form.control}
                              name={`items.${index}.description`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="md:hidden text-[10px] font-bold uppercase text-muted-foreground">Description</FormLabel>
                                  <FormControl><Input placeholder="Item Description" {...field} className="h-9 text-xs" /></FormControl>
                                  <FormMessage className="text-[10px]" />
                                </FormItem>
                              )}
                            />
                          </div>
                          <div className="md:col-span-2">
                            <FormField
                              control={form.control}
                              name={`items.${index}.quantity`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="md:hidden text-[10px] font-bold uppercase text-muted-foreground">Qty</FormLabel>
                                  <FormControl><Input type="number" {...field} className="h-9 text-xs" placeholder="Qty" /></FormControl>
                                  <FormMessage className="text-[10px]" />
                                </FormItem>
                              )}
                            />
                          </div>
                          <div className="md:col-span-3">
                            <FormField
                              control={form.control}
                              name={`items.${index}.estimatedUnitPrice`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="md:hidden text-[10px] font-bold uppercase text-muted-foreground">Est. Unit Price</FormLabel>
                                  <FormControl><Input type="number" step="0.01" {...field} className="h-9 text-xs" placeholder="Unit Price" /></FormControl>
                                  <FormMessage className="text-[10px]" />
                                </FormItem>
                              )}
                            />
                          </div>
                          <div className="md:col-span-1 pt-1.5 flex justify-end">
                            {fields.length > 1 && (
                              <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)} className="h-8 w-8 text-destructive md:opacity-0 group-hover:opacity-100 transition-opacity">
                                <Trash className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex flex-col gap-4 border-t border-border/50 pt-6">
                    <div className="flex justify-between items-center px-2">
                      <span className="text-[10px] uppercase font-bold text-muted-foreground">Cumulative Estimate</span>
                      <span className="text-xl font-black text-primary tracking-tighter">Ksh {currentTotal.toLocaleString()}</span>
                    </div>
                    <DialogFooter className="gap-2 flex-col sm:flex-row">
                      <Button type="button" variant="outline" onClick={handleCloseDialog} className="w-full sm:w-auto text-xs font-bold uppercase">Cancel</Button>
                      <Button type="submit" disabled={isBudgetPaused && !editingPr} className="w-full sm:w-auto bg-primary text-xs font-bold uppercase">
                        {editingPr ? 'Save Revisions' : 'Launch for Approval'}
                      </Button>
                    </DialogFooter>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </RoleGuard>
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-4 bg-card p-4 rounded-xl border border-border shadow-sm">
        <div className="relative w-full flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            placeholder="Search current period requests..." 
            className="w-full pl-9 bg-muted/30 border-none shadow-none focus-visible:ring-1 h-10 text-xs" 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <Card className="border-border shadow-none overflow-hidden bg-card">
        <div className="overflow-x-auto w-full">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30 border-none">
                {isDetailed && <TableHead className="font-bold uppercase text-[10px] whitespace-nowrap">Reference</TableHead>}
                <TableHead className="font-bold uppercase text-[10px] min-w-[200px]">Description Summary</TableHead>
                {isDetailed && <TableHead className="font-bold uppercase text-[10px] whitespace-nowrap">Originator</TableHead>}
                <TableHead className="font-bold uppercase text-[10px] whitespace-nowrap">Budget Line</TableHead>
                <TableHead className="font-bold uppercase text-[10px] whitespace-nowrap">Progress</TableHead>
                <TableHead className="text-right font-bold uppercase text-[10px] whitespace-nowrap">Net Total</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPrs.length > 0 ? (
                filteredPrs.map((pr) => {
                  const budget = budgets.find(b => b.name === pr.budgetLine && b.fiscalYear === pr.fiscalYear);
                  const isPaused = budget ? getBudgetStats(budget).isPaused : false;
                  const total = calculatePRTotal(pr);
                  const firstItem = pr.items?.[0]?.description || 'Untitled Request';
                  
                  return (
                    <TableRow key={pr.id} className="group hover:bg-muted/5">
                      {isDetailed && <TableCell className="font-black text-primary text-xs whitespace-nowrap">{pr.refNumber}</TableCell>}
                      <TableCell>
                        <div className="flex flex-col min-w-0">
                          <span className={cn(
                            "truncate",
                            isDetailed ? "text-xs font-bold" : "text-sm font-bold text-primary"
                          )}>
                            {firstItem}
                          </span>
                          {(pr.items?.length || 0) > 1 && (
                            <span className="text-[10px] text-muted-foreground italic truncate">+ {pr.items.length - 1} more line items</span>
                          )}
                        </div>
                      </TableCell>
                      {isDetailed && <TableCell className="text-xs whitespace-nowrap">{pr.requesterName}</TableCell>}
                      <TableCell>
                        <div className="flex flex-col min-w-0">
                          <span className="text-xs font-semibold truncate">{pr.budgetLine}</span>
                          {isPaused && <Badge variant="destructive" className="text-[8px] h-3.5 px-1 py-0 w-fit">PAUSED</Badge>}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={
                          pr.status === 'Approved' ? 'secondary' : 
                          pr.status === 'Rejected' ? 'destructive' : 'outline'
                        } className="text-[9px] uppercase tracking-tighter whitespace-nowrap">
                          {pr.status}
                        </Badge>
                      </TableCell>
                      <TableCell className={cn(
                        "text-right font-black tracking-tighter whitespace-nowrap",
                        isDetailed ? "text-xs" : "text-base text-primary"
                      )}>
                        Ksh {total.toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 md:opacity-0 group-hover:opacity-100 transition-opacity">
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <RoleGuard permission="approve_requisitions">
                              {pr.status === 'Pending Manager' && (
                                <>
                                  <DropdownMenuItem onClick={() => updatePRStatus(pr.id, 'Approved')} className="text-green-600 text-xs font-bold">
                                    <CheckCircle className="w-4 h-4 mr-2" />
                                    Authorize
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => updatePRStatus(pr.id, 'Rejected')} className="text-red-600 text-xs font-bold">
                                    <XCircle className="w-4 h-4 mr-2" />
                                    Reject
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                </>
                              )}
                            </RoleGuard>

                            <RoleGuard allowedRoles={['Admin', 'Staff']}>
                              {(pr.status === 'Draft' || currentUser.role === 'Admin' || pr.requesterName === currentUser.name) && (
                                 <DropdownMenuItem onClick={() => handleEdit(pr)} className="text-xs">
                                  <Pencil className="w-4 h-4 mr-2" />
                                  Review
                                </DropdownMenuItem>
                              )}
                            </RoleGuard>

                            <RoleGuard allowedRoles={['Admin']}>
                              <DropdownMenuItem onClick={() => setPrToDelete(pr)} className="text-destructive focus:text-destructive text-xs">
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
                  <TableCell colSpan={isDetailed ? 7 : 5} className="h-48 text-center text-muted-foreground">
                    <div className="flex flex-col items-center justify-center space-y-3 opacity-50">
                      <div className="p-4 bg-muted rounded-full">
                        <Search className="w-8 h-8" />
                      </div>
                      <p className="text-sm font-medium">No requisitions for FY {selectedYear}.</p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      <AlertDialog open={!!prToDelete} onOpenChange={(open) => !open && setPrToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-destructive">Purge Requisition?</AlertDialogTitle>
            <AlertDialogDescription className="text-xs">
              This will permanently delete the requisition **{prToDelete?.refNumber}**. 
              Associated purchase orders and verification receipts will also be removed. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="text-xs font-bold uppercase">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-white hover:bg-destructive/90 text-xs font-bold uppercase">
              Confirm Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default function RequisitionsPage() {
  return (
    <Suspense fallback={<div className="p-10 text-center font-bold">Syncing Requisitions...</div>}>
      <RequisitionsContent />
    </Suspense>
  );
}
