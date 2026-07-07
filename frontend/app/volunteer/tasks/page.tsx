"use client";

import React, { useState, useEffect, useCallback } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Badge } from '@/components/ui/badge';
import { api } from '@/utils/api';
import { getSocket } from '@/utils/socket';
import { MapPin, Navigation, CheckCircle, Star } from 'lucide-react';

interface ResourceDetails {
  id: string; type: string; status: string; identifier: string; latitude: number; longitude: number; assignedToSosId?: string;
  assignedToSos?: { id: string; description: string; latitude: number; longitude: number; status: string; audioUrl?: string; imageUrl?: string };
}
interface UserInfo { id: string; resourceId?: string }

export default function VolunteerTasksPage() {
  const [user, setUser] = useState<UserInfo | null>(null);
  const [resource, setResource] = useState<ResourceDetails | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [actionSuccess, setActionSuccess] = useState(false);

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

  const updateStatus = async (newStatus: 'AVAILABLE' | 'MAINTENANCE' | 'ASSIGNED') => {
    if (!resource) return;
    setIsUpdating(true);
    setActionSuccess(false);
    try {
      const res = await api.patch(`/resources/${resource.id}`, {
        status: newStatus,
        assignedToSosId: newStatus === 'AVAILABLE' ? null : resource.assignedToSosId,
      }) as { success?: boolean; data?: { resource?: ResourceDetails } };
      if (res.success && res.data?.resource) {
        setResource(res.data.resource);
        setActionSuccess(true);
        setTimeout(() => setActionSuccess(false), 3000);
      }
    } catch (err) { console.error(err); } finally { setIsUpdating(false); }
  };

  const handleCompleteTask = async () => {
    if (!resource?.assignedToSos?.id) return;
    setIsUpdating(true);
    try {
      const sosRes = await api.patch(`/sos/${resource.assignedToSos.id}`, { status: 'RESOLVED' }) as { success?: boolean };
      if (sosRes.success) {
        await api.patch(`/resources/${resource.id}`, { status: 'AVAILABLE', assignedToSosId: null });
        loadVolunteerData();
      }
    } catch (err) { console.error(err); } finally { setIsUpdating(false); }
  };

  if (!resource) {
    return (
      <DashboardLayout role="volunteer" title="Active Task Mission" subtitle="Standby...">
        <p className="text-xs text-[#64748b] font-mono p-4">Syncing telemetry data...</p>
      </DashboardLayout>
    );
  }

  const activeTask = resource.assignedToSos;

  return (
    <DashboardLayout role="volunteer" title="Active Task Mission" subtitle={`Assigned to unit: ${resource.identifier}`}>
      <div className="max-w-md mx-auto glass-panel rounded-xl p-5 md:p-6 space-y-5">
        <div>
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Navigation className="h-4 w-4 text-primary" />
            Task Information
          </h3>
          <p className="text-[11px] text-[#64748b] mt-0.5">Instructions from ResQ AI Command deck.</p>
        </div>

        {actionSuccess && (
          <div className="p-3 rounded-lg text-xs" style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.2)', color: '#22c55e' }}>
            Status successfully updated in grid matrix.
          </div>
        )}

        {!activeTask ? (
          <div className="text-center py-12 space-y-3">
            <CheckCircle className="h-10 w-10 text-[#22c55e] mx-auto opacity-80" />
            <h4 className="font-semibold text-xs text-foreground">No Active Task Assignments</h4>
            <p className="text-[11px] text-[#64748b] leading-relaxed">You are currently on standby mode. The AI Orchestrator will alert you immediately if emergency telemetry requires response in your sector.</p>
          </div>
        ) : (
          <div className="space-y-5">
            <div className="p-3.5 rounded-lg border border-[#ef4444]/20 bg-[#ef4444]/5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[9px] font-mono font-semibold uppercase tracking-wider text-[#ef4444]">Distress Description</span>
                <Badge variant="destructive" className="bg-[#ef4444]/25 text-[#ef4444] border border-[#ef4444]/40 text-[9px] px-1.5 py-0">Critical</Badge>
              </div>
              <p className="text-xs text-[#e8edf5] leading-relaxed">
                {activeTask.description}
              </p>
              {activeTask.imageUrl && (
                <div className="mt-2.5">
                  <img src={activeTask.imageUrl} alt="Attached distress visual" className="max-h-24 max-w-xs object-cover rounded border border-[#1e3352]" />
                </div>
              )}
              {activeTask.audioUrl && (
                <div className="mt-2.5">
                  <audio src={activeTask.audioUrl} controls className="h-6.5 max-w-[200px] bg-[#060e1d] rounded overflow-hidden" />
                </div>
              )}
            </div>

            <div className="space-y-1.5">
              <p className="text-[10px] font-medium text-[#64748b] uppercase tracking-wider">Mission Target Location</p>
              <div className="flex items-center gap-2 text-xs">
                <MapPin className="h-4 w-4 text-primary shrink-0" />
                <span className="font-mono text-foreground">{activeTask.latitude.toFixed(4)}N, {activeTask.longitude.toFixed(4)}W</span>
              </div>
            </div>

            <div className="flex flex-col gap-2 pt-2 border-t border-[#1e3352]">
              <button
                type="button"
                onClick={handleCompleteTask}
                disabled={isUpdating}
                className="h-10 w-full rounded-lg bg-[#22c55e] hover:bg-[#22c55e]/90 text-white font-medium text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
              >
                <Star className="h-4 w-4" />
                Complete Rescue Mission
              </button>
              <button
                type="button"
                onClick={() => updateStatus('AVAILABLE')}
                disabled={isUpdating}
                className="h-10 w-full rounded-lg border border-[#1e3352] hover:bg-[#060e1d] text-[#64748b] hover:text-foreground font-medium text-xs transition-colors cursor-pointer disabled:opacity-50"
              >
                Release & Return to Standby
              </button>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
