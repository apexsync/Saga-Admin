import { useState, useEffect } from 'react';
import { addProduct, updateProduct } from '../services/products';

const CATEGORIES = [
  'Bangles',
  'Bracelets',
  'Earrings',
  'Necklaces',
  'Pendants',
  'Rings',
];

export default function AddProduct({ editProduct, onSave, onCancel, showToast }) {
  const [form, setForm] = useState({
    name: '',
    price: '',
    category: CATEGORIES[0],
    description: '',
    imageUrl: '',
    material: 'Gold',
    purity: '',
    weight: '',
    stock: '',
    metalColor: 'Yellow',
    gemstones: 'None',
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (editProduct) {
      setForm({
        name: editProduct.name || '',
        price: editProduct.price?.toString() || '',
        category: editProduct.category || CATEGORIES[0],
        description: editProduct.description || '',
        imageUrl: editProduct.imageUrl || '',
        material: editProduct.material || 'Gold',
        purity: editProduct.purity || '',
        weight: editProduct.weight || '',
        stock: editProduct.stock?.toString() || '',
        metalColor: editProduct.metalColor || 'Yellow',
        gemstones: editProduct.gemstones || 'None',
      });
    }
  }, [editProduct]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.name.trim() || !form.price || !form.category) {
      showToast('Please fill in all required fields', 'error');
      return;
    }

    setSaving(true);
    try {
      if (editProduct) {
        await updateProduct(editProduct.id, form);
      } else {
        await addProduct(form);
      }
      onSave();
    } catch (err) {
      showToast('Failed to save product', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">{editProduct ? 'Edit Product' : 'Add New Product'}</h1>
          <p className="page-subtitle">
            {editProduct ? 'Update the product details below' : 'Fill in the details to add a new product to your store'}
          </p>
        </div>
        <button className="btn btn-ghost" onClick={onCancel}>
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 15 3 9m0 0 6-6M3 9h12a6 6 0 0 1 0 12h-3" />
          </svg>
          Back to Dashboard
        </button>
      </div>

      <div className="card" style={{ maxWidth: 640 }}>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Product Name *</label>
            <input
              type="text"
              name="name"
              className="form-input"
              placeholder="e.g. Gold Filigree Bangle"
              value={form.name}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Price (₹) *</label>
              <input
                type="number"
                name="price"
                className="form-input"
                placeholder="e.g. 2500"
                value={form.price}
                onChange={handleChange}
                min="0"
                step="1"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Category *</label>
              <select
                name="category"
                className="form-select"
                value={form.category}
                onChange={handleChange}
                required
              >
                {CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ margin: '24px 0 16px', paddingBottom: 8, borderBottom: '1px solid var(--border)', fontSize: '0.85rem', fontWeight: 600, color: 'var(--primary)' }}>
            PRODUCT SPECIFICATIONS
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Material</label>
              <select name="material" className="form-select" value={form.material} onChange={handleChange}>
                <option value="Gold">Gold</option>
                <option value="Silver">Silver</option>
                <option value="Brass">Brass</option>
                <option value="Alloy">Alloy</option>
                <option value="Copper">Copper</option>
                <option value="Platinum">Platinum</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Purity (e.g. 22K, 925)</label>
              <input
                type="text"
                name="purity"
                className="form-input"
                placeholder="e.g. 18K"
                value={form.purity}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Metal Color</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <select 
                  name="metalColor" 
                  className="form-select" 
                  value={['Yellow', 'Silver', 'Rose Gold', 'Antique'].includes(form.metalColor) ? form.metalColor : 'Other'} 
                  onChange={(e) => {
                    if (e.target.value === 'Other') {
                      setForm(prev => ({ ...prev, metalColor: '' }));
                    } else {
                      handleChange(e);
                    }
                  }}
                >
                  <option value="Yellow">Yellow</option>
                  <option value="Silver">Silver/White</option>
                  <option value="Rose Gold">Rose Gold</option>
                  <option value="Antique">Antique</option>
                  <option value="Other">Other (Custom)</option>
                </select>
                
                {(!['Yellow', 'Silver', 'Rose Gold', 'Antique'].includes(form.metalColor) || form.metalColor === '') && (
                  <input
                    type="text"
                    name="metalColor"
                    className="form-input"
                    placeholder="Enter custom color (e.g. Copper Finish)"
                    value={form.metalColor}
                    onChange={handleChange}
                    autoFocus
                  />
                )}
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Gemstones</label>
              <input
                type="text"
                name="gemstones"
                className="form-input"
                placeholder="e.g. CZ, Ruby, None"
                value={form.gemstones}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Weight (grams)</label>
              <input
                type="text"
                name="weight"
                className="form-input"
                placeholder="e.g. 12.5g"
                value={form.weight}
                onChange={handleChange}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Stock Quantity *</label>
              <input
                type="number"
                name="stock"
                className="form-input"
                placeholder="e.g. 10"
                value={form.stock}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea
              name="description"
              className="form-textarea"
              placeholder="Describe the product details, design, and care instructions..."
              value={form.description}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Image URL</label>
            <input
              type="url"
              name="imageUrl"
              className="form-input"
              placeholder="https://example.com/image.jpg"
              value={form.imageUrl}
              onChange={handleChange}
            />
            {form.imageUrl && (
              <img
                src={form.imageUrl}
                alt="Preview"
                className="image-preview"
                onError={(e) => { e.target.style.display = 'none'; }}
                onLoad={(e) => { e.target.style.display = 'block'; }}
              />
            )}
          </div>

          <div style={{ display: 'flex', gap: 12, paddingTop: 12 }}>
            <button type="button" className="btn btn-ghost" onClick={onCancel}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving
                ? 'Saving...'
                : editProduct
                  ? 'Update Product'
                  : 'Add Product'}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
