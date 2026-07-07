"use client";

import React, { useState, useEffect, useCallback } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Badge } from '@/components/ui/badge';
import { api } from '@/utils/api';
import { getSocket } from '@/utils/socket';
import { Shield } from 'lucide-react';

interface SosReport {
  id: string;
  description: string;
  latitude: number;
  longitude: number;
  status: string;
  createdAt: string;
  audioUrl?: string;
  imageUrl?: string;
  aiAnalysis?: { severity?: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'; category?: string };
}
interface ApiResponse<T> { success?: boolean; data?: T }

function SevBadge({ sev }: { sev: string }) {
  const cls: Record<string, string> = {
    CRITICAL: 'sev-critical',
    HIGH:     'sev-high',
    MEDIUM:   'sev-medium',
    LOW:      'sev-low',
  };
  return (
    <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium ${cls[sev] || 'sev-high'}`}>
      {sev}
    </span>
  );
}

export default function SosIncidentsPage() {
  const [sosList, setSosList] = useState<SosReport[]>([]);
  const [liveFeed, setLiveFeed] = useState([
    { id: '1', text: 'AI detected high-risk wildfire expansion — Sierra Nevada perimeter +2.3km', type: 'critical' as const, time: 'just now' },
    { id: '2', text: 'Resource allocation updated: 14 additional medical units dispatched', type: 'high' as const, time: '1m ago' },
    { id: '3', text: 'Evacuation route BRAVO-7 cleared — 3,200 civilians routed', type: 'low' as const, time: '3m ago' },
    { id: '4', text: 'Structural failure at 29.8N 95.3W — rescue priority ALPHA', type: 'critical' as const, time: '5m ago' },
    { id: '5', text: 'Satellite imagery updated — 847 km² analyzed', type: 'info' as const, time: '8m ago' },
  ]);

  const loadData = useCallback(async () => {
    try {
      const sosRes = await api.get('/sos').catch(() => null) as ApiResponse<{ sosReports?: SosReport[] }> | null;
      if (sosRes?.success && sosRes.data?.sosReports) setSosList(sosRes.data.sosReports);
    } catch (err) { console.error('loadData:', err); }
  }, []);

  useEffect(() => {
    loadData();
    const socket = getSocket();
    socket.on('newSOS', () => {
      loadData();
      setLiveFeed(prev => [{ id: String(Date.now()), text: 'New emergency raised — AI Orchestrator triaging.', type: 'critical' as const, time: 'just now' }, ...prev.slice(0, 5)]);
    });
    socket.on('sosUpdated', loadData);
    return () => { socket.off('newSOS'); socket.off('sosUpdated'); };
  }, [loadData]);

  const activeCount = sosList.filter(s => s.status !== 'RESOLVED').length;

  return (
    <DashboardLayout role="government" title="Active SOS Reports" subtitle="Distress dispatch telemetry logs">
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        {/* Active Incidents table */}
        <div className="xl:col-span-2 bg-[#0d1b2e] border border-[#1e3352] rounded-xl overflow-hidden glass-panel">
          <div className="flex items-center justify-between px-4 py-3 border-b border-[#1e3352]">
            <div>
              <p className="text-sm font-semibold text-foreground">Active Incidents Registry</p>
              <p className="text-[11px] text-[#64748b] mt-0.5">{activeCount || 0} active emergency dispatches</p>
            </div>
            <Badge variant="destructive" className="bg-[#ef4444]/15 text-[#ef4444] border border-[#ef4444]/30 animate-pulse font-mono text-[10px]">
              LIVE SOS FEED
            </Badge>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-[#1e3352]">
              <thead>
                <tr className="bg-[#060e1d]">
                  {['Incident ID', 'Type', 'Description', 'Severity', 'Status'].map(h => (
                    <th key={h} className="px-4 py-2.5 text-left text-[10px] font-medium text-[#64748b] uppercase tracking-wider whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1e3352]">
                {sosList.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-10 text-center text-[#64748b] text-sm">
                      No active emergencies in registry.
                    </td>
                  </tr>
                ) : sosList.map((sos, idx) => (
                  <tr key={sos.id} className="hover:bg-[#0d2040] transition-colors">
                    <td className="px-4 py-3 font-mono text-xs font-medium text-primary whitespace-nowrap">INC-{2840 + idx}</td>
                    <td className="px-4 py-3 text-[10px] font-medium text-foreground uppercase tracking-wide whitespace-nowrap">{sos.aiAnalysis?.category || 'Wildfire'}</td>
                    <td className="px-4 py-3 text-xs text-[#64748b] max-w-[250px]">
                      <p className="leading-relaxed whitespace-pre-wrap">{sos.description}</p>
                      {sos.imageUrl && (
                        <div className="mt-2.5">
                          <img src={sos.imageUrl} alt="Attached SOS visual" className="max-h-24 max-w-xs object-cover rounded border border-[#1e3352]" />
                        </div>
                      )}
                      {sos.audioUrl && (
                        <div className="mt-2.5">
                          <audio src={sos.audioUrl} controls className="h-6.5 max-w-[200px] bg-[#060e1d] rounded overflow-hidden" />
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap"><SevBadge sev={sos.aiAnalysis?.severity || 'HIGH'} /></td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <select
                          value={sos.status}
                          onChange={async (e) => {
                            const newStatus = e.target.value;
                            try {
                              const res = await api.patch(`/sos/${sos.id}`, { status: newStatus }) as { success?: boolean };
                              if (res.success) {
                                loadData();
                              }
                            } catch (err) {
                              alert('Failed to update status: ' + (err instanceof Error ? err.message : 'Unknown error'));
                            }
                          }}
                          className="h-7 text-[11px] bg-[#060e1d] border border-[#1e3352] text-foreground rounded-lg px-2 focus:outline-none focus:border-primary cursor-pointer"
                        >
                          <option value="PENDING">Pending</option>
                          <option value="INVESTIGATING">Investigating</option>
                          <option value="RESOLVED">Resolved</option>
                        </select>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Live Feed */}
        <div className="bg-[#0d1b2e] border border-[#1e3352] rounded-xl overflow-hidden glass-panel h-fit">
          <div className="flex items-center justify-between px-4 py-3 border-b border-[#1e3352]">
            <p className="text-sm font-semibold text-foreground">Live Telemetry Feed</p>
            <span className="h-2 w-2 rounded-full bg-[#f97316] animate-pulse-severity" />
          </div>
          <div className="p-3 space-y-3 max-h-[400px] overflow-y-auto">
            {liveFeed.map(feed => (
              <div key={feed.id} className="flex gap-2.5 text-xs items-start">
                <span className={`h-1.5 w-1.5 rounded-full mt-1 shrink-0 ${
                  feed.type === 'critical' ? 'bg-[#ef4444]' :
                  feed.type === 'high'     ? 'bg-[#f97316]' :
                  feed.type === 'low'      ? 'bg-[#22c55e]' :
                  'bg-primary'
                }`} />
                <div className="space-y-0.5 min-w-0">
                  <p className="text-foreground leading-snug">{feed.text}</p>
                  <p className="text-[9px] text-[#64748b]">{feed.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
