'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Lock, Mail, ArrowRight, Shield } from 'lucide-react';
import styles from './login.module.css';

export default function LoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        // Simulate API call delay for better UX
        await new Promise(resolve => setTimeout(resolve, 800));

        // Hardcoded credentials check
        if (email === 'hi@nadim.com' && password === '102030++') {
            // Set session
            sessionStorage.setItem('authenticated', 'true');
            sessionStorage.setItem('userEmail', email);

            // Redirect to dashboard
            router.push('/dashboard/overview');
        } else {
            setError('Invalid email or password');
            setLoading(false);
        }
    };

    return (
        <div className={styles.container}>
            {/* Animated background orbs */}
            <div className={styles.orb1}></div>
            <div className={styles.orb2}></div>
            <div className={styles.orb3}></div>

            {/* Login Card */}
            <motion.div
                className={styles.loginCard}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: 'easeOut' }}
            >
                {/* Logo/Brand Section */}
                <motion.div
                    className={styles.brandSection}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2, duration: 0.6 }}
                >
                    <div className={styles.logoWrapper}>
                        <Shield className={styles.logo} size={48} />
                    </div>
                    <h1 className={styles.brandName}>LEGAFIN SARL</h1>
                    <p className={styles.tagline}>Protégez vos innovations, sécurisez votre avenir</p>
                </motion.div>

                {/* Form Section */}
                <motion.form
                    className={styles.form}
                    onSubmit={handleSubmit}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4, duration: 0.6 }}
                >
                    <h2 className={styles.formTitle}>Welcome Back</h2>
                    <p className={styles.formSubtitle}>Sign in to access your dashboard</p>

                    {error && (
                        <motion.div
                            className={styles.errorBox}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.2 }}
                        >
                            {error}
                        </motion.div>
                    )}

                    <div className={styles.inputGroup}>
                        <label htmlFor="email" className={styles.label}>
                            Email Address
                        </label>
                        <div className={styles.inputWrapper}>
                            <Mail className={styles.inputIcon} size={20} />
                            <input
                                id="email"
                                type="email"
                                className={styles.input}
                                placeholder="hi@nadim.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                disabled={loading}
                            />
                        </div>
                    </div>

                    <div className={styles.inputGroup}>
                        <label htmlFor="password" className={styles.label}>
                            Password
                        </label>
                        <div className={styles.inputWrapper}>
                            <Lock className={styles.inputIcon} size={20} />
                            <input
                                id="password"
                                type="password"
                                className={styles.input}
                                placeholder="Enter your password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                disabled={loading}
                            />
                        </div>
                    </div>

                    <motion.button
                        type="submit"
                        className={styles.submitBtn}
                        disabled={loading}
                        whileHover={{ scale: loading ? 1 : 1.02 }}
                        whileTap={{ scale: loading ? 1 : 0.98 }}
                    >
                        {loading ? (
                            <>
                                <span className={styles.spinner}></span>
                                Signing in...
                            </>
                        ) : (
                            <>
                                Sign In
                                <ArrowRight size={20} />
                            </>
                        )}
                    </motion.button>
                </motion.form>

                {/* Footer */}
                <motion.div
                    className={styles.footer}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.6, duration: 0.6 }}
                >
                    <p>Brand Detection Dashboard • Powered by LEGAFIN SARL</p>
                </motion.div>
            </motion.div>
        </div>
    );
}
