import { useState, useEffect } from 'react';
import { fetchAllOrders, updateOrderStatus, generateShippingLabel, cancelConsignment, refundPayment, createConsignment } from '../services/orders';

export default function OrdersManager({ showToast }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [trackingId, setTrackingId] = useState('');
  const [updating, setUpdating] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isGeneratingLabel, setIsGeneratingLabel] = useState(false);
  const [shouldRefund, setShouldRefund] = useState(false);
  const [isBookingShipment, setIsBookingShipment] = useState(false);

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
      
      // 1. Handle DTDC Shipment Cancellation if needed
      const order = orders.find(o => o.id === orderId);
      const awb = order?.awbNumber || order?.trackingId || order?.awb;
      if (newStatus === 'Cancelled' && awb) {
        try {
          await cancelConsignment(awb);
          showToast('DTDC consignment also canceled');
        } catch (shipErr) {
          console.error("DTDC Cancellation failed:", shipErr);
          showToast('Order canceled in Firestore, but DTDC cancellation failed', 'warning');
        }
      }

      // 2. Handle Razorpay Refund if requested
      if (newStatus === 'Cancelled' && shouldRefund && order?.paymentId) {
        try {
          await refundPayment(order.paymentId);
          updates.status = 'Refunded';
          updates.refunded = true;
          updates.refundDate = new Date();
          showToast('Razorpay refund issued successfully');
        } catch (refundErr) {
          console.error("Refund failed:", refundErr);
          showToast(refundErr.message || 'Refund failed, please check Razorpay dashboard', 'error');
          // If refund fails, we might still want to cancel the order, but let's inform the user
        }
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

  const handleBookConsignment = async (order) => {
    setIsBookingShipment(true);
    try {
      const awb = await createConsignment(order);
      showToast(`Consignment booked! AWB: ${awb}`);
      // Reload so the modal reflects the new awbNumber & Shipped status
      const freshOrders = await fetchAllOrders();
      setOrders(freshOrders);
      // Update selectedOrder in-place so modal refreshes without closing
      setSelectedOrder(freshOrders.find(o => o.id === order.id) || null);
    } catch (err) {
      showToast(err.message || 'Failed to book DTDC consignment', 'error');
    } finally {
      setIsBookingShipment(false);
    }
  };

  const handleDownloadLabel = async (awb) => {
    if (!awb) return;
    setIsGeneratingLabel(true);
    try {
      await generateShippingLabel(awb);
      showToast('Shipping label downloaded');
    } catch (err) {
      showToast('Failed to generate label', 'error');
    } finally {
      setIsGeneratingLabel(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Processing': return '#a8a29e'; // Stone
      case 'Confirmed': return '#0ea5e9'; // Sky
      case 'Packed': return '#8b5cf6'; // Violet
      case 'Ready to Ship': return '#0d9488'; // Teal
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
    return `https://www.aftership.com/track/dtdc/${id}`;
  };

  const filteredOrders = orders.filter(order => 
    order.id.toLowerCase().includes(searchQuery.toLowerCase()) || 
    (order.customerName && order.customerName.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (order.address?.phone && order.address.phone.includes(searchQuery))
  );

  const getWhatsAppUrl = (order, type = 'general') => {
    const phone = order.address?.phone?.replace(/\D/g, '');
    if (!phone) return '#';
    
    const orderAwb = order.awbNumber || order.trackingId || order.awb;
    let message = '';
    if (type === 'tracking' || order.status === 'Shipped' || order.status === 'Out for Delivery') {
      message = `Hi ${order.customerName || 'there'}, your Saga Order #${order.id.slice(-6).toUpperCase()} is ${order.status.toLowerCase()}! 🚢\n\nTracking ID: ${orderAwb}\nCourier: ${order.courier || 'DTDC'}\n\nYou can track it here: ${getDTDCTrackingUrl(orderAwb)}\n\nThank you for shopping with Saga!`;
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
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center' }}>
          <input 
            type="text" 
            placeholder="Search Order ID, Name or Phone..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="form-input"
            style={{ marginBottom: 0, minWidth: '200px', flex: '1 1 200px' }}
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
                  <td data-label="Order ID">
                    <span style={{ fontFamily: 'monospace', fontWeight: 600 }}>
                      #{order.id.slice(-6).toUpperCase()}
                    </span>
                  </td>
                  <td data-label="Customer">
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={{ fontWeight: 600 }}>{order.customerName || 'Customer'}</span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{order.address?.phone || 'No phone'}</span>
                    </div>
                  </td>
                  <td data-label="Items">{order.items?.length || 0} product(s)</td>
                  <td data-label="Total" style={{ fontWeight: 600 }}>₹{Number(order.total).toLocaleString()}</td>
                  <td data-label="Status">
                    <span className="category-badge" style={{ 
                      background: `${getStatusColor(order.status)}20`, 
                      color: getStatusColor(order.status),
                      borderColor: `${getStatusColor(order.status)}40`
                    }}>
                      {order.status}
                    </span>
                  </td>
                  <td data-label="Date" style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                    {order.createdAt.toLocaleDateString()}
                  </td>
                  <td data-label="">
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
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <h2 className="modal-title" style={{ fontSize: '1.5rem' }}>
                  Order <span style={{ color: 'var(--primary)' }}>#{selectedOrder.id.slice(-6).toUpperCase()}</span>
                </h2>
                <div className="id-chip">
                  <span style={{ fontSize: '0.7rem', fontFamily: 'monospace', color: 'var(--text-secondary)' }}>
                    Full ID: {selectedOrder.id}
                  </span>
                  <button 
                    onClick={() => { navigator.clipboard.writeText(selectedOrder.id); showToast('Order ID copied!'); }}
                    style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontSize: '0.7rem', fontWeight: 700 }}
                  >
                    Copy
                  </button>
                </div>
              </div>
              <button className="modal-close" onClick={() => setSelectedOrder(null)}>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" style={{ width: 22, height: 22 }}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 24, marginBottom: 40 }}>
              <div>
                <span className="section-label">Customer Details</span>
                <p style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: 4 }}>{selectedOrder.customerName || 'Customer'}</p>
                <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: 12 }}>
                  {selectedOrder.customerEmail} <br />
                  <span style={{ color: 'var(--primary)', fontWeight: 500 }}>{selectedOrder.address?.phone || 'No Phone'}</span>
                </p>
                
                <div style={{ 
                  background: 'rgba(255,255,255,0.03)', padding: '16px', borderRadius: '16px', 
                  border: '1px solid rgba(255,255,255,0.05)', marginBottom: 20 
                }}>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                    {selectedOrder.address?.addressLine1}{selectedOrder.address?.addressLine2 ? `, ${selectedOrder.address.addressLine2}` : ''}
                    {selectedOrder.address?.landmark && (
                      <><br /><span style={{ fontSize: '0.75rem', opacity: 0.8 }}>Near: {selectedOrder.address.landmark}</span></>
                    )}
                    <br />
                    <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                      {selectedOrder.address?.city}, {selectedOrder.address?.state} - {selectedOrder.address?.pincode}
                    </span>
                  </p>
                </div>

                <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 12 }}>
                  <div style={{ 
                    display: 'flex', alignItems: 'center', gap: 8, 
                    background: 'rgba(255,255,255,0.05)', padding: '10px 14px', borderRadius: '12px',
                    fontSize: '0.85rem', color: 'var(--text-primary)', fontWeight: 600
                  }}>
                    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" width="16" height="16" strokeWidth="2.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                    {selectedOrder.address?.phone}
                  </div>

                  {selectedOrder.address?.phone && (
                    <a 
                      href={getWhatsAppUrl(selectedOrder)} 
                      target="_blank" 
                      rel="noreferrer"
                      className="whatsapp-btn"
                    >
                      <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/>
                      </svg>
                      Reply
                    </a>
                  )}
                </div>
              </div>

              <div>
                <span className="section-label">Order Status</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
                  <span className="status-indicator pulse-animation" style={{ background: getStatusColor(selectedOrder.status) }}></span>
                  <span className="category-badge" style={{ 
                    background: `${getStatusColor(selectedOrder.status)}15`, 
                    color: getStatusColor(selectedOrder.status),
                    borderColor: `${getStatusColor(selectedOrder.status)}30`,
                    fontSize: '0.85rem', padding: '6px 16px'
                  }}>
                    {selectedOrder.status}
                  </span>
                </div>
                
                {(selectedOrder.awbNumber || selectedOrder.trackingId || selectedOrder.awb) && (() => {
                  const displayAwb = selectedOrder.awbNumber || selectedOrder.trackingId || selectedOrder.awb;
                  return (
                    <div className="tracking-card">
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 8, fontWeight: 600 }}>DTDC AWB NUMBER</p>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                        <code style={{ color: 'var(--primary)', fontWeight: 800, fontSize: '1.1rem' }}>{displayAwb}</code>
                        <a 
                          href={getDTDCTrackingUrl(displayAwb)} 
                          target="_blank" 
                          rel="noreferrer"
                          className="btn btn-ghost btn-small"
                          style={{ padding: '4px 10px', borderRadius: '8px' }}
                        >
                          Track ↗
                        </a>
                      </div>
                      
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        <a 
                          href={getWhatsAppUrl(selectedOrder, 'tracking')} 
                          target="_blank" 
                          rel="noreferrer"
                          className="whatsapp-btn"
                          style={{ width: '100%', justifyContent: 'center', fontSize: '0.8rem' }}
                        >
                          <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/>
                          </svg>
                          Send Tracking to Customer
                        </a>
                        
                        <button 
                          className="btn btn-primary btn-small" 
                          style={{ width: '100%', justifyContent: 'center', background: 'var(--primary)', color: 'white' }}
                          onClick={() => handleDownloadLabel(displayAwb)}
                          disabled={isGeneratingLabel}
                        >
                          {isGeneratingLabel ? 'Generating Label...' : 'Download Shipping Label'}
                        </button>
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>

            <div style={{ 
              borderTop: '1px solid rgba(255,255,255,0.08)', 
              paddingTop: 32, 
              background: 'linear-gradient(180deg, rgba(255,255,255,0.02) 0%, transparent 100%)',
              margin: '0 -36px -36px',
              padding: '32px 36px'
            }}>
              <span className="section-label">Update Status</span>
              
              {selectedOrder.status === 'Processing' && (
                <button className="btn btn-primary" style={{ width: '100%', padding: '14px' }} onClick={() => handleUpdateStatus(selectedOrder.id, 'Confirmed')}>Confirm Order</button>
              )}

              {selectedOrder.status === 'Confirmed' && (
                <button className="btn btn-primary" style={{ width: '100%', padding: '14px' }} onClick={() => handleUpdateStatus(selectedOrder.id, 'Packed')}>Mark as Packed</button>
              )}

              {selectedOrder.status === 'Packed' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {/* Auto-book via Shipsy/DTDC */}
                  <button
                    className="btn btn-primary"
                    style={{ width: '100%', padding: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}
                    onClick={() => handleBookConsignment(selectedOrder)}
                    disabled={isBookingShipment}
                  >
                    {isBookingShipment ? (
                      <>
                        <svg style={{ animation: 'spin 1s linear infinite', width: 18, height: 18 }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 100 16v-4l-3 3 3 3v-4a8 8 0 01-8-8z" />
                        </svg>
                        Booking Consignment...
                      </>
                    ) : (
                      <>
                        <svg style={{ width: 18, height: 18 }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8l1 12a2 2 0 002 2h8a2 2 0 002-2L19 8" />
                        </svg>
                        Book DTDC Consignment
                      </>
                    )}
                  </button>

                  {/* Manual fallback: enter tracking ID */}
                  <details style={{ marginTop: 4 }}>
                    <summary style={{ fontSize: '0.75rem', color: 'var(--text-muted)', cursor: 'pointer', userSelect: 'none' }}>
                      Already have a tracking ID? Enter manually
                    </summary>
                    <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
                      <input 
                        type="text" 
                        className="form-input" 
                        placeholder="Enter DTDC consignment number"
                        value={trackingId}
                        onChange={(e) => setTrackingId(e.target.value)}
                        style={{ padding: '14px', fontSize: '1rem', background: 'rgba(255,255,255,0.05)' }}
                      />
                      <button
                        className="btn btn-ghost"
                        style={{ width: '100%', padding: '12px' }}
                        onClick={() => handleUpdateStatus(selectedOrder.id, 'Shipped')}
                      >
                        Ship with Manual ID
                      </button>
                    </div>
                  </details>
                </div>
              )}

              {['Processing', 'Confirmed', 'Packed'].includes(selectedOrder.status) && (
                <div style={{ marginTop: 24, borderTop: '1px dashed rgba(255,255,255,0.08)', paddingTop: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {selectedOrder.paymentId && (
                    <label className="flex items-center gap-3 cursor-pointer p-3 bg-white/5 rounded-xl border border-white/10 hover:bg-white/10 transition-colors">
                      <input 
                        type="checkbox" 
                        checked={shouldRefund} 
                        onChange={(e) => setShouldRefund(e.target.checked)}
                        className="w-4 h-4 rounded border-white/20 bg-transparent text-primary focus:ring-primary"
                      />
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-white">Issue Full Refund via Razorpay</span>
                        <span className="text-[10px] text-white/40">Money will be returned to original payment method</span>
                      </div>
                    </label>
                  )}
                  <button className="btn btn-danger" style={{ width: '100%', padding: '14px' }} onClick={() => handleUpdateStatus(selectedOrder.id, 'Cancelled')}>
                    {shouldRefund ? 'Cancel & Refund' : 'Cancel Order'}
                  </button>
                </div>
              )}

              {(selectedOrder.status === 'Ready to Ship' || selectedOrder.status === 'Shipped') && (
                <button 
                  className="btn btn-primary" 
                  style={{ width: '100%', padding: '14px' }} 
                  onClick={() => handleUpdateStatus(
                    selectedOrder.id, 
                    selectedOrder.status === 'Ready to Ship' ? 'Shipped' : 'Out for Delivery'
                  )}
                >
                  {selectedOrder.status === 'Ready to Ship' ? 'Mark as Shipped' : 'Mark Out for Delivery'}
                </button>
              )}

              {selectedOrder.status === 'Out for Delivery' && (
                <button className="btn btn-primary" style={{ width: '100%', padding: '14px', fontSize: '1rem' }} onClick={() => handleUpdateStatus(selectedOrder.id, 'Delivered')}>Mark as Delivered</button>
              )}

              {(selectedOrder.status === 'Delivered' || selectedOrder.status === 'Cancelled') && (
                <div style={{ display: 'flex', gap: 12 }}>
                  <button className="btn btn-ghost" style={{ flex: 1, padding: '12px' }} onClick={() => handleUpdateStatus(selectedOrder.id, 'Returned')}>Mark as Returned</button>
                  <button className="btn btn-ghost" style={{ flex: 1, padding: '12px' }} onClick={() => handleUpdateStatus(selectedOrder.id, 'Refunded')}>Mark as Refunded</button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
