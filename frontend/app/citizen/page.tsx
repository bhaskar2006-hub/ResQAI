"use client";

import React, { useState, useEffect, useCallback } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Badge } from '@/components/ui/badge';
import { api } from '@/utils/api';
import { AlertTriangle, Home, Link } from 'lucide-react';

interface ShelterInfo {
  id: string; name: string; address: string; capacity: number; occupancy: number; latitude: number; longitude: number;
}
interface ActiveAlert {
  id: string; name: string; type: string; severity: string; description: string;
}
interface ApiResponse<T> { success?: boolean; data?: T }

function CitizenKpiCard({ label, value, sub, accent }: {
  label: string; value: string | number; sub: string; accent: string;
}) {
  return (
    <div className="glass-panel rounded-xl p-4 lg:p-5 flex items-start gap-4 hover:border-primary/30 transition-colors">
      <div className="min-w-0">
        <p className="text-[10px] text-[#64748b] uppercase tracking-wider font-medium">{label}</p>
        <p className={`text-xl lg:text-2xl font-bold tracking-tight mt-0.5 ${accent}`}>{value}</p>
        <p className="text-[11px] text-[#64748b] mt-0.5">{sub}</p>
      </div>
    </div>
  );
}

export default function CitizenDashboard() {
  const [shelters, setShelters] = useState<ShelterInfo[]>([]);
  const [alerts, setAlerts] = useState<ActiveAlert[]>([]);

  const fetchData = useCallback(async () => {
    try {
      const [shelterRes, disasterRes] = await Promise.all([
        api.get('/shelters').catch(() => null),
        api.get('/disasters?active=true').catch(() => null),
      ]) as [
        ApiResponse<{ shelters?: ShelterInfo[] }> | null,
        ApiResponse<{ disasters?: ActiveAlert[] }> | null
      ];
      if (shelterRes?.success && shelterRes.data?.shelters) setShelters(shelterRes.data.shelters);
      if (disasterRes?.success && disasterRes.data?.disasters) setAlerts(disasterRes.data.disasters);
    } catch (err) { console.error(err); }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return (
    <DashboardLayout role="citizen" title="Citizen Safety Portal" subtitle="Emergency SOS & Real-time Alerts">
      <div className="space-y-5">

        {/* Alerts Banner */}
        {alerts.length > 0 && (
          <div className="rounded-xl border border-[#ef4444]/30 bg-[#ef4444]/5 p-4 animate-slide-up space-y-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4.5 w-4.5 text-[#ef4444] animate-pulse-severity" />
              <span className="text-sm font-semibold text-[#ef4444]">Active Emergency Broadcasts</span>
              <Badge variant="destructive" className="bg-[#ef4444]/20 text-[#ef4444] border border-[#ef4444]/30 text-[9px] font-mono ml-2">{alerts.length}</Badge>
            </div>
            <div className="space-y-2">
              {alerts.slice(0, 2).map(alert => (
                <div key={alert.id} className="flex flex-col sm:flex-row sm:items-center gap-2 p-2.5 rounded-lg bg-[#060e1d] border border-[#1e3352]/75 text-xs">
                  <div className="flex items-center gap-1.5 font-medium text-foreground min-w-0">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#ef4444]" />
                    <span className="truncate">{alert.name}</span>
                  </div>
                  <span className="hidden sm:inline text-[#64748b]">|</span>
                  <span className="text-[#64748b] flex-1 leading-snug">{alert.description}</span>
                  <span className="self-end sm:self-center px-1.5 py-0.5 rounded text-[10px] font-medium border sev-critical uppercase">
                    {alert.severity}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* KPI Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <CitizenKpiCard label="Active Broadcast Threats" value={alerts.length} sub={alerts.length > 0 ? "Under warning status" : "No threat issues"} accent="text-[#ef4444]" />
          <CitizenKpiCard label="Designated Shelters" value={shelters.length} sub="Evacuation points active" accent="text-[#22c55e]" />
          <CitizenKpiCard label="Portal Status" value="Online" sub="Secured mesh network" accent="text-primary" />
        </div>

        {/* Primary Row */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
          {/* Quick Actions Card */}
          <div className="xl:col-span-1 bg-[#0d1b2e] border border-[#1e3352] rounded-xl p-4 lg:p-5 flex flex-col space-y-4 glass-panel h-fit">
            <div className="border-b border-[#1e3352] pb-3 flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-primary animate-pulse-severity shrink-0" />
              <h3 className="text-sm font-semibold text-foreground">Quick Action Access</h3>
            </div>
            <p className="text-xs text-[#64748b] leading-relaxed">
              Use the sidebar or the navigation panel to instantly trigger distress signals or view detailed maps of designated emergency shelters.
            </p>
            <div className="space-y-2 pt-2">
              <a href="/citizen/sos" className="h-9 w-full rounded-lg bg-[#ef4444] hover:bg-[#ef4444]/90 text-white font-medium text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer">
                <span>Go to SOS Dispatch Form</span>
              </a>
              <a href="/citizen/shelters" className="h-9 w-full rounded-lg border border-[#1e3352] hover:bg-[#060e1d] text-[#64748b] hover:text-foreground font-medium text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer">
                <span>View Shelters Map</span>
              </a>
            </div>
          </div>

          {/* Shelter List */}
          <div className="xl:col-span-2 bg-[#0d1b2e] border border-[#1e3352] rounded-xl p-4 lg:p-5 glass-panel">
            <div className="border-b border-[#1e3352] pb-2.5 mb-3.5 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-foreground">Designated Shelter Load</h3>
                <p className="text-[11px] text-[#64748b] mt-0.5">Staging locations currently active.</p>
              </div>
              <a href="/citizen/shelters" className="text-xs text-primary font-medium hover:underline flex items-center gap-1">
                <span>Open map</span>
              </a>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[260px] overflow-y-auto pr-1">
              {shelters.length === 0 ? (
                <p className="col-span-2 text-center text-xs text-[#64748b] py-8">No designated shelters registered.</p>
              ) : (
                shelters.map(shelter => {
                  const capacityPct = Math.round((shelter.occupancy / shelter.capacity) * 100);
                  return (
                    <div key={shelter.id} className="p-3.5 rounded-lg border border-[#1e3352] bg-[#060e1d]/50 flex items-start gap-3">
                      <Home className="h-4.5 w-4.5 text-[#22c55e] shrink-0 mt-0.5" />
                      <div className="min-w-0 flex-1 space-y-1">
                        <p className="text-xs font-semibold text-[#e8edf5] truncate">{shelter.name}</p>
                        <p className="text-[10px] text-[#64748b] truncate">{shelter.address}</p>
                        <div className="space-y-1 pt-1.5">
                          <div className="flex justify-between text-[9px] text-[#64748b]">
                            <span>Occupancy Load</span>
                            <span>{shelter.occupancy} / {shelter.capacity} ({capacityPct}%)</span>
                          </div>
                          <div className="h-1 bg-[#1e3352] rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${capacityPct > 80 ? 'bg-[#ef4444]' : 'bg-[#22c55e]'}`}
                              style={{ width: `${capacityPct}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

      </div>
    </DashboardLayout>
  );
}
