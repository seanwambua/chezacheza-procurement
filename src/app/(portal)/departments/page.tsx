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
  ChevronRight,
  Info,
  AlertCircle
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from '@/lib/utils';

export default function DepartmentsPage() {
  const { budgets, selectedYear } = useStore();
  const { users, viewPreference } = useUserStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const isDetailed = viewPreference === 'detailed';

  // Departments are decoupled from years - they exist as long as there are users or historical budgets
  const departmentNames = Array.from(new Set([
    ...budgets.map(b => b.department),
    ...users.map(u => u.department)
  ])).filter(Boolean);

  const departmentalData = departmentNames.map(name => {
    // Current year data for performance tracking
    const currentYearBudgets = budgets.filter(b => b.department === name && b.fiscalYear === selectedYear);
    const deptUsers = users.filter(u => u.department === name);
    
    const totalAllocation = currentYearBudgets.reduce((acc, b) => 
      acc + b.q1Allocation + b.q2Allocation + b.q3Allocation + b.q4Allocation, 0
    );
    const totalSpent = currentYearBudgets.reduce((acc, b) => acc + (b.spent || 0), 0);
    const totalCommitted = currentYearBudgets.reduce((acc, b) => acc + (b.committed || 0), 0);
    const utilization = totalAllocation > 0 ? ((totalSpent + totalCommitted) / totalAllocation) * 100 : 0;

    return {
      name,
      budgetCount: currentYearBudgets.length,
      staffCount: deptUsers.length,
      totalAllocation,
      totalSpent,
      totalCommitted,
      utilization,
      budgets: currentYearBudgets,
      hasActiveBudgets: currentYearBudgets.length > 0
    };
  });

  const totalAllocationAll = departmentalData.reduce((acc, d) => acc + d.totalAllocation, 0);
  const avgUtilization = departmentalData.filter(d => d.hasActiveBudgets).length > 0 
    ? departmentalData.filter(d => d.hasActiveBudgets).reduce((acc, d) => acc + d.utilization, 0) / departmentalData.filter(d => d.hasActiveBudgets).length 
    : 0;

  return (
    <div className="space-y-6 md:space-y-8 animate-in fade-in duration-500 pb-10 max-w-full overflow-hidden">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="min-w-0 flex-1">
          <h2 className={cn(
            "font-headline font-bold text-primary tracking-tighter leading-tight truncate",
            isDetailed ? "text-2xl md:text-3xl" : "text-3xl md:text-4xl"
          )}>
            Departmental Insights
          </h2>
          <p className="text-muted-foreground text-sm font-medium">Persistent organizational branches and their FY {selectedYear} performance.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
        <StatCard 
          title="Total Branches" 
          value={departmentalData.length} 
          icon={Building2} 
          description={isDetailed ? "Decoupled global entities" : undefined}
        />
        <StatCard 
          title={`FY ${selectedYear} Pool`} 
          value={`Ksh ${totalAllocationAll.toLocaleString()}`} 
          icon={Wallet} 
          description={isDetailed ? "Active annual target" : undefined}
        />
        <div className="sm:col-span-2 md:col-span-1">
          <StatCard 
            title="Avg. Utilization" 
            value={`${Math.round(avgUtilization)}%`} 
            icon={TrendingUp} 
            description={isDetailed ? `Current FY ${selectedYear} efficiency` : undefined}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        {departmentalData.map((dept) => (
          <Card key={dept.name} className="border-border shadow-none hover:border-accent/20 transition-all group bg-card overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 px-4 sm:px-6 pt-4 sm:pt-6">
              <div className="space-y-1 min-w-0 flex-1 mr-2">
                <CardTitle className={cn(
                  "font-black flex items-center gap-2 truncate text-primary",
                  isDetailed ? "text-lg md:text-xl" : "text-xl md:text-2xl"
                )}>
                  {dept.name}
                </CardTitle>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                  <span className="flex items-center gap-1.5 text-[10px] sm:text-xs text-muted-foreground font-medium">
                    <Users className="w-3 h-3" /> {dept.staffCount} Team Members
                  </span>
                  {isDetailed && (
                    <span className="flex items-center gap-1.5 text-[10px] sm:text-xs text-muted-foreground font-medium">
                      <Wallet className="w-3 h-3" /> {dept.budgetCount} Active FY {selectedYear} Lines
                    </span>
                  )}
                </div>
              </div>
              <Button variant="ghost" size="icon" className="shrink-0 h-9 w-9 md:opacity-0 group-hover:opacity-100 transition-opacity">
                <ChevronRight className="w-5 h-5 text-accent" />
              </Button>
            </CardHeader>
            <CardContent className="space-y-6 px-4 sm:px-6 pb-4 sm:pb-6">
              {dept.hasActiveBudgets ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-4 bg-muted/30 rounded-xl border border-border/50 flex flex-col justify-between">
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Utilization (FY {selectedYear})</p>
                      <TrendingUp className="w-3.5 h-3.5 text-accent" />
                    </div>
                    <div className="flex items-end justify-between mb-2">
                      <span className={cn(
                        "font-black tracking-tight",
                        isDetailed ? "text-xl" : "text-2xl"
                      )}>{Math.round(dept.utilization)}%</span>
                    </div>
                    <Progress value={dept.utilization} className="h-1.5 bg-muted" />
                  </div>
                  <div className="p-4 bg-muted/30 rounded-xl border border-border/50 flex flex-col justify-between">
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">FY {selectedYear} Committed</p>
                      <div className="w-1.5 h-1.5 rounded-full bg-accent" />
                    </div>
                    <span className={cn(
                      "font-black tracking-tighter truncate text-primary leading-none",
                      isDetailed ? "text-lg" : "text-xl"
                    )}>
                      Ksh {dept.totalCommitted.toLocaleString()}
                    </span>
                    {isDetailed && <p className="text-[9px] text-muted-foreground mt-2 uppercase font-bold opacity-70">Awaiting Settlement</p>}
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3 p-6 bg-muted/20 border-2 border-dashed rounded-xl justify-center text-muted-foreground">
                  <AlertCircle className="w-5 h-5 opacity-40" />
                  <p className="text-xs font-bold uppercase tracking-tight">No Active FY {selectedYear} Allocation</p>
                </div>
              )}

              {isDetailed && dept.hasActiveBudgets && (
                <div className="space-y-4 pt-2">
                  <h4 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                    Current Budget Lines
                  </h4>
                  <div className="space-y-1.5">
                    {dept.budgets.slice(0, 3).map((b) => (
                      <div key={b.id} className="flex items-center justify-between text-xs p-2.5 rounded-lg hover:bg-muted/50 transition-colors border border-transparent hover:border-border/40 group/item">
                        <span className="font-bold text-primary truncate mr-2">{b.name}</span>
                        <div className="flex items-center gap-3 shrink-0">
                          <span className="text-[10px] font-bold text-muted-foreground uppercase">Ksh {b.spent.toLocaleString()}</span>
                          <div className={cn(
                            "w-1.5 h-1.5 rounded-full",
                            b.spent > 0 ? "bg-accent" : "bg-muted"
                          )} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4 pt-4 border-t border-border/50">
                <div className="text-left">
                  <p className="text-[9px] uppercase font-bold text-muted-foreground tracking-tight">FY {selectedYear} Target</p>
                  <p className={cn(
                    "font-black text-primary tracking-tighter leading-none",
                    isDetailed ? "text-lg" : "text-xl"
                  )}>
                    Ksh {dept.totalAllocation.toLocaleString()}
                  </p>
                </div>
                <Button variant="outline" size="sm" className="h-9 text-[10px] font-bold uppercase tracking-widest shadow-sm">
                  View Full History
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
