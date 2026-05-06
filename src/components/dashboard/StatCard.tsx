
import { Card, CardContent } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon: LucideIcon;
  trend?: {
    value: number;
    isUp: boolean;
  };
}

export function StatCard({ title, value, description, icon: Icon, trend }: StatCardProps) {
  return (
    <Card className="shadow-none border border-border">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <Icon className="w-4 h-4 text-accent" />
        </div>
        <div className="flex items-baseline gap-2">
          <h3 className="text-2xl font-bold font-headline">{value}</h3>
          {trend && (
            <span className={cn(
              "text-xs font-medium",
              trend.isUp ? "text-green-600" : "text-red-600"
            )}>
              {trend.isUp ? '+' : '-'}{trend.value}%
            </span>
          )}
        </div>
        {description && <p className="text-xs text-muted-foreground mt-1">{description}</p>}
      </CardContent>
    </Card>
  );
}

import { cn } from "@/lib/utils";
