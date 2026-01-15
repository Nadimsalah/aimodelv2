'use client';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BarChart, TrendingUp, Download, Calendar, Award, Target } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import styles from './analytics.module.css';

export const dynamic = 'force-dynamic';

export default function AnalyticsPage() {
    const [analytics, setAnalytics] = useState({
        topBrands: [],
        scansByMonth: [],
        matchRate: 0,
        totalScans: 0
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchAnalytics();
    }, []);

    const fetchAnalytics = async () => {
        setLoading(true);

        // Fetch all matches with brand names
        const { data: matches } = await supabase
            .from('matches')
            .select('my_brand');

        // Count brand occurrences
        const brandCounts = {};
        matches?.forEach(match => {
            if (match.my_brand) {
                brandCounts[match.my_brand] = (brandCounts[match.my_brand] || 0) + 1;
            }
        });

        // Sort and get top 10
        const topBrands = Object.entries(brandCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10)
            .map(([name, count]) => ({ name, count }));

        // Fetch scans count
        const { count: scansCount } = await supabase
            .from('scan_jobs')
            .select('*', { count: 'exact', head: true });

        // Calculate match rate
        const matchRate = scansCount > 0 ? Math.round((matches?.length || 0) / scansCount * 100) : 0;

        setAnalytics({
            topBrands,
            scansByMonth: [], // Would need date grouping logic
            matchRate,
            totalScans: scansCount || 0
        });

        setLoading(false);
    };

    const handleExport = () => {
        // Create CSV content
        const csvContent = [
            ['Brand Name', 'Detections'],
            ...analytics.topBrands.map(b => [b.name, b.count])
        ].map(row => row.join(',')).join('\n');

        // Download
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `brand-analytics-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
    };

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <div>
                    <h1 className={styles.title}>Analytics & Reports</h1>
                    <p className={styles.subtitle}>Insights and trends from your brand detection data</p>
                </div>
                <motion.button
                    className={styles.exportBtn}
                    onClick={handleExport}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                >
                    <Download size={18} />
                    Export Report
                </motion.button>
            </header>

            {/* Key Metrics */}
            <div className={styles.metricsGrid}>
                <motion.div
                    className={styles.metricCard}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                >
                    <div className={styles.metricIcon} style={{ backgroundColor: 'rgba(99, 102, 241, 0.1)' }}>
                        <Target size={24} style={{ color: '#6366f1' }} />
                    </div>
                    <div>
                        <p className={styles.metricLabel}>Match Rate</p>
                        <h3 className={styles.metricValue}>{loading ? '...' : `${analytics.matchRate}%`}</h3>
                    </div>
                </motion.div>

                <motion.div
                    className={styles.metricCard}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1, duration: 0.4 }}
                >
                    <div className={styles.metricIcon} style={{ backgroundColor: 'rgba(139, 92, 246, 0.1)' }}>
                        <BarChart size={24} style={{ color: '#8b5cf6' }} />
                    </div>
                    <div>
                        <p className={styles.metricLabel}>Total Scans</p>
                        <h3 className={styles.metricValue}>{loading ? '...' : analytics.totalScans}</h3>
                    </div>
                </motion.div>

                <motion.div
                    className={styles.metricCard}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2, duration: 0.4 }}
                >
                    <div className={styles.metricIcon} style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)' }}>
                        <Award size={24} style={{ color: '#10b981' }} />
                    </div>
                    <div>
                        <p className={styles.metricLabel}>Unique Brands</p>
                        <h3 className={styles.metricValue}>{loading ? '...' : analytics.topBrands.length}</h3>
                    </div>
                </motion.div>
            </div>

            {/* Top Brands Chart */}
            <section className={styles.section}>
                <h2 className={styles.sectionTitle}>
                    <TrendingUp size={20} />
                    Most Detected Brands
                </h2>
                <div className={styles.chartCard}>
                    {loading ? (
                        <p className={styles.emptyState}>Loading data...</p>
                    ) : analytics.topBrands.length === 0 ? (
                        <p className={styles.emptyState}>No brand detection data available yet.</p>
                    ) : (
                        <div className={styles.barChart}>
                            {analytics.topBrands.map((brand, index) => {
                                const maxCount = analytics.topBrands[0]?.count || 1;
                                const percentage = (brand.count / maxCount) * 100;

                                return (
                                    <motion.div
                                        key={brand.name}
                                        className={styles.barItem}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: index * 0.05, duration: 0.3 }}
                                    >
                                        <div className={styles.barLabel}>
                                            <span className={styles.barRank}>#{index + 1}</span>
                                            <span className={styles.barName}>{brand.name}</span>
                                        </div>
                                        <div className={styles.barWrapper}>
                                            <motion.div
                                                className={styles.barFill}
                                                initial={{ width: 0 }}
                                                animate={{ width: `${percentage}%` }}
                                                transition={{ delay: index * 0.05 + 0.2, duration: 0.6 }}
                                            />
                                        </div>
                                        <span className={styles.barCount}>{brand.count}</span>
                                    </motion.div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </section>

            {/* Insights */}
            <section className={styles.section}>
                <h2 className={styles.sectionTitle}>Key Insights</h2>
                <div className={styles.insightsGrid}>
                    <div className={styles.insightCard}>
                        <h3 className={styles.insightTitle}>Detection Performance</h3>
                        <p className={styles.insightText}>
                            Your brand detection system has a {analytics.matchRate}% match rate across {analytics.totalScans} scans.
                            {analytics.matchRate >= 70 ? ' Excellent performance!' : analytics.matchRate >= 40 ? ' Good performance, room for improvement.' : ' Consider expanding your brand library.'}
                        </p>
                    </div>
                    <div className={styles.insightCard}>
                        <h3 className={styles.insightTitle}>Top Performer</h3>
                        <p className={styles.insightText}>
                            {analytics.topBrands.length > 0
                                ? `"${analytics.topBrands[0].name}" is your most detected brand with ${analytics.topBrands[0].count} occurrences.`
                                : 'No brand detections yet. Start scanning PDFs to see insights.'}
                        </p>
                    </div>
                    <div className={styles.insightCard}>
                        <h3 className={styles.insightTitle}>Recommendation</h3>
                        <p className={styles.insightText}>
                            {analytics.totalScans < 10
                                ? 'Scan more PDFs to get better analytics and insights.'
                                : 'Consider reviewing your brand library to ensure all relevant brands are included.'}
                        </p>
                    </div>
                </div>
            </section>
        </div>
    );
}
