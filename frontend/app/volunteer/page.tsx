"use client";

import React, { useState, useEffect, useCallback } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { api } from '@/utils/api';
import { getSocket } from '@/utils/socket';
import { AlertTriangle, Shield, Radio, CheckCircle, Navigation } from 'lucide-react';

interface ResourceDetails {
  id: string; type: string; status: string; identifier: string; latitude: number; longitude: number; assignedToSosId?: string;
  assignedToSos?: { id: string; description: string; latitude: number; longitude: number; status: string };
}
interface UserInfo { id: string; resourceId?: string }

function VolKpiCard({ label, value, sub, icon: Icon, accent }: {
  label: string; value: string | number; sub: string;
  icon: React.ElementType; accent: string;
}) {
  return (
    <div className="glass-panel rounded-xl p-4 lg:p-5 flex items-start gap-4 hover:border-primary/30 transition-colors">
      <div className={`h-10 w-10 rounded-lg flex items-center justify-center shrink-0 ${accent}`}>
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0">
        <p className="text-[10px] text-[#64748b] uppercase tracking-wider font-medium">{label}</p>
        <p className="text-xl lg:text-2xl font-bold tracking-tight text-foreground mt-0.5">{value}</p>
        <p className="text-[11px] text-[#64748b] mt-0.5">{sub}</p>
      </div>
    </div>
  );
}

export default function VolunteerDashboard() {
  const [user, setUser] = useState<UserInfo | null>(null);
  const [resource, setResource] = useState<ResourceDetails | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem('user');
    if (stored) {
      try { setUser(JSON.parse(stored)); } catch (e) { console.error(e); }
    }
  }, []);

  const loadVolunteerData = useCallback(async () => {
    if (!user?.resourceId) return;
    try {
      const res = await api.get(`/resources/${user.resourceId}`) as { success?: boolean; data?: { resource?: ResourceDetails } };
      if (res.success && res.data?.resource) {
        setResource(res.data.resource);
      }
    } catch (err) { console.error(err); }
  }, [user]);

  useEffect(() => {
    if (user) loadVolunteerData();
  }, [user, loadVolunteerData]);

  useEffect(() => {
    const socket = getSocket();
    const refresh = () => loadVolunteerData();
    socket.on('sosUpdated', refresh);
    return () => { socket.off('sosUpdated', refresh); };
  }, [loadVolunteerData]);

  if (!user || !resource) {
    return (
      <DashboardLayout role="volunteer" title="Responder Operations Portal" subtitle="Syncing mesh telemetry...">
        <div className="flex items-center justify-center py-24">
          <div className="flex flex-col items-center gap-3">
            <span className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            <p className="text-xs text-[#64748b] font-mono">Syncing mesh telemetry...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const activeTask = resource.assignedToSos;

  return (
    <DashboardLayout role="volunteer" title="Responder Operations Portal" subtitle={`Deployment profile: ${resource.identifier}`}>
      <div className="space-y-5">
        
        {/* KPI Strip */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <VolKpiCard
            label="Deployment Status"
            value={resource.status}
            sub={resource.status === 'AVAILABLE' ? 'Awaiting assignment' : 'Mission in progress'}
            icon={Shield}
            accent={resource.status === 'ASSIGNED' ? "bg-[#f59e0b]/10 text-[#f59e0b]" : "bg-[#22c55e]/10 text-[#22c55e]"}
          />
          <VolKpiCard
            label="Active Mission"
            value={activeTask ? "1 Assigned" : "Standby"}
            sub={activeTask ? "Critical distress route" : "Awaiting dispatch"}
            icon={AlertTriangle}
            accent={activeTask ? "bg-[#ef4444]/10 text-[#ef4444]" : "bg-[#22c55e]/10 text-[#22c55e]"}
          />
          <VolKpiCard
            label="Local Mesh Signal"
            value="FIPS Link OK"
            sub="GPS lock secure"
            icon={Radio}
            accent="bg-primary/10 text-primary"
          />
        </div>

        {/* Lower Row Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
          {/* Quick Actions Card */}
          <div className="glass-panel rounded-xl p-4 lg:p-5 space-y-4 h-fit">
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Navigation className="h-4 w-4 text-primary" />
              Responder Quick Actions
            </h3>
            <p className="text-xs text-[#64748b] leading-relaxed">
              Access your task assignments or view your live route coordinate map via the dashboard console.
            </p>
            <div className="space-y-2 pt-2">
              <a href="/volunteer/tasks" className="h-9 w-full rounded-lg bg-primary hover:bg-primary/90 text-white font-medium text-xs flex items-center justify-center transition-colors">
                <span>View My Task Details</span>
              </a>
              <a href="/volunteer/map" className="h-9 w-full rounded-lg border border-[#1e3352] hover:bg-[#060e1d] text-[#64748b] hover:text-foreground font-medium text-xs flex items-center justify-center transition-colors">
                <span>Open Telemetry Route Map</span>
              </a>
            </div>
          </div>

          {/* Mission summary */}
          <div className="xl:col-span-2 glass-panel rounded-xl p-4 lg:p-5">
            <div className="border-b border-[#1e3352] pb-3 mb-4">
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-[#22c55e]" />
                Current Assignment Preview
              </h3>
            </div>
            {!activeTask ? (
              <div className="text-center py-10 space-y-2">
                <CheckCircle className="h-8 w-8 text-[#22c55e] mx-auto opacity-60" />
                <p className="text-xs text-[#64748b]">Standing by for dispatches.</p>
              </div>
            ) : (
              <div className="p-3.5 rounded-lg border border-[#ef4444]/20 bg-[#ef4444]/5">
                <p className="text-xs text-foreground font-semibold uppercase tracking-wider text-[#ef4444] mb-1">Active Distress</p>
                <p className="text-xs text-[#e8edf5] leading-relaxed">{activeTask.description}</p>
              </div>
            )}
          </div>
        </div>

      </div>
    </DashboardLayout>
  );
}
