import { useState, useEffect } from 'react';
import { fetchAllOrders, updateOrderStatus } from '../services/orders';

export default function OrdersManager({ showToast }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [trackingId, setTrackingId] = useState('');
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    setLoading(true);
    const data = await fetchAllOrders();
    setOrders(data);
    setLoading(false);
  };

  const handleUpdateStatus = async (orderId, newStatus, currentTrackingId = '') => {
    if (newStatus === 'Shipped' && !trackingId && !currentTrackingId) {
      showToast('Please enter a DTDC tracking ID', 'error');
      return;
    }

    setUpdating(true);
    try {
      const updates = { status: newStatus };
      if (trackingId) {
        updates.trackingId = trackingId;
        updates.courier = 'DTDC';
      }
      
      await updateOrderStatus(orderId, updates);
      showToast(`Order status updated to ${newStatus}`);
      setSelectedOrder(null);
      setTrackingId('');
      loadOrders();
    } catch (err) {
      showToast('Failed to update status', 'error');
    } finally {
      setUpdating(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Processing': return 'var(--warning)';
      case 'Shipped': return '#3b82f6';
      case 'Delivered': return 'var(--success)';
      case 'Cancelled': return 'var(--danger)';
      default: return 'var(--text-muted)';
    }
  };

  const getDTDCTrackingUrl = (id) => {
    return `https://www.dtdc.in/tracking/tracking_results.asp?SearchType=T&TType=A&consignmentNo=${id}`;
  };

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">Order Management</h1>
          <p className="page-subtitle">Track sales and update shipping statuses</p>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <div className="stat-card" style={{ padding: '8px 16px', marginBottom: 0 }}>
             <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Partner:</span>
             <strong style={{ color: 'var(--primary)', fontSize: '0.9rem' }}>DTDC</strong>
          </div>
          <button className="btn btn-ghost" onClick={loadOrders}>
            Refresh
          </button>
        </div>
      </div>

      <div className="table-container">
        {loading ? (
          <div className="empty-state">
            <p>Loading orders...</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="empty-state">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 1 0-7.5 0v4.5m11.356-1.993 1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 0 1-1.12-1.243l1.264-12A1.125 1.125 0 0 1 5.513 7.5h12.974c.576 0 1.059.435 1.119 1.007ZM8.625 10.5a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm7.5 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
            </svg>
            <h3>No orders yet</h3>
            <p>Orders will appear here when customers make a purchase.</p>
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Customer</th>
                <th>Items</th>
                <th>Total</th>
                <th>Status</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {orders.map(order => (
                <tr key={order.id}>
                  <td>
                    <span style={{ fontFamily: 'monospace', fontWeight: 600 }}>
                      #{order.id.slice(-6).toUpperCase()}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={{ fontWeight: 600 }}>{order.address?.firstName} {order.address?.lastName}</span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{order.address?.phone || 'No phone'}</span>
                    </div>
                  </td>
                  <td>{order.items?.length || 0} product(s)</td>
                  <td style={{ fontWeight: 600 }}>₹{Number(order.total).toLocaleString()}</td>
                  <td>
                    <span className="category-badge" style={{ 
                      background: `${getStatusColor(order.status)}20`, 
                      color: getStatusColor(order.status),
                      borderColor: `${getStatusColor(order.status)}40`
                    }}>
                      {order.status}
                    </span>
                  </td>
                  <td style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                    {order.createdAt.toLocaleDateString()}
                  </td>
                  <td>
                    <button className="btn btn-ghost btn-small" onClick={() => setSelectedOrder(order)}>
                      Manage
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Order Management Modal */}
      {selectedOrder && (
        <div className="modal-overlay" onClick={() => setSelectedOrder(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Order #{selectedOrder.id.slice(-6).toUpperCase()}</h2>
              <button className="modal-close" onClick={() => setSelectedOrder(null)}>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{ width: 24, height: 24 }}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 32 }}>
              <div>
                <h4 style={{ color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase', marginBottom: 12 }}>Customer Details</h4>
                <p style={{ fontWeight: 600 }}>{selectedOrder.address?.firstName} {selectedOrder.address?.lastName}</p>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: 4 }}>
                  {selectedOrder.address?.addressLine1},<br />
                  {selectedOrder.address?.city}, {selectedOrder.address?.state} - {selectedOrder.address?.pincode}
                </p>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: 8 }}>
                  📞 {selectedOrder.address?.phone}
                </p>
              </div>
              <div>
                <h4 style={{ color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase', marginBottom: 12 }}>Order Status</h4>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                  <span className="category-badge" style={{ 
                    background: `${getStatusColor(selectedOrder.status)}20`, 
                    color: getStatusColor(selectedOrder.status),
                    borderColor: `${getStatusColor(selectedOrder.status)}40`
                  }}>
                    {selectedOrder.status}
                  </span>
                </div>
                
                {selectedOrder.trackingId && (
                  <div style={{ background: 'rgba(255,255,255,0.03)', padding: 12, borderRadius: 8, border: '1px solid var(--border)' }}>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 4 }}>DTDC Tracking ID:</p>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <code style={{ color: 'var(--primary)', fontWeight: 600 }}>{selectedOrder.trackingId}</code>
                      <a 
                        href={getDTDCTrackingUrl(selectedOrder.trackingId)} 
                        target="_blank" 
                        rel="noreferrer"
                        style={{ fontSize: '0.75rem', color: '#3b82f6', textDecoration: 'none' }}
                      >
                        Track ↗
                      </a>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div style={{ borderTop: '1px solid var(--border)', paddingTop: 24 }}>
              <h4 style={{ color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase', marginBottom: 16 }}>Update Status</h4>
              
              {selectedOrder.status === 'Processing' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div className="form-group">
                    <label className="form-label">DTDC Tracking ID</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      placeholder="Enter DTDC consignment number"
                      value={trackingId}
                      onChange={(e) => setTrackingId(e.target.value)}
                    />
                  </div>
                  <div style={{ display: 'flex', gap: 12 }}>
                    <button 
                      className="btn btn-primary" 
                      style={{ flex: 1 }}
                      disabled={updating}
                      onClick={() => handleUpdateStatus(selectedOrder.id, 'Shipped')}
                    >
                      {updating ? 'Updating...' : 'Mark as Shipped'}
                    </button>
                    <button 
                      className="btn btn-danger" 
                      disabled={updating}
                      onClick={() => handleUpdateStatus(selectedOrder.id, 'Cancelled')}
                    >
                      Cancel Order
                    </button>
                  </div>
                </div>
              )}

              {selectedOrder.status === 'Shipped' && (
                <button 
                  className="btn btn-primary" 
                  style={{ width: '100%' }}
                  disabled={updating}
                  onClick={() => handleUpdateStatus(selectedOrder.id, 'Delivered')}
                >
                  {updating ? 'Updating...' : 'Mark as Delivered'}
                </button>
              )}

              {selectedOrder.status === 'Delivered' && (
                <p style={{ textAlign: 'center', color: 'var(--success)', fontSize: '0.875rem' }}>
                  ✓ This order has been successfully delivered.
                </p>
              )}

              {selectedOrder.status === 'Cancelled' && (
                <p style={{ textAlign: 'center', color: 'var(--danger)', fontSize: '0.875rem' }}>
                  ✕ This order was cancelled.
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
