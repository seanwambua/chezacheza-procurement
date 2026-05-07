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
  Pencil
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
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatCard } from '@/components/dashboard/StatCard';
import { CycleTimer } from '@/components/procurement/CycleTimer';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { useToast } from '@/hooks/use-toast';
import { LPO, calculatePRTotal, PurchaseRequisition, getBudgetStats } from '@/lib/types';
import { cn } from '@/lib/utils';
import { RoleGuard } from '@/components/auth/RoleGuard';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useSearchParams, useRouter } from 'next/navigation';

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
  const router = useRouter();
  
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'requisitions');
  const [search, setSearch] = useState('');
  
  // Requisition States
  const [isPRDialogOpen, setIsPRDialogOpen] = useState(false);
  const [editingPr, setEditingPr] = useState<PurchaseRequisition | null>(null);
  const [prToDelete, setPrToDelete] = useState<PurchaseRequisition | null>(null);

  // LPO States
  const [isLPODialogOpen, setIsLPODialogOpen] = useState(false);
  const [editingLpo, setEditingLpo] = useState<LPO | null>(null);
  const [lpoToVoid, setLpoToVoid] = useState<LPO | null>(null);
  const [receivingLpo, setReceivingLpo] = useState<LPO | null>(null);

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

  // Handle deep links from dashboard or other pages
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
      
      const tabParam = searchParams.get('tab');
      if (tabParam) setActiveTab(tabParam);
    }
  }, [mounted, searchParams, prs]);

  // Sync PR Form
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

  // Sync LPO Form
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
    const searchLower = search.toLowerCase();
    const matchesSearch = pr.items?.some(i => i.description.toLowerCase().includes(searchLower)) || 
                          pr.refNumber.toLowerCase().includes(searchLower);
    
    if (currentUser.role === 'Staff') return isCurrentYear && matchesSearch && pr.requesterName === currentUser.name;
    return isCurrentYear && matchesSearch;
  });

  const filteredLpos = lpos.filter(lpo => 
    lpo.fiscalYear === selectedYear &&
    (lpo.lpoNumber.toLowerCase().includes(search.toLowerCase()) ||
    lpo.vendorName.toLowerCase().includes(search.toLowerCase()))
  );

  const approvedPrs = prs.filter(pr => pr.fiscalYear === selectedYear && (pr.status === 'Approved' || (editingLpo && pr.id === editingLpo.prId)));
  const totalLpoValue = filteredLpos.reduce((acc, lpo) => acc + lpo.totalValue, 0);
  const pendingPrCount = filteredPrs.filter(pr => pr.status.includes('Pending')).length;

  // Handlers
  const onPRSubmit = (values: RequisitionFormValues) => {
    const budget = budgets.find(b => b.name === values.budget && b.fiscalYear === selectedYear);
    const isPaused = budget ? getBudgetStats(budget).isPaused : false;
    
    if (isPaused && !editingPr) {
      toast({ variant: 'destructive', title: "Budget Paused", description: "You cannot submit requests for exhausted budgets." });
      return;
    }

    if (editingPr) {
      updatePR(editingPr.id, {
        budgetLine: values.budget,
        items: values.items.map((item, idx) => ({ ...item, id: editingPr.items?.[idx]?.id || `item-${Math.random()}` }))
      });
      toast({ title: "Requisition Updated" });
    } else {
      addPR({
        budgetLine: values.budget,
        items: values.items.map(item => ({ ...item, id: `item-${Math.random()}` })),
        requesterName: currentUser.name,
        status: 'Pending Manager',
      });
      toast({ title: "Requisition Submitted" });
    }
    setIsPRDialogOpen(false);
    setEditingPr(null);
  };

  const onLPOSubmit = (values: LPOFormValues) => {
    const selectedPr = prs.find(p => p.id === values.prId);
    const selectedVendor = vendors.find(v => v.id === values.vendorId);
    if (!selectedPr || !selectedVendor) return;

    if (editingLpo) {
      updateLPO(editingLpo.id, {
        vendorId: values.vendorId,
        vendorName: selectedVendor.name,
        deliveryDate: values.deliveryDate,
        paymentTerms: values.paymentTerms,
        additionalTerms: values.additionalTerms,
      });
      toast({ title: "LPO Updated" });
    } else {
      const prTotal = calculatePRTotal(selectedPr);
      const newLpoId = `LPO-${Math.floor(Math.random() * 10000)}`;
      
      addLPO({
        id: newLpoId,
        lpoNumber: `LPO/${selectedYear}/${String(lpos.length + 1).padStart(3, '0')}`,
        prId: values.prId,
        vendorId: values.vendorId,
        vendorName: selectedVendor.name,
        items: selectedPr.items.map(item => ({
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.estimatedUnitPrice,
          total: item.quantity * item.estimatedUnitPrice
        })),
        totalValue: prTotal,
        deliveryDate: values.deliveryDate,
        paymentTerms: values.paymentTerms,
        additionalTerms: values.additionalTerms,
        status: 'Dispatched',
        createdAt: new Date().toISOString(),
      });
      
      updatePRStatus(values.prId, 'LPO Generated');
      toast({ title: "LPO Dispatched" });
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
      items: lpo.items.map(i => ({
        description: i.description,
        orderedQty: i.quantity,
        receivedQty: i.quantity,
        qualityRating: 5,
        specificationMatch: true,
        condition: 'Good'
      })),
      disputeFlag: false
    });
    setReceivingLpo(null);
    toast({ title: "Receipt Confirmed" });
  };

  return (
    <div className="space-y-6 md:space-y-8 animate-in fade-in duration-500 pb-10 max-w-full overflow-hidden">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="min-w-0 flex-1">
          <h2 className="text-3xl md:text-4xl font-headline font-bold text-primary tracking-tighter leading-tight truncate">
            Orders & Requests
          </h2>
          <p className="text-muted-foreground text-sm font-medium">Full procurement cycle management for FY {selectedYear}.</p>
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
                <Plus className="w-4 h-4 mr-2" /> Dispatch LPO
              </Button>
            </RoleGuard>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
        <StatCard title="Active Requests" value={pendingPrCount} icon={FileText} description="Awaiting authorization" />
        <StatCard title="Total Commitments" value={`Ksh ${totalLpoValue.toLocaleString()}`} icon={ShoppingCart} description={`FY ${selectedYear} LPOs`} />
        <StatCard title="Dispatched Orders" value={filteredLpos.filter(l => l.status === 'Dispatched').length} icon={Truck} description="Pending fulfillment" />
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 mb-6">
          <TabsList className="grid w-full sm:w-[320px] grid-cols-2 bg-muted/50 p-1">
            <TabsTrigger value="requisitions" className="text-[10px] font-black uppercase">Requisitions</TabsTrigger>
            <TabsTrigger value="lpos" className="text-[10px] font-black uppercase">Purchase Orders</TabsTrigger>
          </TabsList>

          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder={`Search ${activeTab === 'requisitions' ? 'requests' : 'orders'}...`} 
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
                    {isDetailed && <TableHead className="font-bold uppercase text-[10px]">Budget</TableHead>}
                    <TableHead className="text-right font-bold uppercase text-[10px]">Total</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPrs.length > 0 ? (
                    filteredPrs.map((pr) => {
                      const total = calculatePRTotal(pr);
                      return (
                        <TableRow key={pr.id} className="group hover:bg-muted/5">
                          {isDetailed && <TableCell className="font-black text-primary text-xs">{pr.refNumber}</TableCell>}
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="font-bold text-xs truncate max-w-[200px] text-primary">{pr.items?.[0]?.description || 'Untitled'}</span>
                              {pr.items.length > 1 && <span className="text-[9px] text-muted-foreground font-medium">+{pr.items.length - 1} more items</span>}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={pr.status === 'Approved' ? 'secondary' : pr.status === 'Rejected' ? 'destructive' : 'outline'} className="text-[9px] uppercase px-1.5 h-4">
                              {pr.status}
                            </Badge>
                          </TableCell>
                          {isDetailed && <TableCell className="text-[10px] font-bold uppercase text-muted-foreground">{pr.budgetLine}</TableCell>}
                          <TableCell className="text-right font-black tracking-tighter text-xs">Ksh {total.toLocaleString()}</TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8 md:opacity-0 group-hover:opacity-100"><MoreVertical className="w-4 h-4" /></Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => { setEditingPr(pr); setIsPRDialogOpen(true); }} className="text-xs font-bold"><Pencil className="w-4 h-4 mr-2" /> Edit</DropdownMenuItem>
                                {pr.status === 'Pending Manager' && currentUser.role === 'Admin' && (
                                  <DropdownMenuItem onClick={() => updatePRStatus(pr.id, 'Approved')} className="text-xs font-bold text-accent"><CheckCircle className="w-4 h-4 mr-2" /> Authorize</DropdownMenuItem>
                                )}
                                <DropdownMenuItem onClick={() => setPrToDelete(pr)} className="text-xs font-bold text-destructive"><Trash2 className="w-4 h-4 mr-2" /> Delete</DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  ) : (
                    <TableRow>
                      <TableCell colSpan={isDetailed ? 6 : 4} className="h-48 text-center text-muted-foreground">
                        <p className="text-sm font-medium">No requisitions found.</p>
                      </TableCell>
                    </TableRow>
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
                    <TableHead className="font-bold uppercase text-[10px]">Cycle Status</TableHead>
                    <TableHead className="font-bold uppercase text-[10px]">Status</TableHead>
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
                          {lpo.status === 'Dispatched' ? <CycleTimer startTime={lpo.createdAt} /> : <span className="text-[10px] text-muted-foreground italic font-bold">Ended</span>}
                        </TableCell>
                        <TableCell>
                          <Badge variant={lpo.status === 'Fulfilled' ? 'secondary' : 'outline'} className="text-[9px] uppercase px-1.5 h-4">
                            {lpo.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-black tracking-tighter text-xs">Ksh {lpo.totalValue.toLocaleString()}</TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8 md:opacity-0 group-hover:opacity-100"><MoreVertical className="w-4 h-4" /></Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem className="text-xs font-bold"><Printer className="w-4 h-4 mr-2" /> Print PDF</DropdownMenuItem>
                              {lpo.status !== 'Fulfilled' && (
                                <DropdownMenuItem className="text-accent text-xs font-bold" onClick={() => setReceivingLpo(lpo)}><PackageCheck className="w-4 h-4 mr-2" /> Confirm Receipt</DropdownMenuItem>
                              )}
                              <DropdownMenuItem className="text-destructive text-xs font-bold" onClick={() => setLpoToVoid(lpo)}><Trash2 className="w-4 h-4 mr-2" /> Void Order</DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={isDetailed ? 6 : 5} className="h-48 text-center text-muted-foreground">
                        <p className="text-sm font-medium">No purchase orders found.</p>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Requisition Dialog */}
      <Dialog open={isPRDialogOpen} onOpenChange={setIsPRDialogOpen}>
        <DialogContent className="max-w-3xl w-[95vw] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl md:text-2xl font-black">{editingPr ? 'Update Requisition' : 'Draft Requisition'}</DialogTitle>
            <DialogDescription className="text-xs">Specify requirements and target budget for authorization.</DialogDescription>
          </DialogHeader>
          <Form {...prForm}>
            <form onSubmit={prForm.handleSubmit(onPRSubmit)} className="space-y-6 py-4">
              <FormField
                control={prForm.control}
                name="budget"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[10px] uppercase font-bold text-muted-foreground">Select Budget</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl><SelectTrigger className="h-10"><SelectValue placeholder="Target Budget Pool" /></SelectTrigger></FormControl>
                      <SelectContent>
                        {budgets.filter(b => b.fiscalYear === selectedYear).map(b => (
                          <SelectItem key={b.id} value={b.name} className="text-xs">{b.name} ({b.department})</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Item Specification</h3>
                  <Button type="button" variant="outline" size="sm" onClick={() => appendPr({ description: '', quantity: 1, estimatedUnitPrice: 0 })} className="h-8 text-[10px] font-bold uppercase">
                    <PlusCircle className="w-3.5 h-3.5 mr-1.5" /> Add Row
                  </Button>
                </div>
                
                <div className="space-y-3">
                  {prFields.map((field, index) => (
                    <div key={field.id} className="grid grid-cols-1 md:grid-cols-12 gap-3 items-start bg-muted/10 p-3 rounded-md border border-border/40 group">
                      <div className="md:col-span-6">
                        <FormField control={prForm.control} name={`items.${index}.description`} render={({ field }) => (
                          <FormItem><FormControl><Input placeholder="Description" {...field} className="h-9 text-xs" /></FormControl></FormItem>
                        )} />
                      </div>
                      <div className="md:col-span-2">
                        <FormField control={prForm.control} name={`items.${index}.quantity`} render={({ field }) => (
                          <FormItem><FormControl><Input type="number" {...field} className="h-9 text-xs" /></FormControl></FormItem>
                        )} />
                      </div>
                      <div className="md:col-span-3">
                        <FormField control={prForm.control} name={`items.${index}.estimatedUnitPrice`} render={({ field }) => (
                          <FormItem><FormControl><Input type="number" step="0.01" {...field} className="h-9 text-xs" /></FormControl></FormItem>
                        )} />
                      </div>
                      <div className="md:col-span-1 pt-1.5 flex justify-end">
                        <Button type="button" variant="ghost" size="icon" onClick={() => removePr(index)} className="h-8 w-8 text-destructive md:opacity-0 group-hover:opacity-100"><Trash className="w-4 h-4" /></Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <DialogFooter className="gap-2 pt-6 border-t flex-col sm:flex-row">
                <Button type="button" variant="outline" onClick={() => setIsPRDialogOpen(false)} className="font-bold uppercase text-[10px] h-10">Cancel</Button>
                <Button type="submit" className="bg-primary font-bold uppercase text-[10px] h-10 shadow-md">
                  {editingPr ? 'Save Revisions' : 'Launch for Approval'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* LPO Dispatch Dialog */}
      <Dialog open={isLPODialogOpen} onOpenChange={setIsLPODialogOpen}>
        <DialogContent className="max-w-xl w-[95vw]">
          <DialogHeader>
            <DialogTitle className="text-xl md:text-2xl font-black">Official LPO Dispatch</DialogTitle>
            <DialogDescription className="text-xs">Convert authorized requests into vendor commitments.</DialogDescription>
          </DialogHeader>
          <Form {...lpoForm}>
            <form onSubmit={lpoForm.handleSubmit(onLPOSubmit)} className="space-y-6 py-4">
              <FormField control={lpoForm.control} name="prId" render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[10px] uppercase font-bold text-muted-foreground">Authorized Request</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value} disabled={!!editingLpo}>
                    <FormControl><SelectTrigger className="h-10"><SelectValue placeholder="Select PR Reference" /></SelectTrigger></FormControl>
                    <SelectContent>
                      {approvedPrs.map(pr => (
                        <SelectItem key={pr.id} value={pr.id} className="text-xs">{pr.refNumber} - {pr.items[0]?.description}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormItem>
              )} />

              <FormField control={lpoForm.control} name="vendorId" render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[10px] uppercase font-bold text-muted-foreground">Select Vendor</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl><SelectTrigger className="h-10"><SelectValue placeholder="Strategic Partner" /></SelectTrigger></FormControl>
                    <SelectContent>
                      {vendors.map(v => <SelectItem key={v.id} value={v.id} className="text-xs">{v.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </FormItem>
              )} />

              <div className="grid grid-cols-2 gap-4">
                <FormField control={lpoForm.control} name="deliveryDate" render={({ field }) => (
                  <FormItem><FormLabel className="text-[10px] uppercase font-bold text-muted-foreground">Expected Receipt</FormLabel><FormControl><Input type="date" {...field} className="h-10 text-xs" /></FormControl></FormItem>
                )} />
                <FormField control={lpoForm.control} name="paymentTerms" render={({ field }) => (
                  <FormItem><FormLabel className="text-[10px] uppercase font-bold text-muted-foreground">Payment Window</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl><SelectTrigger className="h-10 text-xs"><SelectValue /></SelectTrigger></FormControl>
                      <SelectContent>
                        <SelectItem value="Immediate" className="text-xs">Immediate</SelectItem>
                        <SelectItem value="30 Days Net" className="text-xs">30 Days</SelectItem>
                        <SelectItem value="60 Days Net" className="text-xs">60 Days</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormItem>
                )} />
              </div>

              <DialogFooter className="gap-2 pt-6 border-t flex-col sm:flex-row">
                <Button type="button" variant="outline" onClick={() => setIsLPODialogOpen(false)} className="font-bold uppercase text-[10px] h-10">Cancel</Button>
                <Button type="submit" className="bg-primary font-bold uppercase text-[10px] h-10 shadow-md">Dispatch LPO</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Confirmation Dialogs */}
      <AlertDialog open={!!prToDelete} onOpenChange={(open) => !open && setPrToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-destructive">Purge Requisition?</AlertDialogTitle>
            <AlertDialogDescription>This will permanently delete {prToDelete?.refNumber}.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="text-[10px] font-bold uppercase">Keep</AlertDialogCancel>
            <AlertDialogAction onClick={() => { if(prToDelete) deletePR(prToDelete.id); setPrToDelete(null); }} className="bg-destructive text-white text-[10px] font-bold uppercase">Purge</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!lpoToVoid} onOpenChange={(open) => !open && setLpoToVoid(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-destructive">Void Commitment?</AlertDialogTitle>
            <AlertDialogDescription>This will cancel LPO {lpoToVoid?.lpoNumber} and revert the source requisition.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="text-[10px] font-bold uppercase">No</AlertDialogCancel>
            <AlertDialogAction onClick={() => { if(lpoToVoid) deleteLPO(lpoToVoid.id); setLpoToVoid(null); }} className="bg-destructive text-white text-[10px] font-bold uppercase">Void Order</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={!!receivingLpo} onOpenChange={(open) => !open && setReceivingLpo(null)}>
        <DialogContent className="max-w-md w-[95vw]">
          <DialogHeader><DialogTitle className="text-xl font-black">Confirm FY {selectedYear} Receipt</DialogTitle></DialogHeader>
          <div className="p-4 bg-muted/30 rounded-lg text-xs space-y-2">
            <div className="flex justify-between font-bold"><span>Vendor</span><span>{receivingLpo?.vendorName}</span></div>
            <div className="flex justify-between font-bold"><span>Value</span><span>Ksh {receivingLpo?.totalValue.toLocaleString()}</span></div>
          </div>
          <DialogFooter className="gap-2 pt-4 flex-col sm:flex-row">
            <Button variant="outline" onClick={() => setReceivingLpo(null)} className="font-bold uppercase text-xs h-10">Cancel</Button>
            <Button className="bg-accent font-bold uppercase text-xs h-10 shadow-md" onClick={() => receivingLpo && handleReceiveGoods(receivingLpo)}>Confirm Delivery</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function LPOsPage() {
  return (
    <Suspense fallback={<div className="p-10 text-center font-bold">Syncing Orders...</div>}>
      <OrdersHubContent />
    </Suspense>
  );
}
