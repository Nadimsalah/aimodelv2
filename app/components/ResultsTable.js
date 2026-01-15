import { motion } from 'framer-motion';
import { Tag } from 'lucide-react';
import styles from './ResultsTable.module.css';

export default function ResultsTable({ brands }) {
    if (!brands || brands.length === 0) {
        return null;
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={styles.container}
        >
            <div className={styles.header}>
                <div className={styles.headerTitle}>
                    <Tag size={20} className={styles.headerIcon} />
                    <h2>Detected Brands</h2>
                </div>
                <span className={styles.badge}>{brands.length} found</span>
            </div>

            <div className={styles.tableWrapper}>
                <table className={styles.table}>
                    <thead>
                        <tr>
                            <th>#</th>
                            <th>Brand Name</th>
                            <th>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {brands.map((brand, index) => (
                            <motion.tr
                                key={index}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.05 }}
                            >
                                <td className={styles.indexCol}>{index + 1}</td>
                                <td className={styles.brandCol}>{brand}</td>
                                <td>
                                    <button className={styles.copyBtn} onClick={() => navigator.clipboard.writeText(brand)}>
                                        Copy
                                    </button>
                                </td>
                            </motion.tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </motion.div>
    );
}
