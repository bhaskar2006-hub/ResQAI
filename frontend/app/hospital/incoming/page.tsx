"use client";

import React, { useState, useEffect, useCallback } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Badge } from '@/components/ui/badge';
import { api } from '@/utils/api';
import { getSocket } from '@/utils/socket';
import { AlertTriangle, Clock, CheckCircle2 } from 'lucide-react';

interface SosReport {
  id: string; description: string; status: string; createdAt: string;
  audioUrl?: string; imageUrl?: string;
  aiAnalysis?: {
    severity?: string; category?: string;
    recommendedHospitals?: Array<{ name: string; distance: string; duration: string }>;
  };
}
interface HospitalDetails { id: string; name: string }
interface UserInfo { id: string; hospitalId?: string }

export default function HospitalIncomingPage() {
  const [user, setUser] = useState<UserInfo | null>(null);
  const [hospital, setHospital] = useState<HospitalDetails | null>(null);
  const [incomingSos, setIncomingSos] = useState<SosReport[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem('user');
    if (stored) {
      try { setUser(JSON.parse(stored)); } catch (e) { console.error(e); }
    }
  }, []);

  const loadIncomingData = useCallback(async () => {
    if (!user?.hospitalId) return;
    try {
      const hospRes = await api.get(`/hospitals/${user.hospitalId}`) as { success?: boolean; data?: { hospital?: HospitalDetails } };
      if (hospRes.success && hospRes.data?.hospital) {
        setHospital(hospRes.data.hospital);
        
        const sosRes = await api.get('/sos') as { success?: boolean; data?: { sosReports?: SosReport[] } };
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
    if (user) loadIncomingData();
  }, [user, loadIncomingData]);

  useEffect(() => {
    const socket = getSocket();
    const refresh = () => loadIncomingData();
    socket.on('newSOS', refresh);
    socket.on('sosUpdated', refresh);
    return () => {
      socket.off('newSOS', refresh);
      socket.off('sosUpdated', refresh);
    };
  }, [loadIncomingData]);

  return (
    <DashboardLayout role="hospital" title="Incoming Triage Dispatches" subtitle={hospital?.name || "Operations Center"}>
      <div className="max-w-3xl mx-auto glass-panel rounded-xl p-5 md:p-6 flex flex-col">
        <div className="border-b border-[#1e3352] pb-3 mb-4 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <AlertTriangle className={`h-4 w-4 ${incomingSos.length > 0 ? 'text-[#f59e0b] animate-pulse-severity' : 'text-[#64748b]'}`} />
              Incoming Ambulances & Arrivals
            </h3>
            <p className="text-[11px] text-[#64748b] mt-0.5">Emergency dispatches routed here by AI Orchestrator.</p>
          </div>
          <Badge className="bg-primary/10 text-primary border border-primary/20">{incomingSos.length} Routed</Badge>
        </div>

        <div className="space-y-2.5 max-h-[400px] overflow-y-auto pr-1">
          {incomingSos.length === 0 ? (
            <div className="text-center py-16 space-y-2">
              <CheckCircle2 className="h-8 w-8 text-[#64748b]/40 mx-auto" />
              <p className="text-xs text-[#64748b]">No active triage arrivals routed to this facility.</p>
            </div>
          ) : (
            incomingSos.map((sos) => {
              const severity = sos.aiAnalysis?.severity || 'HIGH';
              const sevColors: Record<string, string> = {
                CRITICAL: 'bg-[#ef4444]/10 text-[#ef4444] border-[#ef4444]/30',
                HIGH: 'bg-[#f97316]/10 text-[#f97316] border-[#f97316]/30',
                MEDIUM: 'bg-[#f59e0b]/10 text-[#f59e0b] border-[#f59e0b]/30',
                LOW: 'bg-[#22c55e]/10 text-[#22c55e] border-[#22c55e]/30',
              };
              return (
                <div key={sos.id} className="p-3.5 rounded-lg border border-[#1e3352] bg-[#060e1d]/50 hover:bg-[#060e1d] transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1.5 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium border ${sevColors[severity] || sevColors.HIGH}`}>
                        {severity}
                      </span>
                      <span className="text-[10px] text-[#64748b] flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" />
                        {new Date(sos.createdAt).toLocaleTimeString()}
                      </span>
                    </div>
                    <p className="text-xs text-[#e8edf5] font-medium leading-relaxed">{sos.description}</p>
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
                  <div className="flex items-center gap-3 shrink-0 self-end md:self-center">
                    <div className="text-right">
                      <p className="text-xs font-semibold text-primary">
                        {sos.aiAnalysis?.recommendedHospitals?.find(h => h.name.toLowerCase() === hospital?.name.toLowerCase())?.duration || '10 mins'}
                      </p>
                      <p className="text-[9px] text-[#64748b]">Arrival ETA</p>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
