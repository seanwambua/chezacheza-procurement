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
  PackageCheck
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
import { LPO, calculatePRTotal, GRN } from '@/lib/types';

const lpoSchema = z.object({
  prId: z.string().min(1, "Requisition is required"),
  vendorId: z.string().min(1, "Vendor is required"),
  deliveryDate: z.string().min(1, "Delivery date is required"),
  paymentTerms: z.string().min(1, "Payment terms are required"),
});

type LPOFormValues = z.infer<typeof lpoSchema>;

export default function LPOsPage() {
  const { lpos, prs, vendors, addLPO, updatePRStatus, addGRN } = useStore();
  const { currentUser } = useUserStore();
  const { toast } = useToast();
  const [mounted, setMounted] = useState(false);
  const [search, setSearch] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [receivingLpo, setReceivingLpo] = useState<LPO | null>(null);

  const form = useForm<LPOFormValues>({
    resolver: zodResolver(lpoSchema),
    defaultValues: {
      prId: '',
      vendorId: '',
      deliveryDate: '',
      paymentTerms: '30 Days Net',
    },
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || !currentUser) return null;

  const filteredLpos = lpos.filter(lpo => 
    lpo.lpoNumber.toLowerCase().includes(search.toLowerCase()) ||
    lpo.vendorName.toLowerCase().includes(search.toLowerCase())
  );

  const approvedPrs = prs.filter(pr => pr.status === 'Approved');
  const totalValue = lpos.reduce((acc, lpo) => acc + lpo.totalValue, 0);

  const onSubmit = (values: LPOFormValues) => {
    const selectedPr = prs.find(p => p.id === values.prId);
    const selectedVendor = vendors.find(v => v.id === values.vendorId);
    if (!selectedPr || !selectedVendor) return;

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
      status: 'Dispatched',
      createdAt: new Date().toISOString(),
    };

    addLPO(newLpo);
    updatePRStatus(values.prId, 'LPO Generated');
    setIsDialogOpen(false);
    form.reset();
    toast({ title: "LPO Dispatched", description: `Order ${newLpo.lpoNumber} sent to ${selectedVendor.name}.` });
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
    toast({ title: "Goods Received", description: `GRN generated for ${lpo.lpoNumber}.` });
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-headline font-bold text-primary">Purchase Orders</h2>
          <p className="text-muted-foreground">Manage official vendor commitments and logistics.</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary">
              <Plus className="w-4 h-4 mr-2" />
              Generate LPO
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-xl">
            <DialogHeader>
              <DialogTitle>Convert Requisition to LPO</DialogTitle>
              <DialogDescription>Assign a vendor and terms to an approved request.</DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
                <FormField
                  control={form.control}
                  name="prId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Approved Requisition</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger></FormControl>
                        <SelectContent>
                          {approvedPrs.map(pr => (
                            <SelectItem key={pr.id} value={pr.id}>{pr.refNumber} - Ksh {calculatePRTotal(pr).toLocaleString()}</SelectItem>
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
                      <FormLabel>Vendor</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl><SelectTrigger><SelectValue placeholder="Select vendor" /></SelectTrigger></FormControl>
                        <SelectContent>
                          {vendors.map(v => <SelectItem key={v.id} value={v.id}>{v.name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-2 gap-4">
                  <FormField control={form.control} name="deliveryDate" render={({ field }) => (
                    <FormItem><FormLabel>Delivery Date</FormLabel><FormControl><Input type="date" {...field} /></FormControl></FormItem>
                  )} />
                  <FormField control={form.control} name="paymentTerms" render={({ field }) => (
                    <FormItem><FormLabel>Terms</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                        <SelectContent>
                          <SelectItem value="30 Days Net">30 Days Net</SelectItem>
                          <SelectItem value="Immediate">Immediate</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )} />
                </div>
                <DialogFooter><Button type="submit">Dispatch LPO</Button></DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard title="Active Commitments" value={`Ksh ${totalValue.toLocaleString()}`} icon={ShoppingCart} />
        <StatCard title="Pending Fulfillment" value={lpos.filter(l => l.status === 'Dispatched').length} icon={Truck} />
        <StatCard title="Cycle Time" value="4.2 Days" icon={Calendar} />
      </div>

      <Card className="border-border shadow-none">
        <CardHeader className="flex flex-row items-center justify-between border-b py-4">
          <CardTitle className="text-lg">LPO Pipeline</CardTitle>
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Search LPOs..." className="pl-9 h-9" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30">
                <TableHead>LPO #</TableHead>
                <TableHead>Vendor</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLpos.map((lpo) => (
                <TableRow key={lpo.id} className="group hover:bg-muted/5">
                  <TableCell className="font-bold text-primary">{lpo.lpoNumber}</TableCell>
                  <TableCell>{lpo.vendorName}</TableCell>
                  <TableCell>
                    <Badge variant={lpo.status === 'Fulfilled' ? 'secondary' : 'outline'} className="text-[10px]">
                      {lpo.status.toUpperCase()}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-black">Ksh {lpo.totalValue.toLocaleString()}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreVertical className="w-4 h-4" /></Button></DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem><Printer className="w-4 h-4 mr-2" /> Print PDF</DropdownMenuItem>
                        {lpo.status !== 'Fulfilled' && (
                          <DropdownMenuItem className="text-green-600" onClick={() => setReceivingLpo(lpo)}>
                            <PackageCheck className="w-4 h-4 mr-2" /> Receive Goods
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={!!receivingLpo} onOpenChange={(open) => !open && setReceivingLpo(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Goods Receipt</DialogTitle>
            <DialogDescription>
              Marking {receivingLpo?.lpoNumber} as fulfilled will generate a GRN and finalize the transaction.
            </DialogDescription>
          </DialogHeader>
          <div className="p-4 bg-muted/30 rounded-lg text-sm space-y-2">
            <div className="flex justify-between"><span>Vendor:</span><span className="font-bold">{receivingLpo?.vendorName}</span></div>
            <div className="flex justify-between"><span>Total Items:</span><span className="font-bold">{receivingLpo?.items.length}</span></div>
            <div className="flex justify-between"><span>Value:</span><span className="font-bold">Ksh {receivingLpo?.totalValue.toLocaleString()}</span></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setReceivingLpo(null)}>Cancel</Button>
            <Button onClick={() => receivingLpo && handleReceiveGoods(receivingLpo)}>Confirm Receipt</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
