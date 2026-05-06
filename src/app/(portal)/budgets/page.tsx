
"use client";

import { useState, useEffect } from 'react';
import { useStore } from '@/lib/store';
import { useUserStore } from '@/lib/user-store';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatCard } from '@/components/dashboard/StatCard';
import { Wallet, PieChart, TrendingDown, ArrowUpRight, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function BudgetsPage() {
  const { budgetLines } = useStore();
  const { currentUser } = useUserStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  // Final Safety Check
  if (currentUser && !['Admin', 'Finance', 'Manager'].includes(currentUser.role)) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center space-y-4">
        <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center">
          <Lock className="w-8 h-8 text-muted-foreground" />
        </div>
        <h2 className="text-xl font-bold">Financial Access Restricted</h2>
        <p className="text-muted-foreground max-w-sm">You do not have the required permissions to view departmental budgets.</p>
        <Button variant="outline" onClick={() => window.history.back()}>Go Back</Button>
      </div>
    );
  }

  const totalAllocation = budgetLines.reduce((acc, bl) => acc + bl.allocation, 0);
  const totalSpent = budgetLines.reduce((acc, bl) => acc + bl.spent, 0);
  const totalCommitted = budgetLines.reduce((acc, bl) => acc + bl.committed, 0);
  const remainingTotal = totalAllocation - totalSpent - totalCommitted;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <h2 className="text-2xl font-headline font-bold text-primary">Budget Management</h2>
        <p className="text-muted-foreground">Monitor departmental allocations and expenditure tracking.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Total Allocation" 
          value={`Ksh ${totalAllocation.toLocaleString()}`} 
          icon={Wallet} 
        />
        <StatCard 
          title="Total Spent" 
          value={`Ksh ${totalSpent.toLocaleString()}`} 
          icon={TrendingDown} 
        />
        <StatCard 
          title="Committed (PO/PR)" 
          value={`Ksh ${totalCommitted.toLocaleString()}`} 
          icon={ArrowUpRight} 
        />
        <StatCard 
          title="Remaining" 
          value={`Ksh ${remainingTotal.toLocaleString()}`} 
          icon={PieChart} 
        />
      </div>

      <Card className="shadow-none border border-border overflow-hidden">
        <CardHeader>
          <CardTitle className="text-lg">Budget Lines Overview</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead>Budget Category</TableHead>
                <TableHead className="text-right">Allocation (Ksh)</TableHead>
                <TableHead className="text-right">Spent (Ksh)</TableHead>
                <TableHead className="text-right">Committed (Ksh)</TableHead>
                <TableHead className="w-[200px]">Utilization</TableHead>
                <TableHead className="text-right">Remaining (Ksh)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {budgetLines.map((bl) => {
                const totalUsed = bl.spent + bl.committed;
                const percentage = Math.min(100, (totalUsed / bl.allocation) * 100);
                const remaining = bl.allocation - totalUsed;
                
                return (
                  <TableRow key={bl.id}>
                    <TableCell className="font-semibold">{bl.name}</TableCell>
                    <TableCell className="text-right">{bl.allocation.toLocaleString()}</TableCell>
                    <TableCell className="text-right">{bl.spent.toLocaleString()}</TableCell>
                    <TableCell className="text-right">{bl.committed.toLocaleString()}</TableCell>
                    <TableCell>
                      <div className="space-y-1.5">
                        <div className="flex justify-between text-[10px] text-muted-foreground uppercase font-bold">
                          <span>{percentage.toFixed(1)}%</span>
                          <span>{totalUsed.toLocaleString()} Used</span>
                        </div>
                        <Progress value={percentage} className="h-1.5" />
                      </div>
                    </TableCell>
                    <TableCell className={`text-right font-bold ${remaining < 0 ? 'text-destructive' : 'text-primary'}`}>
                      {remaining.toLocaleString()}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
