
'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, FileText, Database, Settings, LogOut, Clock, BarChart, Bell, HelpCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import styles from './layout.module.css';

export default function DashboardLayout({ children }) {
    const pathname = usePathname();
    const router = useRouter();
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [userEmail, setUserEmail] = useState('');

    useEffect(() => {
        // Check authentication
        const auth = sessionStorage.getItem('authenticated');
        const email = sessionStorage.getItem('userEmail');

        if (auth === 'true') {
            setIsAuthenticated(true);
            setUserEmail(email || '');
        } else {
            router.push('/login');
        }
    }, [router]);

    const handleLogout = () => {
        sessionStorage.removeItem('authenticated');
        sessionStorage.removeItem('userEmail');
        router.push('/login');
    };

    if (!isAuthenticated) {
        return (
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: '100vh',
                background: 'var(--bg-app)'
            }}>
                <div style={{
                    width: '40px',
                    height: '40px',
                    border: '3px solid rgba(99, 102, 241, 0.3)',
                    borderTopColor: '#6366f1',
                    borderRadius: '50%',
                    animation: 'spin 0.6s linear infinite'
                }}></div>
            </div>
        );
    }


    const navItems = [
        { name: 'Overview', href: '/dashboard/overview', icon: LayoutDashboard },
        { name: 'PDF Scan', href: '/dashboard/pdf-scan', icon: FileText },
        { name: 'Brand Library', href: '/dashboard/brands', icon: Database },
        { name: 'Scan History', href: '/dashboard/history', icon: Clock },
        { name: 'Analytics', href: '/dashboard/analytics', icon: BarChart },
        { name: 'Notifications', href: '/dashboard/notifications', icon: Bell },
        { name: 'Settings', href: '/dashboard/settings', icon: Settings },
        { name: 'Help', href: '/dashboard/help', icon: HelpCircle },
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

                {/* User Section with Logout */}
                <div className={styles.userSection}>
                    <div className={styles.userInfo}>
                        <div className={styles.userEmail}>{userEmail}</div>
                    </div>
                    <motion.button
                        className={styles.logoutBtn}
                        onClick={handleLogout}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                    >
                        <LogOut size={18} />
                        Logout
                    </motion.button>
                </div>
            </aside>
            <main className={styles.main}>
                {children}
            </main>
        </div>
    );
}
