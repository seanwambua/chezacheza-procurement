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
  Filter,
  DollarSign,
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
import { getBudgetStats, calculatePRTotal } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export default function ApprovalsPage() {
  const { prs, budgets, updatePRStatus } = useStore();
  const { currentUser } = useUserStore();
  const { toast } = useToast();
  const [mounted, setMounted] = useState(false);
  const [search, setSearch] = useState('');

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || !currentUser) return null;

  // Filter for pending items appropriate for the user's role
  const pendingPrs = prs.filter(pr => {
    const isPending = pr.status.startsWith('Pending');
    const matchesSearch = pr.items?.some(i => i.description.toLowerCase().includes(search.toLowerCase())) || 
                          pr.refNumber.toLowerCase().includes(search.toLowerCase());
    
    // Admins see everything pending
    if (currentUser.role === 'Admin') return isPending && matchesSearch;
    
    // Managers see items pending manager
    if (currentUser.role === 'Manager') return pr.status === 'Pending Manager' && matchesSearch;
    
    // Finance see items pending finance
    if (currentUser.role === 'Finance') return pr.status === 'Pending Finance' && matchesSearch;
    
    return false;
  });

  const totalPendingValue = pendingPrs.reduce((acc, pr) => acc + calculatePRTotal(pr), 0);
  const highValueRequests = pendingPrs.filter(pr => calculatePRTotal(pr) > 100000).length;

  const handleApprove = (id: string) => {
    const pr = prs.find(p => p.id === id);
    if (!pr) return;

    const budget = budgets.find(b => b.name === pr.budgetLine);
    if (budget) {
      const stats = getBudgetStats(budget);
      if (stats.isPaused) {
        toast({
          variant: "destructive",
          title: "Approval Blocked",
          description: `The budget '${budget.name}' is currently exhausted for this quarter. Reallocate funds first.`,
        });
        return;
      }
    }

    // Progression logic
    let nextStatus = pr.status;
    if (pr.status === 'Pending Manager') nextStatus = 'Pending Finance';
    else if (pr.status === 'Pending Finance') nextStatus = 'Approved';
    
    updatePRStatus(id, nextStatus as any);
    toast({
      title: "Requisition Advanced",
      description: `Request ${pr.refNumber} has been successfully approved and moved to the next stage.`,
    });
  };

  const handleReject = (id: string) => {
    const reason = prompt('Please provide a reason for rejection:');
    if (reason === null) return; // User cancelled

    updatePRStatus(id, 'Rejected');
    toast({
      title: "Requisition Rejected",
      description: "The requester has been notified of the rejection.",
    });
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-headline font-bold text-primary">Approval Pipeline</h2>
          <p className="text-muted-foreground">Verify and authorize departmental procurement requests.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard 
          title="Pending Actions" 
          value={pendingPrs.length} 
          icon={Clock} 
          description="Awaiting your authorization"
          tooltip="Total number of requisitions currently requiring your role's approval to proceed."
        />
        <StatCard 
          title="Pending Exposure" 
          value={`Ksh ${totalPendingValue.toLocaleString()}`} 
          icon={DollarSign} 
          description="Total value of queue"
          tooltip="The sum total of estimated costs for all items currently sitting in your approval queue."
        />
        <StatCard 
          title="High-Value Items" 
          value={highValueRequests} 
          icon={AlertCircle} 
          description="Above Ksh 100,000 threshold"
          tooltip="Number of requests that exceed the standard spending threshold and may require extra scrutiny."
        />
      </div>

      <Card className="border-border shadow-none">
        <CardHeader className="flex flex-row items-center justify-between border-b border-border/50 py-4">
          <CardTitle className="text-lg">Review Queue</CardTitle>
          <div className="flex items-center gap-4">
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input 
                placeholder="Search requests..." 
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
                  <TableHead>Reference</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Requester</TableHead>
                  <TableHead>Budget Health</TableHead>
                  <TableHead className="text-right">Estimated Total</TableHead>
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
                        <TableCell className="font-bold text-primary">{pr.refNumber}</TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="text-sm font-medium">{pr.items?.[0]?.description || 'Untitled Item'}</span>
                            {pr.items?.length > 1 && (
                              <span className="text-[10px] text-muted-foreground uppercase">+{pr.items.length - 1} more items</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-accent/10 flex items-center justify-center text-[10px] font-bold text-accent">
                              {pr.requesterName?.charAt(0) || '?'}
                            </div>
                            <span className="text-xs">{pr.requesterName}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div className="flex items-center gap-2 cursor-help">
                                  <div className={`w-2 h-2 rounded-full ${isPaused ? 'bg-destructive animate-pulse' : 'bg-green-500'}`} />
                                  <span className="text-xs font-medium">
                                    {isPaused ? 'Exhausted' : 'Healthy'}
                                  </span>
                                </div>
                              </TooltipTrigger>
                              <TooltipContent>
                                {isPaused 
                                  ? "This budget is paused. You cannot approve until funds are reallocated." 
                                  : "Budget has sufficient funds for this quarter."}
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </TableCell>
                        <TableCell className="text-right font-black">
                          Ksh {total.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="h-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                              onClick={() => handleReject(pr.id)}
                            >
                              <XCircle className="w-4 h-4 mr-1.5" />
                              Reject
                            </Button>
                            <Button 
                              size="sm" 
                              className="h-8 bg-green-600 hover:bg-green-700"
                              disabled={isPaused}
                              onClick={() => handleApprove(pr.id)}
                            >
                              <CheckCircle2 className="w-4 h-4 mr-1.5" />
                              Approve
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                      <div className="flex flex-col items-center justify-center space-y-2">
                        <CheckSquare className="w-8 h-8 opacity-20" />
                        <p className="text-sm">Great job! Your approval queue is empty.</p>
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