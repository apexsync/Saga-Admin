import { useState, useEffect } from 'react';
import { fetchAllReviews, deleteReview, respondToReview } from '../services/reviews';

export default function ReviewsManager({ showToast }) {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [savingReply, setSavingReply] = useState(false);

  const loadReviews = async () => {
    setLoading(true);
    const data = await fetchAllReviews();
    setReviews(data);
    setLoading(false);
  };

  useEffect(() => {
    loadReviews();
  }, []);

  const handleDelete = async (reviewId) => {
    try {
      await deleteReview(reviewId);
      setReviews(reviews.filter(r => r.id !== reviewId));
      setDeleteConfirm(null);
      showToast('Review deleted successfully');
    } catch (err) {
      showToast('Failed to delete review', 'error');
    }
  };

  const handleReply = async (e) => {
    e.preventDefault();
    if (!replyText.trim()) return;

    setSavingReply(true);
    try {
      await respondToReview(replyingTo.id, replyText);
      showToast('Reply saved successfully!');
      setReplyingTo(null);
      setReplyText('');
      loadReviews();
    } catch (err) {
      showToast('Failed to save reply', 'error');
    } finally {
      setSavingReply(false);
    }
  };

  const startReply = (review) => {
    setReplyingTo(review);
    setReplyText(review.adminReply || '');
  };

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">Product Reviews</h1>
          <p className="page-subtitle">Moderate feedback and engage with your customers</p>
        </div>
        <button className="btn btn-ghost" onClick={loadReviews}>
          Refresh
        </button>
      </div>

      <div className="table-container">
        {loading ? (
          <div className="empty-state">
            <p>Loading reviews...</p>
          </div>
        ) : reviews.length === 0 ? (
          <div className="empty-state">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
            </svg>
            <h3>No reviews yet</h3>
            <p>Reviews from customers will appear here.</p>
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Product</th>
                <th>Customer</th>
                <th>Rating</th>
                <th>Feedback</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {reviews.map(review => (
                <tr key={review.id}>
                  <td style={{ maxWidth: 150 }}>
                    <div style={{ fontSize: '0.8rem', fontWeight: 600 }}>{review.productName || 'General'}</div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                        {review.productId?.slice(-6).toUpperCase()}
                    </div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontWeight: 600 }}>{review.userName || 'Anonymous'}</span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{review.userEmail}</span>
                    </div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', color: '#f59e0b' }}>
                        {[...Array(5)].map((_, i) => (
                            <svg key={i} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill={i < review.rating ? "currentColor" : "none"} stroke="currentColor" strokeWidth={1.5} style={{ width: 14, height: 14 }}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
                            </svg>
                        ))}
                    </div>
                  </td>
                  <td>
                    <div style={{ maxWidth: 300 }}>
                        <p style={{ fontSize: '0.875rem', whiteSpace: 'normal' }}>{review.comment}</p>
                        {review.adminReply && (
                            <div style={{ marginTop: 8, padding: 8, background: 'rgba(251, 112, 16, 0.05)', borderLeft: '2px solid var(--primary)', borderRadius: '0 4px 4px 0' }}>
                                <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--primary)', display: 'block', textTransform: 'uppercase' }}>Your Reply</span>
                                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: 2 }}>{review.adminReply}</p>
                            </div>
                        )}
                    </div>
                  </td>
                  <td>
                    {review.adminReply ? (
                        <span className="category-badge" style={{ background: 'rgba(34, 197, 94, 0.1)', color: 'var(--success)', borderColor: 'rgba(34, 197, 94, 0.2)' }}>Replied</span>
                    ) : (
                        <span className="category-badge" style={{ background: 'rgba(245, 158, 11, 0.1)', color: 'var(--warning)', borderColor: 'rgba(245, 158, 11, 0.2)' }}>Pending</span>
                    )}
                  </td>
                  <td>
                    <div className="actions-cell">
                        <button className="btn btn-ghost btn-small" onClick={() => startReply(review)}>
                            {review.adminReply ? 'Edit' : 'Reply'}
                        </button>
                        <button className="btn btn-danger btn-small" onClick={() => setDeleteConfirm(review.id)}>
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

       {/* Reply Modal */}
       {replyingTo && (
        <div className="modal-overlay" onClick={() => setReplyingTo(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Reply to {replyingTo.userName}</h2>
              <button className="modal-close" onClick={() => setReplyingTo(null)}>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{ width: 24, height: 24 }}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div style={{ marginBottom: 24 }}>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: 8 }}>Customer Review for <strong style={{color: 'var(--text-primary)'}}>{replyingTo.productName || 'Product'}</strong>:</p>
                <div style={{ padding: 16, background: 'var(--bg-input)', borderRadius: 12, border: '1px solid var(--border)' }}>
                    <p style={{ fontSize: '0.9rem' }}>"{replyingTo.comment}"</p>
                </div>
            </div>

            <form onSubmit={handleReply}>
                <div className="form-group">
                    <label className="form-label">Your Response</label>
                    <textarea 
                        className="form-textarea" 
                        placeholder="Type your reply here... (e.g. Thank you for your feedback! Glad you liked it.)"
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        required
                        autoFocus
                        rows={4}
                    />
                </div>
                <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
                    <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={savingReply}>
                        {savingReply ? 'Saving...' : 'Send Reply'}
                    </button>
                    <button type="button" className="btn btn-ghost" onClick={() => setReplyingTo(null)}>Cancel</button>
                </div>
            </form>
          </div>
        </div>
      )}

       {/* Delete Confirmation */}
       {deleteConfirm && (
        <div className="modal-overlay" onClick={() => setDeleteConfirm(null)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 400, textAlign: 'center' }}>
            <h3 style={{ marginBottom: 8 }}>Delete Review?</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: 24 }}>
              Are you sure you want to remove this customer review?
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
