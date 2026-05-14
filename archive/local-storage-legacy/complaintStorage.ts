import { complaintStorage as storage } from './localStorageService';

export interface Complaint {
  id: string;
  reference: string;
  customerName: string;
  complaintDate: string;
  category: 'Product Quality' | 'Food Safety' | 'Packaging' | 'Delivery' | 'Service' | 'Other';
  description: string;
  severity: 'Critical' | 'High' | 'Medium' | 'Low';
  status: 'Open' | 'In Progress' | 'Resolved' | 'Closed';
  assignedTo: string;
  response: string;
  resolutionDate?: string;
  resolvedBy?: string;
  createdAt: string;
  updatedAt: string;
}

export function initializeComplaints() {
  const demoComplaints = [
    {
      id: '1',
      reference: 'CC-2026-001',
      customerName: 'Woolworths SA',
      complaintDate: '2026-04-15',
      category: 'Product Quality',
      description: 'Off-odor detected in fresh chicken products',
      severity: 'High',
      status: 'In Progress',
      assignedTo: 'Priya Reddy',
      response: 'Sample collected for lab analysis. Investigation ongoing.',
      createdAt: '2026-04-15',
      updatedAt: '2026-04-20'
    },
    {
      id: '2',
      reference: 'CC-2026-002',
      customerName: 'Pick n Pay',
      complaintDate: '2026-04-10',
      category: 'Food Safety',
      description: 'Foreign object (plastic) found in frozen vegetables',
      severity: 'Critical',
      status: 'Resolved',
      assignedTo: 'James Nkosi',
      response: 'Root cause identified - supplier packaging issue. Corrective actions implemented.',
      resolutionDate: '2026-04-18',
      resolvedBy: 'James Nkosi',
      createdAt: '2026-04-10',
      updatedAt: '2026-04-18'
    },
    {
      id: '3',
      reference: 'CC-2026-003',
      customerName: 'Checkers',
      complaintDate: '2026-04-05',
      category: 'Packaging',
      description: 'Damaged packaging leading to product leakage',
      severity: 'Medium',
      status: 'Closed',
      assignedTo: 'Thabo Nkosi',
      response: 'Packaging supplier notified. New packaging spec implemented.',
      resolutionDate: '2026-04-12',
      resolvedBy: 'Thabo Nkosi',
      createdAt: '2026-04-05',
      updatedAt: '2026-04-12'
    }
  ];

  const existing = localStorage.getItem('food_compliance_complaints');
  if (!existing) {
    localStorage.setItem('food_compliance_complaints', JSON.stringify(demoComplaints));
  }
}

export const complaintService = storage;
