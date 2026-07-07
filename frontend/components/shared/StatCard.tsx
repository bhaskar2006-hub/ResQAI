"use client";

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  change?: string;
  trend?: 'up' | 'down' | 'neutral';
  icon: React.ElementType;
  color?: 'primary' | 'success' | 'warning' | 'danger' | 'info';
}

const colorMap = {
  primary: { bg: 'bg-primary/10', text: 'text-primary', border: 'border-primary/20' },
  success: { bg: 'bg-success/10', text: 'text-success', border: 'border-success/20' },
  warning: { bg: 'bg-warning/10', text: 'text-warning', border: 'border-warning/20' },
  danger: { bg: 'bg-danger/10', text: 'text-danger', border: 'border-danger/20' },
  info: { bg: 'bg-info/10', text: 'text-info', border: 'border-info/20' },
};

export default function StatCard({ title, value, change, trend = 'neutral', icon: Icon, color = 'primary' }: StatCardProps) {
  const c = colorMap[color];
  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus;

  return (
    <Card className={cn("relative overflow-hidden group hover:border-primary/30 transition-colors", c.border)}>
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">{title}</p>
            <p className="text-2xl font-bold tracking-tight">{value}</p>
            {change && (
              <div className={cn("flex items-center gap-1 text-xs font-medium",
                trend === 'up' ? 'text-success' : trend === 'down' ? 'text-danger' : 'text-muted-foreground'
              )}>
                <TrendIcon className="h-3 w-3" />
                <span>{change}</span>
              </div>
            )}
          </div>
          <div className={cn("h-10 w-10 rounded-lg flex items-center justify-center", c.bg)}>
            <Icon className={cn("h-5 w-5", c.text)} />
          </div>
        </div>
      </CardContent>
      {/* Subtle gradient overlay */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none bg-gradient-to-br from-transparent via-transparent to-primary/[0.03]" />
    </Card>
  );
}
