// Project/Property types for Construction & Real Estate industry

export interface Project {
  id: string;
  name: string;
  type: 'construction' | 'property' | 'renovation' | 'development';
  address?: string;
  client?: string;
  status: 'active' | 'completed' | 'on-hold';
  budget?: number;
  startDate?: string;
  endDate?: string;
}

export interface InvoiceWithProject {
  invoiceId: string;
  projectId: string;
  projectName: string;
  vendorName: string;
  invoiceDate: string;
  totalAmount: string;
  status: 'pending' | 'approved' | 'rejected';
  uploadedAt: string;
}

// Mock projects data - will be replaced with database in Phase 2
export const mockProjects: Project[] = [
  {
    id: 'proj-001',
    name: 'Riverside Commercial Plaza',
    type: 'construction',
    address: '450 Riverside Drive, Toronto, ON',
    client: 'Riverside Development Corp',
    status: 'active',
    budget: 12500000,
    startDate: '2025-06-01',
    endDate: '2026-12-31',
  },
  {
    id: 'proj-002',
    name: 'Oakwood Residential Complex',
    type: 'development',
    address: '123 Oakwood Avenue, Mississauga, ON',
    client: 'Oakwood Living Inc',
    status: 'active',
    budget: 8750000,
    startDate: '2025-09-15',
    endDate: '2027-03-01',
  },
  {
    id: 'proj-003',
    name: 'Heritage Building Renovation',
    type: 'renovation',
    address: '88 King Street West, Toronto, ON',
    client: 'Heritage Properties Ltd',
    status: 'active',
    budget: 3200000,
    startDate: '2025-11-01',
    endDate: '2026-08-15',
  },
  {
    id: 'proj-004',
    name: 'Lakeview Condos - Tower A',
    type: 'construction',
    address: '200 Lakeshore Blvd, Toronto, ON',
    client: 'Lakeview Developments',
    status: 'active',
    budget: 45000000,
    startDate: '2025-03-01',
    endDate: '2028-06-30',
  },
  {
    id: 'proj-005',
    name: 'Maple Street Property Management',
    type: 'property',
    address: '55-75 Maple Street, Brampton, ON',
    client: 'Maple Property Holdings',
    status: 'active',
    budget: 150000,
    startDate: '2025-01-01',
  },
  {
    id: 'proj-006',
    name: 'Downtown Office Tower Retrofit',
    type: 'renovation',
    address: '100 Bay Street, Toronto, ON',
    client: 'Bay Street Investments',
    status: 'on-hold',
    budget: 5800000,
    startDate: '2026-01-15',
    endDate: '2026-11-30',
  },
];

// Project type display labels
export const projectTypeLabels: Record<Project['type'], string> = {
  construction: 'New Construction',
  property: 'Property Management',
  renovation: 'Renovation',
  development: 'Development',
};

// Project type colors for UI
export const projectTypeColors: Record<Project['type'], string> = {
  construction: 'bg-blue-100 text-blue-700',
  property: 'bg-green-100 text-green-700',
  renovation: 'bg-orange-100 text-orange-700',
  development: 'bg-purple-100 text-purple-700',
};

// Format currency for display
export const formatBudget = (amount: number): string => {
  return new Intl.NumberFormat('en-CA', {
    style: 'currency',
    currency: 'CAD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};
