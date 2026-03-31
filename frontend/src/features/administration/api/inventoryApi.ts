import type { InventoryItem, StockTransaction, MaterialRequest } from '../types/inventory';

// Mock Inventory Items
export const mockInventoryItems: InventoryItem[] = [
  { id: '1', name: 'White Board Marker', category: 'stationery', quantity: 150, available: 120, reserved: 30, unit: 'piece', minStock: 20, price: 25, supplier: 'Stationery Co', location: 'Store Room A', createdAt: '2024-01-01', updatedAt: '2024-01-15' },
  { id: '2', name: 'Permanent Marker', category: 'stationery', quantity: 80, available: 65, reserved: 15, unit: 'piece', minStock: 15, price: 35, supplier: 'Stationery Co', location: 'Store Room A', createdAt: '2024-01-01', updatedAt: '2024-01-15' },
  { id: '3', name: 'Ball Pen (Blue)', category: 'stationery', quantity: 500, available: 420, reserved: 80, unit: 'piece', minStock: 50, price: 10, supplier: 'Stationery Co', location: 'Store Room A', createdAt: '2024-01-01', updatedAt: '2024-01-15' },
  { id: '4', name: 'Ball Pen (Black)', category: 'stationery', quantity: 400, available: 350, reserved: 50, unit: 'piece', minStock: 50, price: 10, supplier: 'Stationery Co', location: 'Store Room A', createdAt: '2024-01-01', updatedAt: '2024-01-15' },
  { id: '5', name: 'A4 Paper Ream', category: 'stationery', quantity: 200, available: 180, reserved: 20, unit: 'ream', minStock: 30, price: 350, supplier: 'Paper Mart', location: 'Store Room B', createdAt: '2024-01-01', updatedAt: '2024-01-15' },
  { id: '6', name: 'Notebook (A4)', category: 'stationery', quantity: 100, available: 85, reserved: 15, unit: 'piece', minStock: 20, price: 50, supplier: 'Stationery Co', location: 'Store Room A', createdAt: '2024-01-01', updatedAt: '2024-01-15' },
  { id: '7', name: 'Projector', category: 'electronics', quantity: 10, available: 8, reserved: 2, unit: 'piece', minStock: 2, price: 15000, supplier: 'Tech Solutions', location: 'Equipment Room', createdAt: '2024-01-01', updatedAt: '2024-01-15' },
  { id: '8', name: 'Laptop', category: 'electronics', quantity: 25, available: 20, reserved: 5, unit: 'piece', minStock: 5, price: 45000, supplier: 'Tech Solutions', location: 'Equipment Room', createdAt: '2024-01-01', updatedAt: '2024-01-15' },
  { id: '9', name: 'USB Drive 16GB', category: 'electronics', quantity: 30, available: 25, reserved: 5, unit: 'piece', minStock: 10, price: 500, supplier: 'Tech Solutions', location: 'Equipment Room', createdAt: '2024-01-01', updatedAt: '2024-01-15' },
  { id: '10', name: 'Desk Chair', category: 'furniture', quantity: 50, available: 45, reserved: 5, unit: 'piece', minStock: 10, price: 2500, supplier: 'Furniture House', location: 'Furniture Store', createdAt: '2024-01-01', updatedAt: '2024-01-15' },
  { id: '11', name: 'Student Desk', category: 'furniture', quantity: 100, available: 90, reserved: 10, unit: 'piece', minStock: 20, price: 3500, supplier: 'Furniture House', location: 'Furniture Store', createdAt: '2024-01-01', updatedAt: '2024-01-15' },
  { id: '12', name: 'Whiteboard Eraser', category: 'stationery', quantity: 40, available: 35, reserved: 5, unit: 'piece', minStock: 10, price: 45, supplier: 'Stationery Co', location: 'Store Room A', createdAt: '2024-01-01', updatedAt: '2024-01-15' },
  { id: '13', name: 'Dustbin', category: 'cleaning', quantity: 30, available: 28, reserved: 2, unit: 'piece', minStock: 5, price: 150, supplier: 'Clean Supply', location: 'Cleaning Store', createdAt: '2024-01-01', updatedAt: '2024-01-15' },
  { id: '14', name: 'Floor Cleaner', category: 'cleaning', quantity: 20, available: 18, reserved: 2, unit: 'liter', minStock: 5, price: 200, supplier: 'Clean Supply', location: 'Cleaning Store', createdAt: '2024-01-01', updatedAt: '2024-01-15' },
  { id: '15', name: 'Chalk Box', category: 'stationery', quantity: 50, available: 45, reserved: 5, unit: 'box', minStock: 10, price: 30, supplier: 'Stationery Co', location: 'Store Room A', createdAt: '2024-01-01', updatedAt: '2024-01-15' },
];

