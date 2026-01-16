'use client';
import { useState, useEffect, use } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, ArrowRight, Check, AlertTriangle, TrendingUp } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import BrandCard from '@/app/components/BrandCard';
import styles from './matches.module.css';

export const dynamic = 'force-dynamic';

export default function MatchesPage({ params }) {
    const resolvedParams = use(params);
    const jobId = resolvedParams.jobId;

    const router = useRouter();
    const [matches, setMatches] = useState([]);
    const [pdfBrands, setPdfBrands] = useState({});
    const [libraryBrands, setLibraryBrands] = useState({});
    const [loading, setLoading] = useState(true);
    const [running, setRunning] = useState(false);

    const [filter, setFilter] = useState('all');
    const [minScore, setMinScore] = useState(0);

    const fetchData = async () => {
        setLoading(true);
        try {
            // Fetch matches
            const matchRes = await fetch(`/api/matches/run?jobId=${jobId}`);
            const matchData = await matchRes.json();

            if (matchData.matches) {
                setMatches(matchData.matches);

                // Fetch detailed PDF brands
                const { data: pdfData } = await supabase
                    .from('pdf_brands')
                    .select('*')
                    .eq('job_id', jobId);

                if (pdfData) {
                    const pdfMap = {};
                    pdfData.forEach(brand => {
                        pdfMap[brand.normalized_name] = brand;
                    });
                    setPdfBrands(pdfMap);
                }

                // Fetch detailed library brands
                const { data: libData } = await supabase
                    .from('brands')
                    .select('*');

                if (libData) {
                    const libMap = {};
                    libData.forEach(brand => {
                        libMap[brand.normalized_name] = brand;
                    });
                    setLibraryBrands(libMap);
                }
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const runMatching = async () => {
        setRunning(true);
        try {
            await fetch('/api/matches/run', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ jobId, threshold: 0.6 })
            });
            await fetchData();
        } catch (e) {
            alert('Matching failed');
        } finally {
            setRunning(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [jobId]);

    const filtered = matches.filter(m => {
        if (filter !== 'all' && m.match_type !== filter) return false;
        if (m.similarity < minScore) return false;
        return true;
    });

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <button onClick={() => router.back()} className={styles.backBtn}>
                    <ArrowLeft size={16} /> Back
                </button>
                <div className={styles.titleRow}>
                    <div>
                        <h1 className={styles.title}>Scan Results & Matches</h1>
                        <p className={styles.subtitle}>Comparison between detected and library brands</p>
                    </div>
                    <button
                        onClick={runMatching}
                        disabled={running}
                        className={styles.primaryBtn}
                    >
                        {running ? 'Comparing...' : 'Re-run Comparison'}
                    </button>
                </div>
            </header>

            <div className={styles.statsRow}>
                <div className={styles.statCard}>
                    <TrendingUp size={20} />
                    <div>
                        <span className={styles.statLabel}>Total Matches</span>
                        <span className={styles.statValue}>{matches.length}</span>
                    </div>
                </div>
                <div className={styles.statCard}>
                    <Check size={20} />
                    <div>
                        <span className={styles.statLabel}>Exact Matches</span>
                        <span className={styles.statValue}>{matches.filter(m => m.match_type === 'exact').length}</span>
                    </div>
                </div>
                <div className={styles.statCard}>
                    <AlertTriangle size={20} />
                    <div>
                        <span className={styles.statLabel}>Fuzzy Matches</span>
                        <span className={styles.statValue}>{matches.filter(m => m.match_type === 'fuzzy').length}</span>
                    </div>
                </div>
            </div>

            <div className={styles.filterBar}>
                <div className={styles.filters}>
                    <button
                        className={`${styles.filterBtn} ${filter === 'all' ? styles.active : ''}`}
                        onClick={() => setFilter('all')}
                    >
                        All ({matches.length})
                    </button>
                    <button
                        className={`${styles.filterBtn} ${filter === 'exact' ? styles.active : ''}`}
                        onClick={() => setFilter('exact')}
                    >
                        Exact ({matches.filter(m => m.match_type === 'exact').length})
                    </button>
                    <button
                        className={`${styles.filterBtn} ${filter === 'fuzzy' ? styles.active : ''}`}
                        onClick={() => setFilter('fuzzy')}
                    >
                        Fuzzy ({matches.filter(m => m.match_type === 'fuzzy').length})
                    </button>
                </div>
                <div className={styles.sliderGroup}>
                    <label>Min Similarity: {minScore}%</label>
                    <input
                        type="range"
                        min="0" max="100"
                        value={minScore}
                        onChange={(e) => setMinScore(Number(e.target.value))}
                        className={styles.slider}
                    />
                </div>
            </div>

            <div className={styles.matchesGrid}>
                {loading ? (
                    <div className={styles.loading}>Loading matches...</div>
                ) : filtered.length === 0 ? (
                    <div className={styles.empty}>No matches found matching criteria.</div>
                ) : (
                    filtered.map((match, index) => {
                        const pdfBrand = pdfBrands[match.detected_brand?.toLowerCase()?.trim()] || { name: match.detected_brand };
                        const libBrand = libraryBrands[match.my_brand?.toLowerCase()?.trim()] || { name: match.my_brand };

                        return (
                            <motion.div
                                key={match.id}
                                className={styles.matchCard}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.05 }}
                            >
                                <div className={styles.matchHeader}>
                                    <span className={match.match_type === 'exact' ? styles.exactBadge : styles.fuzzyBadge}>
                                        {match.match_type === 'exact' ? (
                                            <><Check size={14} /> Exact Match</>
                                        ) : (
                                            <><AlertTriangle size={14} /> Fuzzy Match</>
                                        )}
                                    </span>
                                    <span className={styles.similarity}>{match.similarity}% Match</span>
                                </div>

                                <div className={styles.comparison}>
                                    <div className={styles.brandSection}>
                                        <h4 className={styles.sectionTitle}>Detected in PDF</h4>
                                        <BrandCard brand={pdfBrand} showAllDetails={true} />
                                    </div>

                                    <div className={styles.matchIndicator}>
                                        <div className={styles.arrowContainer}>
                                            <ArrowRight size={24} className={styles.arrow} />
                                        </div>
                                        <div className={styles.scoreCircle}>
                                            <svg className={styles.progressRing} width="80" height="80">
                                                <circle
                                                    className={styles.progressRingBg}
                                                    cx="40"
                                                    cy="40"
                                                    r="32"
                                                />
                                                <circle
                                                    className={styles.progressRingFill}
                                                    cx="40"
                                                    cy="40"
                                                    r="32"
                                                    style={{
                                                        strokeDasharray: `${2 * Math.PI * 32}`,
                                                        strokeDashoffset: `${2 * Math.PI * 32 * (1 - match.similarity / 100)}`,
                                                        stroke: match.similarity === 100 ? '#4ade80' : match.similarity >= 80 ? '#facc15' : '#f87171'
                                                    }}
                                                />
                                            </svg>
                                            <span className={styles.scoreText}>{match.similarity}%</span>
                                        </div>
                                    </div>

                                    <div className={styles.brandSection}>
                                        <h4 className={styles.sectionTitle}>Library Brand</h4>
                                        <BrandCard brand={libBrand} showAllDetails={true} />
                                    </div>
                                </div>
                            </motion.div>
                        );
                    })
                )}
            </div>
        </div>
    );
}
