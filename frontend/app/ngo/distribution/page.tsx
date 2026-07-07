"use client";

import React from 'react';
import dynamic from 'next/dynamic';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Package } from 'lucide-react';

const LiveMap = dynamic(() => import('@/components/shared/LiveMap'), { ssr: false });

const SUPPLY_DATA = [
  { name: 'Dry Ration Food Packs', allocated: 450, total: 1000, color: '#22c55e' },
  { name: 'Clean Drinking Water (Litres)', allocated: 1200, total: 3000, color: '#0ea5e9' },
  { name: 'First Aid & Medical Kits', allocated: 180, total: 200, color: '#ef4444' },
  { name: 'Emergency Blankets', allocated: 380, total: 500, color: '#f59e0b' },
];

export default function NgoDistributionPage() {
  return (
    <DashboardLayout role="ngo" title="Staging Staging Map & Distribution" subtitle="Inventory status to staging sectors">
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        
        {/* Supply Distribution progress card */}
        <div className="bg-[#0d1b2e] border border-[#1e3352] rounded-xl p-4 lg:p-5 glass-panel h-fit">
          <div className="border-b border-[#1e3352] pb-3 mb-4">
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Package className="h-4 w-4 text-[#f59e0b]" />
              Supply Distribution Progress
            </h3>
            <p className="text-[11px] text-[#64748b] mt-0.5">Inventory dispatch status to emergency staging sectors.</p>
          </div>
          <div className="space-y-4">
            {SUPPLY_DATA.map(item => {
              const pct = Math.round((item.allocated / item.total) * 100);
              return (
                <div key={item.name} className="space-y-1.5">
                  <div className="flex justify-between text-xs font-medium">
                    <span className="text-foreground">{item.name}</span>
                    <span className="text-[#64748b]">{item.allocated.toLocaleString()} / {item.total.toLocaleString()} ({pct}%)</span>
                  </div>
                  <div className="h-2 bg-[#1e3352] rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-1000"
                      style={{ width: `${pct}%`, background: item.color }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Live Map viewport */}
        <div className="xl:col-span-2 bg-[#0d1b2e] border border-[#1e3352] rounded-xl overflow-hidden glass-panel">
          <div className="relative">
            <LiveMap height="450px" center={[17.385, 78.4867]} zoom={12} />
          </div>
        </div>

      </div>
    </DashboardLayout>
  );
}
