"use client";

import { useEffect, useState } from 'react';
import { useStore } from '@/lib/store';
import { useUserStore } from '@/lib/user-store';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { StatCard } from '@/components/dashboard/StatCard';
import { 
  Building2, 
  Users, 
  Wallet, 
  TrendingUp, 
  ArrowUpRight,
  ChevronRight,
  Info
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export default function DepartmentsPage() {
  const { budgets, prs } = useStore();
  const { users } = useUserStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  // Derive unique departments from budgets and users
  const departmentNames = Array.from(new Set([
    ...budgets.map(b => b.department),
    ...users.map(u => u.department)
  ])).filter(Boolean);

  const departmentalData = departmentNames.map(name => {
    const deptBudgets = budgets.filter(b => b.department === name);
    const deptUsers = users.filter(u => u.department === name);
    
    const totalAllocation = deptBudgets.reduce((acc, b) => 
      acc + b.q1Allocation + b.q2Allocation + b.q3Allocation + b.q4Allocation, 0
    );
    const totalSpent = deptBudgets.reduce((acc, b) => acc + b.spent, 0);
    const totalCommitted = deptBudgets.reduce((acc, b) => acc + b.committed, 0);
    const utilization = totalAllocation > 0 ? (totalSpent / totalAllocation) * 100 : 0;

    return {
      name,
      budgetCount: deptBudgets.length,
      staffCount: deptUsers.length,
      totalAllocation,
      totalSpent,
      totalCommitted,
      utilization,
      budgets: deptBudgets
    };
  });

  const totalAllocationAll = departmentalData.reduce((acc, d) => acc + d.totalAllocation, 0);
  const avgUtilization = departmentalData.length > 0 
    ? departmentalData.reduce((acc, d) => acc + d.utilization, 0) / departmentalData.length 
    : 0;

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-headline font-bold text-primary">Departmental Insights</h2>
          <p className="text-muted-foreground">Operational efficiency and resource distribution across departments.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard 
          title="Active Departments" 
          value={departmentalData.length} 
          icon={Building2} 
          description="Across all fiscal branches"
          tooltip="Total number of unique departments currently managing budgets or staff within the portal."
        />
        <StatCard 
          title="Total Global Allocation" 
          value={`Ksh ${totalAllocationAll.toLocaleString()}`} 
          icon={Wallet} 
          description="Consolidated annual pool"
          tooltip="The sum of all quarterly allocations across every department in the current system."
        />
        <StatCard 
          title="Avg. Utilization" 
          value={`${Math.round(avgUtilization)}%`} 
          icon={TrendingUp} 
          description="System-wide efficiency"
          tooltip="The average spending rate across all departments compared to their total allocated resources."
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {departmentalData.map((dept) => (
          <Card key={dept.name} className="border-border shadow-none hover:border-primary/20 transition-all group">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
              <div className="space-y-1">
                <CardTitle className="text-xl font-bold flex items-center gap-2">
                  {dept.name}
                  <Badge variant="outline" className="text-[10px] font-bold uppercase tracking-tighter">
                    Dept Code: {dept.name.substring(0, 3).toUpperCase()}
                  </Badge>
                </CardTitle>
                <p className="text-xs text-muted-foreground flex items-center gap-4">
                  <span className="flex items-center gap-1.5"><Users className="w-3 h-3" /> {dept.staffCount} Team Members</span>
                  <span className="flex items-center gap-1.5"><Wallet className="w-3 h-3" /> {dept.budgetCount} Active Budgets</span>
                </p>
              </div>
              <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 transition-opacity">
                <ChevronRight className="w-5 h-5" />
              </Button>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-muted/30 rounded-lg border border-border/50">
                  <p className="text-[10px] uppercase font-bold text-muted-foreground mb-1">Utilization</p>
                  <div className="flex items-end justify-between">
                    <span className="text-lg font-black">{Math.round(dept.utilization)}%</span>
                    <TrendingUp className="w-4 h-4 text-accent mb-1" />
                  </div>
                  <Progress value={dept.utilization} className="h-1.5 mt-2 bg-muted" />
                </div>
                <div className="p-3 bg-muted/30 rounded-lg border border-border/50">
                  <p className="text-[10px] uppercase font-bold text-muted-foreground mb-1">Net Committed</p>
                  <div className="flex items-end justify-between">
                    <span className="text-lg font-black truncate">Ksh {dept.totalCommitted.toLocaleString()}</span>
                  </div>
                  <p className="text-[9px] text-muted-foreground mt-2 uppercase">Pending verified payout</p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                    Primary Budgets
                    <TooltipProvider>
                      <Tooltip delayDuration={0}>
                        <TooltipTrigger asChild>
                          <Info className="w-3 h-3 cursor-help opacity-40" />
                        </TooltipTrigger>
                        <TooltipContent className="text-[10px]">Active financial lines owned by this department.</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </h4>
                  <span className="text-[10px] font-bold text-primary flex items-center gap-1 cursor-pointer hover:underline">
                    View All <ArrowUpRight className="w-2.5 h-2.5" />
                  </span>
                </div>
                <div className="space-y-2">
                  {dept.budgets.slice(0, 3).map((b) => (
                    <div key={b.id} className="flex items-center justify-between text-xs p-2.5 rounded-md hover:bg-muted/50 transition-colors border border-transparent hover:border-border">
                      <span className="font-semibold text-primary">{b.name}</span>
                      <div className="flex items-center gap-3">
                        <span className="text-muted-foreground">Ksh {b.spent.toLocaleString()} spent</span>
                        <div className={`w-1.5 h-1.5 rounded-full ${b.spent > 0 ? 'bg-accent' : 'bg-muted'}`} />
                      </div>
                    </div>
                  ))}
                  {dept.budgets.length > 3 && (
                    <p className="text-[10px] text-center text-muted-foreground font-medium pt-1">
                      + {dept.budgets.length - 3} more budget lines
                    </p>
                  )}
                </div>
              </div>

              <Separator className="opacity-50" />
              
              <div className="flex justify-between items-center pt-2">
                <div className="text-left">
                  <p className="text-[9px] uppercase font-bold text-muted-foreground">Total Annual Target</p>
                  <p className="text-sm font-black text-primary">Ksh {dept.totalAllocation.toLocaleString()}</p>
                </div>
                <Button variant="outline" size="sm" className="h-8 text-[11px] font-bold uppercase">
                  Audit Department
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
