"use client";

import React from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Badge } from '@/components/ui/badge';
import { Shield } from 'lucide-react';

const VOLUNTEER_TEAMS = [
  { name: 'Hyderabad Rescue Crew', size: 18, status: 'On Call' as const },
  { name: 'Secunderabad Logistics Team', size: 12, status: 'Deployed' as const },
  { name: 'Cyberabad Medical Volunteers', size: 8, status: 'On Call' as const },
];

export default function NgoVolunteersPage() {
  return (
    <DashboardLayout role="ngo" title="Volunteer Roster" subtitle="Staged response personnel logs">
      <div className="max-w-md mx-auto glass-panel rounded-xl p-5 md:p-6 space-y-4">
        <div className="border-b border-[#1e3352] pb-3">
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Shield className="h-4 w-4 text-primary" />
            Volunteer Rapid Roster
          </h3>
          <p className="text-[11px] text-[#64748b] mt-0.5">Deployment teams status.</p>
        </div>
        <div className="space-y-2.5">
          {VOLUNTEER_TEAMS.map((team, idx) => (
            <div key={idx} className="p-3 rounded-lg border border-[#1e3352] bg-[#060e1d]/50 flex items-center justify-between">
              <div className="min-w-0">
                <p className="text-xs font-medium text-foreground truncate">{team.name}</p>
                <p className="text-[10px] text-[#64748b] mt-0.5">{team.size} Personnel</p>
              </div>
              <Badge className={team.status === 'Deployed' ? 'bg-[#f59e0b]/10 text-[#f59e0b] border-[#f59e0b]/20' : 'bg-[#22c55e]/10 text-[#22c55e] border-[#22c55e]/20'}>
                {team.status}
              </Badge>
            </div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
