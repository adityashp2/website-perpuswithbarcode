import React from 'react';

export default function Footer() {
  return (
    <footer className="app-footer">
      <div>
        <strong>Perpustakaan Politeknik Negeri Lampung</strong> &copy; {new Date().getFullYear()} &bull; Sistem Informasi Perpustakaan Terpadu
      </div>
      <div>
        Dikembangkan dengan antarmuka modern &amp; responsif
      </div>
    </footer>
  );
}
