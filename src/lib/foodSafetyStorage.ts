import { foodSafetyStorage as storage } from './localStorageService';

export interface CCP {
  id: string;
  name: string;
  criticalLimit: string;
  monitoringProcedure: string;
  correctiveAction: string;
  frequency: string;
  responsible: string;
  status: 'Active' | 'Review' | 'Non-compliant';
  lastVerified: string;
}

export interface HACCPPlan {
  id: string;
  productName: string;
  processStep: string;
  hazard: string;
  hazardType: 'Biological' | 'Chemical' | 'Physical';
  severity: 'High' | 'Medium' | 'Low';
  likelihood: 'High' | 'Medium' | 'Low';
  ccps: CCP[];
  createdAt: string;
  updatedAt: string;
}

export function initializeFoodSafety() {
  const demoHACCP = [
    {
      id: '1',
      productName: 'Fresh Chicken Products',
      processStep: 'Cooking',
      hazard: 'Bacterial survival (Salmonella, Campylobacter)',
      hazardType: 'Biological',
      severity: 'High',
      likelihood: 'Medium',
      ccps: [{
        id: '1',
        name: 'Cooking Temperature',
        criticalLimit: 'Internal temp ≥ 74°C',
        monitoringProcedure: 'Continuous temperature monitoring',
        correctiveAction: 'Recook or reject batch',
        frequency: 'Every batch',
        responsible: 'Production Operator',
        status: 'Active',
        lastVerified: '2026-04-15'
      }],
      createdAt: '2025-06-01',
      updatedAt: '2026-04-15'
    },
    {
      id: '2',
      productName: 'Frozen Vegetables',
      processStep: 'Blanching',
      hazard: 'Pathogen survival',
      hazardType: 'Biological',
      severity: 'High',
      likelihood: 'Low',
      ccps: [{
        id: '2',
        name: 'Blanching Temperature & Time',
        criticalLimit: '≥ 85°C for 3 minutes',
        monitoringProcedure: 'Temperature recorder + timer',
        correctiveAction: 'Adjust process, retest product',
        frequency: 'Every 30 minutes',
        responsible: 'Quality Control',
        status: 'Active',
        lastVerified: '2026-04-10'
      }],
      createdAt: '2025-08-15',
      updatedAt: '2026-04-10'
    }
  ];

  const existing = localStorage.getItem('food_compliance_food_safety');
  if (!existing) {
    localStorage.setItem('food_compliance_food_safety', JSON.stringify(demoHACCP));
  }
}

export const foodSafetyService = storage;
