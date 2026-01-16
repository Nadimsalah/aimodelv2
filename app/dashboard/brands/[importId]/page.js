'use client';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Database, FileSpreadsheet, Calendar, Hash, Tag, CheckCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import styles from './import-details.module.css';

export default function ImportDetailsPage({ params }) {
    const [importData, setImportData] = useState(null);
    const [brands, setBrands] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [importId, setImportId] = useState(null);

    useEffect(() => {
        const loadParams = async () => {
            const resolvedParams = await params;
            setImportId(resolvedParams.importId);
        };
        loadParams();
    }, [params]);

    useEffect(() => {
        if (importId) {
            fetchImportData();
        }
    }, [importId]);

    const fetchImportData = async () => {
        if (!importId) return;

        // Fetch import record
        const { data: importRecord, error: importError } = await supabase
            .from('brand_imports')
            .select('*')
            .eq('id', importId)
            .single();

        if (importError) {
            console.error('Error fetching import:', importError);
        } else {
            setImportData(importRecord);
            console.log('Import record:', importRecord);
        }

        // Fetch brands from this import
        console.log('Fetching brands for import_id:', importId);
        const { data: brandsData, error: brandsError } = await supabase
            .from('brands')
            .select('*')
            .eq('import_id', importId)
            .order('name', { ascending: true });

        if (brandsError) {
            console.error('Error fetching brands:', brandsError);
        } else {
            console.log('Found brands:', brandsData?.length, brandsData);
            setBrands(brandsData || []);
        }

        setLoading(false);
    };

    const filteredBrands = brands.filter(brand =>
        brand.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        brand.registration_number?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) {
        return (
            <div className={styles.container}>
                <p className={styles.loading}>Loading import details...</p>
            </div>
        );
    }

    if (!importData) {
        return (
            <div className={styles.container}>
                <p className={styles.error}>Import not found</p>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            {/* Header */}
            <header className={styles.header}>
                <Link href="/dashboard/brands" className={styles.backBtn}>
                    <ArrowLeft size={20} />
                    Back to Library
                </Link>
                <div className={styles.titleRow}>
                    <FileSpreadsheet size={32} className={styles.icon} />
                    <div>
                        <h1 className={styles.title}>{importData.filename}</h1>
                        <p className={styles.subtitle}>
                            Imported on {new Date(importData.created_at).toLocaleDateString()} at {new Date(importData.created_at).toLocaleTimeString()}
                        </p>
                    </div>
                </div>
            </header>

            {/* Stats Bar */}
            <div className={styles.statsBar}>
                <div className={styles.statCard}>
                    <Database size={24} />
                    <div>
                        <div className={styles.statValue}>{brands.length}</div>
                        <div className={styles.statLabel}>Total Brands</div>
                    </div>
                </div>

                {importData.data_summary?.nice_classes && (
                    <div className={styles.statCard}>
                        <Tag size={24} />
                        <div>
                            <div className={styles.statValue}>{importData.data_summary.nice_classes}</div>
                            <div className={styles.statLabel}>Nice Classes</div>
                        </div>
                    </div>
                )}

                {importData.data_summary?.status && (
                    <div className={styles.statCard}>
                        <CheckCircle size={24} />
                        <div>
                            <div className={styles.statValue}>{importData.data_summary.status}</div>
                            <div className={styles.statLabel}>Status</div>
                        </div>
                    </div>
                )}
            </div>

            {/* Search */}
            <div className={styles.searchBox}>
                <input
                    type="text"
                    placeholder="Search brands..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            {/* Brands Table */}
            <div className={styles.brandsCard}>
                <h2>
                    <Database size={24} />
                    Imported Brands ({filteredBrands.length})
                </h2>

                {filteredBrands.length === 0 ? (
                    <p className={styles.emptyState}>
                        {searchTerm ? 'No brands match your search' : 'No brands found in this import'}
                    </p>
                ) : (
                    <div className={styles.tableWrapper}>
                        <table className={styles.brandsTable}>
                            <thead>
                                <tr>
                                    <th>Brand Name</th>
                                    <th>Logo</th>
                                    <th>Registration #</th>
                                    <th>Nice Class</th>
                                    <th>Status</th>
                                    <th>Filing Date</th>
                                    <th>Expiration</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredBrands.map((brand, index) => (
                                    <motion.tr
                                        key={brand.id}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: index * 0.02 }}
                                    >
                                        <td className={styles.brandName}>{brand.name}</td>
                                        <td>
                                            {brand.logo_text ? (
                                                <span className={styles.logoText}>{brand.logo_text}</span>
                                            ) : (
                                                <span className={styles.noData}>-</span>
                                            )}
                                        </td>
                                        <td>
                                            {brand.registration_number ? (
                                                <span className={styles.regNumber}>{brand.registration_number}</span>
                                            ) : (
                                                <span className={styles.noData}>-</span>
                                            )}
                                        </td>
                                        <td>{brand.nice_class || '-'}</td>
                                        <td>
                                            <span className={styles.statusBadge}>
                                                {brand.status || 'Active'}
                                            </span>
                                        </td>
                                        <td>{brand.filing_date || '-'}</td>
                                        <td>{brand.expiration_date || '-'}</td>
                                    </motion.tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
