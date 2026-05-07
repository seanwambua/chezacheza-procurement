"use client";

import { useState, useEffect, Suspense } from 'react';
import { useStore } from '@/lib/store';
import { useUserStore } from '@/lib/user-store';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { 
  Plus, 
  Search, 
  MoreVertical, 
  Trash2, 
  AlertCircle, 
  FileText, 
  PlusCircle, 
  Trash, 
  Pencil,
  Wallet,
  ShieldCheck,
  Zap,
  CheckCircle2,
  Clock,
  History,
  Lock,
  ArrowRight
} from 'lucide-react';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { StatCard } from '@/components/dashboard/StatCard';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { calculatePRTotal, PurchaseRequisition, getBudgetStats, LPO, PRStatus } from '@/lib/types';
import { cn } from '@/lib/utils';
import { RoleGuard } from '@/components/auth/RoleGuard';
import { CycleTimer } from '@/components/procurement/CycleTimer';

// Schemas
const requisitionSchema = z.object({
  budget: z.string().min(1, "Please select a budget"),
  items: z.array(z.object({
    id: z.string().optional(),
    description: z.string().min(3, "Description required"),
    quantity: z.coerce.number().min(1, "Qty >= 1"),
    estimatedUnitPrice: z.coerce.number().min(0.01, "Cost required"),
  })).min(1, "At least one item is required"),
});

const dispatchSchema = z.object({
  vendorId: z.string().min(1, "Vendor selection required"),
  deliveryDate: z.string().min(1, "Delivery deadline required"),
  paymentTerms: z.string().min(1, "Terms required"),
});

type RequisitionFormValues = z.infer<typeof requisitionSchema>;
type DispatchFormValues = z.infer<typeof dispatchSchema>;

