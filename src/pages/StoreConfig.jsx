import React, { useState, useEffect } from 'react';
import { fetchFestiveConfig, updateFestiveConfig } from '../services/siteConfig';

const CATEGORY_DEFAULTS = [
    { id: 'sets', name: 'Sets', image: '/Sets.jpg', subtitle: 'Complete heritage ensembles', position: 'center', fit: 'cover', scale: 1 },
    { id: 'necklaces', name: 'Necklaces', image: '/Necklace.jpeg', subtitle: 'Majestic neckpieces', position: 'center', fit: 'cover', scale: 1 },
    { id: 'earrings', name: 'Earrings', image: '/stock3.jpeg', subtitle: 'Radiance for your ears', position: 'center', fit: 'cover', scale: 1 },
    { id: 'bangles', name: 'Bangles', image: '/Bangles.png', subtitle: 'Exquisite wrist adornments', position: 'center', fit: 'cover', scale: 1 },
    { id: 'bracelets', name: 'Bracelets', image: '/Bracelets.jpeg', subtitle: 'Elegant modern classics', position: 'center', fit: 'cover', scale: 1 },
    { id: 'pendants', name: 'Pendants', image: '/Pendant.jpeg', subtitle: 'Heartfelt brilliance', position: 'center', fit: 'cover', scale: 1 },
    { id: 'rings', name: 'Rings', image: '/Rings.jpeg', subtitle: 'Symbols of eternity', position: 'center', fit: 'cover', scale: 1 },
];

const DEFAULT_CONFIG = {
    carousel: [
        { 
            src: '/stock1.jpeg', 
            title: 'Make Your Moments Beautiful',
            subtitle: 'Saga Exclusive'
        },
        { 
            src: '/stock2.jpeg', 
            title: 'Crafting Timeless Memories',
            subtitle: 'The Art of Jewelry'
        },
        { 
            src: '/stock3.jpeg', 
            title: 'Elegance for Every Occasion',
            subtitle: 'Curated Heritage'
        }
    ],
    items: [
        { src: '/stock1.jpeg', alt: 'Grid 1' },
        { src: '/stock2.jpeg', alt: 'Grid 2' },
        { src: '/Rings.jpeg', alt: 'Grid 3' },
        { src: '/stock3.jpeg', alt: 'Grid 4' }
    ],
    banner: { src: '/stock4.jpg', alt: 'Traditional Coming Soon' },
    categories: CATEGORY_DEFAULTS
};

