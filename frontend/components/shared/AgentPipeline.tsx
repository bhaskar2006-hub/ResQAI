"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { getSocket } from '@/utils/socket';
import { Zap, Brain, Search, Building2, Home, FileText, CheckCircle2, Loader2, AlertTriangle } from 'lucide-react';

interface PipelineStep {
  id: string;
  name: string;
  icon: React.ElementType;
  status: 'pending' | 'processing' | 'completed' | 'error';
  message?: string;
}

const defaultSteps: PipelineStep[] = [
  { id: 'prediction', name: 'Prediction', icon: Brain, status: 'pending' },
  { id: 'sos', name: 'SOS Agent', icon: AlertTriangle, status: 'pending' },
  { id: 'resource', name: 'Resource', icon: Search, status: 'pending' },
  { id: 'hospital', name: 'Hospital', icon: Building2, status: 'pending' },
  { id: 'shelter', name: 'Shelter', icon: Home, status: 'pending' },
  { id: 'report', name: 'Report', icon: FileText, status: 'pending' },
];

export default function AgentPipeline() {
  const [steps, setSteps] = useState<PipelineStep[]>(defaultSteps);
  const [logs, setLogs] = useState<{ agent: string; message: string; time: string; status: string }[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const logEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const socket = getSocket();

    const handleFlowStep = (data: { step: string; agentName: string; message: string; status: string }) => {
      if (data.step === 'orchestrator_start') {
        setIsRunning(true);
        setSteps(defaultSteps);
        setLogs([]);
      }

      if (data.step === 'orchestrator_complete') {
        setIsRunning(false);
      }

      // Update step status
      setSteps(prev => prev.map(s => {
        if (s.id === data.step) {
          return {
            ...s,
            status: data.status === 'COMPLETED' ? 'completed' : data.status === 'PROCESSING' ? 'processing' : s.status,
            message: data.message,
          };
        }
        return s;
      }));

      // Add to terminal logs
      setLogs(prev => [...prev, {
        agent: data.agentName,
        message: data.message,
        time: new Date().toLocaleTimeString(),
        status: data.status,
      }]);
    };

    socket.on('agentFlowStep', handleFlowStep);
    return () => { socket.off('agentFlowStep', handleFlowStep); };
  }, []);

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  const getStepColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-severity-low/10 text-severity-low border-severity-low/30';
      case 'processing': return 'bg-primary/10 text-primary border-primary/30 animate-pulse-severity';
      case 'error': return 'bg-severity-critical/10 text-severity-critical border-severity-critical/30';
      default: return 'bg-muted text-muted-foreground border-border';
    }
  };

  const getLogColor = (agent: string) => {
    if (agent.includes('Prediction')) return 'text-primary';
    if (agent.includes('SOS')) return 'text-severity-critical';
    if (agent.includes('Resource')) return 'text-severity-medium';
    if (agent.includes('Hospital')) return 'text-severity-high';
    if (agent.includes('Shelter')) return 'text-severity-low';
    if (agent.includes('Report')) return 'text-severity-unknown';
    if (agent.includes('Orchestrator')) return 'text-primary';
    return 'text-muted-foreground';
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-primary" />
            AI Agent Pipeline
          </CardTitle>
          <Badge variant={isRunning ? 'warning' : 'secondary'}>
            {isRunning ? 'Processing' : 'Idle'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Pipeline Steps */}
        <div className="flex items-center justify-between gap-1">
          {steps.map((step, idx) => {
            const Icon = step.status === 'completed' ? CheckCircle2 : step.status === 'processing' ? Loader2 : step.icon;
            return (
              <React.Fragment key={step.id}>
                <div className="flex flex-col items-center gap-1.5">
                  <div className={cn(
                    "h-9 w-9 rounded-lg flex items-center justify-center border-2 transition-all duration-300",
                    getStepColor(step.status)
                  )}>
                    <Icon className={cn("h-4 w-4", step.status === 'processing' && 'animate-spin')} />
                  </div>
                  <span className="text-[10px] font-medium text-muted-foreground text-center leading-tight">{step.name}</span>
                </div>
                {idx < steps.length - 1 && (
                  <div className={cn(
                    "flex-1 h-0.5 rounded-full transition-colors duration-500 mb-5",
                    step.status === 'completed' ? 'bg-severity-low' : 'bg-border'
                  )} />
                )}
              </React.Fragment>
            );
          })}
        </div>

        {/* Terminal Console */}
        <div className="bg-card rounded-lg border border-border p-3 h-48 overflow-y-auto font-mono text-[11px] space-y-1">
          {logs.length === 0 ? (
            <div className="text-muted-foreground text-center py-8">
              Waiting for SOS to trigger AI agent pipeline...
            </div>
          ) : (
            logs.map((log, idx) => (
              <div key={idx} className="flex gap-2 leading-relaxed">
                <span className="text-muted-foreground shrink-0">[{log.time}]</span>
                <span className={cn("font-semibold shrink-0", getLogColor(log.agent))}>[{log.agent}]</span>
                <span className="text-muted-foreground">{log.message}</span>
              </div>
            ))
          )}
          <div ref={logEndRef} />
        </div>
      </CardContent>
    </Card>
  );
}
