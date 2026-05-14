export interface StoredItem {
  id: string;
  [key: string]: any;
}

class LocalStorageService<T extends StoredItem> {
  constructor(private key: string) {}

  getAll(): T[] {
    const data = localStorage.getItem(this.key);
    return data ? JSON.parse(data) : [];
  }

  save(item: Omit<T, 'id'>): T {
    const items = this.getAll();
    const newItem = { ...item, id: Date.now().toString() } as T;
    items.push(newItem);
    localStorage.setItem(this.key, JSON.stringify(items));
    return newItem;
  }

  update(id: string, updates: Partial<T>): T | null {
    const items = this.getAll();
    const index = items.findIndex(item => item.id === id);
    if (index === -1) return null;
    
    items[index] = { ...items[index], ...updates };
    localStorage.setItem(this.key, JSON.stringify(items));
    return items[index];
  }

  delete(id: string): boolean {
    const items = this.getAll();
    const filtered = items.filter(item => item.id !== id);
    localStorage.setItem(this.key, JSON.stringify(filtered));
    return true;
  }

  getById(id: string): T | null {
    const items = this.getAll();
    return items.find(item => item.id === id) || null;
  }
}

// Demo data initialization - EXPORT THIS FUNCTION
export function initializeDemoData() {
  const demoAudits = [
    {
      id: '1',
      name: 'FSSC 22000 Surveillance Audit',
      status: 'scheduled',
      standard: 'FSSC 22000',
      auditor: 'SGS South Africa',
      date: '2026-05-15',
      findings: 0,
      score: 0
    },
    {
      id: '2',
      name: 'Internal GMP Audit – Production',
      status: 'passed',
      standard: 'GMP',
      auditor: 'Priya Reddy',
      date: '2026-04-20',
      findings: 2,
      score: 94
    },
    {
      id: '3',
      name: 'OHS Act Compliance Inspection',
      status: 'failed',
      standard: 'OHS Act 85/93',
      auditor: 'DoL Inspector',
      date: '2026-04-10',
      findings: 8,
      score: 61
    },
    {
      id: '4',
      name: 'ISO 9001:2015 Stage 2 Audit',
      status: 'passed',
      standard: 'ISO 9001:2015',
      auditor: 'SGS South Africa',
      date: '2026-03-28',
      findings: 4,
      score: 88
    },
    {
      id: '5',
      name: 'NOSA SHEMTRAC Self-Assessment',
      status: 'in_progress',
      standard: 'NOSA',
      auditor: 'James Nkosi',
      date: '2026-04-25',
      findings: 0,
      score: 0
    }
  ];

  const existingAudits = localStorage.getItem('food_compliance_audits');
  if (!existingAudits) {
    localStorage.setItem('food_compliance_audits', JSON.stringify(demoAudits));
  }
}

// Export storage instances
export const auditStorage = new LocalStorageService('food_compliance_audits');
export const taskStorage = new LocalStorageService('food_compliance_tasks');
export const riskStorage = new LocalStorageService('food_compliance_risks');
export const complaintStorage = new LocalStorageService('food_compliance_complaints');
export const supplierStorage = new LocalStorageService('food_compliance_suppliers');
export const foodSafetyStorage = new LocalStorageService('food_compliance_food_safety');
export const healthSafetyStorage = new LocalStorageService('food_compliance_health_safety');
export const documentStorage = new LocalStorageService('food_compliance_documents');
