"use client";

import { useState, useEffect, Suspense } from 'react';
import { useStore } from '@/lib/store';
import { useUserStore } from '@/lib/user-store';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { 
  ShoppingCart, 
  Plus, 
  Search, 
  MoreVertical, 
  Printer, 
  Truck, 
  Calendar,
  PackageCheck,
  Trash2,
  AlertCircle,
  FileText,
  PlusCircle,
  Trash,
  CheckCircle,
  XCircle,
  AlertTriangle,
  History,
  Pencil,
  Lock,
  Eye
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
import { CycleTimer } from '@/components/procurement/CycleTimer';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
import { useToast } from '@/hooks/use-toast';
import { LPO, calculatePRTotal, PurchaseRequisition, getBudgetStats } from '@/lib/types';
import { cn } from '@/lib/utils';
import { RoleGuard } from '@/components/auth/RoleGuard';
import { useSearchParams } from 'next/navigation';

// Schemas
const requisitionSchema = z.object({
  budget: z.string().min(1, "Please select a budget"),
  items: z.array(z.object({
    description: z.string().min(3, "Description required"),
    quantity: z.coerce.number().min(1, "Qty >= 1"),
    estimatedUnitPrice: z.coerce.number().min(0.01, "Cost required"),
  })).min(1, "At least one item is required"),
});

const lpoSchema = z.object({
  prId: z.string().min(1, "Requisition is required"),
  vendorId: z.string().min(1, "Vendor is required"),
  deliveryDate: z.string().min(1, "Delivery date is required"),
  paymentTerms: z.string().min(1, "Payment terms are required"),
  additionalTerms: z.string().optional(),
});

type RequisitionFormValues = z.infer<typeof requisitionSchema>;
type LPOFormValues = z.infer<typeof lpoSchema>;

function OrdersHubContent() {
  const { 
    lpos, prs, vendors, budgets, 
    addLPO, updateLPO, deleteLPO, 
    addPR, updatePR, deletePR, updatePRStatus, 
    addGRN, selectedYear 
  } = useStore();
  
  const { currentUser, viewPreference } = useUserStore();
  const { toast } = useToast();
  const searchParams = useSearchParams();
  
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'requisitions');
  const [search, setSearch] = useState('');
  
  // States
  const [isPRDialogOpen, setIsPRDialogOpen] = useState(false);
  const [editingPr, setEditingPr] = useState<PurchaseRequisition | null>(null);
  const [prToDelete, setPrToDelete] = useState<PurchaseRequisition | null>(null);

  const [isLPODialogOpen, setIsLPODialogOpen] = useState(false);
  const [editingLpo, setEditingLpo] = useState<LPO | null>(null);
  const [lpoToVoid, setLpoToVoid] = useState<LPO | null>(null);
  const [receivingLpo, setReceivingLpo] = useState<LPO | null>(null);
  const [viewingLpo, setViewingLpo] = useState<LPO | null>(null);

  const isDetailed = viewPreference === 'detailed';

  // Forms
  const prForm = useForm<RequisitionFormValues>({
    resolver: zodResolver(requisitionSchema),
    defaultValues: {
      budget: '',
      items: [{ description: '', quantity: 1, estimatedUnitPrice: 0 }],
    },
  });

  const { fields: prFields, append: appendPr, remove: removePr } = useFieldArray({
    control: prForm.control,
    name: "items",
  });

  const lpoForm = useForm<LPOFormValues>({
    resolver: zodResolver(lpoSchema),
    defaultValues: {
      prId: '',
      vendorId: '',
      deliveryDate: '',
      paymentTerms: '30 Days Net',
      additionalTerms: '',
    },
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  // Handle deep links
  useEffect(() => {
    if (mounted) {
      const prId = searchParams.get('id');
      if (prId) {
        const foundPr = prs.find(p => p.id === prId);
        if (foundPr) {
          setEditingPr(foundPr);
          setIsPRDialogOpen(true);
          setActiveTab('requisitions');
        }
      }
    }
  }, [mounted, searchParams, prs]);

  // Form Sync
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

  useEffect(() => {
    if (editingLpo) {
      lpoForm.reset({
        prId: editingLpo.prId,
        vendorId: editingLpo.vendorId,
        deliveryDate: editingLpo.deliveryDate,
        paymentTerms: editingLpo.paymentTerms,
        additionalTerms: editingLpo.additionalTerms || '',
      });
    } else {
      lpoForm.reset({
        prId: '',
        vendorId: '',
        deliveryDate: '',
        paymentTerms: '30 Days Net',
        additionalTerms: '',
      });
    }
  }, [editingLpo, lpoForm]);

  if (!mounted || !currentUser) return null;

  // Filter Logic
  const filteredPrs = prs.filter(pr => {
    const isCurrentYear = pr.fiscalYear === selectedYear;
    const matchesSearch = pr.items?.some(i => i.description.toLowerCase().includes(search.toLowerCase())) || 
                          pr.refNumber.toLowerCase().includes(search.toLowerCase());
    if (currentUser.role === 'Staff') return isCurrentYear && matchesSearch && pr.requesterName === currentUser.name;
    return isCurrentYear && matchesSearch;
  });

  const filteredLpos = lpos.filter(lpo => 
    lpo.fiscalYear === selectedYear &&
    (lpo.lpoNumber.toLowerCase().includes(search.toLowerCase()) ||
    lpo.vendorName.toLowerCase().includes(search.toLowerCase()))
  );

  const approvedPrs = prs.filter(pr => pr.fiscalYear === selectedYear && pr.status === 'Approved');
  const totalLpoValue = filteredLpos.reduce((acc, lpo) => acc + lpo.totalValue, 0);

  // Handlers
  const onPRSubmit = (values: RequisitionFormValues) => {
    const budget = budgets.find(b => b.name === values.budget && b.fiscalYear === selectedYear);
    const isPaused = budget ? getBudgetStats(budget).isPaused : false;
    if (isPaused && !editingPr) {
      toast({ variant: 'destructive', title: "Budget Paused", description: "Budget exhausted." });
      return;
    }
    if (editingPr) {
      updatePR(editingPr.id, { budgetLine: values.budget, items: values.items.map(i => ({ ...i, id: i.id || Math.random().toString() })) });
    } else {
      addPR({ budgetLine: values.budget, items: values.items.map(i => ({ ...i, id: Math.random().toString() })), requesterName: currentUser.name, status: 'Pending Manager' });
    }
    setIsPRDialogOpen(false);
    setEditingPr(null);
  };

  const onLPOSubmit = (values: LPOFormValues) => {
    const selectedPr = prs.find(p => p.id === values.prId);
    const selectedVendor = vendors.find(v => v.id === values.vendorId);
    if (!selectedPr || !selectedVendor) return;

    if (!editingLpo) {
      addLPO({
        id: `LPO-${Math.floor(Math.random() * 10000)}`,
        lpoNumber: `LPO/${selectedYear}/${String(lpos.length + 1).padStart(3, '0')}`,
        prId: values.prId,
        vendorId: values.vendorId,
        vendorName: selectedVendor.name,
        items: selectedPr.items.map(i => ({ description: i.description, quantity: i.quantity, unitPrice: i.estimatedUnitPrice, total: i.quantity * i.estimatedUnitPrice })),
        totalValue: calculatePRTotal(selectedPr),
        deliveryDate: values.deliveryDate,
        paymentTerms: values.paymentTerms,
        additionalTerms: values.additionalTerms,
        status: 'Dispatched',
        createdAt: new Date().toISOString(),
      });
      updatePRStatus(values.prId, 'LPO Generated');
      toast({ title: "Agreement Dispatched", description: "LPO is now in read-only fulfillment mode." });
    }
    setIsLPODialogOpen(false);
    setEditingLpo(null);
  };

  const handleReceiveGoods = (lpo: LPO) => {
    addGRN({
      id: `GRN-${Math.floor(Math.random() * 10000)}`,
      lpoId: lpo.id,
      lpoNumber: lpo.lpoNumber,
      receivedDate: new Date().toISOString().split('T')[0],
      receivedBy: currentUser.name,
      items: lpo.items.map(i => ({ description: i.description, orderedQty: i.quantity, receivedQty: i.quantity, qualityRating: 5, specificationMatch: true, condition: 'Good' })),
      disputeFlag: false
    });
    setReceivingLpo(null);
    toast({ title: "Cycle Stopped", description: "Delivery verified and order archived." });
  };

  return (
    <div className="space-y-6 md:space-y-8 animate-in fade-in duration-500 pb-10 max-w-full overflow-hidden">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="min-w-0 flex-1">
          <h2 className="text-3xl md:text-4xl font-headline font-bold text-primary tracking-tighter leading-tight truncate">
            Orders Hub
          </h2>
          <p className="text-muted-foreground text-sm font-medium">Agreement & Fulfillment tracking for FY {selectedYear}.</p>
        </div>
        
        <div className="flex items-center gap-2">
          {activeTab === 'requisitions' ? (
            <RoleGuard permission="create_requisitions">
              <Button onClick={() => { setEditingPr(null); setIsPRDialogOpen(true); }} className="bg-primary font-bold uppercase text-xs h-10 shadow-sm">
                <Plus className="w-4 h-4 mr-2" /> New Request
              </Button>
            </RoleGuard>
          ) : (
            <RoleGuard allowedRoles={['Admin', 'Finance']}>
              <Button onClick={() => { setEditingLpo(null); setIsLPODialogOpen(true); }} className="bg-primary font-bold uppercase text-xs h-10 shadow-sm">
                <Plus className="w-4 h-4 mr-2" /> Dispatch Agreement
              </Button>
            </RoleGuard>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
        <StatCard title="Authorized Requests" value={approvedPrs.length} icon={CheckCircle} />
        <StatCard title="Active Cycle Orders" value={filteredLpos.filter(l => l.status === 'Dispatched').length} icon={Truck} description="Timer running" />
        <StatCard title="Archive Total" value={`Ksh ${totalLpoValue.toLocaleString()}`} icon={ShoppingCart} />
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 mb-6">
          <TabsList className="grid w-full sm:w-[320px] grid-cols-2 bg-muted/50 p-1">
            <TabsTrigger value="requisitions" className="text-[10px] font-black uppercase">Internal Requests</TabsTrigger>
            <TabsTrigger value="lpos" className="text-[10px] font-black uppercase">Vendor Agreements</TabsTrigger>
          </TabsList>

          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder={`Search...`} 
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
                    <TableHead className="text-right font-bold uppercase text-[10px]">Total</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPrs.length > 0 ? (
                    filteredPrs.map((pr) => (
                      <TableRow key={pr.id} className="group hover:bg-muted/5">
                        {isDetailed && <TableCell className="font-black text-primary text-xs">{pr.refNumber}</TableCell>}
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-bold text-xs truncate max-w-[200px] text-primary">{pr.items?.[0]?.description || 'Untitled'}</span>
                            {pr.items.length > 1 && <span className="text-[9px] text-muted-foreground font-medium">+{pr.items.length - 1} items</span>}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={pr.status === 'Approved' ? 'secondary' : pr.status === 'LPO Generated' ? 'outline' : 'outline'} className="text-[9px] uppercase px-1.5 h-4">
                            {pr.status === 'LPO Generated' ? 'Agreement Active' : pr.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-black tracking-tighter text-xs">Ksh {calculatePRTotal(pr).toLocaleString()}</TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8 md:opacity-0 group-hover:opacity-100 transition-opacity"><MoreVertical className="w-4 h-4" /></Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem disabled={pr.status === 'LPO Generated'} onClick={() => { setEditingPr(pr); setIsPRDialogOpen(true); }} className="text-xs font-bold"><Pencil className="w-4 h-4 mr-2" /> Edit</DropdownMenuItem>
                              <DropdownMenuItem disabled={pr.status === 'LPO Generated'} onClick={() => setPrToDelete(pr)} className="text-xs font-bold text-destructive"><Trash2 className="w-4 h-4 mr-2" /> Purge</DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow><TableCell colSpan={5} className="h-32 text-center text-muted-foreground italic">No requests matching criteria.</TableCell></TableRow>
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
                    {isDetailed && <TableHead className="min-w-[120px] font-bold uppercase text-[10px]">LPO #</TableHead>}
                    <TableHead className="min-w-[150px] font-bold uppercase text-[10px]">Vendor</TableHead>
                    <TableHead className="font-bold uppercase text-[10px]">Cycle Time</TableHead>
                    <TableHead className="font-bold uppercase text-[10px]">Phase</TableHead>
                    <TableHead className="text-right font-bold uppercase text-[10px]">Value</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLpos.length > 0 ? (
                    filteredLpos.map((lpo) => (
                      <TableRow key={lpo.id} className="group hover:bg-muted/5">
                        {isDetailed && <TableCell className="font-black text-primary text-xs">{lpo.lpoNumber}</TableCell>}
                        <TableCell><span className="font-bold text-xs text-primary">{lpo.vendorName}</span></TableCell>
                        <TableCell>
                          <CycleTimer startTime={lpo.dispatchedAt || lpo.createdAt} endTime={lpo.fulfilledAt} />
                        </TableCell>
                        <TableCell>
                          <Badge variant={lpo.status === 'Fulfilled' ? 'secondary' : 'outline'} className="text-[9px] uppercase px-1.5 h-4">
                            {lpo.status === 'Dispatched' ? 'Fulfillment' : lpo.status === 'Fulfilled' ? 'Archived' : lpo.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-black tracking-tighter text-xs">Ksh {lpo.totalValue.toLocaleString()}</TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8 md:opacity-0 group-hover:opacity-100 transition-opacity"><MoreVertical className="w-4 h-4" /></Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => setViewingLpo(lpo)} className="text-xs font-bold"><Eye className="w-4 h-4 mr-2" /> View Details</DropdownMenuItem>
                              {lpo.status === 'Dispatched' && (
                                <DropdownMenuItem className="text-accent text-xs font-bold" onClick={() => setReceivingLpo(lpo)}><PackageCheck className="w-4 h-4 mr-2" /> Receive Goods</DropdownMenuItem>
                              )}
                              <DropdownMenuItem className="text-xs font-bold"><Printer className="w-4 h-4 mr-2" /> Export PDF</DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow><TableCell colSpan={6} className="h-32 text-center text-muted-foreground italic">No active agreements.</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Forms & Dialogs */}
      <Dialog open={isPRDialogOpen} onOpenChange={setIsPRDialogOpen}>
        <DialogContent className="max-w-3xl w-[95vw] max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle className="text-xl font-black">{editingPr ? 'Edit Request' : 'Draft Request'}</DialogTitle></DialogHeader>
          <Form {...prForm}><form onSubmit={prForm.handleSubmit(onPRSubmit)} className="space-y-6">
            <FormField control={prForm.control} name="budget" render={({ field }) => (
              <FormItem><FormLabel className="text-[10px] uppercase font-bold text-muted-foreground">Budget Pool</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger className="h-10 text-xs"><SelectValue placeholder="Select Target Budget" /></SelectTrigger></FormControl>
                  <SelectContent>{budgets.filter(b => b.fiscalYear === selectedYear).map(b => <SelectItem key={b.id} value={b.name} className="text-xs">{b.name} ({b.department})</SelectItem>)}</SelectContent>
                </Select>
              </FormItem>
            )} />
            <div className="space-y-4">
              <div className="flex items-center justify-between"><h3 className="text-[10px] font-bold uppercase text-muted-foreground">Line Items</h3>
                <Button type="button" variant="outline" size="sm" onClick={() => appendPr({ description: '', quantity: 1, estimatedUnitPrice: 0 })} className="h-8 text-[10px] font-bold uppercase"><PlusCircle className="w-3.5 h-3.5 mr-1.5" /> Add Row</Button>
              </div>
              {prFields.map((field, index) => (
                <div key={field.id} className="grid grid-cols-1 md:grid-cols-12 gap-3 bg-muted/10 p-3 rounded-md border border-border/40">
                  <div className="md:col-span-6"><FormField control={prForm.control} name={`items.${index}.description`} render={({ field }) => <FormItem><FormControl><Input placeholder="Description" {...field} className="h-9 text-xs" /></FormControl></FormItem>} /></div>
                  <div className="md:col-span-2"><FormField control={prForm.control} name={`items.${index}.quantity`} render={({ field }) => <FormItem><FormControl><Input type="number" {...field} className="h-9 text-xs" /></FormControl></FormItem>} /></div>
                  <div className="md:col-span-3"><FormField control={prForm.control} name={`items.${index}.estimatedUnitPrice`} render={({ field }) => <FormItem><FormControl><Input type="number" {...field} className="h-9 text-xs" /></FormControl></FormItem>} /></div>
                  <div className="md:col-span-1 pt-1"><Button type="button" variant="ghost" size="icon" onClick={() => removePr(index)} className="h-8 w-8 text-destructive"><Trash className="w-4 h-4" /></Button></div>
                </div>
              ))}
            </div>
            <DialogFooter className="border-t pt-4"><Button type="submit" className="bg-primary font-bold uppercase text-xs h-10 w-full sm:w-auto">Submit Request</Button></DialogFooter>
          </form></Form>
        </DialogContent>
      </Dialog>

      <Dialog open={isLPODialogOpen} onOpenChange={setIsLPODialogOpen}>
        <DialogContent className="max-w-xl w-[95vw]">
          <DialogHeader><DialogTitle className="text-xl font-black">Official Dispatch (Agreement)</DialogTitle><DialogDescription className="text-xs font-medium">Assign a vendor to an authorized request to start the fulfillment cycle.</DialogDescription></DialogHeader>
          <Form {...lpoForm}><form onSubmit={lpoForm.handleSubmit(onLPOSubmit)} className="space-y-6">
            <FormField control={lpoForm.control} name="prId" render={({ field }) => (
              <FormItem><FormLabel className="text-[10px] uppercase font-bold text-muted-foreground">Authorized PR</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger className="h-10 text-xs"><SelectValue placeholder="Select Reference" /></SelectTrigger></FormControl>
                  <SelectContent>{approvedPrs.map(pr => <SelectItem key={pr.id} value={pr.id} className="text-xs">{pr.refNumber} - {pr.items[0]?.description}</SelectItem>)}</SelectContent>
                </Select>
              </FormItem>
            )} />
            <FormField control={lpoForm.control} name="vendorId" render={({ field }) => (
              <FormItem><FormLabel className="text-[10px] uppercase font-bold text-muted-foreground">Assigned Vendor</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger className="h-10 text-xs"><SelectValue placeholder="Strategic Partner" /></SelectTrigger></FormControl>
                  <SelectContent>{vendors.map(v => <SelectItem key={v.id} value={v.id} className="text-xs">{v.name}</SelectItem>)}</SelectContent>
                </Select>
              </FormItem>
            )} />
            <div className="grid grid-cols-2 gap-4">
              <FormField control={lpoForm.control} name="deliveryDate" render={({ field }) => <FormItem><FormLabel className="text-[10px] uppercase font-bold text-muted-foreground">Delivery Deadline</FormLabel><FormControl><Input type="date" {...field} className="h-10 text-xs" /></FormControl></FormItem>} />
              <FormField control={lpoForm.control} name="paymentTerms" render={({ field }) => <FormItem><FormLabel className="text-[10px] uppercase font-bold text-muted-foreground">Payment Terms</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger className="h-10 text-xs"><SelectValue /></SelectTrigger></FormControl><SelectContent><SelectItem value="Immediate">Immediate</SelectItem><SelectItem value="30 Days Net">30 Days</SelectItem><SelectItem value="60 Days Net">60 Days</SelectItem></SelectContent></Select></FormItem>} />
            </div>
            <DialogFooter className="border-t pt-4"><Button type="submit" className="bg-primary font-bold uppercase text-xs h-10 w-full">Finalize Agreement & Dispatch</Button></DialogFooter>
          </form></Form>
        </DialogContent>
      </Dialog>

      <Dialog open={!!viewingLpo} onOpenChange={(open) => !open && setViewingLpo(null)}>
        <DialogContent className="max-w-2xl w-[95vw]">
          <DialogHeader><DialogTitle className="flex items-center gap-2 font-black">Agreement {viewingLpo?.lpoNumber} <Lock className="w-4 h-4 text-muted-foreground" /></DialogTitle><DialogDescription className="text-xs">Official Commitment - Read Only Mode</DialogDescription></DialogHeader>
          {viewingLpo && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4 p-4 bg-muted/30 rounded-lg border">
                <div><p className="text-[9px] uppercase font-black text-muted-foreground">Vendor</p><p className="text-sm font-bold text-primary">{viewingLpo.vendorName}</p></div>
                <div><p className="text-[9px] uppercase font-black text-muted-foreground">Agreement Status</p><Badge variant="outline" className="text-[9px] uppercase">{viewingLpo.status}</Badge></div>
              </div>
              <div className="space-y-2">
                 <p className="text-[9px] uppercase font-black text-muted-foreground">Committed Items</p>
                 <div className="border rounded-md divide-y bg-card">{viewingLpo.items.map((i, idx) => (
                   <div key={idx} className="p-3 flex justify-between text-xs">
                     <span className="font-bold">{i.description} (x{i.quantity})</span>
                     <span className="font-black">Ksh {i.total.toLocaleString()}</span>
                   </div>
                 ))}</div>
              </div>
              <div className="flex justify-between items-center py-4 border-t"><span className="text-xs font-bold text-muted-foreground">Total Value</span><span className="text-xl font-black text-primary tracking-tighter">Ksh {viewingLpo.totalValue.toLocaleString()}</span></div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!receivingLpo} onOpenChange={(open) => !open && setReceivingLpo(null)}>
        <DialogContent className="max-w-md w-[95vw]">
          <DialogHeader><DialogTitle className="font-black">Verify Fulfillment & Stop Cycle</DialogTitle><DialogDescription className="text-xs">Confirming receipt will end the tracking cycle and archive the LPO.</DialogDescription></DialogHeader>
          <div className="p-4 bg-muted/20 rounded-lg space-y-2">
            <div className="flex justify-between text-xs"><span>Agreement #</span><span className="font-bold">{receivingLpo?.lpoNumber}</span></div>
            <div className="flex justify-between text-xs"><span>Committed Value</span><span className="font-black text-primary">Ksh {receivingLpo?.totalValue.toLocaleString()}</span></div>
          </div>
          <DialogFooter className="gap-2 pt-4 flex-col sm:flex-row">
            <Button variant="outline" onClick={() => setReceivingLpo(null)} className="font-bold uppercase text-xs h-10">Cancel</Button>
            <Button className="bg-accent font-bold uppercase text-xs h-10 shadow-md" onClick={() => receivingLpo && handleReceiveGoods(receivingLpo)}>Confirm Verification</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!prToDelete} onOpenChange={(open) => !open && setPrToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle className="text-destructive">Purge Request?</AlertDialogTitle><AlertDialogDescription>This will permanently delete internal requisition {prToDelete?.refNumber}.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel className="text-xs font-black uppercase">Cancel</AlertDialogCancel><AlertDialogAction onClick={() => { if(prToDelete) deletePR(prToDelete.id); setPrToDelete(null); }} className="bg-destructive text-white text-xs font-black uppercase">Purge</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default function LPOsPage() {
  return (
    <Suspense fallback={<div className="p-10 text-center font-bold">Initializing Orders Hub...</div>}>
      <OrdersHubContent />
    </Suspense>
  );
}
