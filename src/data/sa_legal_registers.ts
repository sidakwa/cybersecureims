export interface LegalRegister {
  id: string;
  act_name: string;
  act_number: string;
  category: string;
  compliance_deadline: string;
  status: 'compliant' | 'partial' | 'non_compliant';
  requirements: string[];
}

export const SA_LEGAL_REGISTERS: LegalRegister[] = [
  {
    id: 'ohs-1',
    act_name: 'Occupational Health and Safety Act',
    act_number: '85 of 1993',
    category: 'Health & Safety',
    compliance_deadline: '2025-01-01',
    status: 'partial',
    requirements: [
      'Appoint health and safety representative',
      'Conduct risk assessments',
      'Maintain incident register',
      'Provide PPE',
      'Safety signage present'
    ]
  },
  {
    id: 'fcd-1',
    act_name: 'Foodstuffs, Cosmetics and Disinfectants Act',
    act_number: '54 of 1972',
    category: 'Food Safety',
    compliance_deadline: '2025-06-01',
    status: 'partial',
    requirements: [
      'Food labelling compliance',
      'Product registration where required',
      'Batch traceability system',
      'Microbiological standards met'
    ]
  },
  {
    id: 'cpa-1',
    act_name: 'Consumer Protection Act',
    act_number: '68 of 2008',
    category: 'Consumer Rights',
    compliance_deadline: '2025-03-15',
    status: 'partial',
    requirements: [
      'Product labeling compliant',
      'Warranty documentation',
      'Recall procedures in place',
      'Consumer complaint process'
    ]
  },
  {
    id: 'nema-1',
    act_name: 'National Environmental Management Act',
    act_number: '107 of 1998',
    category: 'Environmental',
    compliance_deadline: '2025-09-30',
    status: 'non_compliant',
    requirements: [
      'Waste management plan',
      'Environmental impact assessment',
      'Effluent treatment records'
    ]
  },
  {
    id: 'r638',
    act_name: 'Regulations Governing General Hygiene Requirements for Food Premises',
    act_number: 'R.638 of 2018',
    category: 'Food Safety',
    compliance_deadline: '2025-04-01',
    status: 'partial',
    requirements: [
      'Premises hygiene compliance',
      'Personal hygiene standards',
      'Cleaning schedule maintained',
      'Pest control program active'
    ]
  },
  {
    id: 'sans-10049',
    act_name: 'SANS 10049 - Food Safety Management',
    act_number: 'SANS 10049:2020',
    category: 'Food Safety',
    compliance_deadline: '2025-12-01',
    status: 'non_compliant',
    requirements: [
      'HACCP system implemented',
      'Prerequisite programs',
      'Management review conducted',
      'Internal audits completed'
    ]
  }
];

export const getLegalRegistersByCategory = (category: string) => {
  return SA_LEGAL_REGISTERS.filter(reg => reg.category === category);
};

export const getComplianceStats = () => {
  const total = SA_LEGAL_REGISTERS.length;
  const compliant = SA_LEGAL_REGISTERS.filter(r => r.status === 'compliant').length;
  const partial = SA_LEGAL_REGISTERS.filter(r => r.status === 'partial').length;
  const nonCompliant = SA_LEGAL_REGISTERS.filter(r => r.status === 'non_compliant').length;
  
  return {
    total,
    compliant,
    partial,
    nonCompliant,
    complianceRate: Math.round((compliant / total) * 100)
  };
};
