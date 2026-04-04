import api from "../../../services/api/axios";
import type { InventoryItem, StockTransaction, MaterialRequest, RequestItem } from "../types/inventory";

type InventoryItemWrite = Omit<InventoryItem, "id" | "createdAt" | "updatedAt">;
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
};

export default inventoryApi;
