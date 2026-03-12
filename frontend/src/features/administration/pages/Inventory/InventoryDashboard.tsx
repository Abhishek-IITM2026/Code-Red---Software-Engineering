import { useState, useEffect } from 'react';
import { FiPlus, FiEdit2, FiTrash2, FiPackage, FiAlertTriangle, FiTrendingUp, FiTrendingDown, FiX, FiCheck } from 'react-icons/fi';
import { Card, Button, Input, Select } from '../../../../components/common';
import inventoryApi from '../../api/inventoryApi';
import type { InventoryItem } from '../../types/inventory';
import { inventoryCategories } from '../../types/inventory';

const InventoryDashboard = () => {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');

  const [newItem, setNewItem] = useState({
    name: '',
    category: 'stationery' as InventoryItem['category'],
    quantity: 0,
    unit: 'piece',
    minStock: 10,
    price: 0,
    supplier: '',
    location: '',
    description: '',
  });

  useEffect(() => {
    loadItems();
  }, []);

  const loadItems = async () => {
    setLoading(true);
    const data = await inventoryApi.getItems();
    setItems(data);
    setLoading(false);
  };

  const handleAddItem = async () => {
    if (!newItem.name) return;
    
    await inventoryApi.addItem({
      ...newItem,
      available: newItem.quantity,
      reserved: 0,
    });
    
    setShowAddModal(false);
    setNewItem({
      name: '',
      category: 'stationery',
      quantity: 0,
      unit: 'piece',
      minStock: 10,
      price: 0,
      supplier: '',
      location: '',
      description: '',
    });
    loadItems();
  };

  const handleDeleteItem = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this item?')) {
      await inventoryApi.deleteItem(id);
      loadItems();
    }
  };

  const filteredItems = items.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !categoryFilter || item.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const totalValue = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const lowStockItems = items.filter(item => item.available <= item.minStock);

  const categoryStats = inventoryCategories.map(cat => ({
    ...cat,
    count: items.filter(item => item.category === cat.id).length,
  })).filter(cat => cat.count > 0);

  const categoryOptions = [
    { value: '', label: 'All Categories' },
    ...inventoryCategories.map(c => ({ value: c.id, label: c.name }))
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--primary)]"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-[var(--text-secondary)]">Total Items</p>
              <p className="text-2xl font-bold text-[var(--text)]">{items.length}</p>
            </div>
            <FiPackage className="w-8 h-8 text-[var(--primary)]" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-[var(--text-secondary)]">Total Value</p>
              <p className="text-2xl font-bold text-[var(--text)]">Rs.{totalValue.toLocaleString()}</p>
            </div>
            <FiTrendingUp className="w-8 h-8 text-[var(--success)]" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-[var(--text-secondary)]">Low Stock</p>
              <p className="text-2xl font-bold text-[var(--error)]">{lowStockItems.length}</p>
            </div>
            <FiAlertTriangle className="w-8 h-8 text-[var(--warning)]" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-[var(--text-secondary)]">Categories</p>
              <p className="text-2xl font-bold text-[var(--text)]">{categoryStats.length}</p>
            </div>
            <FiTrendingDown className="w-8 h-8 text-[var(--primary)]" />
          </div>
        </Card>
      </div>

      {/* Category Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {categoryStats.map(cat => (
          <Card 
            key={cat.id} 
            className="p-4 cursor-pointer hover:shadow-lg transition"
            onClick={() => setCategoryFilter(categoryFilter === cat.id ? '' : cat.id)}
          >
            <div className="flex items-center gap-3">
              <div 
                className="w-10 h-10 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: cat.color + '20' }}
              >
                <FiPackage className="w-5 h-5" style={{ color: cat.color }} />
              </div>
              <div>
                <p className="font-medium text-[var(--text)]">{cat.name}</p>
                <p className="text-sm text-[var(--text-secondary)]">{cat.count} items</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Filters and Actions */}
      <Card className="p-4">
        <div className="flex flex-col md:flex-row gap-4 justify-between">
          <div className="flex gap-4 flex-1">
            <div className="flex-1">
              <Input
                placeholder="Search items..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="w-48">
              <Select
                options={categoryOptions}
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
              />
            </div>
          </div>
          <Button 
            icon={<FiPlus className="w-4 h-4" />}
            onClick={() => setShowAddModal(true)}
          >
            Add Item
          </Button>
        </div>
      </Card>

      {/* Inventory Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[var(--secondary)]">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-[var(--text-secondary)]">Item</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-[var(--text-secondary)]">Category</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-[var(--text-secondary)]">Quantity</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-[var(--text-secondary)]">Available</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-[var(--text-secondary)]">Reserved</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-[var(--text-secondary)]">Unit Price</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-[var(--text-secondary)]">Location</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-[var(--text-secondary)]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {filteredItems.map(item => (
                <tr key={item.id} className="hover:bg-[var(--secondary)]/50 transition">
                  <td className="px-4 py-3">
                    <div>
                      <p className="font-medium text-[var(--text)]">{item.name}</p>
                      {item.supplier && <p className="text-xs text-[var(--text-secondary)]">{item.supplier}</p>}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span 
                      className="px-2 py-1 rounded-full text-xs font-medium"
                      style={{ 
                        backgroundColor: inventoryCategories.find(c => c.id === item.category)?.color + '20',
                        color: inventoryCategories.find(c => c.id === item.category)?.color 
                      }}
                    >
                      {inventoryCategories.find(c => c.id === item.category)?.name}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-[var(--text)]">{item.quantity} {item.unit}</td>
                  <td className="px-4 py-3">
                    <span className={item.available <= item.minStock ? 'text-[var(--error)] font-medium' : 'text-[var(--text)]'}>
                      {item.available} {item.unit}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-[var(--text)]">{item.reserved} {item.unit}</td>
                  <td className="px-4 py-3 text-[var(--text)]">Rs.{item.price}</td>
                  <td className="px-4 py-3 text-[var(--text-secondary)]">{item.location || '-'}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button 
                        onClick={() => setEditingItem(item)}
                        className="p-1.5 rounded-lg hover:bg-[var(--secondary)] text-[var(--text-secondary)] hover:text-[var(--primary)] transition"
                      >
                        <FiEdit2 className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleDeleteItem(item.id)}
                        className="p-1.5 rounded-lg hover:bg-red-50 text-[var(--text-secondary)] hover:text-[var(--error)] transition"
                      >
                        <FiTrash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Add Item Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-[var(--card-bg)] rounded-2xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b border-[var(--border)]">
              <h2 className="text-lg font-semibold text-[var(--text)]">Add New Item</h2>
              <button onClick={() => setShowAddModal(false)} className="p-2 hover:bg-[var(--secondary)] rounded-lg">
                <FiX className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <Input
                label="Item Name"
                value={newItem.name}
                onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                placeholder="Enter item name"
              />
              <Select
                label="Category"
                options={inventoryCategories.map(c => ({ value: c.id, label: c.name }))}
                value={newItem.category}
                onChange={(e) => setNewItem({ ...newItem, category: e.target.value as InventoryItem['category'] })}
              />
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Quantity"
                  type="number"
                  value={newItem.quantity}
                  onChange={(e) => setNewItem({ ...newItem, quantity: parseInt(e.target.value) || 0 })}
                  placeholder="0"
                />
                <Input
                  label="Unit"
                  value={newItem.unit}
                  onChange={(e) => setNewItem({ ...newItem, unit: e.target.value })}
                  placeholder="piece"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Min Stock Level"
                  type="number"
                  value={newItem.minStock}
                  onChange={(e) => setNewItem({ ...newItem, minStock: parseInt(e.target.value) || 0 })}
                  placeholder="10"
                />
                <Input
                  label="Unit Price (Rs.)"
                  type="number"
                  value={newItem.price}
                  onChange={(e) => setNewItem({ ...newItem, price: parseInt(e.target.value) || 0 })}
                  placeholder="0"
                />
              </div>
              <Input
                label="Supplier"
                value={newItem.supplier}
                onChange={(e) => setNewItem({ ...newItem, supplier: e.target.value })}
                placeholder="Optional supplier name"
              />
              <Input
                label="Location"
                value={newItem.location}
                onChange={(e) => setNewItem({ ...newItem, location: e.target.value })}
                placeholder="e.g., Store Room A"
              />
              <Input
                label="Description"
                value={newItem.description}
                onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
                placeholder="Optional description"
              />
            </div>
            <div className="flex gap-3 p-4 border-t border-[var(--border)]">
              <Button variant="secondary" onClick={() => setShowAddModal(false)} className="flex-1">Cancel</Button>
              <Button onClick={handleAddItem} className="flex-1">Add Item</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InventoryDashboard;