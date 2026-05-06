"use client";

import { useEffect, useState } from 'react';
import { StatCard } from '@/components/dashboard/StatCard';
import { 
  ShoppingCart, 
  FileCheck, 
  Clock, 
  AlertCircle,
  TrendingUp,
  Users,
  CalendarDays,
  ArrowRight
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useStore } from '@/lib/store';
import { useUserStore } from '@/lib/user-store';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { calculatePRTotal } from '@/lib/types';
import Link from 'next/link';

export default function DashboardPage() {
  const { prs, budgets, vendors, lpos, grns } = useStore();
  const { viewPreference } = useUserStore();
  const [mounted, setMounted] = useState(false);
  const [selectedYear, setSelectedYear] = useState('2024');

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const isDetailed = viewPreference === 'detailed';
  const filteredBudgets = budgets.filter(b => b.fiscalYear === selectedYear);
  const totalSpendVal = filteredBudgets.reduce((acc, bl) => acc + (bl.spent || 0), 0);
  const pendingApprovals = prs.filter(pr => pr.status?.includes('Pending')).length;
  const activeLposCount = lpos.filter(lpo => lpo.status !== 'Closed').length;
  const awaitingDelivery = lpos.filter(lpo => lpo.status === 'Dispatched').length;
  const activeDisputes = grns.filter(grn => grn.disputeFlag).length;

  const budgetData = filteredBudgets.map(bl => ({
    name: bl.name,
    spent: bl.spent || 0,
    budget: [bl.q1Allocation || 0, bl.q2Allocation || 0, bl.q3Allocation || 0, bl.q4Allocation || 0].reduce((a, b) => a + b, 0)
  }));

  const vendorPerformance = [
    { name: 'Top Performing', value: vendors.filter(v => v.rating >= 4.5).length, color: 'hsl(var(--accent))' },
    { name: 'Average', value: vendors.filter(v => v.rating >= 3 && v.rating < 4.5).length, color: 'hsl(var(--primary))' },
    { name: 'Needs Review', value: vendors.filter(v => v.rating < 3).length, color: 'hsl(var(--chart-3))' },
  ];

  const recentPrs = prs.slice(0, isDetailed ? 5 : 3);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className={isDetailed ? "text-3xl font-headline font-bold text-primary" : "text-4xl font-black text-primary"}>
            Portal Overview
          </h2>
          <p className="text-muted-foreground">Strategic procurement metrics and fiscal health.</p>
        </div>
        <div className="flex items-center gap-2">
          <CalendarDays className="w-4 h-4 text-muted-foreground" />
          <Select value={selectedYear} onValueChange={setSelectedYear}>
            <SelectTrigger className="w-[180px] h-9 text-xs font-bold uppercase tracking-wider">
              <SelectValue placeholder="Fiscal Year" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="2023">Fiscal Year 2023</SelectItem>
              <SelectItem value="2024">Fiscal Year 2024</SelectItem>
              <SelectItem value="2025">Fiscal Year 2025</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className={isDetailed ? "lg:col-span-2" : "lg:col-span-4"}>
          <StatCard 
            title={`Total Spend (Actual - ${selectedYear})`} 
            value={`Ksh ${totalSpendVal.toLocaleString()}`} 
            trend={{ value: 12, isUp: true }}
            icon={TrendingUp} 
            tooltip="The actual verified expenditure across all departmental budgets for the current fiscal period."
            description={isDetailed ? "Verified actuals vs last month" : undefined}
          />
        </div>

        <div className="lg:col-span-1">
          <StatCard 
            title="Pending Approvals" 
            value={pendingApprovals} 
            description={isDetailed ? "Awaiting your review" : undefined}
            icon={Clock} 
          />
        </div>
        <div className="lg:col-span-1">
          <StatCard 
            title="Active LPOs" 
            value={activeLposCount} 
            description={isDetailed ? `${awaitingDelivery} out for delivery` : undefined}
            icon={ShoppingCart} 
          />
        </div>

        {isDetailed && (
          <>
            <div className="lg:col-span-2 lg:row-span-2">
              <Card className="h-full shadow-none border border-border">
                <CardHeader>
                  <CardTitle className="text-lg font-headline">Budget Utilization vs Allocation ({selectedYear})</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[320px]">
                    {budgetData.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={budgetData} layout="vertical">
                          <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                          <XAxis type="number" hide />
                          <YAxis 
                            dataKey="name" 
                            type="category" 
                            width={100} 
                            axisLine={false}
                            tickLine={false}
                            fontSize={11}
                          />
                          <Tooltip 
                            cursor={{ fill: 'transparent' }}
                            contentStyle={{ borderRadius: '8px', border: '1px solid #border', backgroundColor: 'hsl(var(--card))', color: 'hsl(var(--foreground))' }}
                            formatter={(value: any) => [`Ksh ${value.toLocaleString()}`, '']}
                          />
                          <Bar dataKey="spent" fill="hsl(var(--accent))" radius={[0, 4, 4, 0]} barSize={24} />
                          <Bar dataKey="budget" fill="hsl(var(--muted))" radius={[0, 4, 4, 0]} barSize={8} />
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="flex flex-col items-center justify-center h-full text-muted-foreground space-y-2">
                        <AlertCircle className="w-8 h-8 opacity-20" />
                        <p className="text-sm">No budget data for {selectedYear}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="lg:col-span-1">
               <StatCard 
                title="GRN Disputes" 
                value={activeDisputes} 
                icon={AlertCircle} 
              />
            </div>

            <div className="lg:col-span-1 lg:row-span-2">
              <Card className="h-full shadow-none border border-border overflow-hidden">
                <CardHeader>
                  <CardTitle className="text-lg font-headline">Vendor Quality</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col items-center">
                  <div className="h-[180px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={vendorPerformance}
                          innerRadius={50}
                          outerRadius={70}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {vendorPerformance.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="lg:col-span-1">
               <StatCard 
                title="Onboarded Vendors" 
                value={vendors.length} 
                icon={Users} 
              />
            </div>
          </>
        )}

        <div className={isDetailed ? "lg:col-span-3" : "lg:col-span-4"}>
          <Card className="shadow-none border border-border overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between py-4">
              <CardTitle className="text-lg font-headline">Recent Requisitions</CardTitle>
              <Link href="/requisitions" className="text-xs font-bold text-accent flex items-center gap-1 hover:underline">
                View All <ArrowRight className="w-3 h-3" />
              </Link>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentPrs.length > 0 ? (
                  recentPrs.map((req) => (
                    <Link 
                      key={req.id} 
                      href={`/requisitions?id=${req.id}`}
                      className="flex items-center justify-between p-4 rounded-xl hover:bg-muted/50 transition-all border border-border/50 group"
                    >
                      <div className="flex items-center gap-4">
                        <div className="p-2 bg-muted rounded-lg shrink-0 group-hover:bg-accent/10 transition-colors">
                          <FileCheck className="w-4 h-4 text-primary group-hover:text-accent" />
                        </div>
                        <div className="overflow-hidden">
                          <p className="font-bold text-sm truncate">{req.items?.[0]?.description || 'Untitled Request'}</p>
                          {isDetailed && <p className="text-[10px] text-muted-foreground uppercase">{req.refNumber} • {req.budgetLine}</p>}
                        </div>
                      </div>
                      <div className="text-right shrink-0 ml-4">
                        <p className={isDetailed ? "text-sm font-black" : "text-lg font-bold"}>Ksh {calculatePRTotal(req).toLocaleString()}</p>
                        <Badge variant={req.status === 'Approved' ? 'secondary' : 'outline'} className="text-[9px] px-1.5 py-0">
                          {req.status}
                        </Badge>
                      </div>
                    </Link>
                  ))
                ) : (
                  <p className="text-sm text-center text-muted-foreground py-8">No recent requisitions found.</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
