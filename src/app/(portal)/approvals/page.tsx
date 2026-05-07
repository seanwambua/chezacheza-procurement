"use client";

import { useState, useEffect } from 'react';
import { useStore } from '@/lib/store';
import { useUserStore } from '@/lib/user-store';
import { StatCard } from '@/components/dashboard/StatCard';
import { 
  Clock, 
  AlertCircle, 
  CheckCircle2, 
  XCircle, 
  Search,
  DollarSign,
  Eye,
  History,
  ListTodo
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
import { getBudgetStats, calculatePRTotal, PurchaseRequisition } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription
} from "@/components/ui/dialog";
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';

export default function ApprovalsPage() {
  const { prs, budgets, updatePRStatus } = useStore();
  const { currentUser, viewPreference } = useUserStore();
  const { toast } = useToast();
  const [mounted, setMounted] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedPr, setSelectedPr] = useState<PurchaseRequisition | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || !currentUser) return null;

  const isDetailed = viewPreference === 'detailed';

  const pendingPrs = prs.filter(pr => {
    const isPending = pr.status.startsWith('Pending');
    const matchesSearch = pr.items?.some(i => i.description.toLowerCase().includes(search.toLowerCase())) || 
                          pr.refNumber.toLowerCase().includes(search.toLowerCase());
    
    if (currentUser.role === 'Admin') return isPending && matchesSearch;
    if (currentUser.role === 'Manager') return pr.status === 'Pending Manager' && matchesSearch;
    if (currentUser.role === 'Finance') return pr.status === 'Pending Finance' && matchesSearch;
    
    return false;
  });

  const historyPrs = prs.filter(pr => {
    const isHistory = ['Approved', 'Rejected', 'LPO Generated'].includes(pr.status);
    const matchesSearch = pr.items?.some(i => i.description.toLowerCase().includes(search.toLowerCase())) || 
                          pr.refNumber.toLowerCase().includes(search.toLowerCase());
    return isHistory && matchesSearch;
  });

  const totalPendingValue = pendingPrs.reduce((acc, pr) => acc + calculatePRTotal(pr), 0);
  const highValueRequests = pendingPrs.filter(pr => calculatePRTotal(pr) > 100000).length;

  const handleApprove = (pr: PurchaseRequisition) => {
    const budget = budgets.find(b => b.name === pr.budgetLine);
    if (budget) {
      const stats = getBudgetStats(budget);
      if (stats.isPaused) {
        toast({
          variant: "destructive",
          title: "Approval Blocked",
          description: `The budget '${budget.name}' is currently exhausted for this quarter.`,
        });
        return;
      }
    }

    let nextStatus = pr.status;
    if (pr.status === 'Pending Manager') nextStatus = 'Pending Finance';
    else if (pr.status === 'Pending Finance') nextStatus = 'Approved';
    
    updatePRStatus(pr.id, nextStatus as any);
    setSelectedPr(null);
    toast({
      title: "Requisition Advanced",
      description: `Request ${pr.refNumber} has been successfully approved.`,
    });
  };

  const handleReject = (id: string) => {
    const reason = prompt('Please provide a reason for rejection:');
    if (reason === null) return;

    updatePRStatus(id, 'Rejected');
    setSelectedPr(null);
    toast({
      title: "Requisition Rejected",
      description: "The requester has been notified.",
    });
  };

  return (
    <div className="space-y-6 md:space-y-8 animate-in fade-in duration-500 pb-10 max-w-full overflow-hidden">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="min-w-0 flex-1">
          <h2 className={cn(
            "font-headline font-bold text-primary tracking-tighter truncate",
            isDetailed ? "text-2xl md:text-3xl" : "text-3xl md:text-4xl"
          )}>
            Approval Pipeline
          </h2>
          <p className="text-muted-foreground text-sm font-medium">Verify and authorize departmental procurement requests.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
        <StatCard 
          title="Pending Actions" 
          value={pendingPrs.length} 
          icon={Clock} 
          description={isDetailed ? "Awaiting your authorization" : undefined}
        />
        <StatCard 
          title="Exposure Value" 
          value={`Ksh ${totalPendingValue.toLocaleString()}`} 
          icon={DollarSign} 
          description={isDetailed ? "Total value of queue" : undefined}
        />
        <StatCard 
          title="High-Value Items" 
          value={highValueRequests} 
          icon={AlertCircle} 
          description={isDetailed ? "Above Ksh 100,000 threshold" : undefined}
        />
      </div>

      <Tabs defaultValue="queue" className="w-full">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 mb-6">
          <TabsList className="grid w-full lg:w-[400px] grid-cols-2 bg-muted/50 p-1">
            <TabsTrigger value="queue" className="flex items-center justify-center gap-2 py-2 text-xs font-bold uppercase tracking-tight">
              <ListTodo className="w-3.5 h-3.5" />
              Active Queue ({pendingPrs.length})
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center justify-center gap-2 py-2 text-xs font-bold uppercase tracking-tight">
              <History className="w-3.5 h-3.5" />
              History
            </TabsTrigger>
          </TabsList>

          <div className="relative w-full lg:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Search requests..." 
              className="pl-9 h-10 text-xs bg-card border-none shadow-sm"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <TabsContent value="queue" className="mt-0 focus-visible:ring-0">
          <Card className="border-border shadow-none overflow-hidden bg-card">
            <CardContent className="p-0">
              <div className="overflow-x-auto w-full">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/30 border-none">
                      {isDetailed && <TableHead className="min-w-[120px] font-bold uppercase text-[10px]">Reference</TableHead>}
                      <TableHead className="min-w-[200px] font-bold uppercase text-[10px]">Summary</TableHead>
                      {isDetailed && <TableHead className="min-w-[150px] font-bold uppercase text-[10px]">Requester</TableHead>}
                      <TableHead className="min-w-[140px] font-bold uppercase text-[10px]">Budget Health</TableHead>
                      {isDetailed && <TableHead className="text-right min-w-[120px] font-bold uppercase text-[10px]">Est. Total</TableHead>}
                      <TableHead className="text-right min-w-[100px] font-bold uppercase text-[10px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pendingPrs.length > 0 ? (
                      pendingPrs.map((pr) => {
                        const budget = budgets.find(b => b.name === pr.budgetLine);
                        const stats = budget ? getBudgetStats(budget) : null;
                        const isPaused = stats?.isPaused;
                        const total = calculatePRTotal(pr);

                        return (
                          <TableRow key={pr.id} className="group hover:bg-muted/5">
                            {isDetailed && <TableCell className="font-black text-primary text-xs">{pr.refNumber}</TableCell>}
                            <TableCell>
                              <div className="flex flex-col min-w-0">
                                <span className={cn(
                                  "font-bold truncate",
                                  isDetailed ? "text-xs" : "text-sm text-primary"
                                )}>
                                  {pr.items?.[0]?.description || 'Multi-item Request'}
                                </span>
                                {pr.items?.length > 1 && (
                                  <span className="text-[10px] text-muted-foreground uppercase font-medium">+{pr.items.length - 1} more items</span>
                                )}
                              </div>
                            </TableCell>
                            {isDetailed && (
                              <TableCell>
                                <span className="text-xs truncate font-medium">{pr.requesterName}</span>
                              </TableCell>
                            )}
                            <TableCell>
                              <div className={cn(
                                "flex items-center gap-2",
                                isPaused ? "text-destructive" : "text-accent"
                              )}>
                                <div className={cn(
                                  "w-2 h-2 rounded-full shrink-0",
                                  isPaused ? "bg-destructive animate-pulse" : "bg-accent"
                                )} />
                                <span className="text-[10px] font-bold uppercase tracking-tight">
                                  {isPaused ? 'Exhausted' : 'Healthy'}
                                </span>
                              </div>
                            </TableCell>
                            {isDetailed && (
                              <TableCell className="text-right font-black tracking-tighter text-xs whitespace-nowrap">
                                Ksh {total.toLocaleString()}
                              </TableCell>
                            )}
                            <TableCell className="text-right">
                              <Button 
                                variant="outline" 
                                size="sm"
                                className="h-8 font-bold uppercase text-[10px] shadow-sm"
                                onClick={() => setSelectedPr(pr)}
                              >
                                <Eye className="w-3.5 h-3.5 mr-1.5" />
                                Review
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    ) : (
                      <TableRow>
                        <TableCell colSpan={isDetailed ? 6 : 4} className="h-48 text-center text-muted-foreground">
                           <div className="flex flex-col items-center justify-center space-y-3 opacity-50">
                            <div className="p-4 bg-muted rounded-full">
                              <ListTodo className="w-8 h-8" />
                            </div>
                            <p className="text-sm font-medium">Your approval queue is empty.</p>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="mt-0 focus-visible:ring-0">
          <Card className="border-border shadow-none overflow-hidden bg-card">
            <CardContent className="p-0">
              <div className="overflow-x-auto w-full">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/30 border-none">
                      {isDetailed && <TableHead className="min-w-[120px] font-bold uppercase text-[10px]">Reference</TableHead>}
                      <TableHead className="min-w-[200px] font-bold uppercase text-[10px]">Summary</TableHead>
                      <TableHead className="min-w-[100px] font-bold uppercase text-[10px]">Status</TableHead>
                      {isDetailed && <TableHead className="min-w-[150px] font-bold uppercase text-[10px]">Budget</TableHead>}
                      {isDetailed && <TableHead className="text-right min-w-[120px] font-bold uppercase text-[10px]">Final Total</TableHead>}
                      <TableHead className="text-right min-w-[100px] font-bold uppercase text-[10px]">Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {historyPrs.length > 0 ? (
                      historyPrs.map((pr) => (
                        <TableRow key={pr.id} className="group hover:bg-muted/5 opacity-80 hover:opacity-100 transition-opacity">
                          {isDetailed && <TableCell className="font-bold text-primary text-[10px]">{pr.refNumber}</TableCell>}
                          <TableCell>
                            <div className="flex flex-col min-w-0">
                              <span className={cn(
                                "font-medium truncate",
                                isDetailed ? "text-xs" : "text-sm"
                              )}>{pr.items?.[0]?.description || 'Multi-item Request'}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={pr.status === 'Approved' || pr.status === 'LPO Generated' ? 'secondary' : 'destructive'} className="text-[9px] uppercase px-1.5 py-0 h-4 tracking-tighter">
                              {pr.status}
                            </Badge>
                          </TableCell>
                          {isDetailed && (
                            <TableCell className="text-[10px] font-bold uppercase text-muted-foreground truncate">
                              {pr.budgetLine}
                            </TableCell>
                          )}
                          {isDetailed && (
                            <TableCell className="text-right font-black text-xs whitespace-nowrap tracking-tighter">
                              Ksh {calculatePRTotal(pr).toLocaleString()}
                            </TableCell>
                          )}
                          <TableCell className="text-right text-[10px] text-muted-foreground whitespace-nowrap font-medium">
                            {new Date(pr.createdAt).toLocaleDateString()}
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={isDetailed ? 6 : 4} className="h-48 text-center text-muted-foreground">
                          <div className="flex flex-col items-center justify-center space-y-3 opacity-50">
                            <div className="p-4 bg-muted rounded-full">
                              <History className="w-8 h-8" />
                            </div>
                            <p className="text-sm font-medium">No historical records found.</p>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={!!selectedPr} onOpenChange={(open) => !open && setSelectedPr(null)}>
        <DialogContent className="max-w-2xl w-[95vw] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex flex-col sm:flex-row sm:items-center justify-between text-xl font-black tracking-tight gap-2">
              Review Requisition {selectedPr?.refNumber}
              <Badge variant="outline" className="text-[10px] uppercase w-fit">{selectedPr?.status}</Badge>
            </DialogTitle>
            <DialogDescription className="text-xs">
              Check line items and budget availability before authorizing.
            </DialogDescription>
          </DialogHeader>
          
          {selectedPr && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-muted/30 rounded-lg border border-border/50">
                <div>
                  <p className="text-[10px] uppercase font-bold text-muted-foreground">Requester</p>
                  <p className="text-sm font-bold truncate text-primary">{selectedPr.requesterName}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold text-muted-foreground">Budget</p>
                  <p className="text-sm font-bold text-accent truncate">{selectedPr.budgetLine}</p>
                </div>
              </div>

              <div className="space-y-3">
                <p className="text-[10px] uppercase font-bold text-muted-foreground">Items Requested</p>
                <div className="border border-border/50 rounded-md divide-y max-h-[30vh] overflow-y-auto bg-card shadow-sm">
                  {selectedPr.items.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 text-xs sm:text-sm">
                      <div className="flex flex-col mr-4 min-w-0">
                        <span className="font-bold truncate text-primary">{item.description}</span>
                        <span className="text-[10px] text-muted-foreground font-medium uppercase">Qty: {item.quantity} × Ksh {item.estimatedUnitPrice.toLocaleString()}</span>
                      </div>
                      <span className="font-black whitespace-nowrap tracking-tighter">Ksh {(item.quantity * item.estimatedUnitPrice).toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>

              <Separator className="opacity-50" />

              <div className="flex justify-between items-center px-2">
                <span className="text-[10px] uppercase font-bold text-muted-foreground">Total Commitment</span>
                <span className="text-xl font-black text-primary tracking-tighter">Ksh {calculatePRTotal(selectedPr).toLocaleString()}</span>
              </div>

              <DialogFooter className="gap-2 flex-col sm:flex-row border-t pt-6">
                <Button 
                  variant="ghost" 
                  className="text-destructive hover:bg-destructive/10 w-full sm:w-auto font-bold uppercase text-xs"
                  onClick={() => handleReject(selectedPr.id)}
                >
                  <XCircle className="w-4 h-4 mr-2" />
                  Reject Request
                </Button>
                <Button 
                  className="bg-primary hover:bg-primary/90 w-full sm:w-auto font-bold uppercase text-xs shadow-md"
                  onClick={() => handleApprove(selectedPr)}
                >
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Authorize Approval
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
