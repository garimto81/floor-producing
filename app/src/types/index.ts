// 체크리스트 타입
export interface ChecklistItem {
  id: string;
  title: string;
  description?: string;
  completed: boolean;
  priority: 'high' | 'medium' | 'low';
  category: 'morning' | 'production' | 'evening' | 'emergency';
  timeSlot?: string;
}

// 팀원 상태
export interface TeamMember {
  id: string;
  name: string;
  role: string;
  status: 'active' | 'break' | 'offline';
  phone: string;
  isEmergencyContact?: boolean;
}

// 촬영 현황
export interface ProductionStatus {
  featureTables: {
    total: number;
    active: number;
    issues: number;
  };
  dataTransfer: {
    speed: number; // GB/h
    total: number; // GB
    status: 'stable' | 'slow' | 'error';
  };
  team: {
    total: number;
    active: number;
    onBreak: number;
    offline: number;
  };
}

// 일정
export interface Schedule {
  id: string;
  title: string;
  time: Date;
  type: 'interview' | 'event' | 'break' | 'meeting';
  priority: 'high' | 'medium' | 'low';
  location?: string;
  notes?: string;
}

// 긴급 상황
export interface Emergency {
  id: string;
  title: string;
  level: 'critical' | 'high' | 'medium' | 'low';
  category: 'technical' | 'personnel' | 'external' | 'legal';
  status: 'active' | 'resolved' | 'monitoring';
  timestamp: Date;
  actions: EmergencyAction[];
}

export interface EmergencyAction {
  id: string;
  action: string;
  responsible: string;
  completed: boolean;
  deadline?: Date;
}

// 통신 템플릿
export interface CommunicationTemplate {
  id: string;
  name: string;
  category: 'daily' | 'emergency' | 'request' | 'interview';
  subject: string;
  body: string;
  variables: string[];
}

// 앱 상태
export interface AppState {
  mode: 'normal' | 'production' | 'crisis';
  isOffline: boolean;
  lastSync: Date;
}