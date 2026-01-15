
'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { FileUp, Loader2, CheckCircle, AlertCircle, Play } from 'lucide-react';
// import { supabase } from '@/lib/supabase';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY
);
import FileUploader from '@/app/components/FileUploader';
import styles from './pdf-scan.module.css';

export default function PdfScanPage() {
    const router = useRouter();
    const [file, setFile] = useState(null);
    const [jobs, setJobs] = useState([]);
    const [loadingJobs, setLoadingJobs] = useState(true);

    const checkJobStatus = async (jobId) => {
        const { data } = await supabase
            .from('scan_jobs')
            .select('status')
            .eq('id', jobId)
            .single();
        return data?.status;
    };

    const fetchJobs = async () => {
        setLoadingJobs(true);
        const { data } = await supabase
            .from('scan_jobs')
            .select('*')
            .order('created_at', { ascending: false });
        // In real app, probably limit to 5-10 recent jobs
        if (data) setJobs(data);
        setLoadingJobs(false);
    };

    useEffect(() => {
        fetchJobs();

        // Polling for active jobs
        const interval = setInterval(async () => {
            // Find any jobs that are 'queued' or 'processing'
            // We can refresh the whole list (simpler for prototype)
            // or optimally check specific IDs.
            await fetchJobs();
        }, 3000);

        return () => clearInterval(interval);
    }, []);

    const handleScan = async () => {
        if (!file) return;

        // 1. Create Job
        const formData = new FormData();
        formData.append('file', file);

        try {
            // Optimistic update
            const tempId = `temp_${Date.now()}`;
            setJobs(prev => [{ id: tempId, filename: file.name, status: 'uploading', created_at: new Date().toISOString() }, ...prev]);

            const res = await fetch('/api/scans/create', { method: 'POST', body: formData });
            const data = await res.json();

            if (!res.ok) throw new Error(data.error);

            const jobId = data.job.id;

            // 2. Trigger Run (Async)
            // We don't await this fully, but we trigger it. 
            // Better pattern: Use a queue worker. 
            // For V1: We call it and let polling handle the UI update.
            fetch('/api/scans/run', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ jobId })
            });

            // Allow polling to pick up the new real job state
            setFile(null); // Clear input
            await fetchJobs();

        } catch (error) {
            console.error(error);
            alert('Scan failed: ' + error.message);
        }
    };

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <h1 className={styles.title}>PDF Scan</h1>
                <p className={styles.subtitle}>Upload documents for brand extraction</p>
            </header>

            <div className={styles.uploadSection}>
                <div className={styles.glassCard}>
                    <FileUploader onFileSelect={setFile} selectedFile={file} onClear={() => setFile(null)} />

                    <div className={styles.actions}>
                        <button
                            className={styles.scanBtn}
                            disabled={!file}
                            onClick={handleScan}
                        >
                            <FileUp size={18} /> Start Scan
                        </button>
                    </div>
                </div>
            </div>

            <div className={styles.jobsSection}>
                <h2>Recent Scans</h2>
                <div className={styles.jobList}>
                    {loadingJobs && jobs.length === 0 ? (
                        <p className={styles.empty}>Loading jobs...</p>
                    ) : jobs.length === 0 ? (
                        <p className={styles.empty}>No scans found. Upload a PDF to start.</p>
                    ) : (
                        jobs.map(job => (
                            <motion.div
                                key={job.id}
                                className={styles.jobCard}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                            >
                                <div className={styles.jobInfo}>
                                    <span className={styles.filename}>{job.filename}</span>
                                    <span className={styles.date}>{new Date(job.created_at).toLocaleString()}</span>
                                </div>
                                <div className={styles.jobStatus}>
                                    {job.status === 'queued' && <span className={styles.tagQueued}><Loader2 className={styles.spin} size={14} /> Queued</span>}
                                    {job.status === 'processing' && <span className={styles.tagProcessing}><Loader2 className={styles.spin} size={14} /> Processing...</span>}
                                    {job.status === 'completed' && <span className={styles.tagCompleted}><CheckCircle size={14} /> Completed</span>}
                                    {job.status === 'failed' && <span className={styles.tagFailed}><AlertCircle size={14} /> Failed</span>}
                                    {job.status === 'uploading' && <span className={styles.tagQueued}>Uploading...</span>}
                                </div>
                                {job.status === 'completed' && (
                                    <button
                                        className={styles.viewBtn}
                                        onClick={() => router.push(`/dashboard/matches/${job.id}`)}
                                    >
                                        View Results <Play size={12} fill="currentColor" />
                                    </button>
                                )}
                            </motion.div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
