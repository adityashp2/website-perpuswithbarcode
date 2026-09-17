import React from 'react';

export default function Footer() {
  return (
    <footer
      style={{
        marginTop: 'auto',
        padding: '24px 32px',
        borderTop: '1px solid var(--apple-border)',
        fontSize: '12.5px',
        color: 'var(--apple-text-secondary)',
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '12px',
      }}
    >
      <div>
        <span style={{ fontWeight: 600, color: 'var(--apple-text-primary)' }}>Pustaka Polinela</span> &copy; {new Date().getFullYear()} Politeknik Negeri Lampung. Hak cipta dilindungi.
      </div>
      <div style={{ display: 'flex', gap: '16px' }}>
        <span>Sistem Perpustakaan Digital</span>
        <span>Barcode &amp; Sirkulasi</span>
      </div>
    </footer>
  );
}

