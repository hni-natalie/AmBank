import { useRef, useState } from 'react';
import styles from './UploadCard.module.css';

export interface UploadedFile {
  name: string;
  size: number;
  type: string;
  file: File;
}

interface UploadCardProps {
  file: UploadedFile | null;
  onFileSelect: (file: UploadedFile | null) => void;
  companyName: string;
  ticker: string;
  sector: string;
  onCompanyNameChange: (name: string) => void;
  onTickerChange: (ticker: string) => void;
  onSectorChange: (sector: string) => void;
}

export function UploadCard({
  file,
  onFileSelect,
  companyName,
  ticker,
  sector,
  onCompanyNameChange,
  onTickerChange,
  onSectorChange
}: UploadCardProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFileSelect = (selectedFile: File) => {
    if (selectedFile.type === 'application/pdf') {
      const uploadedFile: UploadedFile = {
        name: selectedFile.name,
        size: selectedFile.size,
        type: selectedFile.type,
        file: selectedFile
      };
      onFileSelect(uploadedFile);
    } else {
      alert('Please upload a PDF file only.');
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      handleFileSelect(droppedFile);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleBrowseClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      handleFileSelect(selectedFile);
    }
  };

  const handleRemove = () => {
    onFileSelect(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const sectors = [
    'Technology',
    'Banks',
    'REIT',
    'Utilities',
    'Consumer',
    'Healthcare',
    'Energy',
    'Industrial'
  ];

  return (
    <div className={styles.container}>
      <h3 className={styles.title}>Upload Portfolio</h3>

      {!file ? (
        <div
          className={`${styles.uploadArea} ${isDragging ? styles.uploadAreaDragging : ''}`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
        >
          <div className={styles.uploadIcon}>
            <svg
              width="48"
              height="48"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M21 15V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V15"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M7 10L12 15L17 10"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M12 15V3"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <p className={styles.uploadText}>
            Drag and drop your portfolio PDF here, or{' '}
            <button
              type="button"
              onClick={handleBrowseClick}
              className={styles.browseButton}
            >
              browse
            </button>
          </p>
          <p className={styles.helperText}>PDF files only</p>
        </div>
      ) : (
        <div className={styles.fileInfo}>
          <div className={styles.fileDetails}>
            <div className={styles.fileIcon}>
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M14 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V8L14 2Z"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M14 2V8H20"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <div className={styles.fileMeta}>
              <p className={styles.fileName}>{file.name}</p>
              <p className={styles.fileSize}>{formatFileSize(file.size)}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleRemove}
            className={styles.removeButton}
            aria-label="Remove file"
          >
            ×
          </button>
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="application/pdf"
        onChange={handleFileInputChange}
        className={styles.hiddenInput}
        aria-label="File input"
      />

      <div className={styles.optionalFields}>
        <div className={styles.field}>
          <label className={styles.label}>Company Name (optional)</label>
          <input
            type="text"
            value={companyName}
            onChange={(e) => onCompanyNameChange(e.target.value)}
            placeholder="e.g., Apple Inc."
            className={styles.input}
          />
        </div>

        <div className={styles.field}>
          <label className={styles.label}>Company Ticker (optional)</label>
          <input
            type="text"
            value={ticker}
            onChange={(e) => onTickerChange(e.target.value.toUpperCase())}
            placeholder="e.g., AAPL"
            className={styles.input}
            maxLength={10}
          />
        </div>

        <div className={styles.field}>
          <label className={styles.label}>Sector (optional)</label>
          <select
            value={sector}
            onChange={(e) => onSectorChange(e.target.value)}
            className={styles.select}
          >
            <option value="">Select sector</option>
            {sectors.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}
