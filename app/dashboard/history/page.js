'use client';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Clock, Search, FileText, Download, Eye, Filter } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import styles from './history.module.css';

export const dynamic = 'force-dynamic';

export default function HistoryPage() {
    const [scans, setScans] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchScans();
    }, []);

    const fetchScans = async () => {
        setLoading(true);
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
                                        {scan.job_id && (
                                            <Link
                                                href={`/dashboard/matches/${scan.job_id}`}
                                                className={styles.actionBtn}
                                                title="View Matches"
                                            >
                                                <Eye size={18} />
                                                View
                                            </Link>
                                        )}
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
