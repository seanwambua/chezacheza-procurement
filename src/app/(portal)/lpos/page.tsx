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
  Eye,
  CheckCircle2
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
  FormDescription,
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
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { LPO, calculatePRTotal, PurchaseRequisition, getBudgetStats, PRStatus, GRN } from '@/lib/types';
import { cn } from '@/lib/utils';
import { RoleGuard } from '@/components/auth/RoleGuard';
import { useSearchParams } from 'next/navigation';

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
        const foundPr = (prs || []).find(p => p.id === prId);
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

  const approvedPrs = (prs || []).filter(pr => pr.fiscalYear === selectedYear && pr.status === 'Approved');
  const totalLpoValue = filteredLpos.reduce((acc, lpo) => acc + lpo.totalValue, 0);

  // Handlers
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

  const onLPOSubmit = (values: LPOFormValues) => {
    const selectedPr = (prs || []).find(p => p.id === values.prId);
    const selectedVendor = (vendors || []).find(v => v.id === values.vendorId);
    
    if (!selectedPr || !selectedVendor) return;

    addLPO({
      id: `LPO-${Math.floor(Math.random() * 10000)}`,
      lpoNumber: `LPO/${selectedYear}/${String((lpos || []).length + 1).padStart(3, '0')}`,
      prId: values.prId,
      vendorId: values.vendorId,
      vendorName: selectedVendor.name,
      items: selectedPr.items.map(i => ({ 
        description: i.description, 
        quantity: i.quantity, 
        unitPrice: i.estimatedUnitPrice, 
        total: i.quantity * i.estimatedUnitPrice 
      })),
      totalValue: calculatePRTotal(selectedPr),
      deliveryDate: values.deliveryDate,
      paymentTerms: values.paymentTerms,
      additionalTerms: values.additionalTerms,
      createdAt: new Date().toISOString(),
    });

    toast({ title: "Agreement Dispatched", description: "Fulfillment cycle initiated." });
    setIsLPODialogOpen(false);
  };

  const handleReceiveGoods = (lpo: LPO) => {
    const hasDispute = lpo.items.some(i => false); // In a real app, we'd have a detailed form for this
    
    addGRN({
      id: `GRN-${Math.floor(Math.random() * 10000)}`,
      lpoId: lpo.id,
      lpoNumber: lpo.lpoNumber,
      receivedDate: new Date().toISOString().split('T')[0],
      receivedBy: currentUser.name,
      items: lpo.items.map(i => ({ 
        description: i.description, 
        orderedQty: i.quantity, 
        receivedQty: i.quantity, 
        qualityRating: 5, 
        specificationMatch: true, 
        condition: 'Good' as const 
      })),
      disputeFlag: false
    });

    setReceivingLpo(null);
    toast({ title: "Receipt Verified", description: "LPO archived and budget reconciled." });
  };

  return (
    <div className="space-y-6 md:space-y-8 animate-in fade-in duration-500 pb-10 max-w-full overflow-hidden">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="min-w-0 flex-1">
          <h2 className="text-3xl md:text-4xl font-headline font-bold text-primary tracking-tighter leading-tight truncate">
            Orders Hub
          </h2>
          <p className="text-muted-foreground text-sm font-medium">Internal requests & official vendor agreements for FY {selectedYear}.</p>
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
              <Button onClick={() => { setIsLPODialogOpen(true); }} className="bg-primary font-bold uppercase text-xs h-10 shadow-sm">
                <Plus className="w-4 h-4 mr-2" /> Dispatch Agreement
              </Button>
            </RoleGuard>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
        <StatCard title="Active Cycle Orders" value={filteredLpos.filter(l => l.status === 'Dispatched').length} icon={Truck} description="Live fulfillment tracking" />
        <StatCard title="Authorized Queue" value={approvedPrs.length} icon={CheckCircle2} description="Awaiting vendor assignment" />
        <StatCard title="Annual Commitment" value={`Ksh ${totalLpoValue.toLocaleString()}`} icon={ShoppingCart} description={`Total FY ${selectedYear} value`} />
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 mb-6">
          <TabsList className="grid w-full sm:w-[320px] grid-cols-2 bg-muted/50 p-1">
            <TabsTrigger value="requisitions" className="text-[10px] font-black uppercase tracking-widest">Internal Requests</TabsTrigger>
            <TabsTrigger value="lpos" className="text-[10px] font-black uppercase tracking-widest">Vendor Agreements</TabsTrigger>
          </TabsList>

          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder={`Search ${activeTab === 'requisitions' ? 'requests' : 'agreements'}...`} 
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
                    <TableHead className="text-right font-bold uppercase text-[10px]">Est. Value</TableHead>
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
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow><TableCell colSpan={5} className="h-48 text-center text-muted-foreground italic">No requests matching criteria.</TableCell></TableRow>
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
                    <TableHead className="min-w-[150px] font-bold uppercase text-[10px]">Assigned Vendor</TableHead>
                    <TableHead className="font-bold uppercase text-[10px]">Fulfillment Cycle</TableHead>
                    <TableHead className="font-bold uppercase text-[10px]">Agreement Phase</TableHead>
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
                            {lpo.status === 'Dispatched' ? 'In Fulfillment' : lpo.status === 'Fulfilled' ? 'Archived' : lpo.status}
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
                                <DropdownMenuItem className="text-accent text-xs font-bold" onClick={() => setReceivingLpo(lpo)}><PackageCheck className="w-4 h-4 mr-2" /> Verify Delivery</DropdownMenuItem>
                              )}
                              <DropdownMenuItem className="text-xs font-bold"><Printer className="w-4 h-4 mr-2" /> Export Agreement</DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow><TableCell colSpan={6} className="h-48 text-center text-muted-foreground italic">No active agreements found.</TableCell></TableRow>
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
                  <FormLabel className="text-[10px] uppercase font-black text-muted-foreground tracking-widest">Target Budget Pool</FormLabel>
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
                <Button type="submit" className="bg-primary font-black uppercase text-xs h-11 w-full sm:w-auto shadow-xl">
                  {editingPr ? 'Save Modifications' : 'Finalize & Submit Request'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Official Dispatch Dialog */}
      <Dialog open={isLPODialogOpen} onOpenChange={setIsLPODialogOpen}>
        <DialogContent className="max-w-xl w-[95vw]">
          <DialogHeader>
            <DialogTitle className="text-xl font-black tracking-tight flex items-center gap-2">
              <ShieldCheck className="w-6 h-6 text-accent" />
              Strategic Dispatch
            </DialogTitle>
            <DialogDescription className="text-xs font-medium">Assign a verified partner to an authorized internal request.</DialogDescription>
          </DialogHeader>
          <Form {...lpoForm}>
            <form onSubmit={lpoForm.handleSubmit(onLPOSubmit)} className="space-y-6">
              <FormField control={lpoForm.control} name="prId" render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[10px] uppercase font-black text-muted-foreground tracking-widest">Authorized Reference</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className="h-10 text-xs shadow-sm bg-muted/20 border-none">
                        <SelectValue placeholder="Select authorized requisition" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {approvedPrs.map(pr => (
                        <SelectItem key={pr.id} value={pr.id} className="text-xs font-medium">
                          {pr.refNumber} - {pr.items[0]?.description}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormItem>
              )} />
              
              <FormField control={lpoForm.control} name="vendorId" render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[10px] uppercase font-black text-muted-foreground tracking-widest">Strategic Assigned Vendor</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className="h-10 text-xs shadow-sm bg-muted/20 border-none">
                        <SelectValue placeholder="Select partner" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {(vendors || []).map(v => (
                        <SelectItem key={v.id} value={v.id} className="text-xs font-medium">
                          {v.name} ({v.category})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormItem>
              )} />

              <div className="grid grid-cols-2 gap-4">
                <FormField control={lpoForm.control} name="deliveryDate" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[10px] uppercase font-black text-muted-foreground tracking-widest">Delivery Deadline</FormLabel>
                    <FormControl><Input type="date" {...field} className="h-10 text-xs shadow-sm bg-muted/20 border-none" /></FormControl>
                  </FormItem>
                )} />
                <FormField control={lpoForm.control} name="paymentTerms" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[10px] uppercase font-black text-muted-foreground tracking-widest">Payment Settlement</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="h-10 text-xs shadow-sm bg-muted/20 border-none"><SelectValue /></SelectTrigger>
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

              <DialogFooter className="border-t pt-6">
                <Button type="submit" className="bg-primary font-black uppercase text-xs h-11 w-full shadow-xl">
                  Commit Agreement & Dispatch
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delivery Verification Dialog */}
      <Dialog open={!!receivingLpo} onOpenChange={(open) => !open && setReceivingLpo(null)}>
        <DialogContent className="max-w-xl w-[95vw] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-black tracking-tight flex items-center gap-2">
              <PackageCheck className="w-6 h-6 text-accent" />
              Delivery Verification (GRN)
            </DialogTitle>
            <DialogDescription className="text-xs font-medium uppercase tracking-widest">Audit and verification of received organizational assets.</DialogDescription>
          </DialogHeader>
          
          {receivingLpo && (
            <div className="space-y-6 pt-4">
              <div className="p-4 bg-muted/30 rounded-xl border space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-muted-foreground uppercase tracking-tighter">Agreement Reference</span>
                  <span className="font-black text-primary">{receivingLpo.lpoNumber}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-muted-foreground uppercase tracking-tighter">Assigned Partner</span>
                  <span className="font-black text-accent">{receivingLpo.vendorName}</span>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Item Verification</h4>
                <div className="space-y-3">
                  {receivingLpo.items.map((item, idx) => (
                    <div key={idx} className="p-4 bg-card border rounded-xl shadow-sm space-y-3">
                      <div className="flex justify-between items-start">
                        <p className="text-xs font-black text-primary truncate max-w-[250px]">{item.description}</p>
                        <Badge variant="outline" className="text-[9px] font-bold uppercase">{item.quantity} Ordered</Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-[9px] font-black uppercase text-muted-foreground opacity-70">Qty Received</label>
                          <Input type="number" defaultValue={item.quantity} className="h-8 text-xs border-muted/50" />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[9px] font-black uppercase text-muted-foreground opacity-70">Quality Rating</label>
                          <Select defaultValue="5">
                            <SelectTrigger className="h-8 text-[10px] border-muted/50">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="5" className="text-xs">5 - Excellent</SelectItem>
                              <SelectItem value="4" className="text-xs">4 - Good</SelectItem>
                              <SelectItem value="3" className="text-xs">3 - Fair</SelectItem>
                              <SelectItem value="2" className="text-xs">2 - Poor</SelectItem>
                              <SelectItem value="1" className="text-xs">1 - Critical</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <Separator />

              <div className="flex flex-col gap-4">
                <div className="flex items-center space-x-2 p-4 bg-destructive/5 rounded-xl border border-destructive/10">
                  <Checkbox id="dispute" />
                  <div className="grid gap-1.5 leading-none">
                    <label htmlFor="dispute" className="text-xs font-black uppercase text-destructive tracking-widest flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      Raise Dispute Flag
                    </label>
                    <p className="text-[10px] font-medium text-muted-foreground">Flag this delivery for inconsistencies or damages.</p>
                  </div>
                </div>
              </div>

              <DialogFooter className="gap-2 pt-6 border-t flex-col sm:flex-row">
                <Button variant="outline" onClick={() => setReceivingLpo(null)} className="font-black uppercase text-xs h-11 w-full sm:w-auto">Cancel Verification</Button>
                <Button className="bg-accent font-black uppercase text-xs h-11 w-full sm:w-auto shadow-xl" onClick={() => handleReceiveGoods(receivingLpo)}>
                  Confirm & Archive Order
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Read-Only Viewer Dialog */}
      <Dialog open={!!viewingLpo} onOpenChange={(open) => !open && setViewingLpo(null)}>
        <DialogContent className="max-w-2xl w-[95vw]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 font-black tracking-tight text-xl">
              Official Agreement {viewingLpo?.lpoNumber} 
              <Lock className="w-4 h-4 text-muted-foreground opacity-50" />
            </DialogTitle>
            <DialogDescription className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Consolidated agreement metadata - View Only</DialogDescription>
          </DialogHeader>
          
          {viewingLpo && (
            <div className="space-y-6 pt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-muted/30 rounded-xl border">
                  <p className="text-[9px] uppercase font-black text-muted-foreground tracking-widest mb-1">Assigned Partner</p>
                  <p className="text-sm font-bold text-primary truncate">{viewingLpo.vendorName}</p>
                </div>
                <div className="p-4 bg-muted/30 rounded-xl border">
                  <p className="text-[9px] uppercase font-black text-muted-foreground tracking-widest mb-1">Cycle Status</p>
                  <Badge variant="outline" className="text-[9px] uppercase font-black px-1.5 h-4.5 border-accent text-accent">{viewingLpo.status}</Badge>
                </div>
              </div>

              <div className="space-y-3">
                <p className="text-[10px] uppercase font-black text-muted-foreground tracking-widest px-1">Committed Items</p>
                <div className="border rounded-xl divide-y bg-card shadow-sm overflow-hidden">
                  {viewingLpo.items.map((i, idx) => (
                    <div key={idx} className="p-4 flex justify-between items-center text-xs group hover:bg-muted/10 transition-colors">
                      <div className="flex flex-col gap-0.5">
                        <span className="font-bold text-primary">{i.description}</span>
                        <span className="text-[9px] font-black uppercase text-muted-foreground">x{i.quantity} @ Ksh {i.unitPrice.toLocaleString()}</span>
                      </div>
                      <span className="font-black tracking-tighter text-primary">Ksh {i.total.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-between items-center py-6 border-t px-2">
                <span className="text-xs font-black uppercase text-muted-foreground tracking-widest">Total Committed Value</span>
                <span className="text-2xl font-black text-primary tracking-tighter">Ksh {viewingLpo.totalValue.toLocaleString()}</span>
              </div>
            </div>
          )}
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
              This will permanently delete internal requisition **{prToDelete?.refNumber}**. This action is destructive and cannot be undone within the current session.
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
