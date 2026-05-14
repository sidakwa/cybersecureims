import { riskStorage as storage } from './localStorageService';

export interface Risk {
  id: string;
  category: string;
  hazard: string;
  riskLevel: 'critical' | 'high' | 'medium' | 'low';
  likelihood: number; // 1-5
  severity: number; // 1-5
  riskScore: number; // likelihood * severity
  mitigation: string;
  status: 'active' | 'mitigated' | 'review';
  assignedTo: string;
  reviewDate: string;
  createdAt: string;
}

export function initializeRisks() {
  const demoRisks = [
    {
      id: '1',
      category: 'Biological',
      hazard: 'Listeria in production environment',
      riskLevel: 'critical',
      likelihood: 4,
      severity: 5,
      riskScore: 20,
      mitigation: 'Enhanced sanitation protocol, environmental monitoring program',
      status: 'active',
      assignedTo: 'Priya Reddy',
      reviewDate: '2026-05-15',
      createdAt: '2026-01-10'
    },
    {
      id: '2',
      category: 'Chemical',
      hazard: 'CIP chemical handling',
      riskLevel: 'high',
      likelihood: 3,
      severity: 4,
      riskScore: 12,
      mitigation: 'Chemical training, PPE requirements, spill kits available',
      status: 'active',
      assignedTo: 'Thabo Nkosi',
      reviewDate: '2026-05-20',
      createdAt: '2026-01-15'
    },
    {
      id: '3',
      category: 'Physical',
      hazard: 'Glass and metal contamination',
      riskLevel: 'critical',
      likelihood: 2,
      severity: 5,
      riskScore: 10,
      mitigation: 'Glass registry, metal detectors, preventive maintenance',
      status: 'in_progress',
      assignedTo: 'James Nkosi',
      reviewDate: '2026-04-30',
      createdAt: '2026-02-01'
    },
    {
      id: '4',
      category: 'Environmental',
      hazard: 'Flood risk to cold store',
      riskLevel: 'medium',
      likelihood: 2,
      severity: 3,
      riskScore: 6,
      mitigation: 'Flood barriers, backup generator, elevated storage',
      status: 'active',
      assignedTo: 'David van der Merwe',
      reviewDate: '2026-06-01',
      createdAt: '2026-02-15'
    }
  ];

  const existing = localStorage.getItem('food_compliance_risks');
  if (!existing) {
    localStorage.setItem('food_compliance_risks', JSON.stringify(demoRisks));
  }
}

export const riskService = storage;
