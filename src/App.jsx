import { useState, useEffect } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from './services/firebase';
import Dashboard from './pages/Dashboard';
import AddProduct from './pages/AddProduct';
import Login from './pages/Login';
import ReviewsManager from './pages/ReviewsManager';
import OrdersManager from './pages/OrdersManager';
import StoreConfig from './pages/StoreConfig';
import './App.css';


function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [editProduct, setEditProduct] = useState(null);
  const [toast, setToast] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setCurrentPage('dashboard');
      setSidebarOpen(false);
    } catch (err) {
      showToast('Error logging out', 'error');
    }
  };

  const handleEditProduct = (product) => {
    setEditProduct(product);
    setCurrentPage('add');
  };

  const handleProductSaved = () => {
    setEditProduct(null);
    setCurrentPage('dashboard');
    showToast('Product saved successfully!');
  };

  const navigateTo = (page) => {
    setCurrentPage(page);
    setEditProduct(null);
    setSidebarOpen(false); // Close sidebar on mobile after navigation
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-dark)' }}>
        <p style={{ color: 'var(--primary)', fontWeight: 600 }}>Loading Saga Admin...</p>
      </div>
    );
  }

  if (!user) {
    return <Login showToast={showToast} />;
  }

  return (
    <div className="app-container">
      {/* Mobile Top Bar */}
      <div className="mobile-topbar">
        <div className="mobile-topbar-logo">
          <img src="/Logo.png" alt="Saga" />
          <span>Admin Panel</span>
        </div>
        <button className="hamburger-btn" onClick={() => setSidebarOpen(!sidebarOpen)} aria-label="Toggle menu">
          {sidebarOpen ? (
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
            </svg>
          )}
        </button>
      </div>

      {/* Sidebar Backdrop (mobile only) */}
      <div className={`sidebar-backdrop ${sidebarOpen ? 'open' : ''}`} onClick={() => setSidebarOpen(false)} />

      {/* Sidebar */}
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-logo" style={{ padding: '20px 24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <img src="/Logo.png" alt="Saga" style={{ height: '40px' }} />
          <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 600, letterSpacing: '2px', textTransform: 'uppercase' }}>Admin Panel</span>
        </div>
        <nav className="sidebar-nav">
          <button
            className={`sidebar-link ${currentPage === 'dashboard' ? 'active' : ''}`}
            onClick={() => navigateTo('dashboard')}
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
            </svg>
            Dashboard
          </button>
          <button
            className={`sidebar-link ${currentPage === 'add' ? 'active' : ''}`}
            onClick={() => navigateTo('add')}
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Add Product
          </button>
          <button
            className={`sidebar-link ${currentPage === 'reviews' ? 'active' : ''}`}
            onClick={() => navigateTo('reviews')}
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
            </svg>
            Reviews
          </button>
          <button
            className={`sidebar-link ${currentPage === 'orders' ? 'active' : ''}`}
            onClick={() => navigateTo('orders')}
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 1 0-7.5 0v4.5m11.356-1.993 1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 0 1-1.12-1.243l1.264-12A1.125 1.125 0 0 1 5.513 7.5h12.974c.576 0 1.059.435 1.119 1.007ZM8.625 10.5a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm7.5 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
            </svg>
            Orders
          </button>
          <button
            className={`sidebar-link ${currentPage === 'appearance' ? 'active' : ''}`}
            onClick={() => navigateTo('appearance')}
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.53 16.122a3 3 0 0 0-5.78 1.128 2.25 2.25 0 0 1-2.4 2.245 4.5 4.5 0 0 0 8.4-2.245c0-.399-.078-.78-.22-1.127Zm9.42-2.03a1.5 1.5 0 1 1-3.001 0 1.5 1.5 0 0 1 3.001 0ZM14.99 10.11a3 3 0 1 0-5.998 0 3 3 0 0 0 5.998 0Z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="m14.673 14.915-3.007-3.508m-3.329-3.974 6.336 7.482Zm0 0-4.563-5.369m10.906 12.894-3.008-3.508m0 0-4.562-5.369m0 0 5.107 6.012m-9.635-11.379a2.25 2.25 0 0 1 4.5 0 2.25 2.25 0 0 1-4.5 0Zm20.93 12.531a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
            </svg>
            Appearance
          </button>
        </nav>
        <button className="sidebar-link" onClick={handleLogout} style={{ marginTop: 'auto' }}>
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15m3 0 3-3m0 0-3-3m3 3H9" />
          </svg>
          Logout
        </button>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        {currentPage === 'dashboard' && (
          <Dashboard
            onEdit={handleEditProduct}
            onAddNew={() => { setCurrentPage('add'); setEditProduct(null); }}
            showToast={showToast}
          />
        )}
        {currentPage === 'add' && (
          <AddProduct
            editProduct={editProduct}
            onSave={handleProductSaved}
            onCancel={() => { setCurrentPage('dashboard'); setEditProduct(null); }}
            showToast={showToast}
          />
        )}
        {currentPage === 'reviews' && (
          <ReviewsManager showToast={showToast} />
        )}
        {currentPage === 'orders' && (
          <OrdersManager showToast={showToast} />
        )}
        {currentPage === 'appearance' && (
          <StoreConfig showToast={showToast} />
        )}
      </main>

      {/* Toast */}
      {toast && (
        <div className={`toast ${toast.type}`}>
          {toast.type === 'success' ? '✓' : '✕'} {toast.message}
        </div>
      )}
    </div>
  );
}

export default App;
