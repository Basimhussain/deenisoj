'use client';

import { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import styles from './FatwaView.module.css';

interface FatwaQrCodeProps {
  url: string;
  label?: string;
}

export function FatwaQrCode({ url, label = 'Scan to verify' }: FatwaQrCodeProps) {
  const [dataUrl, setDataUrl] = useState<string>('');

  useEffect(() => {
    QRCode.toDataURL(url, {
      errorCorrectionLevel: 'M',
      margin: 0,
      width: 256, // high-res so it prints crisply
      color: {
        dark: '#1a1a1a',
        light: '#ffffff',
      },
    })
      .then(setDataUrl)
      .catch(() => setDataUrl(''));
  }, [url]);

  if (!dataUrl) return null;

  return (
    <div className={styles.pdfQrCode} aria-hidden="true">
      <img src={dataUrl} alt="" />
      <span>{label}</span>
    </div>
  );
}
