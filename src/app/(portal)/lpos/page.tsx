"use client";

import { useState, useEffect } from 'react';
import { useStore } from '@/lib/store';
import { useUserStore } from '@/lib/user-store';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { 
  ShoppingCart, 
  Plus, 
  Search, 
  MoreVertical, 
  Printer, 
  Truck, 
  CheckCircle, 
  Building2,
  Calendar,
  PackageCheck,
  Pencil,
  Trash2,
  AlertTriangle,
  FileText
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
  FormDescription,
} from "@/components/ui/form";
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
import { LPO, calculatePRTotal, GRN, PurchaseRequisition } from '@/lib/types';
import { cn } from '@/lib/utils';

const lpoSchema = z.object({
  prId: z.string().min(1, "Requisition is required"),
  vendorId: z.string().min(1, "Vendor is required"),
  deliveryDate: z.string().min(1, "Delivery date is required"),
  paymentTerms: z.string().min(1, "Payment terms are required"),
  additionalTerms: z.string().optional(),
});

type LPOFormValues = z.infer<typeof lpoSchema>;

export default function LPOsPage() {
  const { lpos, prs, vendors, addLPO, updateLPO, deleteLPO, updatePRStatus, addGRN } = useStore();
  const { currentUser, viewPreference } = useUserStore();
  const { toast } = useToast();
  const [mounted, setMounted] = useState(false);
  const [search, setSearch] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingLpo, setEditingLpo] = useState<LPO | null>(null);
  const [receivingLpo, setReceivingLpo] = useState<LPO | null>(null);

  const isDetailed = viewPreference === 'detailed';

  const form = useForm<LPOFormValues>({
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

  useEffect(() => {
    if (editingLpo) {
      form.reset({
        prId: editingLpo.prId,
        vendorId: editingLpo.vendorId,
        deliveryDate: editingLpo.deliveryDate,
        paymentTerms: editingLpo.paymentTerms,
        additionalTerms: editingLpo.additionalTerms || '',
      });
    } else {
      form.reset({
        prId: '',
        vendorId: '',
        deliveryDate: '',
        paymentTerms: '30 Days Net',
        additionalTerms: '',
      });
    }
  }, [editingLpo, form, isDialogOpen]);

  if (!mounted || !currentUser) return null;

  const filteredLpos = lpos.filter(lpo => 
    lpo.lpoNumber.toLowerCase().includes(search.toLowerCase()) ||
    lpo.vendorName.toLowerCase().includes(search.toLowerCase())
  );

  const approvedPrs = prs.filter(pr => pr.status === 'Approved' || (editingLpo && pr.id === editingLpo.prId));
  const totalValue = lpos.reduce((acc, lpo) => acc + lpo.totalValue, 0);

  const onSubmit = (values: LPOFormValues) => {
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
      toast({ 
        title: "LPO Updated", 
        description: `Commitment ${editingLpo.lpoNumber} for ${selectedVendor.name} has been revised.` 
      });
    } else {
      const prTotal = calculatePRTotal(selectedPr);
      const newLpo: LPO = {
        id: `LPO-${Math.floor(Math.random() * 10000)}`,
        lpoNumber: `LPO/2024/${String(lpos.length + 1).padStart(3, '0')}`,
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
      };

      addLPO(newLpo);
      updatePRStatus(values.prId, 'LPO Generated');
      toast({ 
        title: "LPO Dispatched", 
        description: `Official order ${newLpo.lpoNumber} has been issued to ${selectedVendor.name}.` 
      });
    }

    setIsDialogOpen(false);
    setEditingLpo(null);
  };

  const handleDeleteLPO = (lpo: LPO) => {
    if (confirm(`CRITICAL: Are you sure you want to delete LPO ${lpo.lpoNumber}? The associated requisition will be reverted to 'Approved' status.`)) {
      deleteLPO(lpo.id);
      updatePRStatus(lpo.prId, 'Approved');
      toast({
        title: "LPO Rescinded",
        description: `Commitment deleted. Requisition associated with ${lpo.lpoNumber} has been unlocked.`
      });
    }
  };

  const handleReceiveGoods = (lpo: LPO) => {
    const newGrn: GRN = {
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
    };

    addGRN(newGrn);
    setReceivingLpo(null);
    toast({ title: "Receipt Confirmed", description: `GRN generated for ${lpo.lpoNumber}. Stock levels updated.` });
  };

  return (
    <div className="space-y-6 md:space-y-8 animate-in fade-in duration-500 pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <h2 className={cn(
            "font-headline font-bold text-primary tracking-tighter leading-tight",
            isDetailed ? "text-2xl md:text-3xl" : "text-3xl md:text-4xl"
          )}>
            Purchase Orders
          </h2>
          <p className="text-sm text-muted-foreground font-medium">Manage official vendor commitments, documented terms, and logistics.</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) setEditingLpo(null);
        }}>
          <DialogTrigger asChild>
            <Button className="w-full md:w-auto bg-primary font-bold uppercase text-xs h-10 shadow-sm" onClick={() => setEditingLpo(null)}>
              <Plus className="w-4 h-4 mr-2" />
              Generate LPO
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-xl w-[95vw] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-xl md:text-2xl font-black tracking-tight">
                {editingLpo ? `Revise Order ${editingLpo.lpoNumber}` : 'Convert Requisition to LPO'}
              </DialogTitle>
              <DialogDescription className="text-xs font-medium">
                Establish vendor commitments and document specific terms of engagement.
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 py-4">
                <FormField
                  control={form.control}
                  name="prId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[10px] uppercase font-bold text-muted-foreground">Source Requisition</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        value={field.value}
                        disabled={!!editingLpo}
                      >
                        <FormControl><SelectTrigger className="bg-background h-10"><SelectValue placeholder="Select approved request" /></SelectTrigger></FormControl>
                        <SelectContent>
                          {approvedPrs.map(pr => (
                            <SelectItem key={pr.id} value={pr.id} className="text-xs">
                              {pr.refNumber} - Ksh {calculatePRTotal(pr).toLocaleString()}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="vendorId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[10px] uppercase font-bold text-muted-foreground">Assign Vendor</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl><SelectTrigger className="bg-background h-10"><SelectValue placeholder="Select authorized vendor" /></SelectTrigger></FormControl>
                        <SelectContent>
                          {vendors.map(v => <SelectItem key={v.id} value={v.id} className="text-xs">{v.name} ({v.category})</SelectItem>)}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField control={form.control} name="deliveryDate" render={({ field }) => (
                    <FormItem><FormLabel className="text-[10px] uppercase font-bold text-muted-foreground">Expected Delivery</FormLabel><FormControl><Input type="date" {...field} className="bg-background h-10 text-xs" /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="paymentTerms" render={({ field }) => (
                    <FormItem><FormLabel className="text-[10px] uppercase font-bold text-muted-foreground">Payment Window</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl><SelectTrigger className="bg-background h-10"><SelectValue /></SelectTrigger></FormControl>
                        <SelectContent>
                          <SelectItem value="Immediate" className="text-xs">Immediate Payment</SelectItem>
                          <SelectItem value="30 Days Net" className="text-xs">30 Days Net</SelectItem>
                          <SelectItem value="45 Days Net" className="text-xs">45 Days Net</SelectItem>
                          <SelectItem value="60 Days Net" className="text-xs">60 Days Net</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>

                <FormField
                  control={form.control}
                  name="additionalTerms"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[10px] uppercase font-bold text-muted-foreground">Documented Additional Terms</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Specify quality standards, shipping instructions, or penalty clauses..." 
                          className="bg-background min-h-[100px] text-xs" 
                          {...field} 
                        />
                      </FormControl>
                      <FormDescription className="text-[10px] font-medium leading-tight">
                        These terms will be appended to the official Purchase Order document.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <DialogFooter className="gap-2 sm:gap-0 border-t pt-6 flex-col sm:flex-row">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)} className="w-full sm:w-auto font-bold uppercase text-xs h-10">Cancel</Button>
                  <Button type="submit" className="w-full sm:w-auto bg-primary shadow-md font-bold uppercase text-xs h-10">
                    {editingLpo ? 'Authorize Revisions' : 'Dispatch Official Order'}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        <StatCard 
          title="Active Commitments" 
          value={`Ksh ${totalValue.toLocaleString()}`} 
          icon={ShoppingCart} 
          description={isDetailed ? "Verified orders in field" : undefined} 
        />
        <StatCard 
          title="Pending Fulfillment" 
          value={lpos.filter(l => l.status === 'Dispatched').length} 
          icon={Truck} 
        />
        <StatCard 
          title="Avg. Cycle Time" 
          value="4.2 Days" 
          icon={Calendar} 
        />
      </div>

      <Card className="border-border shadow-none overflow-hidden bg-card">
        <CardHeader className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between border-b py-4 px-4 sm:px-6 gap-4">
          <CardTitle className="text-lg font-headline">LPO Pipeline</CardTitle>
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Search LPOs or Vendors..." 
              className="w-full pl-9 h-10 text-xs bg-muted/30 border-none shadow-none focus-visible:ring-1" 
              value={search} 
              onChange={(e) => setSearch(e.target.value)} 
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto w-full">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30 border-none">
                  {isDetailed && <TableHead className="w-[120px] font-bold uppercase text-[10px]">Reference</TableHead>}
                  <TableHead className="min-w-[150px] font-bold uppercase text-[10px]">Vendor</TableHead>
                  <TableHead className="font-bold uppercase text-[10px]">Status</TableHead>
                  {isDetailed && <TableHead className="font-bold uppercase text-[10px]">Terms</TableHead>}
                  <TableHead className="text-right font-bold uppercase text-[10px]">Commitment</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLpos.length > 0 ? (
                  filteredLpos.map((lpo) => (
                    <TableRow key={lpo.id} className="group hover:bg-muted/5">
                      {isDetailed && <TableCell className="font-black text-primary text-xs">{lpo.lpoNumber}</TableCell>}
                      <TableCell>
                        <div className="flex flex-col min-w-0">
                          <span className={cn(
                            "font-bold truncate",
                            isDetailed ? "text-xs" : "text-sm text-primary"
                          )}>
                            {lpo.vendorName}
                          </span>
                          {lpo.items.length > 0 && !isDetailed && (
                            <span className="text-[10px] text-muted-foreground truncate max-w-[160px] font-medium uppercase tracking-tight">
                              {lpo.items[0].description}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={lpo.status === 'Fulfilled' ? 'secondary' : 'outline'} className="text-[9px] uppercase px-1.5 py-0 h-4 tracking-tighter">
                          {lpo.status}
                        </Badge>
                      </TableCell>
                      {isDetailed && (
                        <TableCell className="text-[10px] font-bold uppercase text-muted-foreground">
                          {lpo.paymentTerms}
                        </TableCell>
                      )}
                      <TableCell className={cn(
                        "text-right font-black tracking-tighter whitespace-nowrap",
                        isDetailed ? "text-xs" : "text-base text-primary"
                      )}>
                        Ksh {lpo.totalValue.toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 md:opacity-0 group-hover:opacity-100 transition-opacity">
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem className="text-xs font-bold">
                              <Printer className="w-4 h-4 mr-2" /> Print PDF
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => { setEditingLpo(lpo); setIsDialogOpen(true); }} className="text-xs font-bold">
                              <Pencil className="w-4 h-4 mr-2" /> Review / Edit
                            </DropdownMenuItem>
                            {lpo.status !== 'Fulfilled' && (
                              <DropdownMenuItem className="text-accent text-xs font-bold" onClick={() => setReceivingLpo(lpo)}>
                                <PackageCheck className="w-4 h-4 mr-2" /> Confirm Receipt
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem className="text-destructive text-xs font-bold" onClick={() => handleDeleteLPO(lpo)}>
                              <Trash2 className="w-4 h-4 mr-2" /> Void LPO
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={isDetailed ? 6 : 4} className="h-48 text-center text-muted-foreground">
                      <div className="flex flex-col items-center justify-center space-y-3 opacity-50">
                        <div className="p-4 bg-muted rounded-full">
                          <ShoppingCart className="w-8 h-8" />
                        </div>
                        <p className="text-sm font-medium">No active purchase orders found.</p>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={!!receivingLpo} onOpenChange={(open) => !open && setReceivingLpo(null)}>
        <DialogContent className="max-w-md w-[95vw] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl font-black tracking-tight">
              <PackageCheck className="w-5 h-5 text-accent" />
              Confirm Goods Receipt
            </DialogTitle>
            <DialogDescription className="text-xs font-medium">
              Marking {receivingLpo?.lpoNumber} as fulfilled will generate a GRN and finalize the transaction for audit.
            </DialogDescription>
          </DialogHeader>
          <div className="p-4 bg-muted/30 rounded-lg text-xs space-y-3 border border-border/50">
            <div className="flex justify-between items-center pb-2 border-b border-border/50">
              <span className="text-muted-foreground uppercase font-bold tracking-tight">Vendor</span>
              <span className="font-bold text-primary text-right">{receivingLpo?.vendorName}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground uppercase font-bold tracking-tight">Total Line Items</span>
              <span className="font-bold">{receivingLpo?.items.length}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground uppercase font-bold tracking-tight">Settlement Value</span>
              <span className="font-black text-primary tracking-tighter">Ksh {receivingLpo?.totalValue.toLocaleString()}</span>
            </div>
          </div>
          <DialogFooter className="gap-2 pt-4 flex-col sm:flex-row">
            <Button variant="outline" onClick={() => setReceivingLpo(null)} className="w-full sm:w-auto font-bold uppercase text-xs h-10">Cancel</Button>
            <Button className="bg-accent hover:bg-accent/90 w-full sm:w-auto font-bold uppercase text-xs shadow-md h-10" onClick={() => receivingLpo && handleReceiveGoods(receivingLpo)}>
              Confirm Delivery
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}