'use client';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, FileSpreadsheet, Trash2, Search, RefreshCw, Download, Plus, X, List } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import styles from './brands.module.css';

export const dynamic = 'force-dynamic';

export default function BrandsPage() {
    const [brands, setBrands] = useState([]);
    const [loading, setLoading] = useState(true);
    const [importing, setImporting] = useState(false);
    const [uploadStatus, setUploadStatus] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [showAddModal, setShowAddModal] = useState(false);
    const [showBulkModal, setShowBulkModal] = useState(false);
    const [newBrandName, setNewBrandName] = useState('');
    const [bulkBrands, setBulkBrands] = useState('');
    const [deletingId, setDeletingId] = useState(null);

    const fetchBrands = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('brands')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) console.error("Fetch Brands Error:", error.message || error);
        else setBrands(data || []);
        setLoading(false);
    };

    useEffect(() => {
        fetchBrands();
    }, []);

    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setImporting(true);
        setUploadStatus(null);
        const formData = new FormData();
        formData.append('file', file);

        try {
            const res = await fetch('/api/brands/import-xls', {
                method: 'POST',
                body: formData
            });
            const data = await res.json();
            if (res.ok) {
                setUploadStatus({ type: 'success', message: data.message });
                fetchBrands();
            } else {
                setUploadStatus({ type: 'error', message: data.error });
            }
        } catch (err) {
            setUploadStatus({ type: 'error', message: err.message });
        } finally {
            setImporting(false);
        }
    };

    const handleDownloadSample = () => {
        const csvContent = `Brand Name
Nike
Adidas
Puma
Reebok
Apple
Samsung`;

        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'brand-sample.csv';
        a.click();
    };

    const handleAddSingleBrand = async () => {
        if (!newBrandName.trim()) return;

        const { error } = await supabase
            .from('brands')
            .insert([{
                name: newBrandName.trim(),
                normalized_name: newBrandName.trim().toLowerCase()
            }]);

        if (error) {
            setUploadStatus({ type: 'error', message: error.message });
        } else {
            setUploadStatus({ type: 'success', message: 'Brand added successfully!' });
            setNewBrandName('');
            setShowAddModal(false);
            fetchBrands();
        }
    };

    const handleBulkAdd = async () => {
        const brandNames = bulkBrands
            .split('\n')
            .map(name => name.trim())
            .filter(name => name.length > 0);

        if (brandNames.length === 0) return;

        const brandsToInsert = brandNames.map(name => ({
            name: name,
            normalized_name: name.toLowerCase()
        }));

        const { error } = await supabase
            .from('brands')
            .insert(brandsToInsert);

        if (error) {
            setUploadStatus({ type: 'error', message: error.message });
        } else {
            setUploadStatus({ type: 'success', message: `${brandNames.length} brands added successfully!` });
            setBulkBrands('');
            setShowBulkModal(false);
            fetchBrands();
        }
    };

    const handleDeleteBrand = async (id) => {
        setDeletingId(id);
        const { error } = await supabase
            .from('brands')
            .delete()
            .eq('id', id);

        if (error) {
            setUploadStatus({ type: 'error', message: error.message });
        } else {
            setUploadStatus({ type: 'success', message: 'Brand deleted successfully!' });
            fetchBrands();
        }
        setDeletingId(null);
    };

    const filteredBrands = brands.filter(b =>
        b.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <h1 className={styles.title}>Brand Library</h1>
                <p className={styles.subtitle}>Manage your known brands database</p>
            </header>

            {/* Management Options */}
            <div className={styles.optionsGrid}>
                {/* Upload Excel */}
                <div className={styles.optionCard}>
                    <FileSpreadsheet size={28} className={styles.optionIcon} />
                    <h3>Import from Excel</h3>
                    <p>Upload .xlsx or .xls file</p>
                    <input
                        type="file"
                        accept=".xlsx, .xls"
                        id="xls-upload"
                        hidden
                        onChange={handleFileUpload}
                        disabled={importing}
                    />
                    <label htmlFor="xls-upload" className={styles.optionBtn}>
                        {importing ? <RefreshCw className={styles.spin} size={16} /> : <Upload size={16} />}
                        {importing ? 'Importing...' : 'Upload'}
                    </label>
                </div>

                {/* Download Sample */}
                <div className={styles.optionCard}>
                    <Download size={28} className={styles.optionIcon} />
                    <h3>Download Sample</h3>
                    <p>Get example CSV template</p>
                    <button className={styles.optionBtn} onClick={handleDownloadSample}>
                        <Download size={16} />
                        Download
                    </button>
                </div>

                {/* Add Single Brand */}
                <div className={styles.optionCard}>
                    <Plus size={28} className={styles.optionIcon} />
                    <h3>Add Single Brand</h3>
                    <p>Add one brand manually</p>
                    <button className={styles.optionBtn} onClick={() => setShowAddModal(true)}>
                        <Plus size={16} />
                        Add Brand
                    </button>
                </div>

                {/* Bulk Paste */}
                <div className={styles.optionCard}>
                    <List size={28} className={styles.optionIcon} />
                    <h3>Paste Brand List</h3>
                    <p>Add multiple brands at once</p>
                    <button className={styles.optionBtn} onClick={() => setShowBulkModal(true)}>
                        <List size={16} />
                        Paste List
                    </button>
                </div>
            </div>

            {uploadStatus && (
                <motion.div
                    className={`${styles.status} ${styles[uploadStatus.type]}`}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    {uploadStatus.message}
                </motion.div>
            )}

            {/* Brands Grid Section */}
            <div className={styles.brandsCard}>
                <div className={styles.brandsHeader}>
                    <h2>My Brands ({brands.length})</h2>
                    <div className={styles.searchBox}>
                        <Search size={18} />
                        <input
                            type="text"
                            placeholder="Search brands..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                {loading ? (
                    <p className={styles.emptyState}>Loading brands...</p>
                ) : filteredBrands.length === 0 ? (
                    <p className={styles.emptyState}>No brands found.</p>
                ) : (
                    <div className={styles.brandsGrid}>
                        {filteredBrands.map((brand, index) => (
                            <motion.div
                                key={brand.id}
                                className={styles.brandBox}
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: index * 0.02, duration: 0.3 }}
                                whileHover={{ scale: 1.05, y: -4 }}
                            >
                                <div className={styles.brandName}>{brand.name}</div>
                                <button
                                    className={styles.deleteBtn}
                                    onClick={() => handleDeleteBrand(brand.id)}
                                    disabled={deletingId === brand.id}
                                >
                                    {deletingId === brand.id ? (
                                        <RefreshCw size={14} className={styles.spin} />
                                    ) : (
                                        <Trash2 size={14} />
                                    )}
                                </button>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>

            {/* Add Single Brand Modal */}
            <AnimatePresence>
                {showAddModal && (
                    <motion.div
                        className={styles.modalOverlay}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setShowAddModal(false)}
                    >
                        <motion.div
                            className={styles.modal}
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className={styles.modalHeader}>
                                <h3>Add Single Brand</h3>
                                <button onClick={() => setShowAddModal(false)}>
                                    <X size={20} />
                                </button>
                            </div>
                            <div className={styles.modalBody}>
                                <label>Brand Name</label>
                                <input
                                    type="text"
                                    placeholder="Enter brand name..."
                                    value={newBrandName}
                                    onChange={(e) => setNewBrandName(e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && handleAddSingleBrand()}
                                    autoFocus
                                />
                            </div>
                            <div className={styles.modalFooter}>
                                <button className={styles.cancelBtn} onClick={() => setShowAddModal(false)}>
                                    Cancel
                                </button>
                                <button className={styles.addBtn} onClick={handleAddSingleBrand}>
                                    <Plus size={16} />
                                    Add Brand
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Bulk Add Modal */}
            <AnimatePresence>
                {showBulkModal && (
                    <motion.div
                        className={styles.modalOverlay}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setShowBulkModal(false)}
                    >
                        <motion.div
                            className={styles.modal}
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className={styles.modalHeader}>
                                <h3>Paste Brand List</h3>
                                <button onClick={() => setShowBulkModal(false)}>
                                    <X size={20} />
                                </button>
                            </div>
                            <div className={styles.modalBody}>
                                <label>Brand Names (one per line)</label>
                                <textarea
                                    placeholder="Nike&#10;Adidas&#10;Puma&#10;..."
                                    value={bulkBrands}
                                    onChange={(e) => setBulkBrands(e.target.value)}
                                    rows={10}
                                    autoFocus
                                />
                                <p className={styles.hint}>
                                    {bulkBrands.split('\n').filter(n => n.trim()).length} brands to add
                                </p>
                            </div>
                            <div className={styles.modalFooter}>
                                <button className={styles.cancelBtn} onClick={() => setShowBulkModal(false)}>
                                    Cancel
                                </button>
                                <button className={styles.addBtn} onClick={handleBulkAdd}>
                                    <Plus size={16} />
                                    Add All
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
