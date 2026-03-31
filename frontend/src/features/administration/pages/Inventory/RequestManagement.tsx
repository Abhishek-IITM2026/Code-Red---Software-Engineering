import { useState, useEffect } from 'react';
import { FiCheck, FiX, FiClock, FiPackage, FiAlertCircle } from 'react-icons/fi';
import { Card, Button, Input } from '../../../../components/common';
import inventoryApi from '../../api/inventoryApi';
import type { MaterialRequest } from '../../types/inventory';

const RequestManagement = () => {
  const [requests, setRequests] = useState<MaterialRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<MaterialRequest | null>(null);
  const [reviewNotes, setReviewNotes] = useState('');
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected' | 'fulfilled'>('all');

  useEffect(() => {
    loadRequests();
  }, []);

  const loadRequests = async () => {
    setLoading(true);
    const data = await inventoryApi.getRequests();
    setRequests(data);
    setLoading(false);
  };

  const handleUpdateStatus = async (id: string, status: MaterialRequest['status']) => {
    await inventoryApi.updateRequestStatus(id, status, reviewNotes);
    setSelectedRequest(null);
    setReviewNotes('');
    loadRequests();
  };

  const filteredRequests = requests.filter(r => {
    if (filter === 'all') return true;
    return r.status === filter;
  });

  const pendingCount = requests.filter(r => r.status === 'pending').length;
  const approvedCount = requests.filter(r => r.status === 'approved').length;
  const rejectedCount = requests.filter(r => r.status === 'rejected').length;
  const fulfilledCount = requests.filter(r => r.status === 'fulfilled').length;

  const getStatusBadge = (status: MaterialRequest['status']) => {
    const styles = {
      pending: { bg: 'bg-yellow-100', text: 'text-yellow-800', icon: <FiClock className="w-3 h-3" /> },
      approved: { bg: 'bg-blue-100', text: 'text-blue-800', icon: <FiCheck className="w-3 h-3" /> },
      rejected: { bg: 'bg-red-100', text: 'text-red-800', icon: <FiX className="w-3 h-3" /> },
      fulfilled: { bg: 'bg-green-100', text: 'text-green-800', icon: <FiPackage className="w-3 h-3" /> },
    };
    const style = styles[status];
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${style.bg} ${style.text}`}>
        {style.icon}
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--primary)]"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card 
          className={`p-4 cursor-pointer transition ${filter === 'all' ? 'ring-2 ring-[var(--primary)]' : ''}`}
          onClick={() => setFilter('all')}
        >
          <p className="text-sm text-[var(--text-secondary)]">All Requests</p>
          <p className="text-2xl font-bold text-[var(--text)]">{requests.length}</p>
        </Card>
        <Card 
          className={`p-4 cursor-pointer transition ${filter === 'pending' ? 'ring-2 ring-[var(--primary)]' : ''}`}
          onClick={() => setFilter('pending')}
        >
          <div className="flex items-center gap-2">
            <FiClock className="w-4 h-4 text-yellow-500" />
            <p className="text-sm text-[var(--text-secondary)]">Pending</p>
          </div>
          <p className="text-2xl font-bold text-[var(--text)]">{pendingCount}</p>
        </Card>
        <Card 
          className={`p-4 cursor-pointer transition ${filter === 'approved' ? 'ring-2 ring-[var(--primary)]' : ''}`}
          onClick={() => setFilter('approved')}
        >
          <div className="flex items-center gap-2">
            <FiCheck className="w-4 h-4 text-blue-500" />
            <p className="text-sm text-[var(--text-secondary)]">Approved</p>
          </div>
          <p className="text-2xl font-bold text-[var(--text)]">{approvedCount}</p>
        </Card>
        <Card 
          className={`p-4 cursor-pointer transition ${filter === 'rejected' ? 'ring-2 ring-[var(--primary)]' : ''}`}
          onClick={() => setFilter('rejected')}
        >
          <div className="flex items-center gap-2">
            <FiX className="w-4 h-4 text-red-500" />
            <p className="text-sm text-[var(--text-secondary)]">Rejected</p>
          </div>
          <p className="text-2xl font-bold text-[var(--text)]">{rejectedCount}</p>
        </Card>
        <Card 
          className={`p-4 cursor-pointer transition ${filter === 'fulfilled' ? 'ring-2 ring-[var(--primary)]' : ''}`}
          onClick={() => setFilter('fulfilled')}
        >
          <div className="flex items-center gap-2">
            <FiPackage className="w-4 h-4 text-green-500" />
            <p className="text-sm text-[var(--text-secondary)]">Fulfilled</p>
          </div>
          <p className="text-2xl font-bold text-[var(--text)]">{fulfilledCount}</p>
        </Card>
      </div>

      {/* Requests List */}
      <div className="space-y-4">
        {filteredRequests.length === 0 ? (
          <Card className="p-8 text-center">
            <FiAlertCircle className="w-12 h-12 text-[var(--text-secondary)] mx-auto mb-4" />
            <p className="text-[var(--text-secondary)]">No requests found</p>
          </Card>
        ) : (
          filteredRequests.map(request => (
            <Card key={request.id} className="p-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-semibold text-[var(--text)]">{request.facultyName}</h3>
                    {getStatusBadge(request.status)}
                  </div>
                  <p className="text-sm text-[var(--text-secondary)]">
                    {request.department} • Requested on {new Date(request.requestedAt).toLocaleDateString()}
                  </p>
                  <div className="mt-3 space-y-1">
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
                      Note: {request.reviewNotes}
                    </p>
                  )}
                </div>
                <div className="flex gap-2">
                  {request.status === 'pending' && (
                    <>
                      <Button 
                        size="small"
                        variant="success"
                        icon={<FiCheck className="w-4 h-4" />}
                        onClick={() => setSelectedRequest(request)}
                      >
                        Review
                      </Button>
                    </>
                  )}
                  {request.reviewedBy && (
                    <p className="text-xs text-[var(--text-secondary)] self-center">
                      Reviewed by {request.reviewedBy}
                    </p>
                  )}
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Review Modal */}
      {selectedRequest && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 p-4">
          <div className="flex min-h-full items-start justify-center py-2 sm:items-center sm:py-6">
          <div className="bg-[var(--card-bg)] rounded-2xl w-full max-w-lg relative max-h-[calc(100vh-2rem)] sm:max-h-[calc(100vh-3rem)] overflow-hidden flex flex-col">
            <button
              onClick={() => {
                setSelectedRequest(null);
                setReviewNotes('');
              }}
              className="absolute top-4 right-4 p-2 hover:bg-[var(--secondary)] rounded-lg transition"
            >
              <FiX className="w-5 h-5 text-[var(--text-secondary)]" />
            </button>
            <div className="p-4 border-b border-[var(--border)]">
              <h2 className="text-lg font-semibold text-[var(--text)]">Review Request</h2>
              <p className="text-sm text-[var(--text-secondary)]">
                From {selectedRequest.facultyName} - {selectedRequest.department}
              </p>
            </div>
            <div className="overflow-y-auto p-4">
              <h3 className="font-medium text-[var(--text)] mb-3">Requested Items:</h3>
              <div className="space-y-2 mb-4">
                {selectedRequest.items.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 bg-[var(--secondary)] rounded-lg">
                    <span className="text-[var(--text)]">{item.itemName}</span>
                    <span className="font-medium text-[var(--primary)]">x{item.quantity}</span>
                  </div>
                ))}
              </div>
              <Input
                label="Review Notes (Optional)"
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
                placeholder="Add notes about this request..."
              />
            </div>
            <div className="flex gap-3 p-4 border-t border-[var(--border)]">
              <Button 
                variant="secondary" 
                onClick={() => {
                  setSelectedRequest(null);
                  setReviewNotes('');
                }}
                className="flex-1"
              >
                Close
              </Button>
              <Button 
                variant="danger" 
                onClick={() => handleUpdateStatus(selectedRequest.id, 'rejected')}
                icon={<FiX className="w-4 h-4" />}
                className="flex-1"
              >
                Reject
              </Button>
              <Button 
                variant="success" 
                onClick={() => handleUpdateStatus(selectedRequest.id, 'approved')}
                icon={<FiCheck className="w-4 h-4" />}
                className="flex-1"
              >
                Approve
              </Button>
            </div>
          </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RequestManagement;
