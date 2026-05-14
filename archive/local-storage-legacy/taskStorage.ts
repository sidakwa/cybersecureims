import { taskStorage as storage, initializeDemoTasks } from './localStorageService';

export interface Task {
  id: string;
  title: string;
  module: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  status: 'overdue' | 'in_progress' | 'pending' | 'completed' | 'escalated';
  assignee: string;
  deadline: string;
  daysUntilDue: number;
  escalatedFrom?: string;
  escalatedTo?: string;
}

export function initializeTasks() {
  const demoTasks = [
    {
      id: '1',
      title: 'Complete Supplier HACCP Certification Review',
      module: 'Supplier QA',
      priority: 'critical',
      status: 'overdue',
      assignee: 'James Nkosi',
      deadline: '2026-04-30',
      daysUntilDue: -2,
      escalatedTo: 'Quality Manager'
    },
    {
      id: '2',
      title: 'Update OHS Act Section 8 Legal Register',
      module: 'Health & Safety',
      priority: 'high',
      status: 'in_progress',
      assignee: 'James Nkosi',
      deadline: '2026-05-01',
      daysUntilDue: 2
    },
    {
      id: '3',
      title: 'Conduct Q2 Internal Food Safety Audit',
      module: 'Audit Master',
      priority: 'high',
      status: 'pending',
      assignee: 'Priya Reddy',
      deadline: '2026-05-10',
      daysUntilDue: 11
    },
    {
      id: '4',
      title: 'Resolve Customer Complaint CC-2026-047',
      module: 'Customer Complaints',
      priority: 'critical',
      status: 'escalated',
      assignee: 'David van der Merwe',
      deadline: '2026-04-28',
      daysUntilDue: -1,
      escalatedFrom: 'Line Supervisor',
      escalatedTo: 'Quality Manager'
    },
    {
      id: '5',
      title: 'Review & Approve NPD Change Control Form',
      module: 'Technical',
      priority: 'medium',
      status: 'pending',
      assignee: 'Lerato Dlamini',
      deadline: '2026-05-05',
      daysUntilDue: 6
    },
    {
      id: '6',
      title: 'Schedule Planned Maintenance: Pasteuriser PM-04',
      module: 'Maintenance',
      priority: 'medium',
      status: 'pending',
      assignee: 'Thabo Nkosi',
      deadline: '2026-05-02',
      daysUntilDue: 3
    }
  ];

  const existing = localStorage.getItem('food_compliance_tasks');
  if (!existing) {
    localStorage.setItem('food_compliance_tasks', JSON.stringify(demoTasks));
  }
}

// Export the taskStorage from localStorageService
export const taskStorage = storage;
