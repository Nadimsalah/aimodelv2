
'use client';
import { useState, useEffect, use } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Check, AlertTriangle, Search } from 'lucide-react';
import { useRouter } from 'next/navigation';
import styles from './matches.module.css';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

export default function MatchesPage({ params }) {
    // React 19 uses `use(params)` for async params
    const resolvedParams = use(params);
    const jobId = resolvedParams.jobId;

    const router = useRouter();
    const [matches, setMatches] = useState([]);
    const [loading, setLoading] = useState(true);
    const [running, setRunning] = useState(false);

    const [filter, setFilter] = useState('all'); // all, exact, fuzzy
    const [minScore, setMinScore] = useState(0);

    const fetchMatches = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/matches/run?jobId=${jobId}`);
            const data = await res.json();
            if (data.matches) {
                setMatches(data.matches);
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
            await fetchMatches();
        } catch (e) {
            alert('Matching failed');
        } finally {
            setRunning(false);
        }
    };

    useEffect(() => {
        // Run matching on load if empty, or just fetch
        fetchMatches();
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
                    <h1 className={styles.title}>Scan Results</h1>
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
                    <span className={styles.statLabel}>Total Matches</span>
                    <span className={styles.statValue}>{matches.length}</span>
                </div>
                <div className={styles.statCard}>
                    <span className={styles.statLabel}>Exact Matches</span>
                    <span className={styles.statValue}>{matches.filter(m => m.match_type === 'exact').length}</span>
                </div>
            </div>

            <div className={styles.filterBar}>
                <div className={styles.filters}>
                    <button
                        className={`${styles.filterBtn} ${filter === 'all' ? styles.active : ''}`}
                        onClick={() => setFilter('all')}
                    >
                        All
                    </button>
                    <button
                        className={`${styles.filterBtn} ${filter === 'exact' ? styles.active : ''}`}
                        onClick={() => setFilter('exact')}
                    >
                        Exact
                    </button>
                    <button
                        className={`${styles.filterBtn} ${filter === 'fuzzy' ? styles.active : ''}`}
                        onClick={() => setFilter('fuzzy')}
                    >
                        Fuzzy
                    </button>
                </div>
                <div className={styles.sliderGroup}>
                    <label>Min Similarity: {minScore}%</label>
                    <input
                        type="range"
                        min="0" max="100"
                        value={minScore}
                        onChange={(e) => setMinScore(Number(e.target.value))}
                    />
                </div>
            </div>

            <div className={styles.tableCard}>
                <table className={styles.table}>
                    <thead>
                        <tr>
                            <th>PDF Detected Brand</th>
                            <th>My Brand Match</th>
                            <th>Similarity</th>
                            <th>Type</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan="4" className={styles.loading}>Loading results...</td></tr>
                        ) : filtered.length === 0 ? (
                            <tr><td colSpan="4" className={styles.empty}>No matches found matching criteria.</td></tr>
                        ) : (
                            filtered.map(m => (
                                <tr key={m.id}>
                                    <td className={styles.detected}>{m.detected_brand}</td>
                                    <td className={styles.myBrand}>{m.my_brand}</td>
                                    <td>
                                        <div className={styles.scoreRow}>
                                            <div className={styles.progressTrack}>
                                                <div
                                                    className={styles.progressBar}
                                                    style={{ width: `${m.similarity}%`, background: m.similarity === 100 ? '#4ade80' : '#facc15' }}
                                                />
                                            </div>
                                            <span className={styles.scoreVal}>{m.similarity}%</span>
                                        </div>
                                    </td>
                                    <td>
                                        {m.match_type === 'exact' ? (
                                            <span className={styles.exactTag}><Check size={12} /> Exact</span>
                                        ) : (
                                            <span className={styles.fuzzyTag}><AlertTriangle size={12} /> Fuzzy</span>
                                        )}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
