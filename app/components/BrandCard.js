'use client';
import { FileText, Calendar, User, Tag, Hash, Palette } from 'lucide-react';
import styles from './BrandCard.module.css';

export default function BrandCard({ brand, showAllDetails = true, compact = false }) {
    if (!brand) return null;

    return (
        <div className={`${styles.card} ${compact ? styles.compact : ''}`}>
            {/* Logo and Name Section */}
            <div className={styles.header}>
                <div className={styles.logoContainer}>
                    {brand.logo_path ? (
                        <img
                            src={brand.logo_path}
                            alt={`${brand.name} logo`}
                            className={styles.logo}
                            onError={(e) => {
                                e.target.style.display = 'none';
                                e.target.nextSibling.style.display = 'flex';
                            }}
                        />
                    ) : null}
                    <div className={styles.placeholderLogo} style={{ display: brand.logo_path ? 'none' : 'flex' }}>
                        <FileText size={24} />
                    </div>
                </div>
                <div className={styles.nameSection}>
                    <h3 className={styles.brandName}>{brand.name}</h3>
                    {brand.application_number && (
                        <span className={styles.appNumber}>
                            <Hash size={12} />
                            {brand.application_number}
                        </span>
                    )}
                </div>
            </div>

            {/* Details Grid */}
            {showAllDetails && (
                <div className={styles.details}>
                    {brand.nice_class && (
                        <div className={styles.detailRow}>
                            <span className={styles.label}>
                                <Tag size={14} />
                                Nice Class
                            </span>
                            <span className={styles.value}>{brand.nice_class}</span>
                        </div>
                    )}

                    {brand.filing_date && (
                        <div className={styles.detailRow}>
                            <span className={styles.label}>
                                <Calendar size={14} />
                                Filing Date
                            </span>
                            <span className={styles.value}>{brand.filing_date}</span>
                        </div>
                    )}

                    {brand.expiration_date && (
                        <div className={styles.detailRow}>
                            <span className={styles.label}>
                                <Calendar size={14} />
                                Expiry Date
                            </span>
                            <span className={styles.value}>{brand.expiration_date}</span>
                        </div>
                    )}

                    {brand.owner && (
                        <div className={styles.detailRow}>
                            <span className={styles.label}>
                                <User size={14} />
                                Owner
                            </span>
                            <span className={styles.value}>{brand.owner}</span>
                        </div>
                    )}

                    {brand.colors && (
                        <div className={styles.detailRow}>
                            <span className={styles.label}>
                                <Palette size={14} />
                                Colors
                            </span>
                            <span className={styles.value}>{brand.colors}</span>
                        </div>
                    )}

                    {brand.description && (
                        <div className={styles.description}>
                            <span className={styles.label}>
                                <FileText size={14} />
                                Description
                            </span>
                            <p className={styles.descText}>{brand.description}</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
