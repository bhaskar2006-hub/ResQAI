"use client";

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Badge } from '@/components/ui/badge';
import { Users, Terminal, Shield, Cpu, HardDrive } from 'lucide-react';

interface AuditLog {
  timestamp: string; user: string; action: string; category: 'auth' | 'config' | 'alert' | 'system'; ip: string;
}

function AdminKpiCard({ title, value, desc, icon: Icon }: {
  title: string; value: string | number; desc: string; icon: React.ElementType;
}) {
  return (
    <div className="glass-panel rounded-xl p-4 lg:p-5 flex items-start gap-4 hover:border-primary/30 transition-colors">
      <div className="h-10 w-10 rounded-lg flex items-center justify-center shrink-0 bg-primary/10 text-primary">
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0">
        <p className="text-[10px] text-[#64748b] uppercase tracking-wider font-medium">{title}</p>
        <p className="text-xl lg:text-2xl font-bold tracking-tight text-foreground mt-0.5">{value}</p>
        <p className="text-[11px] text-[#64748b] mt-0.5">{desc}</p>
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([
    { timestamp: '12:05:42', user: 'ADMIN_01', action: 'Modified routing weight for AMB-01', category: 'config', ip: '10.0.4.12' },
    { timestamp: '12:04:12', user: 'SYS_DAEMON', action: 'Synchronized database replica node Hyderabad-Core', category: 'system', ip: '10.0.12.8' },
    { timestamp: '12:00:15', user: 'GOV_OPERATOR_03', action: 'Operator authenticated successfully', category: 'auth', ip: '192.168.2.140' },
    { timestamp: '11:58:30', user: 'ADMIN_01', action: 'Emergency SOS Broadcast triggers updated', category: 'alert', ip: '10.0.4.12' },
    { timestamp: '11:42:05', user: 'SYS_DAEMON', action: 'LLM Token routing limits increased to 500k/m', category: 'system', ip: '10.0.12.8' }
  ]);

  useEffect(() => {
    const actions = [
      { user: 'SYS_DAEMON', action: 'API Router refreshed PostgreSQL pool.', category: 'system' as const },
      { user: 'ADMIN_01', action: 'Updated security access keys for NGO sub-tokens.', category: 'auth' as const },
      { user: 'GOV_OPERATOR_03', action: 'Geofencing triggers scanning parameters modified.', category: 'config' as const },
      { user: 'SYS_DAEMON', action: 'Cleared audit logs cache older than 48h.', category: 'system' as const }
    ];
    const interval = setInterval(() => {
      const randomAction = actions[Math.floor(Math.random() * actions.length)];
      const timestamp = new Date().toLocaleTimeString('en-US', { hour12: false });
      const newLog: AuditLog = {
        timestamp,
        user: randomAction.user,
        action: randomAction.action,
        category: randomAction.category,
        ip: `10.0.${Math.floor(Math.random() * 8) + 1}.${Math.floor(Math.random() * 254) + 1}`
      };
      setAuditLogs(prev => [newLog, ...prev.slice(0, 5)]);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <DashboardLayout role="admin" title="System Control Center" subtitle="Clearance Level 5 • Node replica synced">
      <div className="space-y-5">

        {/* KPI Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <AdminKpiCard title="System Load" value="1.24%" desc="Nominal load factor" icon={Cpu} />
          <AdminKpiCard title="Database Health" value="100%" desc="Replica node synced" icon={HardDrive} />
          <AdminKpiCard title="Active Sessions" value="5 Online" desc="Operators connected" icon={Users} />
          <AdminKpiCard title="Security WAF" value="SECURE" desc="Firewall shields active" icon={Shield} />
        </div>

        {/* Row Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
          {/* Quick Actions Card */}
          <div className="glass-panel rounded-xl p-4 lg:p-5 space-y-4 h-fit">
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Shield className="h-4 w-4 text-primary" />
              Admin Actions
            </h3>
            <p className="text-xs text-[#64748b] leading-relaxed">
              Oversee local database structures, configure LLM endpoints, or manage authenticated staff credentials.
            </p>
            <div className="space-y-2 pt-2">
              <a href="/admin/users" className="h-9 w-full rounded-lg bg-primary hover:bg-primary/90 text-white font-medium text-xs flex items-center justify-center transition-colors">
                <span>View Operators Directory</span>
              </a>
              <a href="/admin/models" className="h-9 w-full rounded-lg border border-[#1e3352] hover:bg-[#060e1d] text-[#64748b] hover:text-foreground font-medium text-xs flex items-center justify-center transition-colors">
                <span>Configure AI Model Routers</span>
              </a>
            </div>
          </div>

          {/* Security Audit log */}
          <div className="xl:col-span-2 glass-panel rounded-xl p-4 lg:p-5 flex flex-col">
            <div className="border-b border-[#1e3352] pb-3 mb-3 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <Terminal className="h-4 w-4 text-primary" />
                  Real-time Security Audit Log
                </h3>
                <p className="text-[11px] text-[#64748b] mt-0.5">Live dispatch activities across API registry.</p>
              </div>
              <Badge className="bg-[#22c55e]/10 text-[#22c55e] border border-[#22c55e]/20 font-mono text-[9px] animate-pulse">LIVE STREAM</Badge>
            </div>

            <div className="flex-1 rounded-lg border border-[#1e3352] bg-[#050a12] p-4 h-60 overflow-y-auto font-mono text-[10px] space-y-2.5">
              {auditLogs.map((log, idx) => (
                <div key={idx} className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[#1e3352]/40 pb-2 gap-1 last:border-0 last:pb-0">
                  <div className="flex items-start gap-2.5 min-w-0">
                    <span className="text-[#64748b]">[{log.timestamp}]</span>
                    <span className="font-semibold text-primary">({log.user})</span>
                    <span className="text-[#e8edf5] truncate">{log.action}</span>
                  </div>
                  <span className="text-[#64748b] shrink-0 font-medium text-[9px] sm:self-start">IP: {log.ip}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </DashboardLayout>
  );
}
