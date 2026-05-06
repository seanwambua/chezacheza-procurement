
import { Card, CardContent } from "@/components/ui/card";
import { LucideIcon, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface StatCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon: LucideIcon;
  trend?: {
    value: number;
    isUp: boolean;
  };
  tooltip?: string;
}

export function StatCard({ title, value, description, icon: Icon, trend, tooltip }: StatCardProps) {
  const content = (
    <Card className="shadow-none border border-border h-full hover:border-accent/30 transition-colors">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm font-medium text-muted-foreground flex items-center gap-1.5">
            {title}
            {tooltip && <Info className="w-3 h-3 opacity-30" />}
          </p>
          <Icon className="w-4 h-4 text-accent" />
        </div>
        <div className="flex items-baseline gap-2">
          <h3 className="text-2xl font-bold font-headline">{value}</h3>
          {trend && (
            <span className={cn(
              "text-xs font-medium px-1.5 py-0.5 rounded-full",
              trend.isUp ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
            )}>
              {trend.isUp ? '↑' : '↓'} {trend.value}%
            </span>
          )}
        </div>
        {description && <p className="text-xs text-muted-foreground mt-1">{description}</p>}
      </CardContent>
    </Card>
  );

  if (!tooltip) return content;

  return (
    <TooltipProvider>
      <Tooltip delayDuration={200}>
        <TooltipTrigger asChild>
          <div className="h-full cursor-help">
            {content}
          </div>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs text-[11px] p-2 leading-relaxed">
          {tooltip}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
