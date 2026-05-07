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
  Wallet
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
import { useToast } from '@/hooks/use-toast';
import { calculatePRTotal, PurchaseRequisition, getBudgetStats } from '@/lib/types';
import { cn } from '@/lib/utils';
import { RoleGuard } from '@/components/auth/RoleGuard';

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

type RequisitionFormValues = z.infer<typeof requisitionSchema>;

function RequisitionsHubContent() {
  const { 
    prs, budgets, addPR, updatePR, deletePR, selectedYear 
  } = useStore();
  
  const { currentUser, viewPreference } = useUserStore();
  const { toast } = useToast();
  
  const [mounted, setMounted] = useState(false);
  const [search, setSearch] = useState('');
  
  const [isPRDialogOpen, setIsPRDialogOpen] = useState(false);
  const [editingPr, setEditingPr] = useState<PurchaseRequisition | null>(null);
  const [prToDelete, setPrToDelete] = useState<PurchaseRequisition | null>(null);

  const isDetailed = viewPreference === 'detailed';

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

  const filteredPrs = (prs || []).filter(pr => {
    const isCurrentYear = pr.fiscalYear === selectedYear;
    const matchesSearch = pr.items?.some(i => i.description.toLowerCase().includes(search.toLowerCase())) || 
                          pr.refNumber.toLowerCase().includes(search.toLowerCase());
    if (currentUser.role === 'Staff') return isCurrentYear && matchesSearch && pr.requesterName === currentUser.name;
    return isCurrentYear && matchesSearch;
  });

  const totalValue = filteredPrs.reduce((acc, pr) => acc + calculatePRTotal(pr), 0);

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

  return (
    <div className="space-y-6 md:space-y-8 animate-in fade-in duration-500 pb-10 max-w-full overflow-hidden">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="min-w-0 flex-1">
          <h2 className="text-3xl md:text-4xl font-headline font-bold text-primary tracking-tighter leading-tight truncate">
            Purchase Requisitions
          </h2>
          <p className="text-muted-foreground text-sm font-medium">Internal organizational requests for FY {selectedYear}.</p>
        </div>
        
        <RoleGuard permission="create_requisitions">
          <Button onClick={() => { setEditingPr(null); setIsPRDialogOpen(true); }} className="bg-primary font-bold uppercase text-xs h-10 shadow-sm">
            <Plus className="w-4 h-4 mr-2" /> New Request
          </Button>
        </RoleGuard>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
        <StatCard title="Active Requests" value={filteredPrs.length} icon={FileText} description="Pending or authorized requests" />
        <StatCard title="My Drafting Value" value={`Ksh ${totalValue.toLocaleString()}`} icon={Wallet} description="Total estimated commitment" />
        <StatCard title="Budget Health" value="Active" icon={AlertCircle} description="Quarterly limits available" />
      </div>

      <Card className="border-border shadow-none overflow-hidden bg-card">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between p-4 border-b gap-4">
          <h3 className="text-sm font-black uppercase tracking-widest text-primary">Request Ledger</h3>
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Search requests..." 
              className="pl-9 h-10 text-xs bg-muted/30 border-none shadow-none"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
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
                        {pr.status === 'LPO Generated' ? 'In Cycle' : pr.status}
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
                <TableRow><TableCell colSpan={5} className="h-48 text-center text-muted-foreground italic">No requests found matching criteria.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

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
                <Button type="submit" className="bg-primary font-black uppercase text-xs h-11 w-full sm:w-auto shadow-xl">
                  {editingPr ? 'Save Modifications' : 'Finalize & Submit Request'}
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
    <Suspense fallback={<div className="p-10 text-center font-black animate-pulse text-muted-foreground uppercase tracking-widest text-xs">Initializing Hub...</div>}>
      <RequisitionsHubContent />
    </Suspense>
  );
}
