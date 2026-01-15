'use client';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    Database,
    FileText,
    CheckCircle,
    TrendingUp,
    Upload,
    FileSpreadsheet,
    ArrowRight,
    Activity
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import styles from './overview.module.css';

export const dynamic = 'force-dynamic';

export default function OverviewPage() {
    const [stats, setStats] = useState({
        totalBrands: 0,
        totalScans: 0,
        totalMatches: 0,
        recentActivity: []
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        setLoading(true);

        // Fetch total brands
        const { count: brandsCount } = await supabase
            .from('brands')
            .select('*', { count: 'exact', head: true });

        // Fetch total scans
        const { count: scansCount } = await supabase
            .from('scan_jobs')
            .select('*', { count: 'exact', head: true });

        // Fetch total matches
        const { count: matchesCount } = await supabase
            .from('matches')
            .select('*', { count: 'exact', head: true });

        // Fetch recent scans for activity feed
        const { data: recentScans } = await supabase
            .from('scan_jobs')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(5);

        setStats({
            totalBrands: brandsCount || 0,
            totalScans: scansCount || 0,
            totalMatches: matchesCount || 0,
            recentActivity: recentScans || []
        });

        setLoading(false);
    };

    const statCards = [
        {
            title: 'Total Brands',
            value: stats.totalBrands,
            icon: Database,
            color: '#6366f1',
            bgColor: 'rgba(99, 102, 241, 0.1)'
        },
        {
            title: 'PDF Scans',
            value: stats.totalScans,
            icon: FileText,
            color: '#8b5cf6',
            bgColor: 'rgba(139, 92, 246, 0.1)'
        },
        {
            title: 'Matches Found',
            value: stats.totalMatches,
            icon: CheckCircle,
            color: '#10b981',
            bgColor: 'rgba(16, 185, 129, 0.1)'
        },
        {
            title: 'Success Rate',
            value: stats.totalScans > 0 ? `${Math.round((stats.totalMatches / stats.totalScans) * 100)}%` : '0%',
            icon: TrendingUp,
            color: '#f59e0b',
            bgColor: 'rgba(245, 158, 11, 0.1)'
        }
    ];

    const quickActions = [
        {
            title: 'Scan PDF',
            description: 'Upload and analyze a new PDF',
            icon: Upload,
            href: '/dashboard/pdf-scan',
            color: '#6366f1'
        },
        {
            title: 'Import Brands',
            description: 'Add brands from Excel file',
            icon: FileSpreadsheet,
            href: '/dashboard/brands',
            color: '#8b5cf6'
        },
        {
            title: 'View Analytics',
            description: 'See detailed reports',
            icon: TrendingUp,
            href: '/dashboard/analytics',
            color: '#10b981'
        }
    ];

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <div>
                    <h1 className={styles.title}>Dashboard Overview</h1>
                    <p className={styles.subtitle}>Welcome back! Here's what's happening with your brand detection.</p>
                </div>
            </header>

            {/* Statistics Cards */}
            <div className={styles.statsGrid}>
                {statCards.map((stat, index) => (
                    <motion.div
                        key={stat.title}
                        className={styles.statCard}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1, duration: 0.4 }}
                    >
                        <div className={styles.statIcon} style={{ backgroundColor: stat.bgColor }}>
                            <stat.icon size={24} style={{ color: stat.color }} />
                        </div>
                        <div className={styles.statContent}>
                            <p className={styles.statLabel}>{stat.title}</p>
                            <h3 className={styles.statValue}>
                                {loading ? '...' : stat.value}
                            </h3>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Quick Actions */}
            <section className={styles.section}>
                <h2 className={styles.sectionTitle}>Quick Actions</h2>
                <div className={styles.actionsGrid}>
                    {quickActions.map((action, index) => (
                        <motion.div
                            key={action.title}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.4 + index * 0.1, duration: 0.4 }}
                        >
                            <Link href={action.href} className={styles.actionCard}>
                                <div className={styles.actionIcon} style={{ color: action.color }}>
                                    <action.icon size={28} />
                                </div>
                                <div className={styles.actionContent}>
                                    <h3 className={styles.actionTitle}>{action.title}</h3>
                                    <p className={styles.actionDescription}>{action.description}</p>
                                </div>
                                <ArrowRight size={20} className={styles.actionArrow} />
                            </Link>
                        </motion.div>
                    ))}
                </div>
            </section>

            {/* Recent Activity */}
            <section className={styles.section}>
                <h2 className={styles.sectionTitle}>
                    <Activity size={20} />
                    Recent Activity
                </h2>
                <div className={styles.activityCard}>
                    {loading ? (
                        <p className={styles.emptyState}>Loading activity...</p>
                    ) : stats.recentActivity.length === 0 ? (
                        <p className={styles.emptyState}>No recent activity. Start by scanning a PDF!</p>
                    ) : (
                        <div className={styles.activityList}>
                            {stats.recentActivity.map((scan) => (
                                <div key={scan.id} className={styles.activityItem}>
                                    <div className={styles.activityIcon}>
                                        <FileText size={18} />
                                    </div>
                                    <div className={styles.activityContent}>
                                        <p className={styles.activityTitle}>
                                            PDF Scan: {scan.filename || 'Unknown'}
                                        </p>
                                        <p className={styles.activityTime}>
                                            {new Date(scan.created_at).toLocaleDateString()} at {new Date(scan.created_at).toLocaleTimeString()}
                                        </p>
                                    </div>
                                    <span className={styles.activityBadge}>
                                        {scan.status || 'completed'}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </section>
        </div>
    );
}
