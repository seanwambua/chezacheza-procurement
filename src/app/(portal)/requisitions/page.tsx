"use client";

import { useState, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
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
import { Plus, Search, Filter, MoreVertical, Pencil, Trash2, CheckCircle, XCircle, AlertTriangle, PlusCircle, Trash } from 'lucide-react';
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
import { PurchaseRequisition, getBudgetStats, calculatePRTotal } from '@/lib/types';
import { RoleGuard } from '@/components/auth/RoleGuard';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';

const requisitionSchema = z.object({
  budgetLine: z.string().min(1, "Please select a budget"),
  items: z.array(z.object({
    description: z.string().min(3, "Description required"),
    quantity: z.coerce.number().min(1, "Qty >= 1"),
    estimatedUnitPrice: z.coerce.number().min(0.01, "Cost required"),
  })).min(1, "At least one item is required"),
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
    if (editingPr) {
      form.reset({
        budgetLine: editingPr.budgetLine,
        items: editingPr.items,
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
    const searchLower = search.toLowerCase();
    const matchesSearch = pr.items.some(item => item.description.toLowerCase().includes(searchLower)) || 
                          pr.refNumber.toLowerCase().includes(searchLower);
    
    if (currentUser.role === 'Staff') {
      return matchesSearch && pr.requesterName === currentUser.name;
    }
    
    return matchesSearch;
  });

  const selectedBudgetName = form.watch('budgetLine');
  const selectedBudget = budgets.find(b => b.name === selectedBudgetName);
  const budgetStats = selectedBudget ? getBudgetStats(selectedBudget) : null;
  const isBudgetPaused = budgetStats?.isPaused;

  const formItems = form.watch('items');
  const currentTotal = formItems.reduce((acc, item) => acc + (item.quantity * item.estimatedUnitPrice), 0);

  const onSubmit = (values: RequisitionFormValues) => {
    if (isBudgetPaused && !editingPr) return;

    if (editingPr) {
      updatePR(editingPr.id, {
        budgetLine: values.budgetLine,
        items: values.items.map((item, idx) => ({ ...item, id: editingPr.items[idx]?.id || `item-${Math.random()}` }))
      });
    } else {
      addPR({
        budgetLine: values.budgetLine,
        items: values.items.map(item => ({ ...item, id: `item-${Math.random()}` })),
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

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-10">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-headline font-bold text-primary">Purchase Requisitions</h2>
          <p className="text-muted-foreground">Submit and track multi-item internal purchase requests.</p>
        </div>
        
        <RoleGuard permission="create_requisitions">
          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) setEditingPr(null);
          }}>
            <DialogTrigger asChild>
              <Button className="bg-primary shadow-sm" onClick={() => setEditingPr(null)}>
                <Plus className="w-4 h-4 mr-2" />
                New Requisition
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-2xl font-black">{editingPr ? 'Update Requisition' : 'Draft New Requisition'}</DialogTitle>
                <DialogDescription>
                  List all required items for this procurement. Total cost is subject to quarterly budget limits.
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
                          <FormLabel className="text-[10px] uppercase font-bold text-muted-foreground">Target Budget Line</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger className="bg-background">
                                <SelectValue placeholder="Select budget" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {budgets.map(b => (
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
                        <AlertTitle className="text-xs font-bold uppercase">Budget Cap Reached</AlertTitle>
                        <AlertDescription className="text-xs">
                          The selected budget line has exhausted its quarterly allocation. Submissions are temporarily paused.
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Line Items</h3>
                      <Button type="button" variant="outline" size="sm" onClick={() => append({ description: '', quantity: 1, estimatedUnitPrice: 0 })} className="h-8 text-[11px] font-bold uppercase">
                        <PlusCircle className="w-3.5 h-3.5 mr-1.5" />
                        Add Item
                      </Button>
                    </div>
                    
                    <div className="space-y-3">
                      {fields.map((field, index) => (
                        <div key={field.id} className="grid grid-cols-12 gap-3 items-start bg-muted/10 p-3 rounded-md border border-border/40 group">
                          <div className="col-span-6">
                            <FormField
                              control={form.control}
                              name={`items.${index}.description`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormControl><Input placeholder="Item Description" {...field} className="h-9 text-sm" /></FormControl>
                                  <FormMessage className="text-[10px]" />
                                </FormItem>
                              )}
                            />
                          </div>
                          <div className="col-span-2">
                            <FormField
                              control={form.control}
                              name={`items.${index}.quantity`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormControl><Input type="number" {...field} className="h-9 text-sm" placeholder="Qty" /></FormControl>
                                  <FormMessage className="text-[10px]" />
                                </FormItem>
                              )}
                            />
                          </div>
                          <div className="col-span-3">
                            <FormField
                              control={form.control}
                              name={`items.${index}.estimatedUnitPrice`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormControl><Input type="number" step="0.01" {...field} className="h-9 text-sm" placeholder="Unit Price" /></FormControl>
                                  <FormMessage className="text-[10px]" />
                                </FormItem>
                              )}
                            />
                          </div>
                          <div className="col-span-1 pt-1.5">
                            {fields.length > 1 && (
                              <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)} className="h-6 w-6 text-destructive opacity-0 group-hover:opacity-100 transition-opacity">
                                <Trash className="w-3.5 h-3.5" />
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
                      <span className="text-xl font-black text-primary">Ksh {currentTotal.toLocaleString()}</span>
                    </div>
                    <DialogFooter className="gap-2 sm:gap-0">
                      <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                      <Button type="submit" disabled={isBudgetPaused && !editingPr} className="bg-primary">
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

      <div className="flex items-center gap-4 bg-card p-4 rounded-xl border border-border shadow-sm">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            placeholder="Search by item name or REF#" 
            className="pl-9 bg-muted/30 border-none shadow-none focus-visible:ring-1" 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Button variant="outline" size="icon" className="shrink-0">
          <Filter className="w-4 h-4" />
        </Button>
      </div>

      <Card className="border-border shadow-none overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30 border-none">
              <TableHead className="font-bold uppercase text-[10px]">Reference</TableHead>
              <TableHead className="font-bold uppercase text-[10px]">Description Summary</TableHead>
              <TableHead className="font-bold uppercase text-[10px]">Originator</TableHead>
              <TableHead className="font-bold uppercase text-[10px]">Budget Line</TableHead>
              <TableHead className="font-bold uppercase text-[10px]">Progress</TableHead>
              <TableHead className="text-right font-bold uppercase text-[10px]">Net Total</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredPrs.length > 0 ? (
              filteredPrs.map((pr) => {
                const budget = budgets.find(b => b.name === pr.budgetLine);
                const isPaused = budget ? getBudgetStats(budget).isPaused : false;
                const total = calculatePRTotal(pr);
                
                return (
                  <TableRow key={pr.id} className="group hover:bg-muted/5">
                    <TableCell className="font-black text-primary text-xs">{pr.refNumber}</TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="text-sm font-medium">{pr.items[0]?.description}</span>
                        {pr.items.length > 1 && (
                          <span className="text-[10px] text-muted-foreground italic">+ {pr.items.length - 1} more line items</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-xs">{pr.requesterName}</TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="text-xs font-semibold">{pr.budgetLine}</span>
                        {isPaused && <Badge variant="destructive" className="text-[8px] h-3.5 px-1 py-0 w-fit">PAUSED</Badge>}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={
                        pr.status === 'Approved' ? 'secondary' : 
                        pr.status === 'Rejected' ? 'destructive' : 'outline'
                      } className="text-[9px] uppercase tracking-tighter">
                        {pr.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-black text-xs">Ksh {total.toLocaleString()}</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <RoleGuard permission="approve_requisitions">
                            {pr.status === 'Pending Manager' && (
                              <>
                                <DropdownMenuItem onClick={() => updatePRStatus(pr.id, 'Approved')} className="text-green-600">
                                  <CheckCircle className="w-4 h-4 mr-2" />
                                  Authorize
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => updatePRStatus(pr.id, 'Rejected')} className="text-red-600">
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
                                Edit Request
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
                <TableCell colSpan={7} className="h-32 text-center text-muted-foreground">
                  <div className="flex flex-col items-center justify-center space-y-2 opacity-50">
                    <Search className="w-8 h-8" />
                    <p className="text-sm">No requisitions match your search filters.</p>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
