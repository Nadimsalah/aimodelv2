'use client';
import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft, Layers, FileText } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import BrandCard from '@/app/components/BrandCard';
import styles from './extracted.module.css';

export const dynamic = 'force-dynamic';

export default function ExtractedBrandsPage({ params }) {
    const resolvedParams = use(params);
    const jobId = resolvedParams.jobId;
    const router = useRouter();

    const [brands, setBrands] = useState([]);
    const [loading, setLoading] = useState(true);
    const [jobInfo, setJobInfo] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            // Fetch brands
            const { data: brandsData, error: brandsError } = await supabase
                .from('pdf_brands')
                .select('*')
                .eq('job_id', jobId)
                .order('name');

            if (brandsError) {
                console.error('Error fetching brands:', brandsError);
            } else {
                setBrands(brandsData || []);
            }

            // Fetch job info
            const { data: jobData } = await supabase
                .from('scan_jobs')
                .select('*')
                .eq('id', jobId)
                .single();

            if (jobData) {
                setJobInfo(jobData);
            }

            setLoading(false);
        };

        if (jobId) {
            fetchData();
        }
    }, [jobId]);

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <button onClick={() => router.back()} className={styles.backBtn}>
                    <ArrowLeft size={16} /> Back to History
                </button>
                <div className={styles.titleRow}>
                    <Layers size={32} className={styles.icon} />
                    <div>
                        <h1 className={styles.title}>Extracted Brands</h1>
                        <p className={styles.subtitle}>
                            {jobInfo ? `From: ${jobInfo.filename}` : 'Brands detected in the scanned document'}
                        </p>
                    </div>
                </div>
            </header>

            <div className={styles.statsBar}>
                <div className={styles.stat}>
                    <FileText size={18} />
                    <div>
                        <span className={styles.statLabel}>Total Brands</span>
                        <span className={styles.statValue}>{brands.length}</span>
                    </div>
                </div>
                {jobInfo && (
                    <div className={styles.stat}>
                        <Layers size={18} />
                        <div>
                            <span className={styles.statLabel}>Pages Scanned</span>
                            <span className={styles.statValue}>{jobInfo.total_pages || 0}</span>
                        </div>
                    </div>
                )}
            </div>

            <div className={styles.grid}>
                {loading ? (
                    <div className={styles.loading}>Loading extracted brands...</div>
                ) : brands.length === 0 ? (
                    <div className={styles.empty}>
                        <FileText size={48} />
                        <p>No brands found in this scan.</p>
                        <span>The PDF may not contain trademark information or the extraction failed.</span>
                    </div>
                ) : (
                    brands.map((brand, index) => (
                        <motion.div
                            key={brand.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                        >
                            <BrandCard brand={brand} showAllDetails={true} />
                        </motion.div>
                    ))
                )}
            </div>
        </div>
    );
}
