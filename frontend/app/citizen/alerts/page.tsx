"use client";

import React, { useState, useEffect, useCallback } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Badge } from '@/components/ui/badge';
import { api } from '@/utils/api';
import { AlertTriangle } from 'lucide-react';

interface ActiveAlert {
  id: string; name: string; type: string; severity: string; description: string;
}
interface ApiResponse<T> { success?: boolean; data?: T }

export default function CitizenAlertsPage() {
  const [alerts, setAlerts] = useState<ActiveAlert[]>([]);

  const fetchAlerts = useCallback(async () => {
    try {
      const res = await api.get('/disasters?active=true').catch(() => null) as ApiResponse<{ disasters?: ActiveAlert[] }> | null;
      if (res?.success && res.data?.disasters) setAlerts(res.data.disasters);
    } catch (err) { console.error(err); }
  }, []);

  useEffect(() => {
    fetchAlerts();
  }, [fetchAlerts]);

  return (
    <DashboardLayout role="citizen" title="Broadcast Alerts" subtitle="Official emergency notices and perimeter updates">
      <div className="max-w-3xl mx-auto space-y-4">
        <div className="rounded-xl border border-[#ef4444]/30 bg-[#ef4444]/5 p-5 glass-panel space-y-4">
          <div className="flex items-center gap-2 border-b border-[#ef4444]/20 pb-3">
            <AlertTriangle className="h-5 w-5 text-[#ef4444] animate-pulse-severity" />
            <span className="text-sm font-semibold text-[#ef4444]">Active Emergency Broadcasts</span>
            <Badge variant="destructive" className="bg-[#ef4444]/25 text-[#ef4444] border border-[#ef4444]/40 text-[10px] font-mono ml-2">
              {alerts.length} Warnings
            </Badge>
          </div>
          <div className="space-y-3">
            {alerts.length === 0 ? (
              <p className="text-center text-xs text-[#64748b] py-8">No active hazard threats or official evacuation warnings in your region.</p>
            ) : (
              alerts.map(alert => (
                <div key={alert.id} className="flex flex-col sm:flex-row sm:items-center gap-3 p-3.5 rounded-lg bg-[#060e1d] border border-[#1e3352]/75 text-xs">
                  <div className="flex items-center gap-1.5 font-semibold text-foreground min-w-[150px]">
                    <span className="h-2 w-2 rounded-full bg-[#ef4444]" />
                    <span>{alert.name}</span>
                  </div>
                  <span className="hidden sm:inline text-[#1e3352]">|</span>
                  <p className="text-[#64748b] flex-1 leading-relaxed">{alert.description}</p>
                  <span className="self-end sm:self-center px-2 py-0.5 rounded text-[9px] font-mono font-semibold border sev-critical uppercase shrink-0">
                    {alert.severity}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
