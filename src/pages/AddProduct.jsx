import { useState, useEffect } from 'react';
import { addProduct, updateProduct } from '../services/products';

const CATEGORIES = [
  'Bangles',
  'Bracelets',
  'Earrings',
  'Necklaces',
  'Pendants',
  'Rings',
  'Anklets',
];

export default function AddProduct({ editProduct, onSave, onCancel, showToast }) {
  const [form, setForm] = useState({
    name: '',
    price: '',
    category: CATEGORIES[0],
    description: '',
    imageUrl: '',
    media: [], // [{ url: '', type: 'image' }]
    material: 'Gold',
    purity: '',
    weight: '',
    sizes: '', // e.g. "6, 7, 8" or "Standard"
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
        media: editProduct.media || [],
        material: editProduct.material || 'Gold',
        purity: editProduct.purity || '',
        weight: editProduct.weight || '',
        sizes: editProduct.sizes || '',
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

  const handleMediaChange = (index, field, value) => {
    const newMedia = [...form.media];
    newMedia[index] = { ...newMedia[index], [field]: value };
    setForm(prev => ({ ...prev, media: newMedia }));
  };

  const addMediaField = () => {
    setForm(prev => ({
      ...prev,
      media: [...prev.media, { url: '', type: 'image' }]
    }));
  };

  const removeMediaField = (index) => {
    setForm(prev => ({
      ...prev,
      media: prev.media.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.name.trim() || !form.price || !form.category) {
      showToast('Please fill in all required fields', 'error');
      return;
    }

    setSaving(true);
    try {
      const filteredMedia = form.media.filter(item => item.url.trim() !== '');
      const submissionData = { ...form, media: filteredMedia };

      if (editProduct) {
        await updateProduct(editProduct.id, submissionData);
      } else {
        await addProduct(submissionData);
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
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <select 
                  name="material" 
                  className="form-select" 
                  value={['Gold', 'Silver', 'Brass', 'Alloy', 'Copper', 'Platinum'].includes(form.material) ? form.material : 'Other'} 
                  onChange={(e) => {
                    if (e.target.value === 'Other') {
                      setForm(prev => ({ ...prev, material: '' }));
                    } else {
                      handleChange(e);
                    }
                  }}
                >
                  <option value="Gold">Gold</option>
                  <option value="Silver">Silver</option>
                  <option value="Brass">Brass</option>
                  <option value="Alloy">Alloy</option>
                  <option value="Copper">Copper</option>
                  <option value="Platinum">Platinum</option>
                  <option value="Other">Other (Custom)</option>
                </select>
                
                {(!['Gold', 'Silver', 'Brass', 'Alloy', 'Copper', 'Platinum'].includes(form.material) || form.material === '') && (
                  <input
                    type="text"
                    name="material"
                    className="form-input"
                    placeholder="Enter custom material (e.g. Bronze)"
                    value={form.material}
                    onChange={handleChange}
                    autoFocus
                  />
                )}
              </div>
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
              <label className="form-label">Sizes (Available)</label>
              <input
                type="text"
                name="sizes"
                className="form-input"
                placeholder="e.g. 6, 7, 8 or S, M, L"
                value={form.sizes}
                onChange={handleChange}
              />
            </div>
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
            <label className="form-label">Cover Image URL</label>
            <input
              type="url"
              name="imageUrl"
              className="form-input"
              placeholder="https://example.com/cover.jpg"
              value={form.imageUrl}
              onChange={handleChange}
            />
            {form.imageUrl && (
              <img
                src={form.imageUrl}
                alt="Preview"
                className="image-preview"
                style={{ marginTop: 12, borderRadius: 8, maxWidth: '200px', display: 'block' }}
                onError={(e) => { e.target.style.display = 'none'; }}
              />
            )}
          </div>

          <div style={{ margin: '24px 0 16px', paddingBottom: 8, borderBottom: '1px solid var(--border)', fontSize: '0.85rem', fontWeight: 600, color: 'var(--primary)' }}>
            ADDITIONAL MEDIA (IMAGES & VIDEOS)
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 24 }}>
            {form.media.map((item, index) => (
              <div key={index} style={{ padding: 16, background: 'rgba(255,255,255,0.03)', borderRadius: 12, border: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                  <div style={{ flex: 1 }}>
                    <label className="form-label">Media URL</label>
                    <input
                      type="url"
                      className="form-input"
                      placeholder={item.type === 'video' ? 'https://youtube.com/...' : 'https://example.com/image.jpg'}
                      value={item.url}
                      onChange={(e) => handleMediaChange(index, 'url', e.target.value)}
                    />
                  </div>
                  <div style={{ width: 100 }}>
                    <label className="form-label">Type</label>
                    <select
                      className="form-select"
                      value={item.type}
                      onChange={(e) => handleMediaChange(index, 'type', e.target.value)}
                    >
                      <option value="image">Image</option>
                      <option value="video">Video</option>
                    </select>
                  </div>
                  <button 
                    type="button" 
                    className="btn btn-ghost" 
                    style={{ marginTop: 28, color: '#ff4d4f', padding: '8px' }}
                    onClick={() => removeMediaField(index)}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{ width: 20 }}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                    </svg>
                  </button>
                </div>

                {item.url && item.type === 'image' && (
                  <img src={item.url} alt="Media Preview" style={{ marginTop: 12, borderRadius: 8, height: 80, width: 80, objectFit: 'cover' }} />
                )}
                
                {item.url && item.type === 'video' && (
                  <div style={{ marginTop: 12, fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{ width: 14 }}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="m15.75 10.5 4.72-4.72a.75.75 0 0 1 1.28.53v11.38a.75.75 0 0 1-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 0 0 2.25-2.25v-9a2.25 2.25 0 0 0-2.25-2.25h-9A2.25 2.25 0 0 0 2.25 7.5v9a2.25 2.25 0 0 0 2.25 2.25Z" />
                    </svg>
                    Video link added
                  </div>
                )}
              </div>
            ))}

            <button type="button" className="btn btn-ghost" onClick={addMediaField} style={{ border: '1px dashed var(--border)', justifyContent: 'center' }}>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{ width: 20 }}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              Add Photo or Video
            </button>
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
