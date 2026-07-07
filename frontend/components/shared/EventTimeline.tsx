"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { getSocket } from '@/utils/socket';
import { api } from '@/utils/api';
import { Activity, AlertTriangle, CheckCircle2, ThumbsUp, ThumbsDown, Clock } from 'lucide-react';

interface TimelineEvent {
  id: string;
  time: string;
  title: string;
  description: string;
  type: 'critical' | 'warning' | 'info' | 'success';
}

interface PendingAction {
  id: string;
  actionType: string;
  details: { reason?: string; resourceIdentifier?: string; resourceType?: string };
  agent: { name: string };
}

export default function EventTimeline() {
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [pendingActions, setPendingActions] = useState<PendingAction[]>([]);

  useEffect(() => {
    // Load pending actions
    api.get('/agents/actions/pending').then((res: Record<string, unknown>) => {
      const data = res as { success?: boolean; data?: { actions?: PendingAction[] } };
      if (data.success && data.data?.actions) {
        setPendingActions(data.data.actions);
      }
    }).catch(() => {});

    const socket = getSocket();

    socket.on('newSOS', (sos: { id: string; description: string; createdAt: string }) => {
      setEvents(prev => [{
        id: `ev-${Date.now()}`, time: new Date(sos.createdAt).toLocaleTimeString(),
        title: '🚨 New SOS Received', description: sos.description.substring(0, 100), type: 'critical' as const
      }, ...prev].slice(0, 20));
    });

    socket.on('actionProposed', (action: PendingAction) => {
      setPendingActions(prev => [action, ...prev]);
      setEvents(prev => [{
        id: `ev-${Date.now()}`, time: new Date().toLocaleTimeString(),
        title: '🤖 AI Dispatch Proposed', description: `${action.agent.name}: ${action.details.reason || 'Resource dispatch recommended'}`, type: 'warning' as const
      }, ...prev].slice(0, 20));
    });

    socket.on('actionApproved', (action: PendingAction) => {
      setPendingActions(prev => prev.filter(a => a.id !== action.id));
      setEvents(prev => [{
        id: `ev-${Date.now()}`, time: new Date().toLocaleTimeString(),
        title: '✅ Dispatch Authorized', description: `${action.details.resourceIdentifier || 'Resource'} dispatched`, type: 'success' as const
      }, ...prev].slice(0, 20));
    });

    socket.on('actionRejected', (action: PendingAction) => {
      setPendingActions(prev => prev.filter(a => a.id !== action.id));
    });

    socket.on('agentFlowStep', (data: { agentName: string; message: string; status: string }) => {
      if (data.status === 'COMPLETED') {
        setEvents(prev => [{
          id: `ev-${Date.now()}`, time: new Date().toLocaleTimeString(),
          title: `⚡ ${data.agentName}`, description: data.message.substring(0, 100), type: 'info' as const
        }, ...prev].slice(0, 20));
      }
    });

    return () => {
      socket.off('newSOS');
      socket.off('actionProposed');
      socket.off('actionApproved');
      socket.off('actionRejected');
      socket.off('agentFlowStep');
    };
  }, []);

  const handleApprove = async (id: string) => {
    try { await api.post(`/agents/actions/${id}/approve`); } catch (err) { console.error(err); }
  };

  const handleReject = async (id: string) => {
    try { await api.post(`/agents/actions/${id}/reject`); } catch (err) { console.error(err); }
  };

  const typeConfig = {
    critical: { color: 'text-destructive', bg: 'bg-destructive/10', icon: AlertTriangle },
    warning: { color: 'text-warning', bg: 'bg-warning/10', icon: Clock },
    info: { color: 'text-info', bg: 'bg-info/10', icon: Activity },
    success: { color: 'text-success', bg: 'bg-success/10', icon: CheckCircle2 },
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-primary" />
            Event Stream
          </CardTitle>
          <Badge variant="secondary">{events.length} events</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* HITL Pending Actions */}
        {pendingActions.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-warning animate-pulse" />
              <span className="text-xs font-semibold text-warning uppercase">
                Awaiting Approval ({pendingActions.length})
              </span>
            </div>
            {pendingActions.map((action) => (
              <div key={action.id} className="p-3 rounded-lg border border-warning/30 bg-warning/5 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs font-semibold truncate">{action.agent.name}: {action.actionType}</p>
                  <p className="text-[11px] text-muted-foreground truncate">{action.details.reason}</p>
                </div>
                <div className="flex gap-1.5 shrink-0">
                  <Button size="sm" variant="destructive" className="h-7 px-2" onClick={() => handleReject(action.id)}>
                    <ThumbsDown className="h-3 w-3" />
                  </Button>
                  <Button size="sm" variant="success" className="h-7 px-2" onClick={() => handleApprove(action.id)}>
                    <ThumbsUp className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Timeline Events */}
        <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
          {events.length === 0 ? (
            <div className="text-center text-xs text-muted-foreground py-8">
              No events yet. Submit an SOS to start the AI pipeline.
            </div>
          ) : (
            events.map((event) => {
              const config = typeConfig[event.type];
              const Icon = config.icon;
              return (
                <div key={event.id} className="flex gap-3 py-2 animate-slide-up">
                  <div className={cn("h-7 w-7 rounded-lg flex items-center justify-center shrink-0", config.bg)}>
                    <Icon className={cn("h-3.5 w-3.5", config.color)} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-xs font-semibold truncate">{event.title}</p>
                      <span className="text-[10px] text-muted-foreground shrink-0">{event.time}</span>
                    </div>
                    <p className="text-[11px] text-muted-foreground truncate">{event.description}</p>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </CardContent>
    </Card>
  );
}
