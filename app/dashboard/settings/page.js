'use client';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { Settings as SettingsIcon, User, Bell, Key, Database, Save } from 'lucide-react';
import styles from './settings.module.css';

export default function SettingsPage() {
    const [settings, setSettings] = useState({
        email: sessionStorage.getItem('userEmail') || '',
        notifications: true,
        emailAlerts: false,
        apiKey: '••••••••••••••••'
    });

    const handleSave = () => {
        alert('Settings saved successfully!');
    };

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <h1 className={styles.title}>
                    <SettingsIcon size={28} />
                    Settings
                </h1>
                <p className={styles.subtitle}>Manage your account and preferences</p>
            </header>

            <div className={styles.sectionsGrid}>
                {/* User Profile */}
                <section className={styles.section}>
                    <h2 className={styles.sectionTitle}>
                        <User size={20} />
                        User Profile
                    </h2>
                    <div className={styles.settingItem}>
                        <label className={styles.label}>Email Address</label>
                        <input
                            type="email"
                            className={styles.input}
                            value={settings.email}
                            onChange={(e) => setSettings({ ...settings, email: e.target.value })}
                        />
                    </div>
                </section>

                {/* Notifications */}
                <section className={styles.section}>
                    <h2 className={styles.sectionTitle}>
                        <Bell size={20} />
                        Notifications
                    </h2>
                    <div className={styles.settingItem}>
                        <div className={styles.toggleRow}>
                            <div>
                                <label className={styles.label}>In-App Notifications</label>
                                <p className={styles.description}>Receive notifications in the dashboard</p>
                            </div>
                            <label className={styles.toggle}>
                                <input
                                    type="checkbox"
                                    checked={settings.notifications}
                                    onChange={(e) => setSettings({ ...settings, notifications: e.target.checked })}
                                />
                                <span className={styles.slider}></span>
                            </label>
                        </div>
                    </div>
                    <div className={styles.settingItem}>
                        <div className={styles.toggleRow}>
                            <div>
                                <label className={styles.label}>Email Alerts</label>
                                <p className={styles.description}>Get email when scans complete</p>
                            </div>
                            <label className={styles.toggle}>
                                <input
                                    type="checkbox"
                                    checked={settings.emailAlerts}
                                    onChange={(e) => setSettings({ ...settings, emailAlerts: e.target.checked })}
                                />
                                <span className={styles.slider}></span>
                            </label>
                        </div>
                    </div>
                </section>

                {/* API Configuration */}
                <section className={styles.section}>
                    <h2 className={styles.sectionTitle}>
                        <Key size={20} />
                        API Configuration
                    </h2>
                    <div className={styles.settingItem}>
                        <label className={styles.label}>Gemini API Key</label>
                        <input
                            type="password"
                            className={styles.input}
                            value={settings.apiKey}
                            onChange={(e) => setSettings({ ...settings, apiKey: e.target.value })}
                            placeholder="Enter your API key"
                        />
                        <p className={styles.hint}>Configured in .env.local file</p>
                    </div>
                </section>

                {/* Data Management */}
                <section className={styles.section}>
                    <h2 className={styles.sectionTitle}>
                        <Database size={20} />
                        Data Management
                    </h2>
                    <div className={styles.settingItem}>
                        <button className={styles.dangerBtn}>
                            Clear All Scan History
                        </button>
                        <p className={styles.hint}>This action cannot be undone</p>
                    </div>
                </section>
            </div>

            <div className={styles.saveSection}>
                <motion.button
                    className={styles.saveBtn}
                    onClick={handleSave}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                >
                    <Save size={18} />
                    Save Changes
                </motion.button>
            </div>
        </div>
    );
}
