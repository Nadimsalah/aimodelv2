import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, FileText, X } from 'lucide-react';
import styles from './FileUploader.module.css';

export default function FileUploader({ onFileSelect, selectedFile, onClear }) {
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef(null);

    const handleDragOver = (e) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragging(false);

        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            const file = e.dataTransfer.files[0];
            if (file.type === 'application/pdf') {
                onFileSelect(file);
            } else {
                alert('Please upload a PDF file.');
            }
        }
    };

    const handleClick = () => {
        fileInputRef.current?.click();
    };

    const handleInputChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            onFileSelect(e.target.files[0]);
        }
    };

    return (
        <div className={styles.container}>
            <AnimatePresence mode="wait">
                {!selectedFile ? (
                    <motion.div
                        key="upload-zone"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className={`${styles.dropZone} ${isDragging ? styles.dragging : ''}`}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        onClick={handleClick}
                    >
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleInputChange}
                            accept=".pdf"
                            style={{ display: 'none' }}
                        />
                        <div className={styles.iconWrapper}>
                            <Upload size={32} className={styles.icon} />
                        </div>
                        <h3>Upload your PDF</h3>
                        <p>Drag and drop or click to browse</p>
                    </motion.div>
                ) : (
                    <motion.div
                        key="file-preview"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className={styles.filePreview}
                    >
                        <div className={styles.fileIcon}>
                            <FileText size={24} />
                        </div>
                        <div className={styles.fileInfo}>
                            <span className={styles.fileName}>{selectedFile.name}</span>
                            <span className={styles.fileSize}>
                                {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                            </span>
                        </div>
                        <button
                            onClick={onClear}
                            className={styles.removeBtn}
                            aria-label="Remove file"
                        >
                            <X size={20} />
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
