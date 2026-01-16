'use client';
import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Clock, Search, FileText, Download, Eye, Filter, Layers, Trash2, StopCircle, Pause, Play, Upload, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import styles from './history.module.css';

export const dynamic = 'force-dynamic';

export default function HistoryPage() {
    const [scans, setScans] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(null);
    const intervalRef = useRef(null);

    useEffect(() => {
        fetchScans();

        // Auto-refresh every 3 seconds
        intervalRef.current = setInterval(() => {
            fetchScans();
        }, 3000);

        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
        };
    }, []); // Empty dependency array - only run once

    const fetchScans = async () => {
        const { data, error } = await supabase
            .from('scan_jobs')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching scans:', error);
        } else {
            setScans(data || []);
        }
        setLoading(false);
    };

    const handleDelete = async (scanId) => {
        if (!confirm('Are you sure you want to delete this scan? This will also delete all extracted brands.')) {
            return;
        }

        const { error } = await supabase
            .from('scan_jobs')
            .delete()
            .eq('id', scanId);

        if (error) {
            alert('Failed to delete scan');
            console.error(error);
        } else {
            fetchScans(); // Refresh list
        }
    };

    const handleStop = async (scanId) => {
        const { error } = await supabase
            .from('scan_jobs')
            .update({ status: 'failed', error: 'Stopped by user' })
            .eq('id', scanId);

        if (error) {
            alert('Failed to stop scan');
            console.error(error);
        } else {
            fetchScans();
        }
    };

    const handlePause = async (scanId) => {
        const { error } = await supabase
            .from('scan_jobs')
            .update({ status: 'paused' })
            .eq('id', scanId);

        if (error) {
            alert('Failed to pause scan');
            console.error(error);
        } else {
            fetchScans();
        }
    };

    const handleContinue = async (scanId) => {
        // Restart the scan by calling the API
        try {
            const response = await fetch('/api/scans/run', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ jobId: scanId })
            });

            if (!response.ok) {
                throw new Error('Failed to continue scan');
            }

            fetchScans();
        } catch (error) {
            alert('Failed to continue scan');
            console.error(error);
        }
    };

    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setUploading(true);
        setUploadProgress({ status: 'uploading', message: 'Uploading PDF...' });

        const formData = new FormData();
        formData.append('file', file);

        try {
            // Create scan job
            const createRes = await fetch('/api/scans/create', {
                method: 'POST',
                body: formData
            });

            const responseText = await createRes.text();
            // console.log('Create API Response:', responseText.substring(0, 200));

            let createData;
            try {
                createData = JSON.parse(responseText);
            } catch (e) {
                console.error('JSON Parse Error:', e);
                console.error('Raw Response:', responseText);
                throw new Error(`Server returned non-JSON response: ${responseText.substring(0, 100)}...`);
            }

            if (!createRes.ok) {
                throw new Error(createData.error || 'Upload failed');
            }

            setUploadProgress({
                status: 'success',
                message: `✓ PDF uploaded! Processing started...`
            });

            // Start processing in background (don't await)
            fetch('/api/scans/run', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ jobId: createData.job.id })
            }).catch(err => console.error('Processing error:', err));

            fetchScans();
            setTimeout(() => setUploadProgress(null), 3000);
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

    const filteredScans = scans.filter(scan =>
        scan.filename?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        scan.id?.toString().includes(searchTerm)
    );

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

    const getEstimatedTimeRemaining = (scan) => {
        if (scan.status !== 'processing') return null;

        const progressPages = scan.progress_pages || 0;
        const totalPages = scan.total_pages || 0;

        if (totalPages === 0 || progressPages === 0) return 'Calculating...';

        const remainingPages = totalPages - progressPages;
        if (remainingPages <= 0) return 'Almost done...';

        // With parallel processing: ~2 seconds per page (10 pages in 20 seconds)
        const secondsPerPage = 2;
        const estimatedSeconds = remainingPages * secondsPerPage;

        if (estimatedSeconds < 60) {
            return `~${estimatedSeconds}s remaining`;
        } else {
            const minutes = Math.ceil(estimatedSeconds / 60);
            return `~${minutes} min remaining`;
        }
    };

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <div>
                    <h1 className={styles.title}>
                        <Clock size={28} />
                        Scan History
                    </h1>
                    <p className={styles.subtitle}>View and manage all your PDF scans</p>
                </div>
            </header>

            {/* Upload Section */}
            <div className={styles.uploadCard}>
                <div className={styles.uploadArea}>
                    <FileText size={48} className={styles.uploadIcon} />
                    <h3>Upload PDF File</h3>
                    <p>Drag and drop your PDF or click to browse</p>
                    <p className={styles.formats}>Supported: .pdf</p>

                    <input
                        type="file"
                        accept=".pdf"
                        id="pdf-upload"
                        hidden
                        onChange={handleFileUpload}
                        disabled={uploading}
                    />
                    <label htmlFor="pdf-upload" className={styles.uploadBtn}>
                        <Upload size={20} />
                        {uploading ? 'Uploading...' : 'Choose PDF'}
                    </label>
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
                        Total Scans: <strong>{scans.length}</strong>
                    </span>
                </div>
            </div>

            {/* Scans List */}
            <div className={styles.scansCard}>
                {loading ? (
                    <p className={styles.emptyState}>Loading scan history...</p>
                ) : filteredScans.length === 0 ? (
                    <p className={styles.emptyState}>
                        {searchTerm ? 'No scans match your search.' : 'No scans yet. Upload a PDF to get started!'}
                    </p>
                ) : (
                    <div className={styles.scansList}>
                        {filteredScans.map((scan, index) => {
                            const statusStyle = getStatusColor(scan.status);

                            return (
                                <motion.div
                                    key={scan.id}
                                    className={styles.scanItem}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.05, duration: 0.3 }}
                                >
                                    <div className={styles.scanIcon}>
                                        <FileText size={24} />
                                    </div>

                                    <div className={styles.scanContent}>
                                        <h3 className={styles.scanFilename}>
                                            {scan.filename || 'Untitled Scan'}
                                        </h3>
                                        <div className={styles.scanMeta}>
                                            <span className={styles.scanId}>ID: {scan.id}</span>
                                            <span className={styles.scanDate}>
                                                {new Date(scan.created_at).toLocaleDateString()} at {new Date(scan.created_at).toLocaleTimeString()}
                                            </span>
                                        </div>

                                        {/* Progress Bar for Processing Scans */}
                                        {scan.status === 'processing' && scan.total_pages > 0 && (
                                            <div className={styles.progressSection}>
                                                <div className={styles.progressBar}>
                                                    <div
                                                        className={styles.progressFill}
                                                        style={{
                                                            width: `${(scan.progress_pages / scan.total_pages) * 100}%`
                                                        }}
                                                    />
                                                </div>
                                                <div className={styles.progressText}>
                                                    <span>{scan.progress_pages}/{scan.total_pages} pages</span>
                                                    <span className={styles.timeRemaining}>
                                                        <Loader2 size={12} className={styles.spin} />
                                                        {getEstimatedTimeRemaining(scan)}
                                                    </span>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    <div className={styles.scanStatus}>
                                        <span
                                            className={styles.statusBadge}
                                            style={{
                                                backgroundColor: statusStyle.bg,
                                                color: statusStyle.color
                                            }}
                                        >
                                            {scan.status || 'completed'}
                                        </span>
                                    </div>

                                    <div className={styles.scanActions}>
                                        <div className={styles.actionButtons}>
                                            {/* Show different actions based on status */}
                                            {scan.status === 'processing' && (
                                                <>
                                                    <button
                                                        onClick={() => handlePause(scan.id)}
                                                        className={`${styles.actionBtn} ${styles.pauseBtn}`}
                                                        title="Pause Scan"
                                                    >
                                                        <Pause size={16} />
                                                        Pause
                                                    </button>
                                                    <button
                                                        onClick={() => handleStop(scan.id)}
                                                        className={`${styles.actionBtn} ${styles.stopBtn}`}
                                                        title="Stop Scan"
                                                    >
                                                        <StopCircle size={16} />
                                                        Stop
                                                    </button>
                                                </>
                                            )}

                                            {(scan.status === 'paused' || scan.status === 'queued') && (
                                                <button
                                                    onClick={() => handleContinue(scan.id)}
                                                    className={`${styles.actionBtn} ${styles.continueBtn}`}
                                                    title={scan.status === 'queued' ? "Run Scan" : "Continue Scan"}
                                                >
                                                    <Play size={16} />
                                                    {scan.status === 'queued' ? "Run" : "Continue"}
                                                </button>
                                            )}

                                            {(scan.status === 'completed' || scan.status === 'failed') && (
                                                <>
                                                    <Link
                                                        href={`/dashboard/matches/${scan.id}`}
                                                        className={`${styles.actionBtn} ${styles.matchBtn}`}
                                                        title="Match Brands"
                                                    >
                                                        <Eye size={16} />
                                                        Match
                                                    </Link>
                                                    <Link
                                                        href={`/dashboard/extracted/${scan.id}`}
                                                        className={`${styles.actionBtn} ${styles.viewBtn}`}
                                                        title="View Extracted Brands"
                                                    >
                                                        <Layers size={16} />
                                                        Extracted
                                                    </Link>
                                                </>
                                            )}

                                            {/* Delete button always available */}
                                            <button
                                                onClick={() => handleDelete(scan.id)}
                                                className={`${styles.actionBtn} ${styles.deleteBtn}`}
                                                title="Delete Scan"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
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
