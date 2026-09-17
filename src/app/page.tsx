'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useData } from '@/lib/dataContext';
import { useAuth } from '@/lib/authContext';
import AuthenticatedHome from '@/components/AuthenticatedHome';
import './landing.css';

export default function HomePage() {
  const router = useRouter();
  const { buku, peminjaman, config } = useData();
  const { currentUser, currentAnggota, isAdmin } = useAuth();

  const [activeFaq, setActiveFaq] = useState<number | null>(0);
  const [previewLanding, setPreviewLanding] = useState(false);

  // If user is authenticated, render the dedicated Beranda Analytics & Monitoring Dashboard
  if (currentUser && !previewLanding) {
    return <AuthenticatedHome onPreviewLanding={() => setPreviewLanding(true)} />;
  }

  const totalBuku = buku.length;

  const toggleFaq = (index: number) => {
    setActiveFaq((prev) => (prev === index ? null : index));
  };

  const faqItems = [
    {
      q: 'Apa itu sistem perpustakaan digital PustakaScan?',
      a: 'PustakaScan adalah platform perpustakaan digital terintegrasi berbasis web modern yang menghadirkan kecepatan sirkulasi buku ala kasir minimarket. Dilengkapi pemindaian barcode buku, kartu tanda anggota fisik/digital standar ISO 7810, dan slip peminjaman 58mm.',
    },
    {
      q: 'Bagaimana caranya meminjam buku di perpustakaan?',
      a: 'Anda cukup menjadi anggota aktif terverifikasi. Pilih buku melalui katalog OPAC atau ambil langsung di rak fisik perpustakaan, lalu tunjukkan barcode buku dan kartu anggota digital/fisik Anda ke petugas kasir meja sirkulasi untuk dipindai dalam 5 detik.',
    },
    {
      q: 'Bagaimana cara mendaftar menjadi anggota perpustakaan?',
      a: 'Klik tombol "Daftar Anggota" di bagian atas halaman atau bagian pendaftaran. Isi formulir dengan data diri dan unggah foto KTM mahasiswa. Setelah diverifikasi petugas, kartu anggota barcode Anda akan aktif secara otomatis.',
    },
    {
      q: 'Berapa lama batas peminjaman dan bagaimana aturan dendanya?',
      a: `Batas peminjaman standar adalah ${config.maxLamaPinjam || 7} hari kerja. Sistem secara otomatis menghitung denda keterlambatan sebesar Rp ${(config.dendaPerHari || 500).toLocaleString('id-ID')} per hari keterlambatan per buku. Jika denda mencapai ambang batas Rp ${(config.ambangDendaBlokir || 50000).toLocaleString('id-ID')}, sistem secara otomatis memblokir peminjaman baru sampai denda diselesaikan.`,
    },
    {
      q: 'Apakah kartu tanda anggota perpustakaan bisa dicetak fisik?',
      a: 'Ya! Sistem menyediakan kartu digital bergaya Apple Wallet yang dapat langsung dicetak dalam format standar ID-1 ISO 7810 (85.6 × 54 mm) siap laminating, lengkap dengan barcode Code 128 dan foto profil anggota.',
    },
  ];

  return (
    <div className="ps-landing">
      {/* Pratinjau Banner if Logged In User Previewing Public Landing */}
      {currentUser && previewLanding && (
        <div
          style={{
            background: 'linear-gradient(135deg, #0071e3 0%, #1e40af 100%)',
            color: '#ffffff',
            padding: '12px 18px',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px',
            boxShadow: '0 4px 16px rgba(0, 113, 227, 0.25)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: 600 }}>
            <i className="bx bx-show" style={{ fontSize: '18px' }} />
            <span>Mode Pratinjau: Anda sedang melihat tampilan Halaman Landing Publik.</span>
          </div>
          <button
            type="button"
            onClick={() => setPreviewLanding(false)}
            style={{
              background: '#ffffff',
              color: '#0071e3',
              border: 'none',
              borderRadius: '8px',
              padding: '6px 14px',
              fontSize: '12px',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            <i className="bx bx-arrow-back" /> Kembali ke Beranda Dashboard
          </button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SECTION 1: HERO SECTION (#home)                                          */}
      {/* ========================================================================= */}
      <section id="home" className="ps-hero">
        <div className="ps-hero__content">
          <div className="ps-hero__tag">
            {config.logoInstansi ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={config.logoInstansi} alt="Logo" className="ps-hero__tag-icon" />
            ) : (
              <i className="bx bx-barcode-reader" />
            )}
            <span>{config.heroTag || 'PUSTAKASCAN • POLINELA'}</span>
          </div>

          <h1 className="ps-hero__title">
            {config.heroTitle || 'Sistem Sirkulasi & Perpustakaan Digital Modern'}
          </h1>

          <p className="ps-hero__desc">
            {config.heroSubtitle || 'Akses literasi tanpa batas, transaksi peminjaman dalam hitungan detik ala kasir minimarket. Terintegrasi scanner barcode, kartu anggota digital/cetak ID-1, dan cetak slip thermal 58mm.'}
          </p>

          <div className="ps-hero__actions">
            <Link href="/katalog" className="ps-hero__btn-primary">
              Mulai Sekarang / Pinjam Buku <i className="bx bx-right-arrow-alt" />
            </Link>
            <a href="#koleksi-buku" className="ps-hero__btn-secondary">
              Lihat Koleksi Buku
            </a>
          </div>

          <div className="ps-hero__metrics">
            <div>
              <div className="ps-hero__metric-value ps-hero__metric-value--blue">{totalBuku}+</div>
              <div className="ps-hero__metric-label">Koleksi Judul Buku</div>
            </div>
            <div className="ps-hero__metric-divider" />
            <div>
              <div className="ps-hero__metric-value ps-hero__metric-value--orange">24/7</div>
              <div className="ps-hero__metric-label">Akses Katalog OPAC</div>
            </div>
            <div className="ps-hero__metric-divider" />
            <div>
              <div className="ps-hero__metric-value ps-hero__metric-value--green">100%</div>
              <div className="ps-hero__metric-label">Web Based &amp; Bebas Antre</div>
            </div>
          </div>
        </div>

        <div className="ps-hero__preview">
          <div className="ps-hero__card">
            <div className="ps-hero__card-header">
              <div className="ps-hero__card-badge">
                <span className="ps-hero__status-indicator" />
                SIMULASI SIRKULASI CEPAT
              </div>
              <span className="ps-hero__scan-ready">READY TO SCAN</span>
            </div>

            <div className="ps-hero__book-item">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={buku[0]?.foto || '/buku/1788324109_logo.jpg'}
                alt="Buku"
                className="ps-hero__book-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/default-book-cover.svg';
                }}
              />
              <div className="ps-hero__book-info">
                <div className="ps-hero__item-tag">ITEM TERPINDAI</div>
                <div className="ps-hero__book-name">
                  {buku[0]?.judul || 'Belajar Pemrograman Web Modern'}
                </div>
                <div className="ps-hero__book-meta">
                  <span className="ps-hero__barcode-pill">PS-2600001-01</span>
                  <span className="ps-hero__rack-text">
                    Rak {buku[0]?.lokasi_rak || 'R-A1'} • Buku 1
                  </span>
                </div>
              </div>
            </div>

            <div className="ps-hero__member-item">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div className="ps-hero__member-avatar">M</div>
                <div>
                  <div className="ps-hero__member-name">Muhammad Aditya Saputra</div>
                  <div className="ps-hero__member-id">AG-20260184 • Siswa</div>
                </div>
              </div>
              <span className="ps-hero__clean-status">
                <i className="bx bx-check-circle" /> BEBAS DENDA
              </span>
            </div>

            <div className="ps-hero__thermal-slip">
              <div className="ps-hero__slip-row">
                <span>Struk Thermal 58mm:</span>
                <span style={{ fontWeight: 700, color: '#0f172a' }}>TRX-20260917-001</span>
              </div>
              <div className="ps-hero__slip-row" style={{ color: '#16a34a' }}>
                <span>Durasi Pinjam:</span>
                <span style={{ fontWeight: 700 }}>7 HARI (TEPAT WAKTU)</span>
              </div>
            </div>

            <Link href="/admin/sirkulasi" className="ps-hero__card-cta">
              <i className="bx bx-barcode-reader" /> Buka Meja Sirkulasi Kasir
            </Link>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* SECTION 2: TENTANG PERPUSTAKAAN (#tentang)                                */}
      {/* ========================================================================= */}
      <section id="tentang" className="ps-section">
        <div className="ps-section__header">
          <h2 className="ps-section__title">
            Apa itu Perpustakaan Digital {config.namaAplikasi || 'PustakaScan'}?
          </h2>
          <p className="ps-section__subtitle">
            Tak kenal maka tak sayang, kenalan dulu yuk dengan ekosistem perpustakaan terpadu kampus kami
          </p>
        </div>

        <div className="ps-about-grid">
          <div className="ps-about-card ps-about-card--center">
            <div className="ps-about-icon">
              <i className="bx bx-book-reader" />
            </div>
            <h3 className="ps-about-card__title">Pusat Referensi &amp; Literasi Kampus</h3>
            <p className="ps-about-card__desc">
              Menghubungkan ratusan judul buku cetak akademik dengan sistem katalog digital yang cepat, transparan, dan dapat diakses dari mana saja tanpa kendala.
            </p>
            <div className="ps-about-badge">
              <i className="bx bx-check-shield" /> Terstandarisasi ISO 7810 &amp; Code 128
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
            <div className="ps-about-narrative">
              <p>
                <strong>{config.namaAplikasi || 'PustakaScan'}</strong> merupakan pangkalan data intelektual dan sistem sirkulasi modern yang mempersembahkan kemudahan literasi di ujung jari civitas akademika <strong>{config.namaInstansi || 'Politeknik Negeri Lampung'}</strong>.
              </p>
              <p>
                Platform ini membebaskan pengguna dari keharusan menginstal aplikasi tambahan di gadget. Cukup buka browser dari perangkat apa saja (laptop Windows/Mac, smartphone Android/iOS), cari buku yang diinginkan, dan periksa ketersediaan stok fisik di rak secara akurat.
              </p>
            </div>

            <div className="ps-about-stats">
              <div className="ps-about-stat-box ps-about-stat-box--blue">
                <div className="ps-about-stat-num">100%</div>
                <div className="ps-about-stat-text">Web Based (Zero Install)</div>
              </div>
              <div className="ps-about-stat-box ps-about-stat-box--orange">
                <div className="ps-about-stat-num">24/7</div>
                <div className="ps-about-stat-text">Accessible Online</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* SECTION 3: FITUR UNGGULAN (#keunggulan)                                  */}
      {/* ========================================================================= */}
      <section id="keunggulan" className="ps-section">
        <div className="ps-section__header">
          <h2 className="ps-section__title">Fitur Unggulan Kami</h2>
          <p className="ps-section__subtitle">
            Pengalaman sirkulasi perpustakaan modern dengan fitur efisien yang membuat operasional perpustakaan Anda bebas antrean
          </p>
        </div>

        <div className="ps-features-grid">
          <div className="ps-feature-card">
            <div>
              <div className="ps-feature-icon ps-feature-icon--blue">
                <i className="bx bx-globe" />
              </div>
              <h3 className="ps-feature-title">Berbasis Web Modern</h3>
              <p className="ps-feature-desc">
                Menghindari kekhawatiran memori gadget penuh. Tanpa perlu download atau install aplikasi, perpustakaan dapat dibuka dari Windows, Android, iPhone, dan Mac secara instan.
              </p>
            </div>
            <div className="ps-feature-tag ps-feature-tag--blue">
              Responsif &bull; PWA Ready
            </div>
          </div>

          <div className="ps-feature-card">
            <div>
              <div className="ps-feature-icon ps-feature-icon--orange">
                <i className="bx bx-barcode-reader" />
              </div>
              <h3 className="ps-feature-title">Sirkulasi Kasir Barcode 5 Detik</h3>
              <p className="ps-feature-desc">
                Petugas memindai kartu anggota dan barcode unik tiap eksemplar buku (misal PS-2600001-01) secara beruntun. Transaksi langsung selesai dan mencetak slip peminjaman 58mm.
              </p>
            </div>
            <div className="ps-feature-tag ps-feature-tag--orange">
              Keyboard-Wedge &bull; Kamera Scanner
            </div>
          </div>

          <div className="ps-feature-card">
            <div>
              <div className="ps-feature-icon ps-feature-icon--green">
                <i className="bx bx-map-pin" />
              </div>
              <h3 className="ps-feature-title">Katalog OPAC &amp; Posisi Rak</h3>
              <p className="ps-feature-desc">
                Pencarian instan berdasarkan judul, pengarang, dan kategori katalog. Menampilkan posisi fisik rak buku (misal Rak R-A1) sehingga mahasiswa tidak perlu bingung mencari di ruangan.
              </p>
            </div>
            <div className="ps-feature-tag ps-feature-tag--green">
              Stok Realtime &bull; Navigasi Rak Fisik
            </div>
          </div>

          <div className="ps-feature-card">
            <div>
              <div className="ps-feature-icon ps-feature-icon--purple">
                <i className="bx bx-id-card" />
              </div>
              <h3 className="ps-feature-title">KTA Digital &amp; Denda Otomatis</h3>
              <p className="ps-feature-desc">
                Kartu anggota digital dengan foto profil dan barcode siap cetak standar ISO 7810. Sistem secara transparan mendeteksi denda per hari dan memblokir otomatis jika melebihi batas.
              </p>
            </div>
            <div className="ps-feature-tag ps-feature-tag--purple">
              ISO 7810 &bull; Kalkulasi Denda Realtime
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* SECTION 4: KOLEKSI BUKU TERPOPULER (#koleksi-buku)                        */}
      {/* ========================================================================= */}
      <section id="koleksi-buku" className="ps-section">
        <div className="ps-catalog-bar">
          <div>
            <span className="ps-section__tag">KATALOG PERPUSTAKAAN</span>
            <h2 className="ps-section__title" style={{ margin: 0 }}>Koleksi Buku Akademik &amp; Populer</h2>
          </div>
          <Link href="/katalog" className="apple-btn-secondary" style={{ padding: '7px 14px', fontSize: '12.5px', minHeight: '38px' }}>
            Lihat Semua Koleksi ({totalBuku} Buku) &rarr;
          </Link>
        </div>

        <div className="ps-catalog-wrapper">
          <div className="ps-book-grid">
            {buku.slice(0, 8).map((item) => (
              <div key={item.isbn} className="ps-book-card">
                <div className="ps-book-cover">
                  {item.foto ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={item.foto}
                      alt={item.judul}
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/default-book-cover.svg';
                      }}
                    />
                  ) : (
                    <i className="bx bx-book-open" style={{ fontSize: '32px', color: '#94a3b8' }} />
                  )}
                  <div className="ps-book-stock-badge">
                    <span className={`badge ${item.qty_stok > 0 ? 'badge-success' : 'badge-danger'}`}>
                      {item.qty_stok > 0 ? `Stok: ${item.qty_stok}` : 'Habis'}
                    </span>
                  </div>
                </div>

                <div className="ps-book-body">
                  <div className="ps-book-katalog">{item.katalog?.nama || 'Akademik'}</div>
                  <div className="ps-book-title" title={item.judul}>{item.judul}</div>
                  <div className="ps-book-meta">
                    <div>Pengarang: {item.pengarang?.nama_pengarang || '-'}</div>
                    <div style={{ marginTop: '2px', fontWeight: 600, color: '#0f172a' }}>Lokasi: {item.lokasi_rak || 'Rak R-A1'}</div>
                  </div>

                  <div className="ps-book-btn-wrap">
                    <Link href={`/buku/${encodeURIComponent(item.isbn)}`} className="ps-book-btn">
                      Detail &amp; Pinjam
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', marginTop: '1.25rem' }}>
            <Link href="/katalog" className="ps-hero__btn-primary">
              Lihat Semua Koleksi Buku &rarr;
            </Link>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* SECTION 5: FREQUENTLY ASKED QUESTIONS (#faq)                              */}
      {/* ========================================================================= */}
      <section id="faq" className="ps-section">
        <div className="ps-section__header">
          <h2 className="ps-section__title">Frequently Asked Questions (FAQ)</h2>
          <p className="ps-section__subtitle">
            Temukan jawaban cepat untuk pertanyaan yang sering diajukan mengenai sistem perpustakaan kami
          </p>
        </div>

        <div className="ps-faq-list">
          {faqItems.map((item, idx) => {
            const isOpen = activeFaq === idx;
            return (
              <div key={idx} className={`ps-faq-item ${isOpen ? 'ps-faq-item--active' : ''}`}>
                <button type="button" onClick={() => toggleFaq(idx)} className="ps-faq-btn">
                  <span className="ps-faq-question">{item.q}</span>
                  <i className="bx bx-chevron-down ps-faq-icon" />
                </button>
                {isOpen && (
                  <div className="ps-faq-answer">
                    {item.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* ========================================================================= */}
      {/* SECTION 6: PENDAFTARAN & JALUR AKSES (#pendaftaran)                       */}
      {/* ========================================================================= */}
      <section id="pendaftaran" className="ps-section">
        <div className="ps-section__header">
          <h2 className="ps-section__title">Jadilah Bagian dari Kami</h2>
          <p className="ps-section__subtitle">
            Tumbuh bersama, tingkatkan prestasi akademik dan literasi di lingkungan kampus
          </p>
        </div>

        <div className="ps-pathways-grid">
          <div className="ps-pathway-card">
            <div>
              <div className="ps-pathway-icon" style={{ background: 'rgba(0, 113, 227, 0.1)', color: '#0071e3' }}>
                <i className="bx bxs-user-plus" />
              </div>
              <h3 className="ps-pathway-card__title">Daftar Anggota Mahasiswa</h3>
              <p className="ps-pathway-card__desc">
                Registrasi mandiri secara online dengan mengunggah foto KTM. Anda langsung mendapatkan nomor anggota resmi dan kartu digital ber-barcode siap pakai.
              </p>
            </div>
            <Link href="/register" className="ps-pathway-btn" style={{ background: '#0071e3', color: '#ffffff' }}>
              Daftar Sekarang &rarr;
            </Link>
          </div>

          <div className="ps-pathway-card">
            <div>
              <div className="ps-pathway-icon" style={{ background: 'rgba(234, 88, 12, 0.1)', color: '#ea580c' }}>
                <i className="bx bxs-lock-alt" />
              </div>
              <h3 className="ps-pathway-card__title">Portal Petugas Sirkulasi</h3>
              <p className="ps-pathway-card__desc">
                Masuk ke sistem kasir sirkulasi meja kasir, verifikasi pendaftaran anggota baru, kelola denda keterlambatan, dan cetak barcode buku dalam sekejap.
              </p>
            </div>
            <Link href="/login" className="ps-pathway-btn" style={{ background: 'transparent', color: '#ea580c', border: '1.5px solid rgba(234,88,12,0.3)' }}>
              Masuk Akun Petugas &rarr;
            </Link>
          </div>

          <div className="ps-pathway-card">
            <div>
              <div className="ps-pathway-icon" style={{ background: 'rgba(52, 199, 89, 0.12)', color: '#16a34a' }}>
                <i className="bx bx-book-content" />
              </div>
              <h3 className="ps-pathway-card__title">Katalog OPAC Terbuka</h3>
              <p className="ps-pathway-card__desc">
                Jelajahi seluruh koleksi buku, cek nomor rak fisik, serta baca ringkasan sinopsis tanpa harus login terlebih dahulu. Terbuka bagi seluruh civitas kampus.
              </p>
            </div>
            <Link href="/katalog" className="ps-pathway-btn" style={{ background: 'transparent', color: '#16a34a', border: '1.5px solid rgba(52,199,89,0.3)' }}>
              Buka Katalog OPAC &rarr;
            </Link>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* SECTION 7: HUBUNGI KAMI (#kontak)                                         */}
      {/* ========================================================================= */}
      <section id="kontak" className="ps-section">
        <div className="ps-contact-card">
          <div>
            <span className="ps-hero__tag" style={{ marginBottom: '0.625rem' }}>PUSAT BANTUAN &amp; LAYANAN</span>
            <h2 className="ps-section__title" style={{ textAlign: 'left' }}>Butuh Bantuan Sirkulasi?</h2>
            <p className="ps-hero__desc" style={{ marginBottom: '1.25rem' }}>
              Tim meja sirkulasi perpustakaan siap membantu Anda menyelesaikan masalah peminjaman, perpanjangan masa pinjam, atau pertanyaan kartu anggota.
            </p>

            <a
              href="https://wa.me/6281128285685"
              target="_blank"
              rel="noopener noreferrer"
              className="ps-contact__wa-btn"
            >
              <i className="bx bxl-whatsapp" style={{ fontSize: '1.5rem' }} />
              <div>
                <div style={{ lineHeight: 1.1 }}>Chat WhatsApp Petugas</div>
                <div style={{ fontSize: '0.6875rem', fontWeight: 400, opacity: 0.9 }}>Respon cepat jam kerja</div>
              </div>
            </a>
          </div>

          <div className="ps-contact__details">
            <div className="ps-contact__detail-item">
              <i className="bx bx-time" style={{ fontSize: '1.25rem', color: '#0071e3', marginTop: '2px' }} />
              <div>
                <div className="ps-contact__detail-label">Jam Layanan Sirkulasi:</div>
                <div className="ps-contact__detail-val">
                  {config.jamLayanan || 'Senin – Jumat (08.00 – 16.00 WIB)'}
                </div>
              </div>
            </div>

            <div className="ps-contact__detail-item">
              <i className="bx bx-map-pin" style={{ fontSize: '1.25rem', color: '#ea580c', marginTop: '2px' }} />
              <div>
                <div className="ps-contact__detail-label">Alamat Gedung Perpustakaan:</div>
                <div className="ps-contact__detail-val">
                  {config.alamatPerpustakaan || 'Gedung Perpustakaan Terpadu Politeknik Negeri Lampung, Jl. Soekarno-Hatta No. 10, Rajabasa, Bandar Lampung.'}
                </div>
              </div>
            </div>

            <div className="ps-contact__detail-item">
              <i className="bx bx-envelope" style={{ fontSize: '1.25rem', color: '#16a34a', marginTop: '2px' }} />
              <div>
                <div className="ps-contact__detail-label">Email Resmi Perpustakaan:</div>
                <div className="ps-contact__detail-val">
                  perpustakaan@polinela.ac.id
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
