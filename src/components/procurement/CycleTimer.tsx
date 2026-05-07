"use client";

import { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { differenceInMinutes, differenceInHours, differenceInDays } from 'date-fns';

interface CycleTimerProps {
  startTime: string;
  endTime?: string;
  className?: string;
}

export function CycleTimer({ startTime, endTime, className }: CycleTimerProps) {
  const [duration, setDuration] = useState<string>('');
  const [isUrgent, setIsUrgent] = useState(false);

  useEffect(() => {
    const updateDuration = () => {
      const start = new Date(startTime);
      const end = endTime ? new Date(endTime) : new Date();
      
      const days = differenceInDays(end, start);
      const hours = differenceInHours(end, start) % 24;
      const minutes = differenceInMinutes(end, start) % 60;

      let timeString = '';
      if (days > 0) timeString += `${days}d `;
      if (hours > 0 || days > 0) timeString += `${hours}h `;
      timeString += `${minutes}m`;

      setDuration(timeString);
      
      // Mark as urgent if dispatched for more than 3 days
      if (!endTime && days >= 3) {
        setIsUrgent(true);
      }
    };

    updateDuration();
    
    // Only set up interval if we're tracking an active (ongoing) cycle
    if (!endTime) {
      const interval = setInterval(updateDuration, 60000); // Update every minute
      return () => clearInterval(interval);
    }
  }, [startTime, endTime]);

  return (
    <div className={cn(
      "flex items-center gap-1.5 px-2 py-0.5 rounded-md w-fit border",
      endTime 
        ? "bg-muted/50 text-muted-foreground border-transparent" 
        : isUrgent 
          ? "bg-destructive/10 text-destructive border-destructive/20 animate-pulse" 
          : "bg-accent/10 text-accent border-accent/20",
      className
    )}>
      <Clock className="w-3 h-3" />
      <span className="text-[10px] font-black uppercase tracking-tight tabular-nums">
        {endTime ? 'Final: ' : 'Live: '}{duration}
      </span>
    </div>
  );
}
