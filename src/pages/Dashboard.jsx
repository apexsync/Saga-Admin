import { useState, useEffect } from 'react';
import { fetchAllProducts, deleteProduct } from '../services/products';
import { fetchReviewsByProductId, respondToReview, deleteReview } from '../services/reviews';

export default function Dashboard({ onEdit, onAddNew, showToast }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  
  // Review states
  const [viewingReviewsFor, setViewingReviewsFor] = useState(null);
  const [productReviews, setProductReviews] = useState([]);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [savingReply, setSavingReply] = useState(false);

  const loadProducts = async () => {
    setLoading(true);
    const data = await fetchAllProducts();
    setProducts(data);
    setLoading(false);
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const handleDelete = async (productId) => {
    try {
      await deleteProduct(productId);
      setProducts(products.filter(p => p.id !== productId));
      setDeleteConfirm(null);
      showToast('Product deleted successfully');
    } catch (err) {
      showToast('Failed to delete product', 'error');
    }
  };

  const loadProductReviews = async (product) => {
    setViewingReviewsFor(product);
    setLoadingReviews(true);
    const reviews = await fetchReviewsByProductId(product.id);
    setProductReviews(reviews);
    setLoadingReviews(false);
  };

  const handleReplyToReview = async (e) => {
    e.preventDefault();
    if (!replyText.trim()) return;
    
    setSavingReply(true);
    try {
      await respondToReview(replyingTo.id, replyText);
      showToast('Reply saved!');
      setReplyingTo(null);
      setReplyText('');
      // Refresh reviews
      const updated = await fetchReviewsByProductId(viewingReviewsFor.id);
      setProductReviews(updated);
    } catch (err) {
      showToast('Failed to save reply', 'error');
    } finally {
      setSavingReply(false);
    }
  };

  const handleDeleteReview = async (reviewId) => {
    if (!window.confirm('Delete this review?')) return;
    try {
      await deleteReview(reviewId);
      setProductReviews(productReviews.filter(r => r.id !== reviewId));
      showToast('Review deleted');
    } catch (err) {
      showToast('Failed to delete review', 'error');
    }
  };

  const categories = [...new Set(products.map(p => p.category))];

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">Manage your products and inventory</p>
        </div>
        <button className="btn btn-primary" onClick={onAddNew}>
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Add Product
        </button>
      </div>

      {/* Stats */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon orange">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
            </svg>
          </div>
          <div>
            <div className="stat-value">{products.length}</div>
            <div className="stat-label">Total Products</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon green">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 6h.008v.008H6V6z" />
            </svg>
          </div>
          <div>
            <div className="stat-value">{categories.length}</div>
            <div className="stat-label">Categories</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon blue">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" />
            </svg>
          </div>
          <div>
            <div className="stat-value">
              ₹{products.reduce((sum, p) => sum + (p.price || 0), 0).toLocaleString()}
            </div>
            <div className="stat-label">Total Inventory Value</div>
          </div>
        </div>
      </div>

      {/* Product Table */}
      <div className="table-container">
        <div className="table-header">
          <span className="table-title">All Products</span>
          <button className="btn btn-ghost btn-small" onClick={loadProducts}>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{ width: 16, height: 16 }}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182" />
            </svg>
            Refresh
          </button>
        </div>

        {loading ? (
          <div className="empty-state">
            <p>Loading products...</p>
          </div>
        ) : products.length === 0 ? (
          <div className="empty-state">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5m8.25 3v6.75m0 0l-3-3m3 3l3-3M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
            </svg>
            <h3>No products yet</h3>
            <p>Click "Add Product" to create your first product.</p>
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Product</th>
                <th>Category</th>
                <th>Price</th>
                <th>Stock</th>
                <th>Added</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map(product => (
                <tr key={product.id}>
                  <td>
                    <div className="product-cell">
                      {product.imageUrl ? (
                        <img src={product.imageUrl} alt={product.name} className="product-thumb" />
                      ) : (
                        <div className="product-thumb" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#666', fontSize: '0.6rem' }}>
                          No img
                        </div>
                      )}
                      <span className="product-name">{product.name}</span>
                    </div>
                  </td>
                  <td><span className="category-badge">{product.category}</span></td>
                  <td style={{ fontWeight: 600 }}>₹{Number(product.price).toLocaleString()}</td>
                  <td style={{ fontWeight: 500, color: (product.stock <= 0) ? 'var(--danger)' : (product.stock < 5) ? 'var(--warning)' : 'inherit' }}>
                    {product.stock || 0}
                  </td>
                  <td style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                    {product.createdAt instanceof Date
                      ? product.createdAt.toLocaleDateString()
                      : 'N/A'}
                  </td>
                  <td>
                    <div className="actions-cell">
                      <button className="btn btn-ghost btn-small" title="View Reviews" onClick={() => loadProductReviews(product)}>
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{ width: 16, height: 16 }}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
                        </svg>
                        Reviews
                      </button>
                      <button className="btn btn-ghost btn-small" onClick={() => onEdit(product)}>
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{ width: 16, height: 16 }}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
                        </svg>
                        Edit
                      </button>
                      <button className="btn btn-danger btn-small" onClick={() => setDeleteConfirm(product.id)}>
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{ width: 16, height: 16 }}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                        </svg>
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Product Reviews Modal */}
      {viewingReviewsFor && (
        <div className="modal-overlay" onClick={() => setViewingReviewsFor(null)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 800 }}>
            <div className="modal-header">
              <h2 className="modal-title">Reviews: {viewingReviewsFor.name}</h2>
              <button className="modal-close" onClick={() => setViewingReviewsFor(null)}>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{ width: 24, height: 24 }}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {loadingReviews ? (
               <div style={{ padding: 40, textAlign: 'center' }}>Loading...</div>
            ) : productReviews.length === 0 ? (
                <div style={{ padding: 60, textAlign: 'center', color: 'var(--text-muted)' }}>
                    <p>No reviews yet for this product.</p>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                    {productReviews.map(review => (
                        <div key={review.id} style={{ padding: 20, background: 'var(--bg-input)', border: '1px solid var(--border)', borderRadius: 12 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                                <div>
                                    <strong style={{ fontSize: '1rem', color: 'var(--text-primary)' }}>{review.userName}</strong>
                                    <div style={{ display: 'flex', color: '#f59e0b', marginTop: 4 }}>
                                        {[...Array(5)].map((_, i) => (
                                            <svg key={i} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill={i < review.rating ? "currentColor" : "none"} stroke="currentColor" strokeWidth={1.5} style={{ width: 12, height: 12 }}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
                                            </svg>
                                        ))}
                                    </div>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{review.createdAt.toLocaleDateString()}</span>
                                </div>
                            </div>
                            <p style={{ fontSize: '0.9rem', marginBottom: 16 }}>{review.comment}</p>
                            
                            {review.adminReply ? (
                                <div style={{ padding: 12, background: 'rgba(251, 112, 16, 0.05)', borderRadius: 8, borderLeft: '3px solid var(--primary)', marginBottom: 16 }}>
                                    <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--primary)', marginBottom: 4, display: 'block' }}>YOUR RESPONSE</span>
                                    <p style={{ fontSize: '0.85rem' }}>{review.adminReply}</p>
                                </div>
                            ) : null}

                            <div style={{ display: 'flex', gap: 12 }}>
                                <button className="btn btn-ghost btn-small" onClick={() => { setReplyingTo(review); setReplyText(review.adminReply || ''); }}>
                                    {review.adminReply ? 'Edit Response' : 'Reply'}
                                </button>
                                <button className="btn btn-danger btn-small" style={{ marginLeft: 'auto' }} onClick={() => handleDeleteReview(review.id)}>Delete</button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
          </div>
        </div>
      )}

      {/* Reply Sub-Modal */}
      {replyingTo && (
          <div className="modal-overlay" style={{ zIndex: 110 }} onClick={() => setReplyingTo(null)}>
              <div className="modal" style={{ maxWidth: 500 }} onClick={e => e.stopPropagation()}>
                <h3 style={{ marginBottom: 20 }}>Reply to {replyingTo.userName}</h3>
                <form onSubmit={handleReplyToReview}>
                    <div className="form-group">
                        <textarea 
                            className="form-textarea" 
                            style={{ minHeight: 120 }}
                            placeholder="Type your reply..."
                            value={replyText}
                            onChange={e => setReplyText(e.target.value)}
                            required
                        />
                    </div>
                    <div style={{ display: 'flex', gap: 12 }}>
                        <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={savingReply}>
                            {savingReply ? 'Saving...' : 'Save Reply'}
                        </button>
                        <button type="button" className="btn btn-ghost" onClick={() => setReplyingTo(null)}>Cancel</button>
                    </div>
                </form>
              </div>
          </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="modal-overlay" onClick={() => setDeleteConfirm(null)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 400, textAlign: 'center' }}>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{ width: 48, height: 48, color: 'var(--danger)', margin: '0 auto 16px' }}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
            </svg>
            <h3 style={{ marginBottom: 8 }}>Delete Product?</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: 24 }}>
              This will permanently remove the product from your store. This action cannot be undone.
            </p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
              <button className="btn btn-ghost" onClick={() => setDeleteConfirm(null)}>Cancel</button>
              <button className="btn btn-danger" onClick={() => handleDelete(deleteConfirm)}>
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
