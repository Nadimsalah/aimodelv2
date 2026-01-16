
'use client';
'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, FileText, Database, Settings, LogOut, Clock, BarChart, Bell, HelpCircle, Menu, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import styles from './layout.module.css';

export default function DashboardLayout({ children }) {
    const pathname = usePathname();
    const router = useRouter();
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [userEmail, setUserEmail] = useState('');
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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

    // Close mobile menu when route changes
    useEffect(() => {
        setIsMobileMenuOpen(false);
    }, [pathname]);

    const handleLogout = () => {
        sessionStorage.removeItem('authenticated');
        sessionStorage.removeItem('userEmail');
        router.push('/login');
    };

    if (!isAuthenticated) {
        return (
            <div className={styles.loadingContainer}>
                <div className={styles.spinner}></div>
            </div>
        );
    }

    const navItems = [
        { name: 'Overview', href: '/dashboard/overview', icon: LayoutDashboard },
        { name: 'Scan History', href: '/dashboard/history', icon: Clock },
        { name: 'Brand Library', href: '/dashboard/brands', icon: Database },
        { name: 'Analytics', href: '/dashboard/analytics', icon: BarChart },
        { name: 'Notifications', href: '/dashboard/notifications', icon: Bell },
        { name: 'Settings', href: '/dashboard/settings', icon: Settings },
        { name: 'Help', href: '/dashboard/help', icon: HelpCircle },
    ];

    return (
        <div className={styles.container}>
            {/* Mobile Header */}
            <header className={styles.mobileHeader}>
                <div className={styles.logoMobile}>LEGAFIN</div>
                <button
                    className={styles.menuToggle}
                    onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                >
                    {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                </button>
            </header>

            {/* Sidebar / Navigation */}
            <aside className={`${styles.sidebar} ${isMobileMenuOpen ? styles.open : ''}`}>
                <div className={styles.sidebarHeader}>
                    <div className={styles.logo}>
                        <div className={styles.logoText}>LEGAFIN SARL</div>
                        <div className={styles.logoTagline}>Innovation Protection</div>
                    </div>
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
                                <item.icon size={20} className={styles.navIcon} />
                                <span className={styles.navLabel}>{item.name}</span>
                                {isActive && (
                                    <motion.div
                                        layoutId="activeNav"
                                        className={styles.activeIndicator}
                                        initial={false}
                                        transition={{ type: "spring", stiffness: 500, damping: 30 }}
                                    />
                                )}
                            </Link>
                        );
                    })}
                </nav>

                <div className={styles.userSection}>
                    <div className={styles.userInfo}>
                        <div className={styles.userAvatar}>
                            {userEmail.charAt(0).toUpperCase()}
                        </div>
                        <div className={styles.userDetails}>
                            <span className={styles.userEmail}>{userEmail}</span>
                            <span className={styles.userRole}>Admin</span>
                        </div>
                    </div>
                    <button onClick={handleLogout} className={styles.logoutBtn}>
                        <LogOut size={18} />
                    </button>
                </div>
            </aside>

            {/* Backdrop for mobile */}
            {isMobileMenuOpen && (
                <div
                    className={styles.backdrop}
                    onClick={() => setIsMobileMenuOpen(false)}
                />
            )}

            <main className={styles.main}>
                <div className={styles.contentWrapper}>
                    {children}
                </div>
            </main>
        </div>
    );
}
