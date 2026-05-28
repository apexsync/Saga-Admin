import { useState, useEffect } from 'react';
import { 
  fetchAllCoupons, 
  createOrUpdateCoupon, 
  deleteCoupon, 
  toggleCouponActive 
} from '../services/coupons';

export default function CouponsManager({ showToast }) {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Modals / Actions states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [form, setForm] = useState({
    code: '',
    discountType: 'percentage', // 'percentage' | 'fixed'
    discountValue: '',
    minPurchase: '',
    maxUses: '',
    expiresAt: '',
    isActive: true
  });

  const loadCoupons = async () => {
    setLoading(true);
    try {
      const data = await fetchAllCoupons();
      setCoupons(data);
    } catch (err) {
      console.error(err);
      showToast('Failed to load coupons', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCoupons();
  }, []);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleCreateCouponSubmit = async (e) => {
    e.preventDefault();
    if (!form.code.trim() || !form.discountValue) {
      showToast('Code and Discount Value are required', 'error');
      return;
    }

    setSubmitting(true);
    try {
      await createOrUpdateCoupon({
        code: form.code.trim().toUpperCase(),
        discountType: form.discountType,
        discountValue: parseFloat(form.discountValue),
        minPurchase: form.minPurchase ? parseFloat(form.minPurchase) : 0,
        maxUses: form.maxUses ? parseInt(form.maxUses) : null,
        expiresAt: form.expiresAt || null,
        isActive: form.isActive,
        usedCount: 0
      });

      showToast('Coupon created successfully!');
      setShowCreateModal(false);
      // Reset form
      setForm({
        code: '',
        discountType: 'percentage',
        discountValue: '',
        minPurchase: '',
        maxUses: '',
        expiresAt: '',
        isActive: true
      });
      loadCoupons();
    } catch (err) {
      console.error(err);
      showToast('Failed to create coupon', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (code) => {
    try {
      await deleteCoupon(code);
      setCoupons(coupons.filter(c => c.id !== code));
      setDeleteConfirm(null);
      showToast('Coupon deleted successfully');
    } catch (err) {
      showToast('Failed to delete coupon', 'error');
    }
  };

  const handleToggleActive = async (coupon) => {
    const newStatus = !coupon.isActive;
    try {
      await toggleCouponActive(coupon.code, newStatus);
      setCoupons(coupons.map(c => c.id === coupon.id ? { ...c, isActive: newStatus } : c));
      showToast(`Coupon marked as ${newStatus ? 'Active' : 'Inactive'}`);
    } catch (err) {
      showToast('Failed to toggle coupon status', 'error');
    }
  };

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">Discord Coupons</h1>
          <p className="page-subtitle">Manage promotional coupon codes for your customers</p>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <button className="btn btn-ghost" onClick={loadCoupons}>
            Refresh
          </button>
          <button className="btn btn-primary" onClick={() => setShowCreateModal(true)}>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{ width: 18, height: 18 }}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Create Coupon
          </button>
        </div>
      </div>

      <div className="table-container">
        {loading ? (
          <div className="empty-state">
            <p>Loading coupons...</p>
          </div>
        ) : coupons.length === 0 ? (
          <div className="empty-state">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 6v.75m0 3v.75m0 3v.75m0 3V18m-9-12h12c1.38 0 2.5 1.12 2.5 2.5v7c0 1.38-1.12 2.5-2.5 2.5h-12A2.5 2.5 0 0 1 5 15.5v-7A2.5 2.5 0 0 1 7.5 6Z" />
            </svg>
            <h3>No coupons yet</h3>
            <p>Click "Create Coupon" to launch your first promotional discount.</p>
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Code</th>
                <th>Discount</th>
                <th>Min Purchase</th>
                <th>Redemptions</th>
                <th>Expiry</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {coupons.map(coupon => {
                const expires = coupon.expiresAt 
                  ? (coupon.expiresAt.toDate ? coupon.expiresAt.toDate() : new Date(coupon.expiresAt))
                  : null;
                const isExpired = expires ? expires < new Date() : false;

                return (
                  <tr key={coupon.id}>
                    <td data-label="Code">
                      <strong style={{ color: 'var(--primary)', letterSpacing: '0.5px' }}>{coupon.code}</strong>
                    </td>
                    <td data-label="Discount">
                      {coupon.discountType === 'percentage' 
                        ? `${coupon.discountValue}% Off` 
                        : `₹${coupon.discountValue} Off`}
                    </td>
                    <td data-label="Min Purchase">
                      ₹{coupon.minPurchase || 0}
                    </td>
                    <td data-label="Redemptions">
                      <span style={{ fontWeight: 500 }}>{coupon.usedCount || 0}</span>
                      {coupon.maxUses ? (
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}> / {coupon.maxUses}</span>
                      ) : (
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}> (Unlimited)</span>
                      )}
                    </td>
                    <td data-label="Expiry">
                      {expires ? (
                        <span style={{ color: isExpired ? 'var(--danger)' : 'var(--text-secondary)' }}>
                          {expires.toLocaleDateString()} {expires.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          {isExpired && ' (Expired)'}
                        </span>
                      ) : (
                        <span style={{ color: 'var(--text-muted)' }}>Never</span>
                      )}
                    </td>
                    <td data-label="Status">
                      <button 
                        onClick={() => handleToggleActive(coupon)}
                        className="category-badge" 
                        style={{ 
                          cursor: 'pointer',
                          background: coupon.isActive && !isExpired ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)', 
                          color: coupon.isActive && !isExpired ? 'var(--success)' : 'var(--danger)', 
                          borderColor: coupon.isActive && !isExpired ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)' 
                        }}
                      >
                        {coupon.isActive && !isExpired ? 'Active' : isExpired ? 'Expired' : 'Inactive'}
                      </button>
                    </td>
                    <td data-label="Actions">
                      <div className="actions-cell">
                        <button className="btn btn-danger btn-small" onClick={() => setDeleteConfirm(coupon.code)}>
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Create Coupon Modal */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 500 }}>
            <div className="modal-header">
              <h2 className="modal-title">Create Discord Coupon</h2>
              <button className="modal-close" onClick={() => setShowCreateModal(false)}>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{ width: 24, height: 24 }}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleCreateCouponSubmit}>
              <div className="form-group">
                <label className="form-label">Coupon Code (Uppercase, e.g. DISCORD15)</label>
                <input
                  type="text"
                  name="code"
                  className="form-input"
                  placeholder="e.g. WELCOME20"
                  value={form.code}
                  onChange={(e) => setForm(prev => ({ ...prev, code: e.target.value.toUpperCase() }))}
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Discount Type</label>
                  <select
                    name="discountType"
                    className="form-select"
                    value={form.discountType}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="percentage">Percentage (%)</option>
                    <option value="fixed">Fixed Amount (₹)</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Discount Value</label>
                  <input
                    type="number"
                    name="discountValue"
                    className="form-input"
                    placeholder={form.discountType === 'percentage' ? 'e.g. 20' : 'e.g. 150'}
                    value={form.discountValue}
                    onChange={handleInputChange}
                    min="0"
                    step="0.01"
                    required
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Min Purchase Requirement (₹)</label>
                  <input
                    type="number"
                    name="minPurchase"
                    className="form-input"
                    placeholder="e.g. 499 (0 for none)"
                    value={form.minPurchase}
                    onChange={handleInputChange}
                    min="0"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Max Uses Limit</label>
                  <input
                    type="number"
                    name="maxUses"
                    className="form-input"
                    placeholder="e.g. 100 (blank for unlimited)"
                    value={form.maxUses}
                    onChange={handleInputChange}
                    min="1"
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Expiry Date & Time (Optional)</label>
                <input
                  type="datetime-local"
                  name="expiresAt"
                  className="form-input"
                  value={form.expiresAt}
                  onChange={handleInputChange}
                />
              </div>

              <div className="form-group" style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 10 }}>
                <input
                  type="checkbox"
                  name="isActive"
                  id="isActive"
                  checked={form.isActive}
                  onChange={handleInputChange}
                  style={{ width: 18, height: 18, accentColor: 'var(--primary)', cursor: 'pointer' }}
                />
                <label htmlFor="isActive" style={{ cursor: 'pointer', fontSize: '0.9rem', fontWeight: 500 }}>
                  Activate Coupon immediately
                </label>
              </div>

              <div style={{ display: 'flex', gap: 12, marginTop: 32 }}>
                <button type="button" className="btn btn-ghost" style={{ flex: 1 }} onClick={() => setShowCreateModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" style={{ flex: 2 }} disabled={submitting}>
                  {submitting ? 'Creating...' : 'Create Coupon'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="modal-overlay" onClick={() => setDeleteConfirm(null)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 400, textAlign: 'center' }}>
            <h3 style={{ marginBottom: 8, fontSize: '1.2rem' }}>Delete Coupon?</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: 24 }}>
              Are you sure you want to permanently remove coupon code <strong>{deleteConfirm}</strong>? This action cannot be undone.
            </p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
              <button className="btn btn-ghost" onClick={() => setDeleteConfirm(null)}>Cancel</button>
              <button className="btn btn-danger" onClick={() => handleDelete(deleteConfirm)}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
