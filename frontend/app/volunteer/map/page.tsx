"use client";

import React, { useState, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Badge } from '@/components/ui/badge';
import { api } from '@/utils/api';
import { MapPin } from 'lucide-react';

const LiveMap = dynamic(() => import('@/components/shared/LiveMap'), { ssr: false });

interface ResourceDetails {
  id: string; identifier: string; latitude: number; longitude: number; assignedToSosId?: string;
  assignedToSos?: { latitude: number; longitude: number };
}
interface UserInfo { id: string; resourceId?: string }

export default function VolunteerMapPage() {
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

  if (!resource) {
    return (
      <DashboardLayout role="volunteer" title="Mission Map" subtitle="Locking telemetry...">
        <p className="text-xs text-[#64748b] font-mono p-4">Acquiring GPS fix...</p>
      </DashboardLayout>
    );
  }

  const activeTask = resource.assignedToSos;

  return (
    <DashboardLayout role="volunteer" title="Mission Map" subtitle={`Telemetry ID: ${resource.identifier}`}>
      <div className="bg-[#0d1b2e] border border-[#1e3352] rounded-xl overflow-hidden glass-panel">
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#1e3352]">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-foreground">Mission Live Route Map</span>
            <Badge className="bg-primary/10 text-primary border border-primary/20">Telemetry Lock</Badge>
          </div>
          <span className="text-[10px] text-[#64748b] flex items-center gap-1">
            <MapPin className="h-3.5 w-3.5" />
            Hyderabad GPS Grid
          </span>
        </div>
        <div className="relative">
          <LiveMap
            height="500px"
            center={activeTask ? [activeTask.latitude, activeTask.longitude] : [resource.latitude, resource.longitude]}
            zoom={13}
          />
        </div>
      </div>
    </DashboardLayout>
  );
}
