"use client";

import React, { useState, useEffect, useCallback } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { api } from '@/utils/api';
import { Bed, Minus, Plus } from 'lucide-react';

interface HospitalDetails {
  id: string; name: string; capacity: number; availableBeds: number; contact: string; latitude: number; longitude: number;
}
interface UserInfo { id: string; hospitalId?: string }

export default function HospitalBedsPage() {
  const [user, setUser] = useState<UserInfo | null>(null);
  const [hospital, setHospital] = useState<HospitalDetails | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [bedChangeSuccess, setBedChangeSuccess] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem('user');
    if (stored) {
      try { setUser(JSON.parse(stored)); } catch (e) { console.error(e); }
    }
  }, []);

  const loadHospitalData = useCallback(async () => {
    if (!user?.hospitalId) return;
    try {
      const hospRes = await api.get(`/hospitals/${user.hospitalId}`) as { success?: boolean; data?: { hospital?: HospitalDetails } };
      if (hospRes.success && hospRes.data?.hospital) {
        setHospital(hospRes.data.hospital);
      }
    } catch (err) { console.error(err); }
  }, [user]);

  useEffect(() => {
    if (user) loadHospitalData();
  }, [user, loadHospitalData]);

  const updateBeds = async (newCount: number) => {
    if (!hospital || newCount < 0 || newCount > hospital.capacity) return;
    setIsUpdating(true);
    setBedChangeSuccess(false);
    try {
      const res = await api.patch(`/hospitals/${hospital.id}`, { availableBeds: newCount }) as { success?: boolean; data?: { hospital?: HospitalDetails } };
      if (res.success && res.data?.hospital) {
        setHospital(res.data.hospital);
        setBedChangeSuccess(true);
        setTimeout(() => setBedChangeSuccess(false), 3000);
      }
    } catch (err) { console.error(err); } finally { setIsUpdating(false); }
  };

  if (!hospital) {
    return (
      <DashboardLayout role="hospital" title="Bed Management" subtitle="Loading bed telemetry...">
        <p className="text-xs text-[#64748b] font-mono p-4">Syncing database node...</p>
      </DashboardLayout>
    );
  }

  const occupancyPct = Math.round(((hospital.capacity - hospital.availableBeds) / hospital.capacity) * 100);

  return (
    <DashboardLayout role="hospital" title="Bed Management" subtitle={hospital.name}>
      <div className="max-w-md mx-auto glass-panel rounded-xl p-5 md:p-6 space-y-5">
        <div>
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Bed className="h-4 w-4 text-primary" />
            Bed Capacity Controls
          </h3>
          <p className="text-[11px] text-[#64748b] mt-0.5">Adjust available triage beds in real-time.</p>
        </div>

        {bedChangeSuccess && (
          <div className="p-3 rounded-lg text-xs" style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.2)', color: '#22c55e' }}>
            Available bed count updated successfully.
          </div>
        )}

        <div className="flex items-center justify-center gap-6 py-4">
          <button
            type="button"
            onClick={() => updateBeds(hospital.availableBeds - 1)}
            disabled={isUpdating || hospital.availableBeds <= 0}
            className="h-12 w-12 rounded-lg border border-[#1e3352] bg-[#060e1d] hover:bg-[#0d2040] transition-colors flex items-center justify-center text-foreground disabled:opacity-50"
          >
            <Minus className="h-5 w-5" />
          </button>
          <div className="text-center min-w-[80px]">
            <p className="text-4xl font-bold tracking-tight text-foreground">{hospital.availableBeds}</p>
            <p className="text-[9px] text-[#64748b] uppercase tracking-wider font-semibold mt-1">Available</p>
          </div>
          <button
            type="button"
            onClick={() => updateBeds(hospital.availableBeds + 1)}
            disabled={isUpdating || hospital.availableBeds >= hospital.capacity}
            className="h-12 w-12 rounded-lg border border-[#1e3352] bg-[#060e1d] hover:bg-[#0d2040] transition-colors flex items-center justify-center text-foreground disabled:opacity-50"
          >
            <Plus className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-1">
          <div className="flex justify-between text-xs text-[#64748b]">
            <span>Operational Capacity</span>
            <span className="font-mono text-foreground font-medium">{hospital.capacity} Beds</span>
          </div>
          <div className="h-1.5 bg-[#1e3352] rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${occupancyPct > 80 ? 'bg-[#ef4444]' : 'bg-primary'}`}
              style={{ width: `${occupancyPct}%` }}
            />
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
