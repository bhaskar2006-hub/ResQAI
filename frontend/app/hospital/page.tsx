"use client";

import React, { useState, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { api } from '@/utils/api';
import { getSocket } from '@/utils/socket';
import { Bed, Activity, Shield, CheckCircle2 } from 'lucide-react';

const LiveMap = dynamic(() => import('@/components/shared/LiveMap'), { ssr: false });

interface UserInfo {
  id: string; name: string; email: string; role: string; hospitalId?: string;
}
interface HospitalDetails {
  id: string; name: string; latitude: number; longitude: number; address: string; capacity: number; availableBeds: number; contact: string;
}
interface SosReport {
  id: string; description: string; status: string; createdAt: string; audioUrl?: string; imageUrl?: string;
  aiAnalysis?: {
    recommendedHospitals?: Array<{ name: string }>;
  };
}
interface ApiResponse<T> { success?: boolean; data?: T }

function KpiCard({ label, value, sub, icon: Icon, accent }: {
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

export default function HospitalDashboard() {
  const [user, setUser] = useState<UserInfo | null>(null);
  const [hospital, setHospital] = useState<HospitalDetails | null>(null);
  const [incomingSos, setIncomingSos] = useState<SosReport[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem('user');
    if (stored) {
      try { setUser(JSON.parse(stored)); } catch (e) { console.error(e); }
    }
  }, []);

  const loadHospitalData = useCallback(async () => {
    if (!user?.hospitalId) return;
    try {
      const hospRes = await api.get(`/hospitals/${user.hospitalId}`) as ApiResponse<{ hospital?: HospitalDetails }>;
      if (hospRes.success && hospRes.data?.hospital) {
        setHospital(hospRes.data.hospital);

        const sosRes = await api.get('/sos') as ApiResponse<{ sosReports?: SosReport[] }>;
        if (sosRes.success && sosRes.data?.sosReports) {
          const filtered = sosRes.data.sosReports.filter((report) => {
            if (!report.aiAnalysis?.recommendedHospitals) return false;
            return report.aiAnalysis.recommendedHospitals.some(
              (h) => h.name.toLowerCase() === hospRes.data!.hospital!.name.toLowerCase()
            );
          });
          setIncomingSos(filtered);
        }
      }
    } catch (err) { console.error(err); }
  }, [user]);

  useEffect(() => {
    if (user) loadHospitalData();
  }, [user, loadHospitalData]);

  useEffect(() => {
    const socket = getSocket();
    const refresh = () => loadHospitalData();
    socket.on('newSOS', refresh);
    socket.on('sosUpdated', refresh);
    return () => {
      socket.off('newSOS', refresh);
      socket.off('sosUpdated', refresh);
    };
  }, [loadHospitalData]);

  if (!user || !hospital) {
    return (
      <DashboardLayout role="hospital" title="Hospital Operations Center" subtitle="Connecting telemetry...">
        <div className="flex items-center justify-center py-24">
          <div className="flex flex-col items-center gap-3">
            <span className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            <p className="text-xs text-[#64748b] font-mono">Loading operations deck...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const occupancyPct = Math.round(((hospital.capacity - hospital.availableBeds) / hospital.capacity) * 100);

  return (
    <DashboardLayout role="hospital" title="Hospital Operations Center" subtitle={`Operational control for ${hospital.name}`}>
      <div className="space-y-5">
        
        {/* KPI Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <KpiCard
            label="Available Emergency Beds"
            value={hospital.availableBeds}
            sub={`Out of ${hospital.capacity} total`}
            icon={Bed}
            accent={hospital.availableBeds < 5 ? "bg-[#ef4444]/10 text-[#ef4444]" : "bg-primary/10 text-primary"}
          />
          <KpiCard
            label="ICU Utilization"
            value={`${occupancyPct}%`}
            sub="Active ICU bed load"
            icon={Activity}
            accent={occupancyPct > 80 ? "bg-[#ef4444]/10 text-[#ef4444]" : "bg-[#22c55e]/10 text-[#22c55e]"}
          />
          <KpiCard
            label="Incoming Dispatches"
            value={incomingSos.length}
            sub="Arrival ETA < 15m"
            icon={Shield}
            accent={incomingSos.length > 0 ? "bg-[#f59e0b]/10 text-[#f59e0b]" : "bg-[#64748b]/10 text-[#64748b]"}
          />
          <KpiCard
            label="Facility Operational Status"
            value="Nominal"
            sub="All sectors synchronized"
            icon={CheckCircle2}
            accent="bg-[#22c55e]/10 text-[#22c55e]"
          />
        </div>

        {/* Primary Row Layout */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
          {/* Quick Stats & Coordinates */}
          <div className="glass-panel rounded-xl p-4 lg:p-5 space-y-4">
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Activity className="h-4 w-4 text-primary" />
              Operational Summary
            </h3>
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-[#64748b]">
                <span>Bed Capacity load</span>
                <span className="font-mono text-foreground font-medium">{occupancyPct}% Occupied</span>
              </div>
              <div className="h-1.5 bg-[#1e3352] rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${occupancyPct > 80 ? 'bg-[#ef4444]' : 'bg-primary'}`}
                  style={{ width: `${occupancyPct}%` }}
                />
              </div>
            </div>
            <div className="border-t border-[#1e3352] pt-4 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-[#64748b]">Registry Phone</span>
                <span className="font-mono font-medium text-foreground">{hospital.contact}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#64748b]">GPS Coordinates</span>
                <span className="font-mono font-medium text-foreground">{hospital.latitude.toFixed(4)}, {hospital.longitude.toFixed(4)}</span>
              </div>
            </div>
            <div className="pt-2">
              <a href="/hospital/beds" className="h-9 w-full rounded-lg bg-primary hover:bg-primary/90 text-white font-medium text-xs flex items-center justify-center transition-colors">
                <span>Manage Beds Capacity</span>
              </a>
            </div>
          </div>

          {/* Area map summary */}
          <div className="xl:col-span-2 glass-panel rounded-xl overflow-hidden">
            <div className="relative">
              <LiveMap height="240px" center={[hospital.latitude, hospital.longitude]} zoom={13} />
            </div>
          </div>
        </div>

        {/* Incoming Dispatches List Summary */}
        <div className="glass-panel rounded-xl p-4 lg:p-5">
          <div className="border-b border-[#1e3352] pb-2.5 mb-3.5 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-foreground">Incoming Triage Dispatches</h3>
              <p className="text-[11px] text-[#64748b] mt-0.5">Emergency dispatches currently routed here by AI Orchestrator.</p>
            </div>
            <a href="/hospital/incoming" className="text-xs text-primary font-medium hover:underline">
              <span>Open dispatches deck</span>
            </a>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[300px] overflow-y-auto pr-1">
            {incomingSos.length === 0 ? (
              <p className="col-span-2 text-center text-xs text-[#64748b] py-8">No active incoming triage arrivals routed to this facility.</p>
            ) : (
              incomingSos.map(sos => (
                <div key={sos.id} className="p-3.5 rounded-lg border border-[#1e3352] bg-[#060e1d]/50 space-y-2 text-xs">
                  <p className="text-[#e8edf5] font-medium leading-relaxed">{sos.description}</p>
                  {sos.imageUrl && (
                    <div className="mt-2">
                      <img src={sos.imageUrl} alt="Attached SOS visual" className="max-h-24 max-w-xs object-cover rounded border border-[#1e3352]" />
                    </div>
                  )}
                  {sos.audioUrl && (
                    <div className="mt-2">
                      <audio src={sos.audioUrl} controls className="h-6.5 max-w-[200px] bg-[#060e1d] rounded overflow-hidden" />
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </DashboardLayout>
  );
}
