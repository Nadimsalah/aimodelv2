'use client';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Bell, CheckCircle, AlertCircle, Info, X } from 'lucide-react';
import styles from './notifications.module.css';

export default function NotificationsPage() {
    const [notifications, setNotifications] = useState([
        {
            id: 1,
            type: 'success',
            title: 'Scan Completed',
            message: 'Your PDF scan has been completed successfully. 5 brands detected.',
            time: new Date(Date.now() - 1000 * 60 * 5),
            read: false
        },
        {
            id: 2,
            type: 'info',
            title: 'Brand Library Updated',
            message: '50 new brands imported from Excel file.',
            time: new Date(Date.now() - 1000 * 60 * 60 * 2),
            read: false
        },
        {
            id: 3,
            type: 'warning',
            title: 'Low Match Rate',
            message: 'Recent scan had only 2 matches. Consider expanding your brand library.',
            time: new Date(Date.now() - 1000 * 60 * 60 * 24),
            read: true
        }
    ]);

    const getIcon = (type) => {
        switch (type) {
            case 'success':
                return <CheckCircle size={20} />;
            case 'warning':
                return <AlertCircle size={20} />;
            case 'info':
            default:
                return <Info size={20} />;
        }
    };

    const getColor = (type) => {
        switch (type) {
            case 'success':
                return { bg: 'var(--success-bg)', color: 'var(--success)', border: 'transparent' };
            case 'warning':
                return { bg: 'var(--warning-bg)', color: 'var(--warning)', border: 'transparent' };
            case 'info':
            default:
                return { bg: 'var(--bg-subtle)', color: 'var(--primary)', border: 'transparent' };
        }
    };

    const markAsRead = (id) => {
        setNotifications(notifications.map(n =>
            n.id === id ? { ...n, read: true } : n
        ));
    };

    const deleteNotification = (id) => {
        setNotifications(notifications.filter(n => n.id !== id));
    };

    const markAllAsRead = () => {
        setNotifications(notifications.map(n => ({ ...n, read: true })));
    };

    const unreadCount = notifications.filter(n => !n.read).length;

    const formatTime = (date) => {
        const now = new Date();
        const diff = now - date;
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);

        if (days > 0) return `${days}d ago`;
        if (hours > 0) return `${hours}h ago`;
        if (minutes > 0) return `${minutes}m ago`;
        return 'Just now';
    };

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <div>
                    <h1 className={styles.title}>
                        <Bell size={28} />
                        Notifications
                        {unreadCount > 0 && (
                            <span className={styles.badge}>{unreadCount}</span>
                        )}
                    </h1>
                    <p className={styles.subtitle}>Stay updated with your brand detection activity</p>
                </div>
                {unreadCount > 0 && (
                    <button className={styles.markAllBtn} onClick={markAllAsRead}>
                        Mark all as read
                    </button>
                )}
            </header>

            <div className={styles.notificationsList}>
                {notifications.length === 0 ? (
                    <div className={styles.emptyState}>
                        <Bell size={48} style={{ opacity: 0.3 }} />
                        <p>No notifications yet</p>
                    </div>
                ) : (
                    notifications.map((notification, index) => {
                        const colors = getColor(notification.type);

                        return (
                            <motion.div
                                key={notification.id}
                                className={`${styles.notificationItem} ${notification.read ? styles.read : ''}`}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.05, duration: 0.3 }}
                            >
                                <div
                                    className={styles.notificationIcon}
                                    style={{
                                        backgroundColor: colors.bg,
                                        color: colors.color,
                                        border: `1px solid ${colors.border}`
                                    }}
                                >
                                    {getIcon(notification.type)}
                                </div>

                                <div className={styles.notificationContent}>
                                    <div className={styles.notificationHeader}>
                                        <h3 className={styles.notificationTitle}>
                                            {notification.title}
                                            {!notification.read && <span className={styles.unreadDot}></span>}
                                        </h3>
                                        <span className={styles.notificationTime}>
                                            {formatTime(notification.time)}
                                        </span>
                                    </div>
                                    <p className={styles.notificationMessage}>{notification.message}</p>
                                </div>

                                <div className={styles.notificationActions}>
                                    {!notification.read && (
                                        <button
                                            className={styles.actionBtn}
                                            onClick={() => markAsRead(notification.id)}
                                            title="Mark as read"
                                        >
                                            <CheckCircle size={18} />
                                        </button>
                                    )}
                                    <button
                                        className={styles.actionBtn}
                                        onClick={() => deleteNotification(notification.id)}
                                        title="Delete"
                                    >
                                        <X size={18} />
                                    </button>
                                </div>
                            </motion.div>
                        );
                    })
                )}
            </div>
        </div>
    );
}
