
'use client';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Upload, FileSpreadsheet, Trash2, Search, RefreshCw } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import styles from './brands.module.css';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

export default function BrandsPage() {
    const [brands, setBrands] = useState([]);
    const [loading, setLoading] = useState(true);
    const [importing, setImporting] = useState(false);
    const [uploadStatus, setUploadStatus] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');

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

    const filteredBrands = brands.filter(b =>
        b.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <h1 className={styles.title}>Brand Library</h1>
                <p className={styles.subtitle}>Manage your known brands database</p>
            </header>

            {/* Upload Section */}
            <div className={styles.uploadSection}>
                <div className={styles.uploadCard}>
                    <div className={styles.iconWrapper}>
                        <FileSpreadsheet size={32} />
                    </div>
                    <div>
                        <h3>Import Brands</h3>
                        <p>Upload an Excel (.xls/.xlsx) file to bulk import brands.</p>
                    </div>
                    <div className={styles.actions}>
                        <input
                            type="file"
                            accept=".xlsx, .xls"
                            id="xls-upload"
                            hidden
                            onChange={handleFileUpload}
                            disabled={importing}
                        />
                        <label htmlFor="xls-upload" className={styles.uploadBtn}>
                            {importing ? <RefreshCw className={styles.spin} /> : <Upload size={18} />}
                            {importing ? 'Importing...' : 'Upload Excel'}
                        </label>
                    </div>
                </div>
                {uploadStatus && (
                    <div className={`${styles.status} ${styles[uploadStatus.type]}`}>
                        {uploadStatus.message}
                    </div>
                )}
            </div>

            {/* Table Section */}
            <div className={styles.tableCard}>
                <div className={styles.tableHeader}>
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

                <div className={styles.tableWrapper}>
                    <table className={styles.table}>
                        <thead>
                            <tr>
                                <th>Brand Name</th>
                                <th>Reg. #</th>
                                <th>Class</th>
                                <th>Status</th>
                                <th>Filing Date</th>
                                <th>Expiry</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan="6" className={styles.loadingCell}>Loading brands...</td></tr>
                            ) : filteredBrands.length === 0 ? (
                                <tr><td colSpan="6" className={styles.emptyCell}>No brands found.</td></tr>
                            ) : (
                                filteredBrands.map(brand => (
                                    <tr key={brand.id}>
                                        <td style={{ fontWeight: 600 }}>{brand.name}</td>
                                        <td className={styles.mono}>{brand.registration_number || '-'}</td>
                                        <td className={styles.mono}>{brand.nice_class || '-'}</td>
                                        <td>
                                            {brand.status ? (
                                                <span style={{
                                                    padding: '2px 8px',
                                                    borderRadius: '4px',
                                                    background: 'rgba(255,255,255,0.1)',
                                                    fontSize: '0.85em'
                                                }}>
                                                    {brand.status}
                                                </span>
                                            ) : '-'}
                                        </td>
                                        <td className={styles.date}>{brand.filing_date || '-'}</td>
                                        <td className={styles.date}>{brand.expiration_date || '-'}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
