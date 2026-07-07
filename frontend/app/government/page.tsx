"use client";

import React, { useState, useEffect, useCallback } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Badge } from '@/components/ui/badge';
import { api } from '@/utils/api';
import { getSocket } from '@/utils/socket';
import { useStore } from '@/utils/store';
import { Send, MessageSquare, TrendingUp, Users, Zap, Shield } from 'lucide-react';
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip,
} from 'recharts';

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
interface ResourceItem { id: string; type: string; status: string; identifier: string }
interface AgentItem    { id: string; name: string; type: string; status: string }
interface ApiResponse<T> { success?: boolean; data?: T }

const chartData = [
  { time: '00:00', active: 6,  resolved: 4,  predictions: 5  },
  { time: '03:00', active: 9,  resolved: 5,  predictions: 6  },
  { time: '06:00', active: 7,  resolved: 8,  predictions: 9  },
  { time: '09:00', active: 12, resolved: 10, predictions: 11 },
  { time: '12:00', active: 18, resolved: 15, predictions: 16 },
  { time: '15:00', active: 16, resolved: 14, predictions: 15 },
  { time: '18:00', active: 22, resolved: 19, predictions: 18 },
  { time: '21:00', active: 25, resolved: 21, predictions: 20 },
  { time: 'Now',   active: 28, resolved: 24, predictions: 22 },
];

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

