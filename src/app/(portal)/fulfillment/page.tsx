"use client";

import { useState, useEffect } from 'react';
import { useStore } from '@/lib/store';
import { useUserStore } from '@/lib/user-store';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { 
  Zap, 
  Truck, 
  Search, 
  MoreVertical, 
  PackageCheck, 
  ShieldCheck, 
  UserPlus, 
  Eye, 
  Printer, 
  AlertTriangle,
  History,
  CheckCircle2,
  Clock,
  Lock,
  MessageSquareMore,
  Star,
  Send
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
import { CycleTimer } from '@/components/procurement/CycleTimer';
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
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { LPO, calculatePRTotal, PurchaseRequisition, GRN } from '@/lib/types';
import { cn } from '@/lib/utils';
import { RoleGuard } from '@/components/auth/RoleGuard';

const lpoSchema = z.object({
  prId: z.string().min(1, "Requisition is required"),
  vendorId: z.string().min(1, "Vendor is required"),
  deliveryDate: z.string().min(1, "Delivery date is required"),
  paymentTerms: z.string().min(1, "Payment terms are required"),
});

type LPOFormValues = z.infer<typeof lpoSchema>;

export default function FulfillmentPage() {
  const { 
    lpos, prs, vendors, addLPO, addGRN, addFeedback, selectedYear 
  } = useStore();
  const { currentUser, viewPreference } = useUserStore();
  const { toast } = useToast();
  
  const [mounted, setMounted] = useState(false);
  const [search, setSearch] = useState('');
  
  const [isLPODialogOpen, setIsLPODialogOpen] = useState(false);
  const [receivingLpo, setReceivingLpo] = useState<LPO | null>(null);
  const [viewingLpo, setViewingLpo] = useState<LPO | null>(null);

  // Feedback State
  const [isFeedbackDialogOpen, setIsFeedbackDialogOpen] = useState(false);
  const [feedbackRating, setFeedbackRating] = useState(5);
  const [feedbackComment, setFeedbackComment] = useState('');

  const isDetailed = viewPreference === 'detailed';

  const lpoForm = useForm<LPOFormValues>({
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

  // 1. Queue: Approved PRs awaiting vendor assignment
  const assignmentQueue = (prs || []).filter(pr => 
    pr.fiscalYear === selectedYear && pr.status === 'Approved' &&
    (pr.refNumber.toLowerCase().includes(search.toLowerCase()) ||
     pr.items?.[0]?.description.toLowerCase().includes(search.toLowerCase()))
  );

  // 2. Cycle: Dispatched LPOs awaiting fulfillment
  const activeCycle = (lpos || []).filter(lpo => 
    lpo.fiscalYear === selectedYear && lpo.status === 'Dispatched' &&
    (lpo.lpoNumber.toLowerCase().includes(search.toLowerCase()) ||
     lpo.vendorName.toLowerCase().includes(search.toLowerCase()))
  );

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
      createdAt: new Date().toISOString(),
    });

    toast({ title: "Agreement Dispatched", description: "The fulfillment timer has started." });
    setIsLPODialogOpen(false);
    lpoForm.reset();
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
        condition: 'Good' as const 
      })),
      disputeFlag: false
    });

    setReceivingLpo(null);
    toast({ title: "Receipt Verified", description: "Cycle stopped. Record moved to Delivery Ledger." });
  };

  const handleFeedbackSubmit = () => {
    if (!receivingLpo || !feedbackComment) return;

    addFeedback({
      vendorId: receivingLpo.vendorId,
      vendorName: receivingLpo.vendorName,
      authorName: currentUser?.name || 'Unknown User',
      rating: feedbackRating,
      comment: feedbackComment
    });

    toast({
      title: "Feedback Recorded",
      description: `Your qualitative feedback for ${receivingLpo.vendorName} has been recorded.`
    });

    setIsFeedbackDialogOpen(false);
    setFeedbackComment('');
    setFeedbackRating(5);
  };

  return (
    <div className="space-y-6 md:space-y-8 animate-in fade-in duration-500 pb-10 max-w-full overflow-hidden">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="min-w-0 flex-1">
          <h2 className="text-3xl md:text-4xl font-headline font-bold text-primary tracking-tighter leading-tight truncate">
            Fulfillment Pipeline
          </h2>
          <p className="text-muted-foreground text-sm font-medium">Strategic assignment and active shipment tracking for FY {selectedYear}.</p>
        </div>
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            placeholder="Search pipeline..." 
            className="pl-9 h-10 text-xs bg-card border-none shadow-sm"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
        <StatCard title="Assignment Queue" value={assignmentQueue.length} icon={UserPlus} description="Authorized but unassigned" />
        <StatCard title="Active Shipments" value={activeCycle.length} icon={Truck} description="Vendor-dispatched orders" trend={{ value: 5, isUp: true }} />
        <StatCard title="Cycle Readiness" value="100%" icon={ShieldCheck} description="Vendor verification status" />
      </div>

      <div className="grid grid-cols-1 gap-8">
        {/* Assignment Queue */}
        <Card className="border-border shadow-none overflow-hidden bg-card">
          <CardHeader className="bg-muted/20 border-b">
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-accent" />
              <CardTitle className="text-base font-black uppercase tracking-tight">Assignment Queue</CardTitle>
            </div>
            <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">Internal authorized requests ready for vendor assignment.</p>
          </CardHeader>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/10 border-none">
                  <TableHead className="min-w-[120px] font-black uppercase text-[10px]">Reference</TableHead>
                  <TableHead className="min-w-[200px] font-black uppercase text-[10px]">Work Description</TableHead>
                  <TableHead className="text-right font-black uppercase text-[10px]">Est. Value</TableHead>
                  <TableHead className="text-right font-black uppercase text-[10px]">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {assignmentQueue.length > 0 ? (
                  assignmentQueue.map((pr) => (
                    <TableRow key={pr.id} className="group hover:bg-accent/[0.02]">
                      <TableCell className="font-black text-primary text-xs">{pr.refNumber}</TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-bold text-xs text-primary truncate max-w-[250px]">
                            {pr.items[0]?.description || 'Multi-item project'}
                          </span>
                          {pr.items.length > 1 && (
                            <span className="text-[9px] text-muted-foreground uppercase font-bold tracking-tighter">
                              +{pr.items.length - 1} supplementary items
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-black tracking-tighter text-xs">
                        Ksh {calculatePRTotal(pr).toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <RoleGuard allowedRoles={['Admin', 'Finance']}>
                          <Button 
                            size="sm" 
                            className="h-8 text-[10px] font-black uppercase tracking-tight gap-1.5 bg-accent text-white shadow-sm"
                            onClick={() => {
                              lpoForm.setValue('prId', pr.id);
                              setIsLPODialogOpen(true);
                            }}
                          >
                            <UserPlus className="w-3.5 h-3.5" />
                            Dispatch Agreement
                          </Button>
                        </RoleGuard>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} className="h-32 text-center text-muted-foreground italic text-xs">
                      No requests currently awaiting assignment.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </Card>

        {/* Live Tracking */}
        <Card className="border-border shadow-none overflow-hidden bg-card">
          <CardHeader className="bg-primary/5 border-b">
            <div className="flex items-center gap-2">
              <Truck className="w-5 h-5 text-primary" />
              <CardTitle className="text-base font-black uppercase tracking-tight">Active Shipments</CardTitle>
            </div>
            <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">Dispatched vendor agreements in fulfillment cycle.</p>
          </CardHeader>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/10 border-none">
                  <TableHead className="min-w-[120px] font-black uppercase text-[10px]">Agreement</TableHead>
                  <TableHead className="min-w-[150px] font-black uppercase text-[10px]">Partner</TableHead>
                  <TableHead className="font-black uppercase text-[10px]">Live Cycle Timer</TableHead>
                  <TableHead className="text-right font-black uppercase text-[10px]">Total Value</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {activeCycle.length > 0 ? (
                  activeCycle.map((lpo) => (
                    <TableRow key={lpo.id} className="group hover:bg-muted/5">
                      <TableCell className="font-black text-primary text-xs">{lpo.lpoNumber}</TableCell>
                      <TableCell>
                        <span className="font-bold text-xs text-primary">{lpo.vendorName}</span>
                      </TableCell>
                      <TableCell>
                        <CycleTimer startTime={lpo.dispatchedAt || lpo.createdAt} />
                      </TableCell>
                      <TableCell className="text-right font-black tracking-tighter text-xs">
                        Ksh {lpo.totalValue.toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8"><MoreVertical className="w-4 h-4" /></Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => setViewingLpo(lpo)} className="text-xs font-bold"><Eye className="w-4 h-4 mr-2" /> Review Terms</DropdownMenuItem>
                            <DropdownMenuItem className="text-accent font-bold text-xs" onClick={() => setReceivingLpo(lpo)}>
                              <PackageCheck className="w-4 h-4 mr-2" /> Verify Delivery
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-xs font-bold"><Printer className="w-4 h-4 mr-2" /> Export PDF</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="h-32 text-center text-muted-foreground italic text-xs">
                      No active shipments in the cycle.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </Card>
      </div>

      {/* Official Dispatch Dialog */}
      <Dialog open={isLPODialogOpen} onOpenChange={setIsLPODialogOpen}>
        <DialogContent className="max-w-xl w-[95vw]">
          <DialogHeader>
            <DialogTitle className="text-xl font-black tracking-tight flex items-center gap-2">
              <ShieldCheck className="w-6 h-6 text-accent" />
              Strategic Dispatch
            </DialogTitle>
            <DialogDescription className="text-xs font-medium">Commit an authorized request to a verified commercial partner.</DialogDescription>
          </DialogHeader>
          <Form {...lpoForm}>
            <form onSubmit={lpoForm.handleSubmit(onLPOSubmit)} className="space-y-6">
              <FormField control={lpoForm.control} name="vendorId" render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[10px] uppercase font-black text-muted-foreground tracking-widest">Assigned Partner</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className="h-10 text-xs shadow-sm bg-muted/20 border-none">
                        <SelectValue placeholder="Select partner from directory" />
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
                  Start Fulfillment Cycle
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delivery Verification Dialog */}
      <Dialog open={!!receivingLpo} onOpenChange={(open) => !open && setReceivingLpo(null)}>
        <DialogContent className="max-w-2xl w-[95vw] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-black tracking-tight flex items-center gap-2">
              <PackageCheck className="w-6 h-6 text-accent" />
              Cycle Verification (GRN)
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
                <h4 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Item Audit</h4>
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
                          <label className="text-[9px] font-black uppercase text-muted-foreground opacity-70">Condition</label>
                          <Select defaultValue="Good">
                            <SelectTrigger className="h-8 text-[10px] border-muted/50">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Good" className="text-xs">Good Condition</SelectItem>
                              <SelectItem value="Damaged" className="text-xs text-destructive">Damaged/Defective</SelectItem>
                              <SelectItem value="Wrong" className="text-xs text-destructive">Incorrect Specification</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <DialogFooter className="gap-2 pt-6 border-t flex-col sm:flex-row">
                <Button variant="outline" onClick={() => setReceivingLpo(null)} className="font-black uppercase text-xs h-11 w-full sm:w-auto">Cancel Verification</Button>
                <Button 
                  variant="outline" 
                  className="font-black uppercase text-xs h-11 w-full sm:w-auto border-accent text-accent hover:bg-accent/5" 
                  onClick={() => setIsFeedbackDialogOpen(true)}
                >
                  <MessageSquareMore className="w-3.5 h-3.5 mr-2" />
                  Rate Experience
                </Button>
                <Button className="bg-accent font-black uppercase text-xs h-11 w-full sm:w-auto shadow-xl" onClick={() => handleReceiveGoods(receivingLpo)}>
                  Stop Timer & Confirm Receipt
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Feedback Submission Dialog */}
      <Dialog open={isFeedbackDialogOpen} onOpenChange={setIsFeedbackDialogOpen}>
        <DialogContent className="max-w-md w-[95vw]">
          <DialogHeader>
            <DialogTitle className="text-xl font-black tracking-tight">Post Qualitative Feedback</DialogTitle>
            <DialogDescription className="text-xs">Share qualitative experience about {receivingLpo?.vendorName}.</DialogDescription>
          </DialogHeader>

          <div className="space-y-5 py-4">
            <div className="space-y-2">
              <label className="text-[10px] uppercase font-black text-muted-foreground">Quality Rating (1-5)</label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map(r => (
                  <button 
                    key={r}
                    type="button"
                    className={cn(
                      "w-10 h-10 rounded-lg flex items-center justify-center transition-all border",
                      feedbackRating === r ? "bg-accent border-accent text-white scale-110 shadow-md" : "bg-muted border-transparent hover:bg-muted/80"
                    )}
                    onClick={() => setFeedbackRating(r)}
                  >
                    <Star className={cn("w-4 h-4", feedbackRating >= r ? "fill-current" : "")} />
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] uppercase font-black text-muted-foreground">Testimonial / Comment</label>
              <Textarea 
                placeholder="Share your experience..." 
                className="min-h-[100px] text-xs font-medium"
                value={feedbackComment}
                onChange={(e) => setFeedbackComment(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0 pt-6 border-t flex-col sm:flex-row">
            <Button variant="outline" onClick={() => setIsFeedbackDialogOpen(false)} className="w-full sm:w-auto font-black uppercase text-[10px] h-10">Discard</Button>
            <Button 
              className="w-full sm:w-auto bg-accent text-white font-black uppercase text-[10px] h-10 shadow-lg"
              onClick={handleFeedbackSubmit}
              disabled={!feedbackComment}
            >
              <Send className="w-3 h-3 mr-2" />
              Publish Feedback
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Read-Only Viewer */}
      <Dialog open={!!viewingLpo} onOpenChange={(open) => !open && setViewingLpo(null)}>
        <DialogContent className="max-w-2xl w-[95vw]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 font-black tracking-tight text-xl">
              Official Agreement {viewingLpo?.lpoNumber} 
              <Lock className="w-4 h-4 text-muted-foreground opacity-50" />
            </DialogTitle>
            <DialogDescription className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Consolidated agreement metadata - Read Only</DialogDescription>
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
                <span className="text-xs font-black uppercase text-muted-foreground tracking-widest">Total Commitment</span>
                <span className="text-2xl font-black text-primary tracking-tighter">Ksh {viewingLpo.totalValue.toLocaleString()}</span>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
