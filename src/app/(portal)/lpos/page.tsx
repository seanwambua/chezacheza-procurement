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
  Calendar,
  PackageCheck,
  Trash2,
  AlertCircle
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
} from "@/components/ui/dropdown-menu";
import { useToast } from '@/hooks/use-toast';
import { LPO, calculatePRTotal } from '@/lib/types';
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
  const { lpos, prs, vendors, addLPO, updateLPO, deleteLPO, updatePRStatus, addGRN, selectedYear } = useStore();
  const { currentUser, viewPreference } = useUserStore();
  const { toast } = useToast();
  const [mounted, setMounted] = useState(false);
  const [search, setSearch] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingLpo, setEditingLpo] = useState<LPO | null>(null);
  const [lpoToVoid, setLpoToVoid] = useState<LPO | null>(null);
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
    lpo.fiscalYear === selectedYear &&
    (lpo.lpoNumber.toLowerCase().includes(search.toLowerCase()) ||
    lpo.vendorName.toLowerCase().includes(search.toLowerCase()))
  );

  const approvedPrs = prs.filter(pr => pr.fiscalYear === selectedYear && (pr.status === 'Approved' || (editingLpo && pr.id === editingLpo.prId)));
  const totalValue = filteredLpos.reduce((acc, lpo) => acc + lpo.totalValue, 0);

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
        description: `Commitment ${editingLpo.lpoNumber} revised.` 
      });
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
      toast({ 
        title: "LPO Dispatched", 
        description: `Order issued for FY ${selectedYear}.` 
      });
    }

    setIsDialogOpen(false);
    setEditingLpo(null);
  };

  const confirmVoid = () => {
    if (lpoToVoid) {
      deleteLPO(lpoToVoid.id);
      toast({
        title: "Order Voided",
        description: `LPO ${lpoToVoid.lpoNumber} has been successfully canceled and the source requisition reverted.`,
      });
      setLpoToVoid(null);
    }
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
    <div className="space-y-6 md:space-y-8 animate-in fade-in duration-500 pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <h2 className={cn(
            "font-headline font-bold text-primary tracking-tighter leading-tight",
            isDetailed ? "text-2xl md:text-3xl" : "text-3xl md:text-4xl"
          )}>
            Purchase Orders
          </h2>
          <p className="text-sm text-muted-foreground font-medium">LPOs for FY {selectedYear}.</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) setEditingLpo(null);
        }}>
          <DialogTrigger asChild>
            <Button className="w-full md:w-auto bg-primary font-bold uppercase text-xs h-10 shadow-sm">
              <Plus className="w-4 h-4 mr-2" />
              Generate LPO
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-xl w-[95vw] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-xl md:text-2xl font-black">FY {selectedYear} LPO Dispatch</DialogTitle>
              <DialogDescription className="text-xs font-medium">Convert approved FY {selectedYear} requisitions to official commitments.</DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 py-4">
                <FormField
                  control={form.control}
                  name="prId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[10px] uppercase font-bold text-muted-foreground">Source Requisition (FY {selectedYear})</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value} disabled={!!editingLpo}>
                        <FormControl><SelectTrigger><SelectValue placeholder="Select approved request" /></SelectTrigger></FormControl>
                        <SelectContent>
                          {approvedPrs.map(pr => (
                            <SelectItem key={pr.id} value={pr.id} className="text-xs">
                              {pr.refNumber} - Ksh {calculatePRTotal(pr).toLocaleString()}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
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
                        <FormControl><SelectTrigger><SelectValue placeholder="Select vendor" /></SelectTrigger></FormControl>
                        <SelectContent>
                          {vendors.map(v => <SelectItem key={v.id} value={v.id} className="text-xs">{v.name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField control={form.control} name="deliveryDate" render={({ field }) => (
                    <FormItem><FormLabel className="text-[10px] uppercase font-bold text-muted-foreground">Expected Delivery</FormLabel><FormControl><Input type="date" {...field} className="h-10 text-xs" /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="paymentTerms" render={({ field }) => (
                    <FormItem><FormLabel className="text-[10px] uppercase font-bold text-muted-foreground">Payment Window</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl><SelectTrigger className="h-10 text-sm"><SelectValue /></SelectTrigger></FormControl>
                        <SelectContent>
                          <SelectItem value="Immediate" className="text-xs">Immediate</SelectItem>
                          <SelectItem value="30 Days Net" className="text-xs">30 Days</SelectItem>
                          <SelectItem value="60 Days Net" className="text-xs">60 Days</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )} />
                </div>

                <FormField control={form.control} name="additionalTerms" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[10px] uppercase font-bold text-muted-foreground">Terms & Instructions</FormLabel>
                    <FormControl><Textarea placeholder="..." className="min-h-[100px] text-xs" {...field} /></FormControl>
                  </FormItem>
                )} />

                <DialogFooter className="gap-2 sm:gap-0 pt-6 border-t flex-col sm:flex-row">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)} className="w-full sm:w-auto font-bold uppercase text-xs h-10">Cancel</Button>
                  <Button type="submit" className="w-full sm:w-auto bg-primary shadow-md font-bold uppercase text-xs h-10">
                    {editingLpo ? 'Authorize Revisions' : 'Dispatch LPO'}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        <StatCard title="Total Commitments" value={`Ksh ${totalValue.toLocaleString()}`} icon={ShoppingCart} description={`Verified FY ${selectedYear} orders`} />
        <StatCard title="Pending Fulfillment" value={filteredLpos.filter(l => l.status === 'Dispatched').length} icon={Truck} />
        <StatCard title="Fiscal Period" value={`FY ${selectedYear}`} icon={Calendar} />
      </div>

      <Card className="border-border shadow-none overflow-hidden bg-card">
        <div className="overflow-x-auto w-full">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30 border-none">
                {isDetailed && <TableHead className="w-[120px] font-bold uppercase text-[10px]">Reference</TableHead>}
                <TableHead className="min-w-[150px] font-bold uppercase text-[10px]">Vendor</TableHead>
                <TableHead className="font-bold uppercase text-[10px]">Cycle Status</TableHead>
                <TableHead className="font-bold uppercase text-[10px]">Status</TableHead>
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
                      <span className="font-bold text-xs text-primary">{lpo.vendorName}</span>
                    </TableCell>
                    <TableCell>
                      {lpo.status === 'Dispatched' ? (
                        <CycleTimer startTime={lpo.createdAt} />
                      ) : (
                        <span className="text-[10px] text-muted-foreground font-bold uppercase italic">Cycle End</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={lpo.status === 'Fulfilled' ? 'secondary' : 'outline'} className="text-[9px] uppercase px-1.5 py-0 h-4">
                        {lpo.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-black tracking-tighter text-xs">
                      Ksh {lpo.totalValue.toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 md:opacity-0 group-hover:opacity-100 transition-opacity"><MoreVertical className="w-4 h-4" /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem className="text-xs font-bold"><Printer className="w-4 h-4 mr-2" /> Print</DropdownMenuItem>
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
                    <p className="text-sm font-medium">No LPOs for FY {selectedYear}.</p>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      <AlertDialog open={!!lpoToVoid} onOpenChange={(open) => !open && setLpoToVoid(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-destructive flex items-center gap-2">
              <AlertCircle className="w-5 h-5" />
              Void Commitment {lpoToVoid?.lpoNumber}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently cancel the order. Any associated Goods Received Notes (GRNs) will also be purged. 
              The budget commitment will be adjusted, and the source requisition will revert to 'Approved' status.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="text-xs font-bold uppercase">Keep Active</AlertDialogCancel>
            <AlertDialogAction onClick={confirmVoid} className="bg-destructive hover:bg-destructive/90 text-white text-xs font-bold uppercase">
              Void Order
            </AlertDialogAction>
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
