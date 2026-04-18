import api from "../../../services/api/axios";
import type { InventoryItem, InventoryProcurement, MaterialRequest, RequestItem, StockTransaction, Vendor } from "../types/inventory";

type InventoryItemWrite = Omit<InventoryItem, "id" | "createdAt" | "updatedAt">;
type VendorWrite = Omit<Vendor, "id" | "createdAt" | "updatedAt">;
type ProcurementWrite = Omit<
  InventoryProcurement,
  "id" | "createdAt" | "updatedAt" | "inventoryItemName" | "vendorName" | "createdBy" | "totalAmount"
>;
type MaterialRequestCreate = {
  facultyId?: string;
  facultyName?: string;
  department: string;
  items: RequestItem[];
};

const inventoryApi = {
  async getItems(): Promise<InventoryItem[]> {
    const response = await api.get<InventoryItem[]>("/inventory/items");
    return response.data;
  },

  async getItem(id: string): Promise<InventoryItem | undefined> {
    const items = await this.getItems();
    return items.find((item) => item.id === id);
  },

  async addItem(item: InventoryItemWrite): Promise<InventoryItem> {
    const response = await api.post<InventoryItem>("/inventory/items", item);
    return response.data;
  },

  async updateItem(id: string, updates: Partial<InventoryItem>): Promise<InventoryItem | undefined> {
    const response = await api.put<InventoryItem>(`/inventory/items/${id}`, updates);
    return response.data;
  },

  async deleteItem(id: string): Promise<boolean> {
    await api.delete(`/inventory/items/${id}`);
    return true;
  },

  async getTransactions(): Promise<StockTransaction[]> {
    return [];
  },

  async addTransaction(_transaction: Omit<StockTransaction, "id" | "createdAt">): Promise<StockTransaction> {
    throw new Error("Stock transactions are not exposed by the backend yet.");
  },

  async getRequests(): Promise<MaterialRequest[]> {
    const response = await api.get<MaterialRequest[]>("/inventory/requests");
    return response.data;
  },

  async updateRequestStatus(
    id: string,
    status: MaterialRequest["status"],
    reviewNotes?: string
  ): Promise<MaterialRequest | undefined> {
    const response = await api.patch<MaterialRequest>(`/inventory/requests/${id}/status`, {
      status,
      reviewNotes,
    });
    return response.data;
  },

  async createRequest(request: MaterialRequestCreate): Promise<MaterialRequest> {
    const response = await api.post<MaterialRequest>("/inventory/requests", {
      facultyId: request.facultyId ? Number(request.facultyId) : undefined,
      department: request.department,
      items: request.items.map((item) => ({
        itemId: Number(item.itemId),
        quantity: item.quantity,
        notes: item.notes,
      })),
    });
    return response.data;
  },

  async getVendors(): Promise<Vendor[]> {
    const response = await api.get<Vendor[]>("/inventory/vendors");
    return response.data;
  },

  async addVendor(vendor: VendorWrite): Promise<Vendor> {
    const response = await api.post<Vendor>("/inventory/vendors", vendor);
    return response.data;
  },

  async getProcurements(): Promise<InventoryProcurement[]> {
    const response = await api.get<InventoryProcurement[]>("/inventory/procurements");
    return response.data;
  },

  async addProcurement(procurement: ProcurementWrite): Promise<InventoryProcurement> {
    const response = await api.post<InventoryProcurement>("/inventory/procurements", procurement);
    return response.data;
  },
};

export default inventoryApi;
