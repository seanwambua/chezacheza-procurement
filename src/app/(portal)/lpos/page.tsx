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
  Clock,
  Building2,
  Calendar
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
import { LPO, calculatePRTotal } from '@/lib/types';

const lpoSchema = z.object({
  prId: z.string().min(1, "Requisition is required"),
  vendorId: z.string().min(1, "Vendor is required"),
  deliveryDate: z.string().min(1, "Delivery date is required"),
  paymentTerms: z.string().min(1, "Payment terms are required"),
});

type LPOFormValues = z.infer<typeof lpoSchema>;

export default function LPOsPage() {
  const { lpos, prs, vendors, addLPO, updatePRStatus } = useStore();
  const { currentUser } = useUserStore();
  const { toast } = useToast();
  const [mounted, setMounted] = useState(false);
  const [search, setSearch] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);

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
  const pendingDeliveries = lpos.filter(lpo => lpo.status === 'Dispatched').length;

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
    
    toast({
      title: "LPO Generated",
      description: `Order ${newLpo.lpoNumber} has been dispatched to ${selectedVendor.name}.`,
    });
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
              <DialogDescription>
                Select an approved multi-item requisition to initiate the purchase order process.
              </DialogDescription>
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
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a request" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {approvedPrs.map(pr => (
                            <SelectItem key={pr.id} value={pr.id}>
                              {pr.refNumber} - {pr.items[0]?.description}... (Ksh {calculatePRTotal(pr).toLocaleString()})
                            </SelectItem>
                          ))}
                          {approvedPrs.length === 0 && (
                            <div className="p-2 text-xs text-center text-muted-foreground">No approved requisitions available</div>
                          )}
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
                      <FormLabel>Assign Vendor</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select vendor" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {vendors.map(v => (
                            <SelectItem key={v.id} value={v.id}>{v.name} ({v.category})</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="deliveryDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Expected Delivery</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="paymentTerms"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Payment Terms</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Terms" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Immediate">Immediate</SelectItem>
                            <SelectItem value="7 Days Net">7 Days Net</SelectItem>
                            <SelectItem value="15 Days Net">15 Days Net</SelectItem>
                            <SelectItem value="30 Days Net">30 Days Net</SelectItem>
                            <SelectItem value="60 Days Net">60 Days Net</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <DialogFooter className="pt-4">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                  <Button type="submit">Confirm & Dispatch</Button>
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
          description="Total value of open orders"
          tooltip="The sum total of all purchase orders currently dispatched and awaiting fulfillment."
        />
        <StatCard 
          title="Pending Deliveries" 
          value={pendingDeliveries} 
          icon={Truck} 
          description="Orders in transit"
          tooltip="Number of purchase orders that have been sent to vendors but are not yet received."
        />
        <StatCard 
          title="Avg. Fulfillment" 
          value="4.2 Days" 
          icon={Clock} 
          description="Order to delivery"
          tooltip="Average time taken from LPO dispatch to full receipt of goods based on historical data."
        />
      </div>

      <Card className="border-border shadow-none">
        <CardHeader className="flex flex-row items-center justify-between border-b border-border/50 py-4 px-6">
          <CardTitle className="text-lg">LPO Pipeline</CardTitle>
          <div className="flex items-center gap-4">
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input 
                placeholder="Search LPOs or Vendors..." 
                className="pl-9 h-9 text-xs"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30">
                  <TableHead>LPO Number</TableHead>
                  <TableHead>Vendor</TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead>Delivery Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Total Value</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLpos.length > 0 ? (
                  filteredLpos.map((lpo) => (
                    <TableRow key={lpo.id} className="group hover:bg-muted/5">
                      <TableCell className="font-bold text-primary">{lpo.lpoNumber}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Building2 className="w-3.5 h-3.5 text-muted-foreground" />
                          <span className="text-xs font-medium">{lpo.vendorName}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="text-xs truncate max-w-[200px]">{lpo.items[0]?.description}</span>
                          {lpo.items.length > 1 && (
                            <span className="text-[10px] text-muted-foreground">+{lpo.items.length - 1} more items</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 text-xs">
                          <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                          {new Date(lpo.deliveryDate).toLocaleDateString()}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={
                          lpo.status === 'Fulfilled' ? 'secondary' : 
                          lpo.status === 'Dispatched' ? 'outline' : 'default'
                        } className="text-[10px] px-2 py-0">
                          {lpo.status.toUpperCase()}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-black">
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
                            <DropdownMenuItem>
                              <Printer className="w-4 h-4 mr-2" /> Print LPO
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Truck className="w-4 h-4 mr-2" /> Track Shipment
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-green-600">
                              <CheckCircle className="w-4 h-4 mr-2" /> Mark Received
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="h-32 text-center text-muted-foreground">
                      <div className="flex flex-col items-center justify-center space-y-2">
                        <ShoppingCart className="w-8 h-8 opacity-20" />
                        <p className="text-sm">No purchase orders found.</p>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
