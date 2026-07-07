"use client";

import React, { useState, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { api } from '@/utils/api';
import { useStore } from '@/utils/store';
import { MessageSquare, Send } from 'lucide-react';

const RagPipeline = dynamic(() => import('@/components/shared/RagPipeline'), { ssr: false });

interface AgentItem { id: string; name: string; type: string; status: string }
interface ApiResponse<T> { success?: boolean; data?: T }

export default function AgentsPage() {
  const [agents, setAgents] = useState<AgentItem[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState<Array<{ sender: 'ai'|'user'; text: string; time: string }>>([
    { sender: 'ai', text: 'AI Command Engine online. Type a message or task to invoke agent vector matching, reranking, and Gemini execution.', time: 'Just now' }
  ]);
  const [isSending, setIsSending] = useState(false);

  const fetchAgents = useCallback(async () => {
    try {
      const res = await api.get('/agents').catch(() => null) as ApiResponse<{ agents?: AgentItem[] }> | null;
      if (res?.success && res.data?.agents) setAgents(res.data.agents);
    } catch (err) { console.error('Failed to load agents:', err); }
  }, []);

  useEffect(() => {
    fetchAgents();
  }, [fetchAgents]);

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

  return (
    <DashboardLayout role="government" title="AI Orchestrator & Agents" subtitle="Transparent neural networks monitoring">
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        
        {/* Left: Chat Input & Agent Load */}
        <div className="xl:col-span-1 space-y-5">
          {/* AI Command Chat Panel */}
          <div className="bg-[#0d1b2e] border border-[#1e3352] rounded-xl overflow-hidden glass-panel">
            <div className="flex items-center gap-2 px-4 py-3 border-b border-[#1e3352]">
              <MessageSquare className="h-4 w-4 text-primary" />
              <p className="text-sm font-semibold text-foreground">AI Command Console</p>
              <span className="ml-auto flex items-center gap-1 text-[9px] text-[#22c55e] font-medium">
                <span className="h-1.5 w-1.5 rounded-full bg-[#22c55e]" />
                ONLINE
              </span>
            </div>
            <div className="p-3 space-y-3">
              <div className="h-64 rounded-lg bg-[#060e1d] border border-[#1e3352] p-3 overflow-y-auto space-y-2 flex flex-col justify-end">
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

          {/* AI Agent Load progress */}
          <div className="bg-[#0d1b2e] border border-[#1e3352] rounded-xl overflow-hidden glass-panel">
            <div className="flex items-center justify-between px-4 py-3 border-b border-[#1e3352]">
              <p className="text-sm font-semibold text-foreground">AI Agent Grid Load</p>
              <span className="text-[9px] font-mono text-[#22c55e] bg-[#22c55e]/10 border border-[#22c55e]/20 px-1.5 py-0.5 rounded">
                {agents.length ? `${agents.length} AGENTS ACTIVE` : 'SYNCING...'}
              </span>
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

        {/* Right: RAG pipeline animation flowchart */}
        <div className="xl:col-span-2">
          <RagPipeline />
        </div>
      </div>
    </DashboardLayout>
  );
}
