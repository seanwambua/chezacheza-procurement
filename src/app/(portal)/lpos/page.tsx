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
    <div className="space-y-8 animate-in fade-in duration-500 pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className={cn(
            "font-headline font-bold text-primary",
            isDetailed ? "text-3xl" : "text-4xl"
          )}>
            Purchase Orders
          </h2>
          <p className="text-muted-foreground">Manage official vendor commitments, documented terms, and logistics.</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) setEditingLpo(null);
        }}>
          <DialogTrigger asChild>
            <Button className="bg-primary font-bold uppercase text-xs" onClick={() => setEditingLpo(null)}>
              <Plus className="w-4 h-4 mr-2" />
              Generate LPO
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold">
                {editingLpo ? `Revise Order ${editingLpo.lpoNumber}` : 'Convert Requisition to LPO'}
              </DialogTitle>
              <DialogDescription>
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
                        <FormControl><SelectTrigger className="bg-background"><SelectValue placeholder="Select approved request" /></SelectTrigger></FormControl>
                        <SelectContent>
                          {approvedPrs.map(pr => (
                            <SelectItem key={pr.id} value={pr.id}>
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
                        <FormControl><SelectTrigger className="bg-background"><SelectValue placeholder="Select authorized vendor" /></SelectTrigger></FormControl>
                        <SelectContent>
                          {vendors.map(v => <SelectItem key={v.id} value={v.id}>{v.name} ({v.category})</SelectItem>)}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField control={form.control} name="deliveryDate" render={({ field }) => (
                    <FormItem><FormLabel className="text-[10px] uppercase font-bold text-muted-foreground">Expected Delivery</FormLabel><FormControl><Input type="date" {...field} className="bg-background" /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="paymentTerms" render={({ field }) => (
                    <FormItem><FormLabel className="text-[10px] uppercase font-bold text-muted-foreground">Payment Window</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl><SelectTrigger className="bg-background"><SelectValue /></SelectTrigger></FormControl>
                        <SelectContent>
                          <SelectItem value="Immediate">Immediate Payment</SelectItem>
                          <SelectItem value="30 Days Net">30 Days Net</SelectItem>
                          <SelectItem value="45 Days Net">45 Days Net</SelectItem>
                          <SelectItem value="60 Days Net">60 Days Net</SelectItem>
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
                      <FormDescription className="text-[10px]">
                        These terms will be appended to the official Purchase Order document.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <DialogFooter className="gap-2 sm:gap-0 border-t pt-6">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                  <Button type="submit" className="bg-primary shadow-sm">
                    {editingLpo ? 'Authorize Revisions' : 'Dispatch Official Order'}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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

      <Card className="border-border shadow-none overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between border-b py-4">
          <CardTitle className="text-lg font-headline">LPO Pipeline</CardTitle>
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Search LPOs or Vendors..." 
              className="pl-9 h-9 text-xs" 
              value={search} 
              onChange={(e) => setSearch(e.target.value)} 
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30">
                  {isDetailed && <TableHead className="w-[120px]">Reference</TableHead>}
                  <TableHead>Vendor</TableHead>
                  <TableHead>Status</TableHead>
                  {isDetailed && <TableHead>Terms</TableHead>}
                  <TableHead className="text-right">Total Commitment</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLpos.length > 0 ? (
                  filteredLpos.map((lpo) => (
                    <TableRow key={lpo.id} className="group hover:bg-muted/5">
                      {isDetailed && <TableCell className="font-bold text-primary text-xs">{lpo.lpoNumber}</TableCell>}
                      <TableCell>
                        <div className="flex flex-col">
                          <span className={cn(
                            "font-bold",
                            isDetailed ? "text-sm" : "text-base text-primary"
                          )}>
                            {lpo.vendorName}
                          </span>
                          {lpo.items.length > 0 && !isDetailed && (
                            <span className="text-[10px] text-muted-foreground truncate max-w-[200px]">{lpo.items[0].description}</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={lpo.status === 'Fulfilled' ? 'secondary' : 'outline'} className="text-[9px] uppercase px-1.5 py-0 h-4">
                          {lpo.status}
                        </Badge>
                      </TableCell>
                      {isDetailed && (
                        <TableCell className="text-[10px] font-medium text-muted-foreground">
                          {lpo.paymentTerms}
                        </TableCell>
                      )}
                      <TableCell className={cn(
                        "text-right font-black tracking-tighter",
                        isDetailed ? "text-sm" : "text-lg text-primary"
                      )}>
                        Ksh {lpo.totalValue.toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem className="text-xs">
                              <Printer className="w-4 h-4 mr-2" /> Print PDF
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => { setEditingLpo(lpo); setIsDialogOpen(true); }} className="text-xs">
                              <Pencil className="w-4 h-4 mr-2" /> Review / Edit Details
                            </DropdownMenuItem>
                            {lpo.status !== 'Fulfilled' && (
                              <DropdownMenuItem className="text-green-600 text-xs font-bold" onClick={() => setReceivingLpo(lpo)}>
                                <PackageCheck className="w-4 h-4 mr-2" /> Confirm Receipt
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem className="text-destructive text-xs" onClick={() => handleDeleteLPO(lpo)}>
                              <Trash2 className="w-4 h-4 mr-2" /> Void LPO
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={isDetailed ? 6 : 4} className="h-32 text-center text-muted-foreground">
                      <div className="flex flex-col items-center justify-center space-y-2 opacity-50">
                        <ShoppingCart className="w-8 h-8" />
                        <p className="text-sm">No active purchase orders found.</p>
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
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <PackageCheck className="w-5 h-5 text-green-600" />
              Confirm Goods Receipt
            </DialogTitle>
            <DialogDescription>
              Marking {receivingLpo?.lpoNumber} as fulfilled will generate a GRN and finalize the transaction for audit.
            </DialogDescription>
          </DialogHeader>
          <div className="p-4 bg-muted/30 rounded-lg text-xs space-y-3 border">
            <div className="flex justify-between items-center pb-2 border-b">
              <span className="text-muted-foreground uppercase font-bold">Vendor</span>
              <span className="font-bold">{receivingLpo?.vendorName}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Total Line Items</span>
              <span className="font-bold">{receivingLpo?.items.length}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Settlement Value</span>
              <span className="font-bold text-primary">Ksh {receivingLpo?.totalValue.toLocaleString()}</span>
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setReceivingLpo(null)}>Cancel</Button>
            <Button className="bg-green-600 hover:bg-green-700" onClick={() => receivingLpo && handleReceiveGoods(receivingLpo)}>
              Confirm Delivery
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
