import { documentStorage as storage } from './localStorageService';

export interface Document {
  id: string;
  name: string;
  type: 'Policy' | 'Procedure' | 'Work Instruction' | 'Form' | 'Certificate' | 'Report';
  category: string;
  version: string;
  status: 'Draft' | 'Under Review' | 'Approved' | 'Archived' | 'Expired';
  owner: string;
  approvedBy?: string;
  approvalDate?: string;
  expiryDate?: string;
  tags: string[];
  fileUrl?: string;
  description: string;
  createdAt: string;
  updatedAt: string;
}

export function initializeDocuments() {
  const demoDocuments = [
    {
      id: '1',
      name: 'Food Safety Policy',
      type: 'Policy',
      category: 'Food Safety',
      version: '3.2',
      status: 'Approved',
      owner: 'Quality Manager',
      approvedBy: 'John Smith',
      approvalDate: '2026-01-15',
      expiryDate: '2027-01-14',
      tags: ['food safety', 'policy'],
      description: 'Company-wide food safety policy statement',
      createdAt: '2025-01-10',
      updatedAt: '2026-01-15'
    },
    {
      id: '2',
      name: 'HACCP Plan - Fresh Chicken',
      type: 'Procedure',
      category: 'HACCP',
      version: '2.0',
      status: 'Approved',
      owner: 'Food Safety Team',
      approvedBy: 'Priya Reddy',
      approvalDate: '2026-02-20',
      expiryDate: '2027-02-19',
      tags: ['haccp', 'ccp', 'chicken'],
      description: 'Complete HACCP plan for fresh chicken production',
      createdAt: '2025-02-01',
      updatedAt: '2026-02-20'
    }
  ];

  const existing = localStorage.getItem('food_compliance_documents');
  if (!existing) {
    localStorage.setItem('food_compliance_documents', JSON.stringify(demoDocuments));
  }
}

export const documentService = storage;
