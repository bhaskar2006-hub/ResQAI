"use client";

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore, RagStepType } from '@/utils/store';
import { 
  MessageSquare, Binary, Database, ArrowUpDown, Brain, FileCheck, CheckCircle2, Loader2 
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

interface PipelineNode {
  id: RagStepType;
  label: string;
  icon: React.ElementType;
  description: string;
}

const pipelineNodes: PipelineNode[] = [
  { id: 'query', label: 'Query Input', icon: MessageSquare, description: 'Natural language request parsing' },
  { id: 'embed', label: 'Vector Embed', icon: Binary, description: 'Dense text vector conversion' },
  { id: 'retrieve', label: 'RAG Retrieve', icon: Database, description: 'Locating hospital/shelter databases' },
  { id: 'rerank', label: 'CoT Rerank', icon: ArrowUpDown, description: 'Cross-encoder relevance scoring' },
  { id: 'llm', label: 'Gemini Synthesis', icon: Brain, description: 'Generative response formulation' },
  { id: 'answer', label: 'Action Output', icon: FileCheck, description: 'Structured JSON proposal schema' }
];

export default function RagPipeline() {
  const { ragStep, ragStatus, ragQuery, ragResult } = useStore();

  const getStepIndex = (step: RagStepType) => {
    switch (step) {
      case 'query': return 0;
      case 'embed': return 1;
      case 'retrieve': return 2;
      case 'rerank': return 3;
      case 'llm': return 4;
      case 'answer': return 5;
      case 'idle':
      default: return -1;
    }
  };

  const activeIndex = getStepIndex(ragStep);

  const getStepStatus = (index: number) => {
    if (ragStatus === 'idle') return 'idle';
    if (index < activeIndex) return 'completed';
    if (index === activeIndex) return 'processing';
    return 'pending';
  };

  const getStepLog = (step: RagStepType) => {
    switch (step) {
      case 'query':
        return `[INFO] Parsing NLP user query: "${ragQuery || 'No active query'}"`;
      case 'embed':
        return `[PROCESS] Converting query to high-dimensional embedding vector...`;
      case 'retrieve':
        return `[DATABASE] Performing vector search on local coordinates and resource index...`;
      case 'rerank':
        return `[LOGIC] Reranking matches: sorting hospitals by bed availability and proximity.`;
      case 'llm':
        return `[AI] Calling Google Gemini API: generating rescue route proposal.`;
      case 'answer':
        return `[SUCCESS] Output generated: Action payload ready for commander authorization.`;
      case 'idle':
      default:
        return `[READY] Waiting for commander input or automated SOS trigger...`;
    }
  };

  return (
    <Card className="glass-panel-glow border">
      <CardHeader className="pb-3 border-b border-border/40">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xs font-mono tracking-wider font-semibold uppercase flex items-center gap-2">
            <span className={`h-2 w-2 rounded-full ${ragStatus === 'processing' ? 'bg-severity-medium animate-pulse' : 'bg-primary'}`} />
            Agent Transparency Pipeline (RAG)
          </CardTitle>
          {ragStatus === 'processing' && (
            <div className="flex items-center gap-1 text-[10px] font-mono text-severity-medium">
              <Loader2 className="h-3 w-3 animate-spin" />
              THINKING...
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-5 space-y-5">
        {/* Horizontal Flowchart Nodes */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-3 relative">
          {pipelineNodes.map((node, i) => {
            const status = getStepStatus(i);
            const Icon = node.icon;

            return (
              <div key={node.id} className="relative flex flex-col items-center">
                {/* Visual Node */}
                <motion.div
                  className={`h-11 w-11 rounded-xl flex items-center justify-center border transition-all duration-300 relative z-10 ${
                    status === 'completed' ? 'bg-severity-low/10 border-severity-low/40 text-severity-low shadow-glow-success' :
                    status === 'processing' ? 'bg-primary/20 border-primary text-primary shadow-glow-info scale-105' :
                    'bg-secondary/20 border-border/40 text-muted-foreground'
                  }`}
                  animate={status === 'processing' ? { scale: [1, 1.05, 1] } : {}}
                  transition={{ repeat: Infinity, duration: 1.5 }}
                >
                  {status === 'completed' ? (
                    <CheckCircle2 className="h-5 w-5" />
                  ) : (
                    <Icon className="h-5 w-5" />
                  )}
                </motion.div>

                {/* Node Details */}
                <div className="text-center mt-2.5">
                  <h5 className={`text-[10px] font-bold font-mono tracking-wide ${
                    status === 'processing' ? 'text-primary text-glow-info' : 'text-foreground'
                  }`}>{node.label}</h5>
                  <p className="text-[8px] text-muted-foreground mt-0.5 max-w-[110px] mx-auto leading-normal">{node.description}</p>
                </div>

                {/* Connecting lines between nodes (horizontal on medium screen) */}
                {i < 5 && (
                  <div className="hidden md:block absolute top-5.5 -right-3.5 w-7 h-px bg-border/30 z-0">
                    {status === 'completed' && (
                      <div className="h-full bg-severity-low w-full animate-in fade-in duration-300" />
                    )}
                    {status === 'processing' && (
                      <div className="h-full bg-primary w-1/2 animate-pulse" />
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Live Terminal Output Console */}
        <div className="bg-[#050c16] rounded-lg border border-border/40 p-3 font-mono text-[9px] min-h-[70px] flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-1.5 right-2 text-[7px] text-[#64748b] select-none uppercase font-semibold">Live Pipeline Stream</div>
          <div className="space-y-1 select-none">
            <span className="text-[#64748b] block">{`>> ResQAI RAG Console v1.0.0`}</span>
            <AnimatePresence mode="wait">
              <motion.div
                key={ragStep}
                initial={{ opacity: 0, x: -5 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 5 }}
                className={`font-semibold tracking-wide ${
                  ragStep === 'answer' ? 'text-severity-low' :
                  ragStatus === 'processing' ? 'text-primary' : 'text-[#e8edf5]'
                }`}
              >
                {getStepLog(ragStep)}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Action result display when completed */}
          {ragStatus === 'completed' && (
            <motion.div 
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-2.5 p-2 bg-severity-low/5 border border-severity-low/20 rounded text-[9px] text-[#22c55e] flex items-center justify-between"
            >
              <span>{`[ACTION RESULT]: ${ragResult}`}</span>
              <span className="text-[7.5px] uppercase bg-severity-low/10 px-1 py-0.5 rounded font-bold tracking-widest">EXECUTED</span>
            </motion.div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
