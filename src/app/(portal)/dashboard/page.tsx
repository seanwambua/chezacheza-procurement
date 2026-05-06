
"use client";

import { useEffect, useState } from 'react';
import { StatCard } from '@/components/dashboard/StatCard';
import { 
  ShoppingCart, 
  FileCheck, 
  Clock, 
  AlertCircle,
  Landmark,
  TrendingUp,
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

export default function DashboardPage() {
  const { prs, budgets, vendors, lpos, grns } = useStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  // Dynamic calculations
  const totalSpendVal = budgets.reduce((acc, bl) => acc + bl.spent, 0);
  const pendingApprovals = prs.filter(pr => pr.status.includes('Pending')).length;
  const activeLposCount = lpos.filter(lpo => lpo.status !== 'Closed').length;
  const awaitingDelivery = lpos.filter(lpo => lpo.status === 'Dispatched').length;
  const activeDisputes = grns.filter(grn => grn.disputeFlag).length;

  const budgetData = budgets.map(bl => ({
    name: bl.name,
    spent: bl.spent,
    budget: [bl.q1Allocation, bl.q2Allocation, bl.q3Allocation, bl.q4Allocation].reduce((a, b) => a + b, 0)
  }));

  const vendorPerformance = [
    { name: 'Top Performing', value: vendors.filter(v => v.rating >= 4.5).length, color: 'hsl(var(--accent))' },
    { name: 'Average', value: vendors.filter(v => v.rating >= 3 && v.rating < 4.5).length, color: 'hsl(var(--primary))' },
    { name: 'Needs Review', value: vendors.filter(v => v.rating < 3).length, color: 'hsl(var(--chart-3))' },
  ];

  const recentPrs = prs.slice(0, 5);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <h2 className="text-3xl font-headline font-bold text-primary">Overview</h2>
        <p className="text-muted-foreground">Welcome back. Here's what's happening today.</p>
      </div>

      {/* Bento Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1">
          <StatCard 
            title="Pending Approvals" 
            value={pendingApprovals} 
            description="Requires your attention" 
            icon={Clock} 
            tooltip="Number of purchase requisitions currently awaiting manager or finance approval before they can be processed."
          />
        </div>
        <div className="lg:col-span-1">
          <StatCard 
            title="Active LPOs" 
            value={activeLposCount} 
            description={`${awaitingDelivery} awaiting delivery`} 
            icon={ShoppingCart} 
            tooltip="Purchase orders that have been sent to vendors but are not yet fully fulfilled, delivered, or closed."
          />
        </div>
        <div className="md:col-span-2">
          <StatCard 
            title="Total Spend (Actual)" 
            value={`Ksh ${totalSpendVal.toLocaleString()}`} 
            trend={{ value: 12, isUp: true }}
            icon={TrendingUp} 
            tooltip="The actual verified expenditure across all departmental budgets for the current fiscal period."
          />
        </div>
        <div className="lg:col-span-1">
           <StatCard 
            title="GRN Disputes" 
            value={activeDisputes} 
            description="Blocking payments" 
            icon={AlertCircle} 
            tooltip="Goods Received Notes with quality or quantity issues that must be resolved before finance can release payment."
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 shadow-none border border-border">
          <CardHeader>
            <CardTitle className="text-lg font-headline">Budget Utilization vs Allocation (Ksh)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
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
                    fontSize={12}
                  />
                  <Tooltip 
                    cursor={{ fill: 'transparent' }}
                    contentStyle={{ borderRadius: '8px', border: '1px solid #border' }}
                    formatter={(value: any) => [`Ksh ${value.toLocaleString()}`, '']}
                  />
                  <Bar dataKey="spent" fill="hsl(var(--accent))" radius={[0, 4, 4, 0]} barSize={20} />
                  <Bar dataKey="budget" fill="hsl(var(--muted))" radius={[0, 4, 4, 0]} barSize={10} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-none border border-border overflow-hidden">
          <CardHeader>
            <CardTitle className="text-lg font-headline">Vendor Quality</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center">
            <div className="h-[200px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={vendorPerformance}
                    innerRadius={60}
                    outerRadius={80}
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
            <div className="w-full space-y-2 mt-4">
              {vendorPerformance.map((item) => (
                <div key={item.name} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="text-muted-foreground">{item.name}</span>
                  </div>
                  <span className="font-semibold">{item.value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <Card className="shadow-none border border-border overflow-x-auto">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg font-headline">Recent Requisitions</CardTitle>
            <Badge variant="outline">View All</Badge>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 min-w-[500px]">
              {recentPrs.length > 0 ? (
                recentPrs.map((req) => (
                  <div key={req.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="p-2 bg-muted rounded-full shrink-0">
                        <FileCheck className="w-4 h-4 text-primary" />
                      </div>
                      <div className="overflow-hidden">
                        <p className="font-semibold text-sm truncate">{req.itemDescription}</p>
                        <p className="text-xs text-muted-foreground">{req.refNumber} • {req.budgetLine}</p>
                      </div>
                    </div>
                    <div className="text-right shrink-0 ml-4">
                      <p className="text-sm font-bold">Ksh {(req.estimatedCost * req.quantity).toLocaleString()}</p>
                      <Badge variant={req.status === 'Approved' ? 'secondary' : 'outline'} className="text-[10px]">
                        {req.status}
                      </Badge>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-center text-muted-foreground py-4">No recent requisitions found.</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