export default function StoreConfig() {
    const [config, setConfig] = useState(DEFAULT_CONFIG);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

    useEffect(() => {
        const loadConfig = async () => {
            try {
                const data = await fetchFestiveConfig();
                if (data) {
                    // Merge categories if missing in old data
                    setConfig({
                        ...DEFAULT_CONFIG,
                        ...data,
                        categories: data.categories || CATEGORY_DEFAULTS
                    });
                }
            } catch (err) {
                console.error(err);
                setMessage({ type: 'error', text: 'Failed to load configuration' });
            } finally {
                setLoading(false);
            }
        };
        loadConfig();
    }, []);

    const handleRevert = () => {
        if (window.confirm('This will reset all images and text to the original store defaults. Continue?')) {
            setConfig(DEFAULT_CONFIG);
            setMessage({ type: 'warning', text: 'Reset to defaults. Don\'t forget to click Publish to save.' });
        }
    };

    const handleSave = async (section = 'all') => {
        setSaving(true);
        setMessage({ type: '', text: '' });
        try {
            await updateFestiveConfig(config);
            setMessage({ type: 'success', text: `Published ${section === 'all' ? 'changes' : section} successfully!` });
            setTimeout(() => setMessage({ type: '', text: '' }), 3000);
        } catch (err) {
            console.error(err);
            setMessage({ type: 'error', text: 'Failed to publish changes.' });
        } finally {
            setSaving(false);
        }
    };

    const updateCarousel = (index, field, value) => {
        const newCarousel = [...config.carousel];
        newCarousel[index][field] = value;
        setConfig({ ...config, carousel: newCarousel });
    };

    const updateItem = (index, field, value) => {
        const newItems = [...config.items];
        newItems[index][field] = value;
        setConfig({ ...config, items: newItems });
    };

    const updateCategory = (index, field, value) => {
        const newCats = [...config.categories];
        newCats[index][field] = value;
        setConfig({ ...config, categories: newCats });
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[#050505] text-white flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    const getImageUrl = (url) => {
        if (!url) return '';
        if (url.startsWith('http') || url.startsWith('data:')) return url;
        if (url.startsWith('/')) {
            // Check if we're in development and point to the store's dev server
            // In production, this would be the actual store URL
            return `http://localhost:5173${url}`;
        }
        return url;
    };

    return (
        <div className="store-config-page">
            <header className="page-header">
                <div>
                    <h1 className="page-title">Store Appearance</h1>
                    <p className="page-subtitle">Manage hero carousels and storefront images individually</p>
                </div>
                <button 
                    onClick={handleRevert}
                    className="btn btn-ghost"
                >
                    Revert to Defaults
                </button>
            </header>

            {message.text && (
                <div className={`toast ${message.type}`} style={{ position: 'fixed', zIndex: 1000 }}>
                    {message.type === 'success' ? '✓' : '✕'} {message.text}
                </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '48px' }}>
                {/* Hero Carousel Section */}
                <section className="card" style={{ borderTop: '4px solid var(--primary)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                        <div>
                            <h2 className="section-label" style={{ fontSize: '1.25rem', marginBottom: '4px', color: 'var(--text-primary)' }}>Main Hero Carousel</h2>
                            <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Changes here will affect the top-level slideshow</p>
                        </div>
                        <button 
                            onClick={handleSave}
                            disabled={saving}
                            className="btn btn-primary"
                            style={{ padding: '8px 24px' }}
                        >
                            {saving ? 'Updating...' : 'Update Carousel'}
                        </button>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
                        {config.carousel.map((slide, idx) => (
                            <div key={idx} className="tracking-card" style={{ padding: '24px', background: 'rgba(255,255,255,0.02)' }}>
                                <span className="section-label" style={{ color: 'var(--primary)' }}>Slide {idx + 1}</span>
                                
                                <img 
                                    src={getImageUrl(slide.src) || 'https://placehold.co/600x400/1a1a1a/666666?text=No+Image'} 
                                    alt="" 
                                    className="image-preview" 
                                    style={{ width: '100%', maxWidth: 'none', height: '180px', marginBottom: '24px', borderRadius: '12px' }}
                                />

                                <div className="form-group">
                                    <label className="form-label">Image URL <span style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>(16:9 or 21:9)</span></label>
                                    <input 
                                        type="text" 
                                        value={slide.src} 
                                        onChange={(e) => updateCarousel(idx, 'src', e.target.value)}
                                        className="form-input"
                                        placeholder="https://..."
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Main Title</label>
                                    <input 
                                        type="text" 
                                        value={slide.title} 
                                        onChange={(e) => updateCarousel(idx, 'title', e.target.value)}
                                        className="form-input"
                                        placeholder="e.g. Exclusive Collection"
                                    />
                                </div>
                                <div className="form-group" style={{ marginBottom: 0 }}>
                                    <label className="form-label">Subtitle / Label</label>
                                    <input 
                                        type="text" 
                                        value={slide.subtitle} 
                                        onChange={(e) => updateCarousel(idx, 'subtitle', e.target.value)}
                                        className="form-input"
                                        placeholder="e.g. Saga Special"
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', gap: '32px' }}>
                    {/* Festive Grid */}
                    <section className="card" style={{ borderTop: '4px solid #3b82f6' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                            <h2 className="section-label" style={{ fontSize: '1.1rem', marginBottom: 0, color: 'var(--text-primary)' }}>Festive Grid Images</h2>
                            <button 
                                onClick={() => handleSave('grid')}
                                disabled={saving}
                                className="btn btn-ghost btn-small"
                                style={{ borderColor: '#3b82f6', color: '#3b82f6' }}
                            >
                                {saving ? 'Saving...' : 'Update Grid'}
                            </button>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                            {config.items.map((item, idx) => (
                                <div key={idx} className="form-group" style={{ marginBottom: '12px' }}>
                                    <img 
                                        src={getImageUrl(item.src) || 'https://placehold.co/400x400/1a1a1a/666666?text=Placeholder'} 
                                        alt="" 
                                        className="image-preview" 
                                        style={{ width: '100%', maxWidth: 'none', height: '140px', borderRadius: '8px' }}
                                    />
                                    <label className="form-label" style={{ fontSize: '0.7rem' }}>Image {idx + 1} <span style={{ color: 'var(--text-muted)' }}>(1:1 Square)</span></label>
                                    <input 
                                        type="text" 
                                        value={item.src} 
                                        onChange={(e) => updateItem(idx, 'src', e.target.value)}
                                        className="form-input"
                                        style={{ marginTop: '4px', fontSize: '0.8rem' }}
                                        placeholder="Image URL"
                                    />
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* Promotion Banner */}
                    <section className="card" style={{ borderTop: '4px solid #22c55e' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                            <h2 className="section-label" style={{ fontSize: '1.1rem', marginBottom: 0, color: 'var(--text-primary)' }}>Main Promotion Banner</h2>
                            <button 
                                onClick={() => handleSave('banner')}
                                disabled={saving}
                                className="btn btn-ghost btn-small"
                                style={{ borderColor: '#22c55e', color: '#22c55e' }}
                            >
                                {saving ? 'Saving...' : 'Update Banner'}
                            </button>
                        </div>
                        <div className="form-group">
                            <img 
                                src={getImageUrl(config.banner.src) || 'https://placehold.co/1200x400/1a1a1a/666666?text=Banner+Preview'} 
                                alt="" 
                                className="image-preview" 
                                style={{ width: '100%', maxWidth: 'none', height: '200px', borderRadius: '12px' }}
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Banner Image URL <span style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>(21:9 Ultra-Wide)</span></label>
                            <input 
                                type="text" 
                                value={config.banner.src} 
                                onChange={(e) => setConfig({ ...config, banner: { ...config.banner, src: e.target.value } })}
                                className="form-input"
                                placeholder="https://..."
                            />
                        </div>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                            <label className="form-label">Banner Text (Alt Content)</label>
                            <input 
                                type="text" 
                                value={config.banner.alt} 
                                onChange={(e) => setConfig({ ...config, banner: { ...config.banner, alt: e.target.value } })}
                                className="form-input"
                                placeholder="e.g. Traditional Wedding Edit"
                            />
                        </div>
                    </section>
                </div>

                {/* Categories Management Section */}
                <section className="card" style={{ borderTop: '4px solid #a855f7' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                        <div>
                            <h2 className="section-label" style={{ fontSize: '1.25rem', marginBottom: '4px', color: 'var(--text-primary)' }}>Category Hero & Grid Management</h2>
                            <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Manage images for category pages and the 'Shop by Category' section</p>
                        </div>
                        <button 
                            onClick={() => handleSave('categories')}
                            disabled={saving}
                            className="btn btn-primary"
                            style={{ background: '#a855f7', borderColor: '#a855f7' }}
                        >
                            {saving ? 'Saving...' : 'Update Categories'}
                        </button>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px' }}>
                        {config.categories.map((cat, idx) => (
                            <div key={cat.id} className="tracking-card" style={{ padding: '20px', border: '1px solid rgba(168, 85, 247, 0.2)' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#a855f7' }}></div>
                                    <span className="section-label" style={{ marginBottom: 0 }}>{cat.name}</span>
                                </div>

                                <img 
                                    src={getImageUrl(cat.image) || 'https://placehold.co/400x400/1a1a1a/666666?text=Category'} 
                                    alt="" 
                                    className="image-preview" 
                                    style={{ 
                                        width: '100%', 
                                        maxWidth: 'none', 
                                        height: '140px', 
                                        borderRadius: '8px', 
                                        marginBottom: '20px',
                                        objectFit: cat.fit || 'cover',
                                        objectPosition: cat.position || 'center',
                                        transform: `scale(${cat.scale || 1})`
                                    }}
                                />

                                <div className="form-group">
                                    <label className="form-label">
                                        Hero / Grid Image 
                                        <span style={{ color: 'var(--text-muted)', fontSize: '0.65rem', marginLeft: '6px' }}>
                                            ({idx === 0 ? '21:9' : (idx < 3 ? '16:9' : '1:1')})
                                        </span>
                                    </label>
                                    <input 
                                        type="text" 
                                        value={cat.image} 
                                        onChange={(e) => updateCategory(idx, 'image', e.target.value)}
                                        className="form-input"
                                        placeholder="URL"
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Category Subtitle</label>
                                    <input 
                                        type="text" 
                                        value={cat.subtitle} 
                                        onChange={(e) => updateCategory(idx, 'subtitle', e.target.value)}
                                        className="form-input"
                                        placeholder="Tagline"
                                    />
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '16px' }}>
                                    <div className="form-group" style={{ marginBottom: 0 }}>
                                        <label className="form-label">Display Mode</label>
                                        <select 
                                            value={cat.fit || 'cover'} 
                                            onChange={(e) => updateCategory(idx, 'fit', e.target.value)}
                                            className="form-select"
                                            style={{ padding: '8px 12px', fontSize: '0.8rem' }}
                                        >
                                            <option value="cover">Aspect Fill (Cover)</option>
                                            <option value="contain">Aspect Fit (Contain)</option>
                                            <option value="fill">Scale to Fill (Stretch)</option>
                                        </select>
                                    </div>
                                    <div className="form-group" style={{ marginBottom: 0 }}>
                                        <label className="form-label">Alignment</label>
                                        <select 
                                            value={cat.position || 'center'} 
                                            onChange={(e) => updateCategory(idx, 'position', e.target.value)}
                                            className="form-select"
                                            style={{ padding: '8px 12px', fontSize: '0.8rem' }}
                                        >
                                            <option value="center">Center</option>
                                            <option value="top">Top</option>
                                            <option value="bottom">Bottom</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="form-group" style={{ marginTop: '12px', marginBottom: 0 }}>
                                    <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        Zoom Level <span>{cat.scale || 1}x</span>
                                    </label>
                                    <input 
                                        type="range"
                                        min="0.5"
                                        max="2"
                                        step="0.1"
                                        value={cat.scale || 1}
                                        onChange={(e) => updateCategory(idx, 'scale', parseFloat(e.target.value))}
                                        style={{ width: '100%', accentColor: 'var(--primary)' }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            </div>
        </div>
    );
}
