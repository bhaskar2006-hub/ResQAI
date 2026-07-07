"use client";

import React, { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Settings, ToggleLeft } from 'lucide-react';

export default function AdminModelsPage() {
  const [modelGov, setModelGov] = useState('gemini-1.5-flash');
  const [modelCitizen, setModelCitizen] = useState('gemini-1.5-flash');
  const [autoDispatch, setAutoDispatch] = useState(true);

  return (
    <DashboardLayout role="admin" title="AI Model Routing" subtitle="System Control Center">
      <div className="max-w-md mx-auto bg-[#0d1b2e] border border-[#1e3352] rounded-xl p-4 lg:p-5 flex flex-col space-y-4 glass-panel">
        <div>
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Settings className="h-4 w-4 text-[#f59e0b]" />
            AI Model Routing Configuration
          </h3>
          <p className="text-[11px] text-[#64748b] mt-0.5">Map agents to preferred inference engines.</p>
        </div>

        <div className="space-y-4 flex-1">
          <div className="space-y-1.5">
            <label className="text-[10px] font-medium text-[#64748b] uppercase tracking-wider">Command Core Agent LLM</label>
            <select
              value={modelGov}
              onChange={e => setModelGov(e.target.value)}
              className="w-full h-9 px-3 rounded-lg text-xs bg-[#060e1d] border border-[#1e3352] text-foreground rounded-lg focus:outline-none focus:border-primary"
            >
              <option value="gemini-1.5-flash">Gemini 1.5 Flash (Production)</option>
              <option value="gemini-1.5-pro">Gemini 1.5 Pro (Precision)</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-medium text-[#64748b] uppercase tracking-wider">SOS Translation Agent LLM</label>
            <select
              value={modelCitizen}
              onChange={e => setModelCitizen(e.target.value)}
              className="w-full h-9 px-3 rounded-lg text-xs bg-[#060e1d] border border-[#1e3352] text-foreground rounded-lg focus:outline-none focus:border-primary"
            >
              <option value="gemini-1.5-flash">Gemini 1.5 Flash (Production)</option>
              <option value="gemini-1.5-pro">Gemini 1.5 Pro (Precision)</option>
            </select>
          </div>

          <div className="pt-3 border-t border-[#1e3352]">
            <div className="flex items-center justify-between p-3 rounded-lg bg-[#060e1d]/50 border border-[#1e3352]">
              <div className="min-w-0 pr-2">
                <p className="text-xs font-semibold text-foreground">Auto-Dispatch Override</p>
                <p className="text-[9px] text-[#64748b] leading-snug mt-0.5">Dispatch responders automatically.</p>
              </div>
              <button
                type="button"
                onClick={() => setAutoDispatch(!autoDispatch)}
                className="relative flex items-center justify-center shrink-0 cursor-pointer text-primary"
              >
                <ToggleLeft className={`h-8 w-8 transition-transform duration-200 ${autoDispatch ? 'rotate-180 text-primary' : 'text-[#64748b]'}`} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
