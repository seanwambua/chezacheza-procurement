import { Card, CardContent } from "@/components/ui/card";
import { LucideIcon, Info, TrendingUp, TrendingDown } from "lucide-react";
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
    <Card className="shadow-none border border-border h-full hover:border-accent/30 transition-all duration-300 group">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
            {title}
            {tooltip && <Info className="w-3 h-3 opacity-30 group-hover:opacity-100 transition-opacity" />}
          </p>
          <div className="p-2 bg-muted rounded-lg group-hover:bg-accent/10 transition-colors">
            <Icon className="w-4 h-4 text-accent" />
          </div>
        </div>
        <div className="flex items-center gap-3">
          <h3 className="text-2xl font-black font-headline tracking-tighter">{value}</h3>
          {trend && (
            <div className={cn(
              "text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-0.5 transition-colors",
              trend.isUp 
                ? "bg-green-500/10 text-green-600 dark:bg-green-500/20 dark:text-green-400" 
                : "bg-destructive/10 text-destructive"
            )}>
              {trend.isUp ? <TrendingUp className="w-2.5 h-2.5" /> : <TrendingDown className="w-2.5 h-2.5" />}
              {trend.value}%
            </div>
          )}
        </div>
        {description && <p className="text-[10px] text-muted-foreground font-medium mt-2 flex items-center gap-1">
          <span className="w-1 h-1 rounded-full bg-accent/40" />
          {description}
        </p>}
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
        <TooltipContent side="top" className="max-w-xs text-[11px] p-2 leading-relaxed font-medium bg-card text-foreground border-accent/20">
          {tooltip}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
