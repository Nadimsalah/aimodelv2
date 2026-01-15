
'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, FileText, Database, Settings } from 'lucide-react';
import styles from './layout.module.css';

export default function DashboardLayout({ children }) {
    const pathname = usePathname();

    const navItems = [
        { name: 'PDF Scan', href: '/dashboard/pdf-scan', icon: FileText },
        { name: 'Brand Library', href: '/dashboard/brands', icon: Database },
        // { name: 'Matches', href: '/dashboard/matches', icon: LayoutDashboard }, // Hidden, accessed via jobs
    ];

    return (
        <div className={styles.container}>
            <aside className={styles.sidebar}>
                <div className={styles.logo}>
                    <div style={{ fontSize: '1.2rem', fontWeight: 800, lineHeight: 1.2 }}>LEGAFIN SARL</div>
                    <div style={{ fontSize: '0.65rem', opacity: 0.7, marginTop: '0.2rem' }}>Protégez vos innovations, sécurisez votre avenir</div>
                </div>
                <nav className={styles.nav}>
                    {navItems.map(item => {
                        const isActive = pathname.startsWith(item.href);
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`${styles.navItem} ${isActive ? styles.active : ''}`}
                            >
                                <item.icon size={20} />
                                {item.name}
                            </Link>
                        );
                    })}
                </nav>
            </aside>
            <main className={styles.main}>
                {children}
            </main>
        </div>
    );
}
