"use client";

import { useState, useEffect } from 'react';
import { useStore } from '@/lib/store';
import { useUserStore } from '@/lib/user-store';
import { StatCard } from '@/components/dashboard/StatCard';
import { 
  CheckSquare, 
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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
    <div className="space-y-8 animate-in fade-in duration-500 pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className={cn(
            "font-headline font-bold text-primary tracking-tighter",
            isDetailed ? "text-3xl" : "text-4xl"
          )}>
            Approval Pipeline
          </h2>
          <p className="text-muted-foreground">Verify and authorize departmental procurement requests.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard 
          title="Pending Actions" 
          value={pendingPrs.length} 
          icon={Clock} 
          description={isDetailed ? "Awaiting your authorization" : undefined}
        />
        <StatCard 
          title="Pending Exposure" 
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
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
          <TabsList className="grid w-full sm:w-[400px] grid-cols-2">
            <TabsTrigger value="queue" className="flex items-center gap-2">
              <ListTodo className="w-4 h-4" />
              Active Queue ({pendingPrs.length})
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center gap-2">
              <History className="w-4 h-4" />
              History
            </TabsTrigger>
          </TabsList>

          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Search requests..." 
              className="pl-9 h-9 text-xs"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <TabsContent value="queue" className="mt-0">
          <Card className="border-border shadow-none overflow-hidden">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/30">
                      {isDetailed && <TableHead>Reference</TableHead>}
                      <TableHead>Summary</TableHead>
                      {isDetailed && <TableHead>Requester</TableHead>}
                      <TableHead>Budget Health</TableHead>
                      {isDetailed && <TableHead className="text-right">Estimated Total</TableHead>}
                      <TableHead className="text-right">Actions</TableHead>
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
                            {isDetailed && <TableCell className="font-bold text-primary">{pr.refNumber}</TableCell>}
                            <TableCell>
                              <div className="flex flex-col">
                                <span className={cn(
                                  "font-bold",
                                  isDetailed ? "text-sm" : "text-lg text-primary"
                                )}>
                                  {pr.items?.[0]?.description || 'Multi-item Request'}
                                </span>
                                {pr.items?.length > 1 && (
                                  <span className="text-[10px] text-muted-foreground uppercase">+{pr.items.length - 1} more items</span>
                                )}
                              </div>
                            </TableCell>
                            {isDetailed && (
                              <TableCell>
                                <span className="text-xs">{pr.requesterName}</span>
                              </TableCell>
                            )}
                            <TableCell>
                              <div className={cn(
                                "flex items-center gap-2",
                                isPaused ? "text-destructive" : "text-green-600"
                              )}>
                                <div className={cn(
                                  "w-2.5 h-2.5 rounded-full",
                                  isPaused ? "bg-destructive animate-pulse" : "bg-green-600"
                                )} />
                                {isDetailed && <span className="text-xs font-bold uppercase">{isPaused ? 'Exhausted' : 'Healthy'}</span>}
                              </div>
                            </TableCell>
                            {isDetailed && (
                              <TableCell className={cn(
                                "text-right font-black tracking-tighter",
                                isDetailed ? "text-base" : "text-xl text-primary"
                              )}>
                                Ksh {total.toLocaleString()}
                              </TableCell>
                            )}
                            <TableCell className="text-right">
                              <Button 
                                variant="outline" 
                                size={isDetailed ? "sm" : "default"}
                                className="h-9 font-bold uppercase text-[10px]"
                                onClick={() => setSelectedPr(pr)}
                              >
                                <Eye className="w-4 h-4 mr-1.5" />
                                Review
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    ) : (
                      <TableRow>
                        <TableCell colSpan={isDetailed ? 6 : 4} className="h-32 text-center text-muted-foreground">
                          <p className="text-sm">Your approval queue is empty.</p>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="mt-0">
          <Card className="border-border shadow-none overflow-hidden">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/30">
                      {isDetailed && <TableHead>Reference</TableHead>}
                      <TableHead>Summary</TableHead>
                      <TableHead>Status</TableHead>
                      {isDetailed && <TableHead>Budget Line</TableHead>}
                      {isDetailed && <TableHead className="text-right">Final Total</TableHead>}
                      <TableHead className="text-right">Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {historyPrs.length > 0 ? (
                      historyPrs.map((pr) => (
                        <TableRow key={pr.id} className="group hover:bg-muted/5 opacity-80 hover:opacity-100 transition-opacity">
                          {isDetailed && <TableCell className="font-bold text-primary text-xs">{pr.refNumber}</TableCell>}
                          <TableCell>
                            <div className="flex flex-col">
                              <span className={cn(
                                "font-medium",
                                isDetailed ? "text-xs" : "text-sm"
                              )}>{pr.items?.[0]?.description || 'Multi-item Request'}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={pr.status === 'Approved' || pr.status === 'LPO Generated' ? 'secondary' : 'destructive'} className="text-[9px] uppercase">
                              {pr.status}
                            </Badge>
                          </TableCell>
                          {isDetailed && (
                            <TableCell className="text-[10px] font-bold uppercase text-muted-foreground">
                              {pr.budgetLine}
                            </TableCell>
                          )}
                          {isDetailed && (
                            <TableCell className="text-right font-black text-xs">
                              Ksh {calculatePRTotal(pr).toLocaleString()}
                            </TableCell>
                          )}
                          <TableCell className="text-right text-[10px] text-muted-foreground">
                            {new Date(pr.createdAt).toLocaleDateString()}
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={isDetailed ? 6 : 4} className="h-32 text-center text-muted-foreground">
                          <p className="text-sm">No historical records found.</p>
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
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              Review Requisition {selectedPr?.refNumber}
              <Badge variant="outline">{selectedPr?.status}</Badge>
            </DialogTitle>
            <DialogDescription>
              Check line items and budget availability before authorizing.
            </DialogDescription>
          </DialogHeader>
          
          {selectedPr && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4 p-4 bg-muted/30 rounded-lg border">
                <div>
                  <p className="text-[10px] uppercase font-bold text-muted-foreground">Requester</p>
                  <p className="text-sm font-bold">{selectedPr.requesterName}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold text-muted-foreground">Budget Line</p>
                  <p className="text-sm font-bold text-accent">{selectedPr.budgetLine}</p>
                </div>
              </div>

              <div className="space-y-3">
                <p className="text-[10px] uppercase font-bold text-muted-foreground">Items Requested</p>
                <div className="border rounded-md divide-y">
                  {selectedPr.items.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 text-sm">
                      <div className="flex flex-col">
                        <span className="font-medium">{item.description}</span>
                        <span className="text-[10px] text-muted-foreground">Qty: {item.quantity} × Ksh {item.estimatedUnitPrice.toLocaleString()}</span>
                      </div>
                      <span className="font-bold">Ksh {(item.quantity * item.estimatedUnitPrice).toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>

              <Separator />

              <div className="flex justify-between items-center px-2">
                <span className="text-sm font-bold">Total Commitment</span>
                <span className="text-xl font-black text-primary">Ksh {calculatePRTotal(selectedPr).toLocaleString()}</span>
              </div>

              <DialogFooter className="gap-2 sm:gap-0">
                <Button 
                  variant="ghost" 
                  className="text-destructive hover:bg-destructive/10"
                  onClick={() => handleReject(selectedPr.id)}
                >
                  <XCircle className="w-4 h-4 mr-2" />
                  Reject Request
                </Button>
                <Button 
                  className="bg-green-600 hover:bg-green-700"
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
