import { supplierStorage as storage } from './localStorageService';

export interface Supplier {
  id: string;
  name: string;
  category: string;
  status: 'Active' | 'Approved' | 'Probation' | 'Suspended' | 'Rejected';
  riskLevel: 'Low' | 'Medium' | 'High' | 'Critical';
  score: number;
  lastAuditDate: string;
  nextAuditDate: string;
  certifications: string[];
  contactPerson: string;
  email: string;
  phone: string;
  notes: string;
  createdAt: string;  updatedAt: string;
}

export function initializeSuppliers() {
  const demosuppliers = [
    {
      id: '1',
      name: 'Fresh Produce Ltd',
      category: 'Raw Materials',
      status: 'Approved',
      riskLevel: 'Medium',
      score: 85,
      lastAuditDate: '2026-02-15',
      nextAuditDate: '2026-08-15',
      certifications: ['GlobalG.A.P.', 'BRCGS'],
      contactPerson: 'John Smith',
      email: 'john@freshproduce.com',
      phone: '+27 11 123 4567',
      notes: 'Reliable supplier, good quality',
      createdAt: '2025-01-10',
      updatedAt: '2026-02-15'
    },
    {
      id: '2',
      name: 'Packaging Solutions SA',
      category: 'Packaging',
      status: 'Probation',
      riskLevel: 'High',
      score: 68,
      lastAuditDate: '2026-03-10',
      nextAuditDate: '2026-05-10',
      certifications: ['ISO 9001'],
      contactPerson: 'Sarah Jones',
      email: 'sarah@packagingsolutions.co.za',
      phone: '+27 21 987 6543',
      notes: 'Quality issues with recent batch - on probation',
      createdAt: '2025-03-15',
      updatedAt: '2026-03-10'
    }
  ];

  const existing = localStorage.getItem('food_compliance_suppliers');
  if (!existing) {
    localStorage.setItem('food_compliance_suppliers', JSON.stringify(demosuppliers));
  }
}

export const supplierService = storage;
