import { useState, useEffect } from 'react';
import { FiPlus, FiTrash2, FiClock, FiCheck, FiX, FiPackage, FiShoppingCart } from 'react-icons/fi';
import { useSelector } from 'react-redux';
import { Card, Button, Input, Select } from '../../../components/common';
import inventoryApi from '../../administration/api/inventoryApi';
import type { InventoryItem, MaterialRequest, RequestItem } from '../../administration/types/inventory';
import { inventoryCategories } from '../../administration/types/inventory';
import type { RootState } from '../../../app/store';

const RequestMaterials = () => {
  const user = useSelector((state: RootState) => state.auth.user);
  const [availableItems, setAvailableItems] = useState<InventoryItem[]>([]);
  const [myRequests, setMyRequests] = useState<MaterialRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [selectedItems, setSelectedItems] = useState<RequestItem[]>([]);
  const [notes, setNotes] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const [items, requests] = await Promise.all([
      inventoryApi.getItems(),
      inventoryApi.getRequests(),
    ]);
    setAvailableItems(items);
    const currentUserName = `${user?.firstName || ''} ${user?.lastName || ''}`.trim().toLowerCase();
    setMyRequests(
      requests.filter((request) => request.facultyName.trim().toLowerCase() === currentUserName)
    );
    setLoading(false);
  };

  const handleAddItem = (item: InventoryItem) => {
    const existing = selectedItems.find(i => i.itemId === item.id);
    if (existing) {
      setSelectedItems(selectedItems.map(i => 
        i.itemId === item.id ? { ...i, quantity: i.quantity + 1 } : i
      ));
    } else {
      setSelectedItems([...selectedItems, {
        itemId: item.id,
        itemName: item.name,
        quantity: 1,
      }]);
    }
  };

  const handleUpdateQuantity = (itemId: string, quantity: number) => {
    if (quantity <= 0) {
      setSelectedItems(selectedItems.filter(i => i.itemId !== itemId));
    } else {
      setSelectedItems(selectedItems.map(i => 
        i.itemId === itemId ? { ...i, quantity } : i
      ));
    }
  };

  const handleRemoveItem = (itemId: string) => {
    setSelectedItems(selectedItems.filter(i => i.itemId !== itemId));
  };

  const handleSubmitRequest = async () => {
    if (selectedItems.length === 0) return;
    
    await inventoryApi.createRequest({
      facultyName: `${user?.firstName} ${user?.lastName}`,
      department: 'Mathematics',
      items: selectedItems,
    });
    
    setShowRequestModal(false);
    setSelectedItems([]);
    setNotes('');
    loadData();
  };

  const filteredItems = availableItems.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !categoryFilter || item.category === categoryFilter;
    return matchesSearch && matchesCategory && item.available > 0;
  });

  const getStatusBadge = (status: MaterialRequest['status']) => {
    const styles = {
      pending: { bg: 'bg-yellow-100', text: 'text-yellow-800' },
      approved: { bg: 'bg-blue-100', text: 'text-blue-800' },
      rejected: { bg: 'bg-red-100', text: 'text-red-800' },
      fulfilled: { bg: 'bg-green-100', text: 'text-green-800' },
    };
    const style = styles[status];
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${style.bg} ${style.text}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const pendingRequests = myRequests.filter(r => r.status === 'pending').length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--primary)]"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text)]">Request Materials</h1>
          <p className="text-[var(--text-secondary)]">Request stationery and supplies for your teaching needs</p>
        </div>
        <Button 
          icon={<FiShoppingCart className="w-4 h-4" />}
          onClick={() => setShowRequestModal(true)}
        >
          New Request
        </Button>
      </div>

      {/* Pending Requests Alert */}
      {pendingRequests > 0 && (
        <Card className="p-4 bg-yellow-50 border-yellow-200">
          <div className="flex items-center gap-3">
            <FiClock className="w-5 h-5 text-yellow-600" />
            <p className="text-yellow-800">You have {pendingRequests} pending request(s) awaiting approval</p>
          </div>
        </Card>
      )}

      {/* My Requests */}
      <Card>
        <h2 className="text-lg font-semibold text-[var(--text)] mb-4">My Request History</h2>
        {myRequests.length === 0 ? (
          <div className="text-center py-8">
            <FiPackage className="w-12 h-12 text-[var(--text-secondary)] mx-auto mb-4" />
            <p className="text-[var(--text-secondary)]">No requests yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {myRequests.map(request => (
              <div key={request.id} className="p-4 border border-[var(--border)] rounded-xl">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-[var(--text-secondary)]">
                    {new Date(request.requestedAt).toLocaleDateString()} at {new Date(request.requestedAt).toLocaleTimeString()}
                  </span>
                  {getStatusBadge(request.status)}
                </div>
                <div className="space-y-1">
                  {request.items.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-sm">
                      <FiPackage className="w-4 h-4 text-[var(--text-secondary)]" />
                      <span className="text-[var(--text)]">{item.itemName}</span>
                      <span className="text-[var(--text-secondary)]">x{item.quantity}</span>
                    </div>
                  ))}
                </div>
                {request.reviewNotes && (
                  <p className="mt-2 text-sm text-[var(--text-secondary)] italic">
                    Admin note: {request.reviewNotes}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Available Items Preview */}
      <Card>
        <h2 className="text-lg font-semibold text-[var(--text)] mb-4">Available Items</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {availableItems.filter(i => i.available > 0).slice(0, 12).map(item => (
            <div 
              key={item.id} 
              className="p-3 border border-[var(--border)] rounded-xl hover:border-[var(--primary)] transition cursor-pointer"
              onClick={() => handleAddItem(item)}
            >
              <p className="font-medium text-[var(--text)] text-sm truncate">{item.name}</p>
              <p className="text-xs text-[var(--text-secondary)]">{item.available} available</p>
            </div>
          ))}
        </div>
      </Card>

      {/* Request Modal */}
      {showRequestModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 p-4">
          <div className="flex min-h-full items-start justify-center py-2 sm:items-center sm:py-6">
          <div className="bg-[var(--card-bg)] rounded-2xl w-full max-w-2xl max-h-[calc(100vh-2rem)] sm:max-h-[calc(100vh-3rem)] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-[var(--border)]">
              <h2 className="text-lg font-semibold text-[var(--text)]">New Material Request</h2>
              <button onClick={() => setShowRequestModal(false)} className="p-2 hover:bg-[var(--secondary)] rounded-lg">
                <FiX className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {/* Selected Items */}
              {selectedItems.length > 0 && (
                <div className="p-4 bg-[var(--secondary)] rounded-xl">
                  <h3 className="font-medium text-[var(--text)] mb-3">Selected Items:</h3>
                  <div className="space-y-2">
                    {selectedItems.map(item => (
                      <div key={item.itemId} className="flex items-center justify-between">
                        <span className="text-[var(--text)]">{item.itemName}</span>
                        <div className="flex items-center gap-2">
                          <button 
                            onClick={() => handleUpdateQuantity(item.itemId, item.quantity - 1)}
                            className="w-8 h-8 rounded-lg bg-[var(--card-bg)] border border-[var(--border)] flex items-center justify-center"
                          >
                            -
                          </button>
                          <span className="w-8 text-center text-[var(--text)]">{item.quantity}</span>
                          <button 
                            onClick={() => handleUpdateQuantity(item.itemId, item.quantity + 1)}
                            className="w-8 h-8 rounded-lg bg-[var(--card-bg)] border border-[var(--border)] flex items-center justify-center"
                          >
                            +
                          </button>
                          <button 
                            onClick={() => handleRemoveItem(item.itemId)}
                            className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                          >
                            <FiTrash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Available Items */}
              <div>
                <h3 className="font-medium text-[var(--text)] mb-3">Available Items</h3>
                <div className="flex gap-3 mb-4">
                  <Input
                    placeholder="Search items..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="flex-1"
                  />
                  <Select
                    options={[
                      { value: '', label: 'All Categories' },
                      ...inventoryCategories.map(c => ({ value: c.id, label: c.name }))
                    ]}
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    className="w-40"
                  />
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-64 overflow-y-auto">
                  {filteredItems.map(item => (
                    <button
                      key={item.id}
                      onClick={() => handleAddItem(item)}
                      className="p-3 text-left border border-[var(--border)] rounded-lg hover:border-[var(--primary)] hover:bg-[var(--primary)]/5 transition"
                    >
                      <p className="font-medium text-[var(--text)] text-sm">{item.name}</p>
                      <p className="text-xs text-[var(--text-secondary)]">{item.available} {item.unit} available</p>
                    </button>
                  ))}
                </div>
              </div>

              <Input
                label="Notes (Optional)"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add any special requirements or notes..."
              />
            </div>

            <div className="flex gap-3 p-4 border-t border-[var(--border)]">
              <Button variant="secondary" onClick={() => setShowRequestModal(false)} className="flex-1">
                Cancel
              </Button>
              <Button 
                onClick={handleSubmitRequest} 
                disabled={selectedItems.length === 0}
                className="flex-1"
              >
                Submit Request ({selectedItems.length} items)
              </Button>
            </div>
          </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RequestMaterials;
