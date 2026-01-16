'use client';
import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Upload, FileSpreadsheet, Trash2, Search, Database, Download, Eye, Clock } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import styles from './brands.module.css';

export const dynamic = 'force-dynamic';

export default function BrandsPage() {
    const [imports, setImports] = useState([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const intervalRef = useRef(null);

    const fetchImports = async () => {
        try {
            const { data, error } = await supabase
                .from('brand_imports')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) {
                // Table might not exist yet, that's okay
                console.log("Brand imports table not found - will be created on first upload");
                setImports([]);
            } else {
                setImports(data || []);
            }
        } catch (err) {
            console.log("Error fetching imports:", err);
            setImports([]);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchImports();

        // Auto-refresh every 3 seconds
        intervalRef.current = setInterval(() => {
            fetchImports();
        }, 3000);

        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
        };
    }, []);

    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setUploading(true);
        setUploadProgress({ status: 'uploading', message: 'Uploading Excel file...' });

        const formData = new FormData();
        formData.append('file', file);

        try {
            const res = await fetch('/api/brands/import-xls', {
                method: 'POST',
                body: formData
            });

            const data = await res.json();

            if (res.ok) {
                setUploadProgress({
                    status: 'success',
                    message: `✓ Successfully imported ${data.imported || 0} brands!`
                });
                fetchImports();

                setTimeout(() => setUploadProgress(null), 3000);
            } else {
                setUploadProgress({
                    status: 'error',
                    message: `✗ ${data.error || 'Import failed'}`
                });
            }
        } catch (err) {
            setUploadProgress({
                status: 'error',
                message: `✗ ${err.message}`
            });
        } finally {
            setUploading(false);
            e.target.value = '';
        }
    };

    const handleDeleteImport = async (importId) => {
        if (!confirm('Delete this import? This will also delete all brands from this import.')) return;

        const { error } = await supabase
            .from('brand_imports')
            .delete()
            .eq('id', importId);

        if (!error) fetchImports();
    };

    const handleDownloadSample = () => {
        const csvContent = `Brand Name,Logo,Registration Number,Nice Class,Status,Filing Date,Expiration Date
Nike,nike_logo.png,123456,25,Active,2020-01-15,2030-01-15
Adidas,adidas_logo.png,789012,25,Active,2019-05-20,2029-05-20
Puma,puma_logo.png,345678,25,Active,2021-03-10,2031-03-10`;

        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'brand-library-sample.csv';
        a.click();
    };

    const getStatusColor = (status) => {
        switch (status?.toLowerCase()) {
            case 'completed':
                return { bg: 'rgba(16, 185, 129, 0.1)', color: '#10b981' };
            case 'processing':
                return { bg: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b' };
            case 'failed':
                return { bg: 'rgba(239, 68, 68, 0.1)', color: '#ef4444' };
            default:
                return { bg: 'rgba(161, 161, 170, 0.1)', color: '#a1a1aa' };
        }
    };

    const filteredImports = imports.filter(imp =>
        imp.filename?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        imp.id?.toString().includes(searchTerm)
    );

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <div className={styles.titleRow}>
                    <Database size={32} className={styles.icon} />
                    <div>
                        <h1 className={styles.title}>Brand Library</h1>
                        <p className={styles.subtitle}>Upload Excel files to build your trademark database</p>
                    </div>
                </div>
            </header>

            {/* Upload Section */}
            <div className={styles.uploadCard}>
                <div className={styles.uploadArea}>
                    <FileSpreadsheet size={48} className={styles.uploadIcon} />
                    <h3>Upload Excel File</h3>
                    <p>Drag and drop your Excel file or click to browse</p>
                    <p className={styles.formats}>Supported: .xlsx, .xls, .csv</p>

                    <input
                        type="file"
                        accept=".xlsx, .xls, .csv"
                        id="excel-upload"
                        hidden
                        onChange={handleFileUpload}
                        disabled={uploading}
                    />
                    <label htmlFor="excel-upload" className={styles.uploadBtn}>
                        <Upload size={20} />
                        {uploading ? 'Uploading...' : 'Choose File'}
                    </label>

                    <button onClick={handleDownloadSample} className={styles.sampleBtn}>
                        <Download size={16} />
                        Download Sample Template
                    </button>
                </div>

                {uploadProgress && (
                    <motion.div
                        className={`${styles.uploadStatus} ${styles[uploadProgress.status]}`}
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                    >
                        {uploadProgress.message}
                    </motion.div>
                )}
            </div>

            {/* Search Bar */}
            <div className={styles.searchSection}>
                <div className={styles.searchBox}>
                    <Search size={20} />
                    <input
                        type="text"
                        placeholder="Search by filename or ID..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className={styles.searchInput}
                    />
                </div>
                <div className={styles.stats}>
                    <span className={styles.statBadge}>
                        Total Imports: <strong>{imports.length}</strong>
                    </span>
                </div>
            </div>

            {/* Import History */}
            <div className={styles.historyCard}>
                <h2>
                    <Clock size={24} />
                    Import History
                </h2>

                {loading ? (
                    <p className={styles.emptyState}>Loading import history...</p>
                ) : filteredImports.length === 0 ? (
                    <div className={styles.emptyState}>
                        <FileSpreadsheet size={48} />
                        <p>{searchTerm ? 'No imports match your search' : 'No imports yet. Upload an Excel file to get started!'}</p>
                    </div>
                ) : (
                    <div className={styles.importsList}>
                        {filteredImports.map((imp, index) => {
                            const statusStyle = getStatusColor(imp.status);

                            return (
                                <motion.div
                                    key={imp.id}
                                    className={styles.importItem}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.05 }}
                                >
                                    <div className={styles.importIcon}>
                                        <FileSpreadsheet size={24} />
                                    </div>

                                    <div className={styles.importContent}>
                                        <h3 className={styles.importFilename}>
                                            {imp.filename || 'Untitled Import'}
                                        </h3>
                                        <div className={styles.importMeta}>
                                            <span className={styles.importId}>ID: {imp.id}</span>
                                            <span className={styles.importDate}>
                                                {new Date(imp.created_at).toLocaleDateString()} at {new Date(imp.created_at).toLocaleTimeString()}
                                            </span>
                                            <span className={styles.importCount}>
                                                {imp.brands_count || 0} brands imported
                                            </span>
                                        </div>

                                        {/* Data Summary */}
                                        {imp.data_summary && (
                                            <div className={styles.dataSummary}>
                                                {imp.data_summary.registration_numbers && (
                                                    <span className={styles.dataItem}>
                                                        📋 Reg #: {imp.data_summary.registration_numbers}
                                                    </span>
                                                )}
                                                {imp.data_summary.nice_classes && (
                                                    <span className={styles.dataItem}>
                                                        🏷️ Classes: {imp.data_summary.nice_classes}
                                                    </span>
                                                )}
                                                {imp.data_summary.status && (
                                                    <span className={styles.dataItem}>
                                                        ✓ Status: {imp.data_summary.status}
                                                    </span>
                                                )}
                                                {imp.data_summary.date_range && (
                                                    <span className={styles.dataItem}>
                                                        📅 {imp.data_summary.date_range}
                                                    </span>
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    <div className={styles.importStatus}>
                                        <span
                                            className={styles.statusBadge}
                                            style={{
                                                backgroundColor: statusStyle.bg,
                                                color: statusStyle.color
                                            }}
                                        >
                                            {imp.status || 'completed'}
                                        </span>
                                    </div>

                                    <div className={styles.importActions}>
                                        <Link
                                            href={`/dashboard/brands/${imp.id}`}
                                            className={`${styles.actionBtn} ${styles.viewBtn}`}
                                            title="View Brands"
                                        >
                                            <Eye size={16} />
                                            View
                                        </Link>
                                        <button
                                            onClick={() => handleDeleteImport(imp.id)}
                                            className={`${styles.actionBtn} ${styles.deleteBtn}`}
                                            title="Delete Import"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
