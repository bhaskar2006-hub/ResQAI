"use client";

import React, { useState, useEffect, useCallback } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { api } from '@/utils/api';
import { getSocket } from '@/utils/socket';
import { Users, Truck, AlertCircle, Package } from 'lucide-react';

interface ResourceItem {
  id: string; type: 'AMBULANCE' | 'FIRE_TRUCK' | 'BOAT' | 'VOLUNTEER'; status: 'AVAILABLE' | 'ASSIGNED' | 'MAINTENANCE'; identifier: string;
}

const SUPPLY_DATA = [
  { name: 'Dry Ration Food Packs', allocated: 450, total: 1000, color: '#22c55e' },
  { name: 'Clean Drinking Water (Litres)', allocated: 1200, total: 3000, color: '#0ea5e9' },
  { name: 'First Aid & Medical Kits', allocated: 180, total: 200, color: '#ef4444' },
];

function NgoKpiCard({ label, value, icon: Icon, accent }: {
  label: string; value: string | number;
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
      </div>
    </div>
  );
}

export default function NgoDashboard() {
  const [resources, setResources] = useState<ResourceItem[]>([]);

  const fetchResources = useCallback(async () => {
    try {
      const res = await api.get('/resources') as { success?: boolean; data?: { resources?: ResourceItem[] } };
      if (res.success && res.data?.resources) {
        setResources(res.data.resources);
      }
    } catch (err) { console.error('Failed to load resources:', err); }
  }, []);

  useEffect(() => {
    fetchResources();
    const socket = getSocket();
    socket.on('sosUpdated', fetchResources);
    return () => { socket.off('sosUpdated', fetchResources); };
  }, [fetchResources]);

  const volunteersCount = resources.filter(r => r.type === 'VOLUNTEER').length;
  const vehiclesCount = resources.filter(r => r.type !== 'VOLUNTEER').length;
  const activeDeployments = resources.filter(r => r.status === 'ASSIGNED').length;

  return (
    <DashboardLayout role="ngo" title="NGO Resource Dashboard" subtitle="Supply Chain & Emergency Asset Deployments">
      <div className="space-y-5">
        
        {/* KPI Strip */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <NgoKpiCard label="Volunteer Responders" value={volunteersCount} icon={Users} accent="bg-[#22c55e]/10 text-[#22c55e]" />
          <NgoKpiCard label="Logistics Vehicles" value={vehiclesCount} icon={Truck} accent="bg-primary/10 text-primary" />
          <NgoKpiCard label="Active Deployments" value={activeDeployments} icon={AlertCircle} accent="bg-[#ef4444]/10 text-[#ef4444]" />
        </div>

        {/* Lower Row Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
          {/* Quick Links Card */}
          <div className="glass-panel rounded-xl p-4 lg:p-5 space-y-4 h-fit">
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Truck className="h-4 w-4 text-primary" />
              NGO Dispatch Actions
            </h3>
            <p className="text-xs text-[#64748b] leading-relaxed">
              Coordinate and dispatch emergency supplies or manage the active roster profiles of rapid response volunteers.
            </p>
            <div className="space-y-2 pt-2">
              <a href="/ngo/distribution" className="h-9 w-full rounded-lg bg-primary hover:bg-primary/90 text-white font-medium text-xs flex items-center justify-center transition-colors">
                <span>Open Staging Distribution Map</span>
              </a>
              <a href="/ngo/volunteers" className="h-9 w-full rounded-lg border border-[#1e3352] hover:bg-[#060e1d] text-[#64748b] hover:text-foreground font-medium text-xs flex items-center justify-center transition-colors">
                <span>Manage Volunteers Roster</span>
              </a>
            </div>
          </div>

          {/* Supply progress */}
          <div className="xl:col-span-2 glass-panel rounded-xl p-4 lg:p-5">
            <div className="border-b border-[#1e3352] pb-3 mb-4">
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <Package className="h-4 w-4 text-[#f59e0b]" />
                Supply Progress Overview
              </h3>
            </div>
            <div className="space-y-4">
              {SUPPLY_DATA.map(item => {
                const pct = Math.round((item.allocated / item.total) * 100);
                return (
                  <div key={item.name} className="space-y-1.5">
                    <div className="flex justify-between text-xs font-medium">
                      <span className="text-foreground">{item.name}</span>
                      <span className="text-[#64748b]">{item.allocated} / {item.total}</span>
                    </div>
                    <div className="h-2 bg-[#1e3352] rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-1000"
                        style={{ width: `${pct}%`, background: item.color }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

      </div>
    </DashboardLayout>
  );
}
