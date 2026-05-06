
"use client";

import { StatCard } from '@/components/dashboard/StatCard';
import { 
  ShoppingCart, 
  FileCheck, 
  Clock, 
  AlertCircle,
  TrendingUp,
  Package
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

const budgetData = [
  { name: 'IT Infrastructure', spent: 65000, budget: 150000 },
  { name: 'Office Equip', spent: 17000, budget: 50000 },
  { name: 'Marketing', spent: 10500, budget: 30000 },
  { name: 'Stationery', spent: 4500, budget: 10000 },
];

const vendorPerformance = [
  { name: 'Top Performing', value: 12, color: 'hsl(var(--accent))' },
  { name: 'Average', value: 45, color: 'hsl(var(--primary))' },
  { name: 'Needs Review', value: 8, color: 'hsl(var(--chart-3))' },
];

export default function DashboardPage() {
  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <h2 className="text-3xl font-headline font-bold text-primary">Overview</h2>
        <p className="text-muted-foreground">Welcome back, Jane. Here's what's happening today.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Pending Approvals" 
          value={8} 
          description="Requires your attention" 
          icon={Clock} 
        />
        <StatCard 
          title="Active LPOs" 
          value={24} 
          description="12 awaiting delivery" 
          icon={ShoppingCart} 
        />
        <StatCard 
          title="Total Spend (MTD)" 
          value="$42,500" 
          trend={{ value: 12, isUp: true }}
          icon={TrendingUp} 
        />
        <StatCard 
          title="GRN Disputes" 
          value={3} 
          description="Blocking payments" 
          icon={AlertCircle} 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 shadow-none border border-border">
          <CardHeader>
            <CardTitle className="text-lg font-headline">Budget Utilization vs Allocation</CardTitle>
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
                    contentStyle={{ borderRadius: '8px', border: '1px solid #ddd' }}
                  />
                  <Bar dataKey="spent" fill="hsl(var(--accent))" radius={[0, 4, 4, 0]} barSize={20} />
                  <Bar dataKey="budget" fill="hsl(var(--muted))" radius={[0, 4, 4, 0]} barSize={10} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-none border border-border">
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
        <Card className="shadow-none border border-border">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg font-headline">Recent Requisitions</CardTitle>
            <Badge variant="outline">View All</Badge>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { ref: 'REQ/24/012', desc: '5x MacBook Pro M3', dept: 'IT', status: 'Approved', amount: '$12,500' },
                { ref: 'REQ/24/013', desc: 'Ergonomic Desks', dept: 'Facilities', status: 'Pending Manager', amount: '$4,200' },
                { ref: 'REQ/24/014', desc: 'Marketing Swag', dept: 'Marketing', status: 'Approved', amount: '$1,800' },
              ].map((req) => (
                <div key={req.ref} className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-muted rounded-full">
                      <FileCheck className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <p className="font-semibold text-sm">{req.desc}</p>
                      <p className="text-xs text-muted-foreground">{req.ref} • {req.dept}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold">{req.amount}</p>
                    <Badge variant={req.status === 'Approved' ? 'secondary' : 'outline'} className="text-[10px]">
                      {req.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