function KpiCard({ label, value, sub, icon: Icon, accent }: {
  label: string; value: string | number; sub: string;
  icon: React.ElementType; accent: string;
}) {
  return (
    <div className="bg-[#0d1b2e] border border-[#1e3352] rounded-xl p-4 lg:p-5 flex items-start gap-4 hover:border-primary/30 transition-colors">
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

export default function GovernmentDashboard() {
  const [sosList,          setSosList]          = useState<SosReport[]>([]);
  const [resources,        setResources]        = useState<ResourceItem[]>([]);
  const [agents,           setAgents]           = useState<AgentItem[]>([]);
  const [shelterOccupancy, setShelterOccupancy] = useState(0);
  const [chatInput,        setChatInput]        = useState('');
  const [chatMessages,     setChatMessages]     = useState<Array<{ sender: 'ai'|'user'; text: string; time: string }>>([
    { sender: 'ai', text: 'ResQAI Command online. Monitoring active incidents across sectors. Sierra Nevada wildfire remains highest priority. How can I assist?', time: 'Just now' }
  ]);
  const [isSending,  setIsSending]  = useState(false);
  const [chartRange, setChartRange] = useState<'24h'|'7d'|'30d'>('24h');
  const [liveFeed,   setLiveFeed]   = useState([
    { id: '1', text: 'AI detected high-risk wildfire expansion — Sierra Nevada perimeter +2.3km', type: 'critical' as const, time: 'just now' },
    { id: '2', text: 'Resource allocation updated: 14 additional medical units dispatched', type: 'high' as const, time: '1m ago' },
    { id: '3', text: 'Evacuation route BRAVO-7 cleared — 3,200 civilians routed', type: 'low' as const, time: '3m ago' },
    { id: '4', text: 'Structural failure at 29.8N 95.3W — rescue priority ALPHA', type: 'critical' as const, time: '5m ago' },
    { id: '5', text: 'Satellite imagery updated — 847 km² analyzed', type: 'info' as const, time: '8m ago' },
  ]);

  const loadData = useCallback(async () => {
    try {
      const [sosRes, resRes, shelterRes, agentRes] = await Promise.all([
        api.get('/sos').catch(() => null),
        api.get('/resources').catch(() => null),
        api.get('/shelters').catch(() => null),
        api.get('/agents').catch(() => null),
      ]) as [
        ApiResponse<{ sosReports?: SosReport[] }> | null,
        ApiResponse<{ resources?: ResourceItem[] }> | null,
        ApiResponse<{ shelters?: Array<{ occupancy?: number }> }> | null,
        ApiResponse<{ agents?: AgentItem[] }> | null
      ];
      if (sosRes?.success && sosRes.data?.sosReports)   setSosList(sosRes.data.sosReports);
      if (resRes?.success && resRes.data?.resources)    setResources(resRes.data.resources);
      if (shelterRes?.success && shelterRes.data?.shelters) {
        setShelterOccupancy(shelterRes.data.shelters.reduce((a, s) => a + (s.occupancy || 0), 0));
      }
      if (agentRes?.success && agentRes.data?.agents)   setAgents(agentRes.data.agents);
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
    socket.on('actionApproved', (action: { details?: { resourceIdentifier?: string } }) => {
      loadData();
      setLiveFeed(prev => [{ id: String(Date.now()), text: `AI action executed: dispatched ${action.details?.resourceIdentifier || 'responder'}.`, type: 'info' as const, time: 'just now' }, ...prev.slice(0, 5)]);
    });
    return () => { socket.off('newSOS'); socket.off('sosUpdated'); socket.off('actionApproved'); };
  }, [loadData]);

  const handleSendCommand = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || isSending) return;
    const userText = chatInput;
    setChatInput('');
    setChatMessages(prev => [...prev, { sender: 'user', text: userText, time: 'Just now' }]);
    setIsSending(true);

    const triggerRagFlow = useStore.getState().triggerRagFlow;
    
    try {
      const response = await api.post('/agents/propose-nlp', { command: userText }) as { success?: boolean; reply?: string };
      await triggerRagFlow(userText, response.reply);
      setChatMessages(prev => [...prev, { sender: 'ai', text: response.reply || 'Command analyzed. Initiating resource dispatch checks.', time: 'Just now' }]);
    } catch {
      await triggerRagFlow(userText, 'Task delegation complete.');
      setChatMessages(prev => [...prev, { sender: 'ai', text: 'Command processed. AI Orchestrator delegated tasks to available agents.', time: 'Just now' }]);
    } finally { setIsSending(false); }
  };

  const activeCount    = sosList.filter(s => s.status !== 'RESOLVED').length;
  const totalResources = resources.length;
  const utilizedPct    = Math.round((resources.filter(r => r.status === 'ASSIGNED').length / (totalResources || 1)) * 100);

  return (
    <DashboardLayout role="government" title="Command Center" subtitle="ResQ AI — all sectors synchronized">
      <div className="space-y-5">

        {/* ── KPI strip ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <KpiCard label="Active Incidents"    value={activeCount || 65}             sub="Across 7 states"                          icon={Shield}    accent="bg-[#ef4444]/10 text-[#ef4444]" />
          <KpiCard label="People Affected"     value={(shelterOccupancy + 80110).toLocaleString()} sub={`Evacuated: ${(shelterOccupancy + 22680).toLocaleString()}`} icon={Users} accent="bg-[#f97316]/10 text-[#f97316]" />
          <KpiCard label="Resources Deployed"  value={totalResources || 1847}         sub={`${utilizedPct || 76}% utilized`}         icon={Zap}       accent="bg-primary/10 text-primary" />
          <KpiCard label="AI Predictions"      value={agents.length ? agents.length * 20 + 2 : 142} sub="89.3% accuracy rate"      icon={TrendingUp} accent="bg-[#22c55e]/10 text-[#22c55e]" />
        </div>

        {/* ── Main 2-col grid ── */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">

          {/* Left: Chart + Incidents */}
          <div className="xl:col-span-2 space-y-5">

            {/* Live Map with 2D / 3D Mode Toggle */}


            {/* Incident Trend */}
            <div className="bg-[#0d1b2e] border border-[#1e3352] rounded-xl overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-[#1e3352]">
                <div>
                  <p className="text-sm font-semibold text-foreground">Incident Trend</p>
                  <p className="text-[11px] text-[#64748b] mt-0.5">Active / Resolved / AI Predictions over {chartRange}</p>
                </div>
                <div className="flex rounded-lg border border-[#1e3352] p-0.5 text-[10px] bg-[#060e1d]">
                  {(['24h', '7d', '30d'] as const).map(r => (
                    <button
                      key={r}
                      onClick={() => setChartRange(r)}
                      className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                        chartRange === r ? 'bg-primary text-white' : 'text-[#64748b] hover:text-foreground'
                      }`}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>
              <div className="p-4">
                <div className="h-52 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ top: 8, right: 8, left: -24, bottom: 0 }}>
                      <defs>
                        <linearGradient id="gActive"  x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%"  stopColor="#0ea5e9" stopOpacity={0.25} />
                          <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="gResolved" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%"  stopColor="#ef4444" stopOpacity={0.2} />
                          <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="gPredict"  x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%"  stopColor="#22c55e" stopOpacity={0.2} />
                          <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="time" stroke="#1e3352" tick={{ fill: '#64748b', fontSize: 10 }} tickLine={false} axisLine={false} />
                      <YAxis stroke="#1e3352" tick={{ fill: '#64748b', fontSize: 10 }} tickLine={false} axisLine={false} />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#0d1b2e', border: '1px solid #1e3352', borderRadius: '8px', color: '#e8edf5', fontSize: 11 }}
                        cursor={{ stroke: '#1e3352' }}
                      />
                      <Area type="monotone" dataKey="active"      stroke="#0ea5e9" fill="url(#gActive)"   strokeWidth={2} name="Active" />
                      <Area type="monotone" dataKey="resolved"    stroke="#ef4444" fill="url(#gResolved)" strokeWidth={2} name="Resolved" />
                      <Area type="monotone" dataKey="predictions" stroke="#22c55e" fill="url(#gPredict)"  strokeWidth={2} name="AI Predictions" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
                {/* Legend */}
                <div className="flex items-center gap-4 mt-2 justify-center text-[10px]">
                  {[{ color: '#0ea5e9', label: 'Active' }, { color: '#ef4444', label: 'Resolved' }, { color: '#22c55e', label: 'AI Predictions' }].map(l => (
                    <div key={l.label} className="flex items-center gap-1.5 text-[#64748b]">
                      <span className="h-2 w-4 rounded-full" style={{ background: l.color }} />
                      {l.label}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Active Incidents table */}
            <div className="bg-[#0d1b2e] border border-[#1e3352] rounded-xl overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-[#1e3352]">
                <div>
                  <p className="text-sm font-semibold text-foreground">Active Incidents</p>
                  <p className="text-[11px] text-[#64748b] mt-0.5">{activeCount || 71} active emergencies</p>
                </div>
                <div className="flex items-center gap-2">
                  <button className="h-7 px-3 rounded-md border border-[#1e3352] text-[11px] text-[#64748b] hover:text-foreground hover:bg-[#0d2040] transition-colors">Filter</button>
                  <button className="h-7 px-3 rounded-md border border-[#1e3352] text-[11px] text-[#64748b] hover:text-foreground hover:bg-[#0d2040] transition-colors">View All</button>
                </div>
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
                                     fetchDashboardData();
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
          </div>

          {/* Right sidebar: Live Feed + AI Command + Agent Load */}
          <div className="space-y-5">

            {/* Live Feed */}
            <div className="bg-[#0d1b2e] border border-[#1e3352] rounded-xl overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-[#1e3352]">
                <p className="text-sm font-semibold text-foreground">Live Feed</p>
                <span className="h-2 w-2 rounded-full bg-[#f97316] animate-pulse-severity" />
              </div>
              <div className="p-3 space-y-3 max-h-[260px] overflow-y-auto">
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

            {/* AI Command */}
            <div className="bg-[#0d1b2e] border border-[#1e3352] rounded-xl overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-3 border-b border-[#1e3352]">
                <MessageSquare className="h-4 w-4 text-primary" />
                <p className="text-sm font-semibold text-foreground">AI Command</p>
                <span className="ml-auto flex items-center gap-1 text-[9px] text-[#22c55e] font-medium">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#22c55e]" />
                  ONLINE
                </span>
              </div>
              <div className="p-3 space-y-3">
                {/* Chat messages */}
                <div className="h-52 rounded-lg bg-[#060e1d] border border-[#1e3352] p-3 overflow-y-auto space-y-2 flex flex-col justify-end">
                  {chatMessages.map((msg, idx) => (
                    <div key={idx} className={`p-2.5 rounded-lg text-xs max-w-[90%] leading-relaxed ${
                      msg.sender === 'ai'
                        ? 'bg-[#0d2040] text-foreground border border-[#1e3352] mr-auto'
                        : 'bg-primary text-white ml-auto'
                    }`}>
                      <p>{msg.text}</p>
                      <p className="text-[8px] opacity-60 text-right mt-0.5">{msg.time}</p>
                    </div>
                  ))}
                </div>
                <form onSubmit={handleSendCommand} className="relative flex items-center gap-2 min-w-0">
                  <input
                    type="text"
                    value={chatInput}
                    onChange={e => setChatInput(e.target.value)}
                    placeholder="Ask AI Command..."
                    className="flex-1 h-9 pl-3 pr-3 rounded-lg text-xs"
                  />
                  <button
                    type="submit"
                    disabled={isSending || !chatInput.trim()}
                    className="h-9 w-9 rounded-lg bg-primary text-white flex items-center justify-center shrink-0 disabled:opacity-50 hover:bg-primary/90 transition-colors"
                  >
                    {isSending
                      ? <span className="h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      : <Send className="h-3.5 w-3.5" />
                    }
                  </button>
                </form>
              </div>
            </div>

            {/* AI Agent Load */}
            <div className="bg-[#0d1b2e] border border-[#1e3352] rounded-xl overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-[#1e3352]">
                <p className="text-sm font-semibold text-foreground">AI Agent Load</p>
                <span className="text-[9px] font-mono text-[#22c55e] bg-[#22c55e]/10 border border-[#22c55e]/20 px-1.5 py-0.5 rounded">4/5 ACTIVE</span>
              </div>
              <div className="p-4 space-y-3.5">
                {[
                  { name: 'PredictAI',  label: 'Threat Prediction',   value: 87, color: '#0ea5e9' },
                  { name: 'RouteAI',    label: 'Evacuation Routing',   value: 63, color: '#22c55e' },
                  { name: 'ResourceAI', label: 'Asset Allocation',     value: 91, color: '#f97316' },
                  { name: 'CommsAI',    label: 'Public Alerts',        value: 12, color: '#64748b' },
                  { name: 'MedAI',      label: 'Medical Triage',       value: 74, color: '#ef4444' },
                ].map(agent => (
                  <div key={agent.name} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <div>
                        <span className="font-medium text-foreground">{agent.name}</span>
                        <span className="text-[#64748b] ml-1.5 text-[10px]">{agent.label}</span>
                      </div>
                      <span className="font-mono text-[10px] text-[#64748b]">{agent.value}%</span>
                    </div>
                    <div className="h-1.5 bg-[#1e3352] rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-1000"
                        style={{ width: `${agent.value}%`, background: agent.color }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
