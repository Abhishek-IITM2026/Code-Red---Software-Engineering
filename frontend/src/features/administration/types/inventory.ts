// Inventory Types
export interface InventoryItem {
  id: string;
  name: string;
  category: 'stationery' | 'electronics' | 'furniture' | 'cleaning' | 'laboratory' | 'other';
  quantity: number;
  available: number;
  reserved: number;
  unit: string;
  minStock: number;
  price: number;
  supplier?: string;
  location?: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface InventoryCategory {
  id: string;
  name: string;
  color: string;
  icon: string;
}

export interface StockTransaction {
  id: string;
  itemId: string;
  itemName: string;
  type: 'in' | 'out' | 'adjustment';
  quantity: number;
  reason: string;
  performedBy: string;
  notes?: string;
  createdAt: string;
}

export interface MaterialRequest {
  id: string;
  facultyId: string;
  facultyName: string;
  department: string;
  items: RequestItem[];
  status: 'pending' | 'approved' | 'rejected' | 'fulfilled';
  requestedAt: string;
  updatedAt: string;
  reviewedBy?: string;
  reviewNotes?: string;
}

export interface RequestItem {
  itemId: string;
  itemName: string;
  quantity: number;
  notes?: string;
}

export interface MaterialRequestForm {
  items: RequestItem[];
  notes?: string;
}

export const inventoryCategories = [
  { id: 'stationery', name: 'Stationery', color: '#3b82f6' },
  { id: 'electronics', name: 'Electronics', color: '#8b5cf6' },
  { id: 'furniture', name: 'Furniture', color: '#f59e0b' },
  { id: 'cleaning', name: 'Cleaning', color: '#10b981' },
  { id: 'laboratory', name: 'Laboratory', color: '#ef4444' },
  { id: 'other', name: 'Other', color: '#6b7280' },
];
