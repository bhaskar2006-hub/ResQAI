import { create } from 'zustand';

export type SeverityType = 'low' | 'medium' | 'high' | 'critical';

export interface DisasterInfo {
  id: string;
  name: string;
  lat: number;
  lng: number;
  type: string;
  severity: SeverityType;
  radius: number;
}

export interface SosReportInfo {
  id: string;
  description: string;
  lat: number;
  lng: number;
  status: string;
  severity?: SeverityType;
}

export type RagStepType = 'idle' | 'query' | 'embed' | 'retrieve' | 'rerank' | 'llm' | 'answer';
export type RagStatusType = 'idle' | 'processing' | 'completed' | 'error';

interface CommandCenterState {
  // Map / Focus state
  selectedDistrict: string | null;
  activeDisasters: DisasterInfo[];
  selectedDisaster: DisasterInfo | null;
  selectedSosReport: SosReportInfo | null;
  
  // Live Feed
  sosReports: SosReportInfo[];
  systemLoad: number; // 0 to 100
  systemSeverity: SeverityType;

  // RAG Pipeline
  ragStep: RagStepType;
  ragStatus: RagStatusType;
  ragQuery: string;
  ragResult: string;
  
  // Actions
  setSelectedDistrict: (district: string | null) => void;
  setActiveDisasters: (disasters: DisasterInfo[]) => void;
  setSelectedDisaster: (disaster: DisasterInfo | null) => void;
  setSelectedSosReport: (sos: SosReportInfo | null) => void;
  setSosReports: (sos: SosReportInfo[]) => void;
  setSystemLoad: (load: number) => void;
  setSystemSeverity: (severity: SeverityType) => void;
  triggerRagFlow: (query: string, result?: string) => Promise<void>;
  resetRagFlow: () => void;
}

export const useStore = create<CommandCenterState>((set) => ({
  selectedDistrict: null,
  activeDisasters: [],
  selectedDisaster: null,
  selectedSosReport: null,
  sosReports: [],
  systemLoad: 25,
  systemSeverity: 'low',

  ragStep: 'idle',
  ragStatus: 'idle',
  ragQuery: '',
  ragResult: '',

  setSelectedDistrict: (district) => set({ selectedDistrict: district }),
  setActiveDisasters: (disasters) => {
    // Determine overall system severity based on highest active disaster severity
    let maxSeverity: SeverityType = 'low';
    disasters.forEach(d => {
      const s = d.severity.toLowerCase() as SeverityType;
      if (s === 'critical') maxSeverity = 'critical';
      else if (s === 'high' && maxSeverity !== 'critical') maxSeverity = 'high';
      else if (s === 'medium' && maxSeverity !== 'critical' && maxSeverity !== 'high') maxSeverity = 'medium';
    });
    const load = disasters.length > 0 ? Math.min(30 + disasters.length * 15, 100) : 20;
    
    set({ 
      activeDisasters: disasters,
      systemSeverity: maxSeverity,
      systemLoad: load
    });
  },
  setSelectedDisaster: (disaster) => set({ selectedDisaster: disaster }),
  setSelectedSosReport: (sos) => set({ selectedSosReport: sos }),
  setSosReports: (sos) => set({ sosReports: sos }),
  setSystemLoad: (load) => set({ systemLoad: load }),
  setSystemSeverity: (severity) => set({ systemSeverity: severity }),
  
  triggerRagFlow: async (query: string, result = 'Resource assignment successfully completed.') => {
    set({ ragQuery: query, ragStatus: 'processing', ragStep: 'query' });
    
    const steps: RagStepType[] = ['query', 'embed', 'retrieve', 'rerank', 'llm', 'answer'];
    
    for (const step of steps) {
      set({ ragStep: step });
      // Simulate RAG pipeline speed
      await new Promise((resolve) => setTimeout(resolve, 600));
    }
    
    set({ ragStatus: 'completed', ragResult: result });
  },
  
  resetRagFlow: () => set({ ragStep: 'idle', ragStatus: 'idle', ragQuery: '', ragResult: '' })
}));