// Mock Stock Transactions
export const mockTransactions: StockTransaction[] = [
  { id: '1', itemId: '1', itemName: 'White Board Marker', type: 'in', quantity: 50, reason: 'Purchase Order', performedBy: 'Admin', createdAt: '2024-01-10' },
  { id: '2', itemId: '5', itemName: 'A4 Paper Ream', type: 'in', quantity: 100, reason: 'Purchase Order', performedBy: 'Admin', createdAt: '2024-01-12' },
  { id: '3', itemId: '1', itemName: 'White Board Marker', type: 'out', quantity: 10, reason: 'Faculty Request', performedBy: 'Admin', createdAt: '2024-01-14' },
  { id: '4', itemId: '3', itemName: 'Ball Pen (Blue)', type: 'out', quantity: 20, reason: 'Student Distribution', performedBy: 'Admin', createdAt: '2024-01-15' },
];

// Mock Material Requests
export const mockMaterialRequests: MaterialRequest[] = [
  { id: '1', facultyId: '2', facultyName: 'Jane Smith', department: 'Mathematics', items: [{ itemId: '1', itemName: 'White Board Marker', quantity: 5 }, { itemId: '12', itemName: 'Whiteboard Eraser', quantity: 2 }], status: 'pending', requestedAt: '2024-01-15T10:30:00', updatedAt: '2024-01-15T10:30:00' },
  { id: '2', facultyId: '2', facultyName: 'Jane Smith', department: 'Mathematics', items: [{ itemId: '5', itemName: 'A4 Paper Ream', quantity: 2 }, { itemId: '6', itemName: 'Notebook (A4)', quantity: 10 }], status: 'approved', requestedAt: '2024-01-14T09:00:00', updatedAt: '2024-01-14T14:00:00', reviewedBy: 'Admin User' },
  { id: '3', facultyId: '3', facultyName: 'Dr. Johnson', department: 'Physics', items: [{ itemId: '7', itemName: 'Projector', quantity: 1 }], status: 'pending', requestedAt: '2024-01-16T08:00:00', updatedAt: '2024-01-16T08:00:00' },
  { id: '4', facultyId: '2', facultyName: 'Jane Smith', department: 'Mathematics', items: [{ itemId: '15', itemName: 'Chalk Box', quantity: 5 }], status: 'fulfilled', requestedAt: '2024-01-10T11:00:00', updatedAt: '2024-01-11T15:00:00', reviewedBy: 'Admin User' },
];

// Inventory API
export const inventoryApi = {
  getItems: async (): Promise<InventoryItem[]> => {
    return mockInventoryItems;
  },

  getItem: async (id: string): Promise<InventoryItem | undefined> => {
    return mockInventoryItems.find(item => item.id === id);
  },

  addItem: async (item: Omit<InventoryItem, 'id' | 'createdAt' | 'updatedAt'>): Promise<InventoryItem> => {
    const newItem: InventoryItem = {
      ...item,
      id: String(mockInventoryItems.length + 1),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    mockInventoryItems.push(newItem);
    return newItem;
  },

  updateItem: async (id: string, updates: Partial<InventoryItem>): Promise<InventoryItem | undefined> => {
    const index = mockInventoryItems.findIndex(item => item.id === id);
    if (index !== -1) {
      mockInventoryItems[index] = { ...mockInventoryItems[index], ...updates, updatedAt: new Date().toISOString() };
      return mockInventoryItems[index];
    }
    return undefined;
  },

  deleteItem: async (id: string): Promise<boolean> => {
    const index = mockInventoryItems.findIndex(item => item.id === id);
    if (index !== -1) {
      mockInventoryItems.splice(index, 1);
      return true;
    }
    return false;
  },

  getTransactions: async (): Promise<StockTransaction[]> => {
    return mockTransactions;
  },

  addTransaction: async (transaction: Omit<StockTransaction, 'id' | 'createdAt'>): Promise<StockTransaction> => {
    const newTransaction: StockTransaction = {
      ...transaction,
      id: String(mockTransactions.length + 1),
      createdAt: new Date().toISOString(),
    };
    mockTransactions.push(newTransaction);
    
    const item = mockInventoryItems.find(i => i.id === transaction.itemId);
    if (item) {
      if (transaction.type === 'in') {
        item.quantity += transaction.quantity;
        item.available += transaction.quantity;
      } else if (transaction.type === 'out') {
        item.quantity = Math.max(0, item.quantity - transaction.quantity);
        item.available = Math.max(0, item.available - transaction.quantity);
      }
      item.updatedAt = new Date().toISOString();
    }
    
    return newTransaction;
  },

  getRequests: async (): Promise<MaterialRequest[]> => {
    return mockMaterialRequests;
  },

  updateRequestStatus: async (id: string, status: MaterialRequest['status'], reviewNotes?: string): Promise<MaterialRequest | undefined> => {
    const index = mockMaterialRequests.findIndex(r => r.id === id);
    if (index !== -1) {
      mockMaterialRequests[index] = {
        ...mockMaterialRequests[index],
        status,
        reviewNotes,
        reviewedBy: 'Admin User',
        updatedAt: new Date().toISOString(),
      };
      return mockMaterialRequests[index];
    }
    return undefined;
  },

  createRequest: async (request: Omit<MaterialRequest, 'id' | 'status' | 'requestedAt' | 'updatedAt'>): Promise<MaterialRequest> => {
    const newRequest: MaterialRequest = {
      ...request,
      id: String(mockMaterialRequests.length + 1),
      status: 'pending',
      requestedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    mockMaterialRequests.push(newRequest);
    return newRequest;
  },
};

export default inventoryApi;
