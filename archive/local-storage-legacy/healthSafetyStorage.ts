import { healthSafetyStorage as storage } from './localStorageService';

export interface Incident {
  id: string;
  incidentDate: string;
  incidentType: 'Accident' | 'Near Miss' | 'Hazard' | 'Injury' | 'Property Damage';
  severity: 'Critical' | 'High' | 'Medium' | 'Low';
  location: string;
  department: string;
  description: string;
  rootCause: string;
  correctiveActions: string;
  reportedBy: string;
  status: 'Open' | 'Under Investigation' | 'Resolved' | 'Closed';
  closureDate?: string;
  createdAt: string;
  updatedAt: string;
}

export function initializeHealthSafety() {
  const demoIncidents = [
    {
      id: '1',
      incidentDate: '2026-04-20',
      incidentType: 'Near Miss',
      severity: 'Medium',
      location: 'Production Line 2',
      department: 'Production',
      description: 'Employee nearly slipped on wet floor',
      rootCause: 'Leak from packaging machine',
      correctiveActions: 'Fixed leak, installed anti-slip matting',
      reportedBy: 'John Doe',
      status: 'Resolved',
      closureDate: '2026-04-22',
      createdAt: '2026-04-20',
      updatedAt: '2026-04-22'
    },
    {
      id: '2',
      incidentDate: '2026-04-15',
      incidentType: 'Hazard',
      severity: 'High',
      location: 'Cold Storage',
      department: 'Logistics',
      description: 'Faulty temperature alarm system',
      rootCause: 'Electrical malfunction',
      correctiveActions: 'Repaired alarm system, testing completed',
      reportedBy: 'Sarah Smith',
      status: 'Resolved',
      closureDate: '2026-04-18',
      createdAt: '2026-04-15',
      updatedAt: '2026-04-18'
    }
  ];

  const existing = localStorage.getItem('food_compliance_health_safety');
  if (!existing) {
    localStorage.setItem('food_compliance_health_safety', JSON.stringify(demoIncidents));
  }
}

export const healthSafetyService = storage;