function OrdersHubContent() {
  const { 
    prs, budgets, vendors, lpos, addPR, updatePR, deletePR, addLPO, selectedYear 
  } = useStore();
  
  const { currentUser, viewPreference } = useUserStore();
  const { toast } = useToast();
  
  const [mounted, setMounted] = useState(false);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('requisitions');
  
  // Requisition State
  const [isPRDialogOpen, setIsPRDialogOpen] = useState(false);
  const [editingPr, setEditingPr] = useState<PurchaseRequisition | null>(null);
  const [prToDelete, setPrToDelete] = useState<PurchaseRequisition | null>(null);

  // Dispatch State
  const [dispatchingPr, setDispatchingPr] = useState<PurchaseRequisition | null>(null);

  const isDetailed = viewPreference === 'detailed';

  const prForm = useForm<RequisitionFormValues>({
    resolver: zodResolver(requisitionSchema),
    defaultValues: {
      budget: '',
      items: [{ description: '', quantity: 1, estimatedUnitPrice: 0 }],
    },
  });

  const dispatchForm = useForm<DispatchFormValues>({
    resolver: zodResolver(dispatchSchema),
    defaultValues: {
      vendorId: '',
      deliveryDate: '',
      paymentTerms: '30 Days Net',
    },
  });

  const { fields: prFields, append: appendPr, remove: removePr } = useFieldArray({
    control: prForm.control,
    name: "items",
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (editingPr) {
      prForm.reset({
        budget: editingPr.budgetLine,
        items: editingPr.items || [{ description: '', quantity: 1, estimatedUnitPrice: 0 }],
      });
    } else {
      prForm.reset({
        budget: '',
        items: [{ description: '', quantity: 1, estimatedUnitPrice: 0 }],
      });
    }
  }, [editingPr, prForm]);

  if (!mounted || !currentUser) return null;

  // Filter Logic
  const filteredPrs = (prs || []).filter(pr => {
    const isCurrentYear = pr.fiscalYear === selectedYear;
    const matchesSearch = pr.items?.some(i => i.description.toLowerCase().includes(search.toLowerCase())) || 
                          pr.refNumber.toLowerCase().includes(search.toLowerCase());
    if (currentUser.role === 'Staff') return isCurrentYear && matchesSearch && pr.requesterName === currentUser.name;
    return isCurrentYear && matchesSearch;
  });

  const filteredLpos = (lpos || []).filter(lpo => 
    lpo.fiscalYear === selectedYear &&
    (lpo.lpoNumber.toLowerCase().includes(search.toLowerCase()) ||
     lpo.vendorName.toLowerCase().includes(search.toLowerCase()))
  );

  const statsPrs = filteredPrs.filter(pr => pr.status !== 'Rejected');
  const totalValue = statsPrs.reduce((acc, pr) => acc + calculatePRTotal(pr), 0);

  const onPRSubmit = (values: RequisitionFormValues) => {
    const budget = (budgets || []).find(b => b.name === values.budget && b.fiscalYear === selectedYear);
    const isPaused = budget ? getBudgetStats(budget).isPaused : false;
    
    if (isPaused && !editingPr) {
      toast({ variant: 'destructive', title: "Budget Cap Reached", description: "Current quarter allocation is exhausted." });
      return;
    }

    if (editingPr) {
      updatePR(editingPr.id, { 
        budgetLine: values.budget, 
        items: values.items.map(i => ({ 
          id: i.id || Math.random().toString(),
          description: i.description,
          quantity: i.quantity,
          estimatedUnitPrice: i.estimatedUnitPrice
        })) 
      });
      toast({ title: "Request Updated" });
    } else {
      addPR({ 
        budgetLine: values.budget, 
        items: values.items.map(i => ({ 
          id: Math.random().toString(),
          description: i.description,
          quantity: i.quantity,
          estimatedUnitPrice: i.estimatedUnitPrice
        })), 
        requesterName: currentUser.name, 
        status: 'Pending Manager' 
      });
      toast({ title: "Requisition Submitted", description: "Manager notification sent." });
    }
    setIsPRDialogOpen(false);
    setEditingPr(null);
  };

  const onDispatchSubmit = (values: DispatchFormValues) => {
    if (!dispatchingPr) return;
    const vendor = vendors.find(v => v.id === values.vendorId);
    if (!vendor) return;

    addLPO({
      id: `LPO-${Math.floor(Math.random() * 10000)}`,
      lpoNumber: `LPO/${selectedYear}/${String((lpos || []).length + 1).padStart(3, '0')}`,
      prId: dispatchingPr.id,
      vendorId: values.vendorId,
      vendorName: vendor.name,
      items: dispatchingPr.items.map(i => ({ 
        description: i.description, 
        quantity: i.quantity, 
        unitPrice: i.estimatedUnitPrice, 
        total: i.quantity * i.estimatedUnitPrice 
      })),
      totalValue: calculatePRTotal(dispatchingPr),
      deliveryDate: values.deliveryDate,
      paymentTerms: values.paymentTerms,
      createdAt: new Date().toISOString(),
    });

    toast({ title: "Vendor Agreement Dispatched", description: "Official LPO has been generated and locked." });
    setDispatchingPr(null);
    dispatchForm.reset();
  };

  return (
    <div className="space-y-6 md:space-y-8 animate-in fade-in duration-500 pb-10 max-w-full overflow-hidden">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="min-w-0 flex-1">
          <h2 className="text-3xl md:text-4xl font-headline font-bold text-primary tracking-tighter leading-tight truncate">
            Orders & Requests
          </h2>
          <p className="text-muted-foreground text-sm font-medium">Consolidated procurement cycle management for FY {selectedYear}.</p>
        </div>
        
        <RoleGuard permission="create_requisitions">
          <Button onClick={() => { setEditingPr(null); setIsPRDialogOpen(true); }} className="bg-primary font-bold uppercase text-xs h-10 shadow-sm">
            <Plus className="w-4 h-4 mr-2" /> New Request
          </Button>
        </RoleGuard>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
        <StatCard title="Total Committed" value={`Ksh ${totalValue.toLocaleString()}`} icon={Wallet} description="Authorized or pending pool" />
        <StatCard title="Active Agreements" value={filteredLpos.length} icon={ShieldCheck} description="Vendor-dispatched orders" />
        <StatCard title="Cycle Status" value="Active" icon={Clock} description="Fulfillment tracking engaged" />
      </div>

      <Tabs defaultValue="requisitions" value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 mb-6">
          <TabsList className="grid w-full lg:w-[400px] grid-cols-2 bg-muted/50 p-1">
            <TabsTrigger value="requisitions" className="flex items-center justify-center gap-2 py-2 text-[10px] font-black uppercase tracking-widest">
              <FileText className="w-3.5 h-3.5" />
              Requisitions
            </TabsTrigger>
            <TabsTrigger value="lpos" className="flex items-center justify-center gap-2 py-2 text-[10px] font-black uppercase tracking-widest">
              <Zap className="w-3.5 h-3.5" />
              Purchase Orders
            </TabsTrigger>
          </TabsList>

          <div className="relative w-full lg:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Search commitments..." 
              className="pl-9 h-10 text-xs bg-card border-none shadow-sm"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <TabsContent value="requisitions" className="mt-0 focus-visible:ring-0">
          <Card className="border-border shadow-none overflow-hidden bg-card">
            <div className="overflow-x-auto w-full">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30 border-none">
                    {isDetailed && <TableHead className="min-w-[120px] font-bold uppercase text-[10px]">Reference</TableHead>}
                    <TableHead className="min-w-[200px] font-bold uppercase text-[10px]">Description</TableHead>
                    <TableHead className="font-bold uppercase text-[10px]">Status</TableHead>
                    {isDetailed && <TableHead className="font-bold uppercase text-[10px]">Budget Pool</TableHead>}
                    <TableHead className="text-right font-bold uppercase text-[10px]">Est. Value</TableHead>
                    <TableHead className="text-right font-bold uppercase text-[10px]">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPrs.length > 0 ? (
                    filteredPrs.map((pr) => (
                      <TableRow key={pr.id} className="group hover:bg-muted/5">
                        {isDetailed && <TableCell className="font-black text-primary text-xs">{pr.refNumber}</TableCell>}
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-bold text-xs truncate max-w-[200px] text-primary">{pr.items?.[0]?.description || 'Multi-item Request'}</span>
                            {pr.items.length > 1 && <span className="text-[9px] text-muted-foreground font-bold uppercase tracking-tighter">+{pr.items.length - 1} more items</span>}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant={pr.status === 'Approved' ? 'secondary' : pr.status === 'LPO Generated' ? 'outline' : 'outline'} 
                            className={cn(
                              "text-[9px] uppercase px-1.5 h-4",
                              pr.status === 'LPO Generated' && "border-accent text-accent"
                            )}
                          >
                            {pr.status === 'LPO Generated' ? 'Dispatched' : pr.status}
                          </Badge>
                        </TableCell>
                        {isDetailed && <TableCell className="text-[10px] font-bold uppercase text-muted-foreground">{pr.budgetLine}</TableCell>}
                        <TableCell className="text-right font-black tracking-tighter text-xs">Ksh {calculatePRTotal(pr).toLocaleString()}</TableCell>
                        <TableCell className="text-right">
                          {pr.status === 'Approved' ? (
                            <RoleGuard allowedRoles={['Admin', 'Finance']}>
                              <Button 
                                size="sm" 
                                className="h-7 text-[9px] font-black uppercase bg-accent text-white shadow-sm"
                                onClick={() => setDispatchingPr(pr)}
                              >
                                <Zap className="w-3 h-3 mr-1" /> Dispatch
                              </Button>
                            </RoleGuard>
                          ) : (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8 md:opacity-0 group-hover:opacity-100 transition-opacity"><MoreVertical className="w-4 h-4" /></Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem 
                                  disabled={pr.status === 'LPO Generated' || pr.status === 'Approved'} 
                                  onClick={() => { setEditingPr(pr); setIsPRDialogOpen(true); }} 
                                  className="text-xs font-bold"
                                >
                                  <Pencil className="w-4 h-4 mr-2" /> Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  disabled={pr.status === 'LPO Generated'} 
                                  onClick={() => setPrToDelete(pr)} 
                                  className="text-xs font-bold text-destructive"
                                >
                                  <Trash2 className="w-4 h-4 mr-2" /> Purge
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow><TableCell colSpan={6} className="h-48 text-center text-muted-foreground italic">No requisitions found.</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="lpos" className="mt-0 focus-visible:ring-0">
          <Card className="border-border shadow-none overflow-hidden bg-card">
            <div className="overflow-x-auto w-full">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30 border-none">
                    <TableHead className="min-w-[120px] font-bold uppercase text-[10px]">LPO Agreement</TableHead>
                    <TableHead className="min-w-[150px] font-bold uppercase text-[10px]">Assigned Vendor</TableHead>
                    <TableHead className="font-bold uppercase text-[10px]">Cycle Status</TableHead>
                    <TableHead className="text-right font-bold uppercase text-[10px]">Agreement Value</TableHead>
                    <TableHead className="text-right font-bold uppercase text-[10px]">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLpos.length > 0 ? (
                    filteredLpos.map((lpo) => (
                      <TableRow key={lpo.id} className="group hover:bg-muted/5">
                        <TableCell className="font-black text-primary text-xs">{lpo.lpoNumber}</TableCell>
                        <TableCell className="font-bold text-xs text-primary">{lpo.vendorName}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary" className="text-[9px] uppercase px-1.5 h-4">{lpo.status}</Badge>
                            {lpo.status === 'Dispatched' && <CycleTimer startTime={lpo.dispatchedAt || lpo.createdAt} />}
                          </div>
                        </TableCell>
                        <TableCell className="text-right font-black tracking-tighter text-xs">Ksh {lpo.totalValue.toLocaleString()}</TableCell>
                        <TableCell className="text-right">
                          <Button variant="outline" size="sm" className="h-8 text-[10px] font-bold uppercase shadow-sm">
                             Audit
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow><TableCell colSpan={5} className="h-48 text-center text-muted-foreground italic">No active LPOs found.</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Internal Request Dialog */}
      <Dialog open={isPRDialogOpen} onOpenChange={setIsPRDialogOpen}>
        <DialogContent className="max-w-3xl w-[95vw] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-black tracking-tight">{editingPr ? 'Update Internal Request' : 'Draft New Requisition'}</DialogTitle>
            <DialogDescription className="text-xs font-medium uppercase tracking-widest text-muted-foreground">Internal allocation request for organizational needs.</DialogDescription>
          </DialogHeader>
          <Form {...prForm}>
            <form onSubmit={prForm.handleSubmit(onPRSubmit)} className="space-y-6">
              <FormField control={prForm.control} name="budget" render={({ field }) => (
                <FormItem>
                  <label className="text-[10px] uppercase font-black text-muted-foreground tracking-widest">Target Budget Pool</label>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className="h-10 text-xs shadow-sm bg-muted/20 border-none">
                        <SelectValue placeholder="Select target allocation" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {(budgets || []).filter(b => b.fiscalYear === selectedYear).map(b => (
                        <SelectItem key={b.id} value={b.name} className="text-xs">
                          {b.name} ({b.department})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormItem>
              )} />

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Line Item Definition</h3>
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm" 
                    onClick={() => appendPr({ description: '', quantity: 1, estimatedUnitPrice: 0 })} 
                    className="h-8 text-[10px] font-bold uppercase shadow-sm"
                  >
                    <PlusCircle className="w-3.5 h-3.5 mr-1.5" /> Add Item
                  </Button>
                </div>
                
                <div className="space-y-3">
                  {prFields.map((field, index) => (
                    <div key={field.id} className="grid grid-cols-1 md:grid-cols-12 gap-3 bg-muted/10 p-4 rounded-xl border border-border/40 group relative">
                      <div className="md:col-span-6">
                        <FormField control={prForm.control} name={`items.${index}.description`} render={({ field }) => (
                          <FormItem><FormControl><Input placeholder="Item description" {...field} className="h-9 text-xs border-none bg-card shadow-sm" /></FormControl></FormItem>
                        )} />
                      </div>
                      <div className="md:col-span-2">
                        <FormField control={prForm.control} name={`items.${index}.quantity`} render={({ field }) => (
                          <FormItem><FormControl><Input type="number" placeholder="Qty" {...field} className="h-9 text-xs border-none bg-card shadow-sm" /></FormControl></FormItem>
                        )} />
                      </div>
                      <div className="md:col-span-3">
                        <FormField control={prForm.control} name={`items.${index}.estimatedUnitPrice`} render={({ field }) => (
                          <FormItem><FormControl><Input type="number" placeholder="Unit Price (Ksh)" {...field} className="h-9 text-xs border-none bg-card shadow-sm" /></FormControl></FormItem>
                        )} />
                      </div>
                      <div className="md:col-span-1 pt-0.5">
                        <Button 
                          type="button" 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => removePr(index)} 
                          className="h-8 w-8 text-destructive hover:bg-destructive/10"
                        >
                          <Trash className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="flex justify-between items-center px-2 pt-2">
                <span className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Estimated Commitment</span>
                <span className="text-lg font-black tracking-tighter text-primary">
                  Ksh {prForm.watch('items').reduce((acc, item) => acc + (Number(item.quantity) * Number(item.estimatedUnitPrice)), 0).toLocaleString()}
                </span>
              </div>

              <DialogFooter className="border-t pt-6">
                <Button type="submit" className="bg-primary font-black uppercase text-xs h-11 shadow-xl">
                  {editingPr ? 'Save Modifications' : 'Finalize & Submit Request'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Dispatch Agreement Dialog */}
      <Dialog open={!!dispatchingPr} onOpenChange={(open) => !open && setDispatchingPr(null)}>
        <DialogContent className="max-w-xl w-[95vw]">
          <DialogHeader>
            <DialogTitle className="text-xl font-black tracking-tight flex items-center gap-2">
              <ShieldCheck className="w-6 h-6 text-accent" />
              Strategic Dispatch
            </DialogTitle>
            <DialogDescription className="text-xs font-medium">Assign a verified partner to an authorized internal request.</DialogDescription>
          </DialogHeader>
          <Form {...dispatchForm}>
            <form onSubmit={dispatchForm.handleSubmit(onDispatchSubmit)} className="space-y-6 pt-4">
              <div className="p-4 bg-muted/30 rounded-xl space-y-1">
                <p className="text-[10px] uppercase font-black text-muted-foreground tracking-widest">Source Request</p>
                <p className="text-sm font-bold text-primary">{dispatchingPr?.refNumber}</p>
                <p className="text-lg font-black text-accent tracking-tighter">Ksh {dispatchingPr ? calculatePRTotal(dispatchingPr).toLocaleString() : 0}</p>
              </div>

              <FormField control={dispatchForm.control} name="vendorId" render={({ field }) => (
                <FormItem>
                  <label className="text-[10px] uppercase font-black text-muted-foreground tracking-widest">Assigned Partner</label>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className="h-10 text-xs shadow-sm bg-card border-border">
                        <SelectValue placeholder="Select vendor from registry" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {vendors.map(v => (
                        <SelectItem key={v.id} value={v.id} className="text-xs">{v.name} ({v.category})</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormItem>
              )} />

              <div className="grid grid-cols-2 gap-4">
                <FormField control={dispatchForm.control} name="deliveryDate" render={({ field }) => (
                  <FormItem>
                    <label className="text-[10px] uppercase font-black text-muted-foreground tracking-widest">Delivery Deadline</label>
                    <FormControl><Input type="date" {...field} className="h-10 text-xs bg-card" /></FormControl>
                  </FormItem>
                )} />
                <FormField control={dispatchForm.control} name="paymentTerms" render={({ field }) => (
                  <FormItem>
                    <label className="text-[10px] uppercase font-black text-muted-foreground tracking-widest">Terms</label>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="h-10 text-xs bg-card"><SelectValue /></SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Immediate" className="text-xs">Immediate Cash</SelectItem>
                        <SelectItem value="30 Days Net" className="text-xs">30 Days Net</SelectItem>
                        <SelectItem value="60 Days Net" className="text-xs">60 Days Net</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormItem>
                )} />
              </div>

              <DialogFooter className="pt-6 border-t">
                <Button type="submit" className="bg-primary font-black uppercase text-xs h-11 shadow-xl">
                  Finalize & Dispatch Agreement
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!prToDelete} onOpenChange={(open) => !open && setPrToDelete(null)}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-destructive flex items-center gap-2 font-black tracking-tight">
              <AlertCircle className="w-5 h-5" />
              Purge Internal Request?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs font-medium leading-relaxed">
              This will permanently delete internal requisition **{prToDelete?.refNumber}**. This action is destructive and cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 sm:gap-0">
            <AlertDialogCancel className="font-black uppercase text-xs h-10 border-none bg-muted/50">Keep Request</AlertDialogCancel>
            <AlertDialogAction onClick={() => { if(prToDelete) deletePR(prToDelete.id); setPrToDelete(null); }} className="bg-destructive hover:bg-destructive/90 text-white font-black uppercase text-xs h-10">
              Purge Permanently
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default function LPOsPage() {
  return (
    <Suspense fallback={<div className="p-10 text-center font-black animate-pulse text-muted-foreground uppercase tracking-widest text-xs">Initializing Orders Hub...</div>}>
      <OrdersHubContent />
    </Suspense>
  );
}
