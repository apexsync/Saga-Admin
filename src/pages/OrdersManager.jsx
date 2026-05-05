import { useState, useEffect } from 'react';
import { fetchAllOrders, updateOrderStatus } from '../services/orders';

export default function OrdersManager({ showToast }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [trackingId, setTrackingId] = useState('');
  const [updating, setUpdating] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

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
      case 'Processing': return '#a8a29e'; // Stone
      case 'Confirmed': return '#0ea5e9'; // Sky
      case 'Packed': return '#8b5cf6'; // Violet
      case 'Shipped': return '#3b82f6'; // Blue
      case 'Out for Delivery': return '#f59e0b'; // Amber
      case 'Delivered': return 'var(--success)'; // Green
      case 'Cancelled': return 'var(--danger)'; // Red
      case 'Returned': return '#ec4899'; // Pink
      case 'Refunded': return '#64748b'; // Slate
      default: return 'var(--text-muted)';
    }
  };

  const getDTDCTrackingUrl = (id) => {
    return `https://www.dtdc.in/tracking/tracking_results.asp?SearchType=T&TType=A&consignmentNo=${id}`;
  };

  const filteredOrders = orders.filter(order => 
    order.id.toLowerCase().includes(searchQuery.toLowerCase()) || 
    (order.customerName && order.customerName.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (order.address?.phone && order.address.phone.includes(searchQuery))
  );

  const getWhatsAppUrl = (order, type = 'general') => {
    const phone = order.address?.phone?.replace(/\D/g, '');
    if (!phone) return '#';
    
    let message = '';
    if (type === 'tracking' || order.status === 'Shipped' || order.status === 'Out for Delivery') {
      message = `Hi ${order.customerName || 'there'}, your Saga Order #${order.id.slice(-6).toUpperCase()} is ${order.status.toLowerCase()}! 🚢\n\nTracking ID: ${order.trackingId}\nCourier: ${order.courier || 'DTDC'}\n\nYou can track it here: ${getDTDCTrackingUrl(order.trackingId)}\n\nThank you for shopping with Saga!`;
    } else if (order.status === 'Confirmed') {
      message = `Hi ${order.customerName || 'there'}, your Saga Order #${order.id.slice(-6).toUpperCase()} has been confirmed and is being prepared! ✨`;
    } else if (order.status === 'Packed') {
      message = `Hi ${order.customerName || 'there'}, your Saga Order #${order.id.slice(-6).toUpperCase()} is packed and ready for dispatch! 📦`;
    } else {
      message = `Hi ${order.customerName || 'there'}, I'm reaching out regarding your Saga Order #${order.id.slice(-6).toUpperCase()}. Current status: ${order.status}.`;
    }
    
    return `https://wa.me/${phone.startsWith('91') ? phone : '91' + phone}?text=${encodeURIComponent(message)}`;
  };

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">Order Management</h1>
          <p className="page-subtitle">Track sales and update shipping statuses</p>
        </div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <input 
            type="text" 
            placeholder="Search Order ID, Name or Phone..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="form-input"
            style={{ marginBottom: 0, minWidth: '250px' }}
          />
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
        ) : filteredOrders.length === 0 ? (
          <div className="empty-state">
            <h3>{orders.length === 0 ? 'No orders yet' : 'No matching orders found'}</h3>
            <p>{orders.length === 0 ? 'Orders will appear here when customers make a purchase.' : 'Try adjusting your search terms.'}</p>
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
              {filteredOrders.map(order => (
                <tr key={order.id}>
                  <td>
                    <span style={{ fontFamily: 'monospace', fontWeight: 600 }}>
                      #{order.id.slice(-6).toUpperCase()}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={{ fontWeight: 600 }}>{order.customerName || 'Customer'}</span>
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
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <h2 className="modal-title">Order #{selectedOrder.id.slice(-6).toUpperCase()}</h2>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: '0.75rem', fontFamily: 'monospace', color: 'var(--text-muted)' }}>Full ID: {selectedOrder.id}</span>
                  <button 
                    onClick={() => { navigator.clipboard.writeText(selectedOrder.id); showToast('Order ID copied!'); }}
                    style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontSize: '0.75rem' }}
                  >
                    Copy
                  </button>
                </div>
              </div>
              <button className="modal-close" onClick={() => setSelectedOrder(null)}>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{ width: 24, height: 24 }}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 32 }}>
              <div>
                <h4 style={{ color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase', marginBottom: 12 }}>Customer Details</h4>
                <p style={{ fontWeight: 600 }}>{selectedOrder.customerName || 'Customer'}</p>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: 4 }}>
                  {selectedOrder.customerEmail}
                </p>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: 4 }}>
                  {selectedOrder.address?.street},<br />
                  {selectedOrder.address?.city} - {selectedOrder.address?.zip}
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 12 }}>
                  <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', margin: 0 }}>
                    📞 {selectedOrder.address?.phone}
                  </p>
                  {selectedOrder.address?.phone && (
                    <a 
                      href={getWhatsAppUrl(selectedOrder)} 
                      target="_blank" 
                      rel="noreferrer"
                      style={{ 
                        display: 'inline-flex', alignItems: 'center', gap: 6, 
                        background: '#25D366', color: 'white', padding: '4px 10px', 
                        borderRadius: 4, textDecoration: 'none', fontSize: '0.75rem', fontWeight: 600 
                      }}
                    >
                      <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/>
                      </svg>
                      Reply on WhatsApp
                    </a>
                  )}
                </div>
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
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
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
                    
                    <a 
                      href={getWhatsAppUrl(selectedOrder, 'tracking')} 
                      target="_blank" 
                      rel="noreferrer"
                      className="btn btn-ghost btn-small"
                      style={{ 
                        width: '100%', justifyContent: 'center', background: '#25D36620', 
                        color: '#25D366', borderColor: '#25D36640', gap: 8 
                      }}
                    >
                      <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/>
                      </svg>
                      Send Tracking to Customer
                    </a>
                  </div>
                )}
              </div>
            </div>

            <div style={{ borderTop: '1px solid var(--border)', paddingTop: 24 }}>
              <h4 style={{ color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase', marginBottom: 16 }}>Update Status</h4>
              
              {selectedOrder.status === 'Processing' && (
                <div style={{ display: 'flex', gap: 12 }}>
                  <button className="btn btn-primary" style={{ flex: 1 }} onClick={() => handleUpdateStatus(selectedOrder.id, 'Confirmed')}>Confirm Order</button>
                  <button className="btn btn-danger" onClick={() => handleUpdateStatus(selectedOrder.id, 'Cancelled')}>Cancel</button>
                </div>
              )}

              {selectedOrder.status === 'Confirmed' && (
                <button className="btn btn-primary" style={{ width: '100%' }} onClick={() => handleUpdateStatus(selectedOrder.id, 'Packed')}>Mark as Packed</button>
              )}

              {selectedOrder.status === 'Packed' && (
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
                  <button className="btn btn-primary" style={{ width: '100%' }} onClick={() => handleUpdateStatus(selectedOrder.id, 'Shipped')}>Ship Order</button>
                </div>
              )}

              {selectedOrder.status === 'Shipped' && (
                <button className="btn btn-primary" style={{ width: '100%' }} onClick={() => handleUpdateStatus(selectedOrder.id, 'Out for Delivery')}>Mark Out for Delivery</button>
              )}

              {selectedOrder.status === 'Out for Delivery' && (
                <button className="btn btn-primary" style={{ width: '100%' }} onClick={() => handleUpdateStatus(selectedOrder.id, 'Delivered')}>Mark as Delivered</button>
              )}

              {(selectedOrder.status === 'Delivered' || selectedOrder.status === 'Cancelled') && (
                <div style={{ display: 'flex', gap: 12 }}>
                  <button className="btn btn-ghost" style={{ flex: 1 }} onClick={() => handleUpdateStatus(selectedOrder.id, 'Returned')}>Mark as Returned</button>
                  <button className="btn btn-ghost" style={{ flex: 1 }} onClick={() => handleUpdateStatus(selectedOrder.id, 'Refunded')}>Mark as Refunded</button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
