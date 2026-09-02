<?php
require_once __DIR__ . '/koneksi.php';

$user = get_current_user_data();
$admin_param = $user ? $user['admin_id'] : '';
$admin_query_str = $admin_param ? "&admin=" . urlencode($admin_param) : "";

// Fetch Quick Statistics
$q_total_buku = db_fetch_one(db_query("SELECT COUNT(*) as total, SUM(qty_stok) as total_stok FROM buku"));
$total_buku = $q_total_buku['total'] ?? 0;
$total_stok = $q_total_buku['total_stok'] ?? 0;

$q_total_pengarang = db_fetch_one(db_query("SELECT COUNT(*) as total FROM pengarang"));
$total_pengarang = $q_total_pengarang['total'] ?? 0;

$q_total_penerbit = db_fetch_one(db_query("SELECT COUNT(*) as total FROM penerbit"));
$total_penerbit = $q_total_penerbit['total'] ?? 0;

$q_active_loans = db_fetch_one(db_query("SELECT COUNT(*) as total FROM peminjaman WHERE id_pinjam NOT IN (SELECT id_pinjam FROM pengembalian)"));
$total_active_loans = $q_active_loans['total'] ?? 0;

$q_total_denda = db_fetch_one(db_query("SELECT SUM(denda) as total FROM pengembalian"));
$total_denda = $q_total_denda['total'] ?? 0;

// Fetch Recent Books
$q_buku_terbaru = db_query("SELECT b.isbn, b.judul, b.tahun, b.qty_stok, b.foto, pn.nama_penerbit, pg.nama_pengarang, kg.nama as nama_katalog 
    FROM buku b 
    LEFT JOIN penerbit pn ON pn.id_penerbit=b.id_penerbit 
    LEFT JOIN pengarang pg ON pg.id_pengarang=b.id_pengarang 
    LEFT JOIN katalog kg ON kg.id_katalog=b.id_katalog 
    ORDER BY b.tahun DESC LIMIT 6");
$buku_list = db_fetch_all($q_buku_terbaru);
?>

<?php if ($user && $user['type'] === 'ADM'): ?>
    <!-- ADMIN DASHBOARD -->
    <div class="page-header">
        <div class="page-header-info">
            <h1>Selamat Datang, <?= htmlspecialchars($user['nama']) ?>! 👋</h1>
            <p>Berikut adalah ringkasan data dan aktivitas sistem perpustakaan hari ini.</p>
        </div>
        <div class="page-actions">
            <a href="index.php?pg=formBuku<?= $admin_query_str ?>" class="btn btn-primary">
                <i class='bx bx-plus-circle'></i> Tambah Buku
            </a>
            <a href="index.php?pg=stokBuku<?= $admin_query_str ?>" class="btn btn-secondary">
                <i class='bx bx-layer'></i> Kelola Stok
            </a>
        </div>
    </div>

    <!-- Stats Grid -->
    <div class="stats-grid">
        <div class="stat-card stat-indigo">
            <div class="stat-data">
                <h3>Total Judul Buku</h3>
                <div class="number"><?= number_format($total_buku) ?></div>
            </div>
            <div class="stat-icon"><i class='bx bx-book'></i></div>
        </div>

        <div class="stat-card stat-emerald">
            <div class="stat-data">
                <h3>Total Stok Tersedia</h3>
                <div class="number"><?= number_format($total_stok) ?></div>
            </div>
            <div class="stat-icon"><i class='bx bx-check-shield'></i></div>
        </div>

        <div class="stat-card stat-sky">
            <div class="stat-data">
                <h3>Peminjaman Aktif</h3>
                <div class="number"><?= number_format($total_active_loans) ?></div>
            </div>
            <div class="stat-icon"><i class='bx bx-time-five'></i></div>
        </div>

        <div class="stat-card stat-amber">
            <div class="stat-data">
                <h3>Total Denda Masuk</h3>
                <div class="number" style="font-size: 20px;"><?= rupiah($total_denda) ?></div>
            </div>
            <div class="stat-icon"><i class='bx bx-coin-stack'></i></div>
        </div>
    </div>

<?php elseif ($user && $user['type'] === 'ANG'): ?>
    <!-- MEMBER DASHBOARD -->
    <div class="hero-banner">
        <div class="hero-title">Halo, <?= htmlspecialchars($user['nama']) ?>! 📚</div>
        <div class="hero-desc">
            Selamat datang di portal anggota Perpustakaan Politeknik Negeri Lampung (Polinela). Temukan buku perkuliahan, referensi ilmiah, jurnal, dan literatur favorit Anda dengan mudah.
        </div>
        <div style="display: flex; gap: 12px; flex-wrap: wrap;">
            <a href="index.php?pg=peminjaman<?= $admin_query_str ?>" class="btn btn-primary" style="background: #ffffff; color: var(--primary) !important;">
                <i class='bx bx-cart-add'></i> Buat Peminjaman Buku
            </a>
            <a href="index.php?pg=pengembalian<?= $admin_query_str ?>" class="btn btn-secondary" style="background: rgba(255,255,255,0.15); color: #fff !important; border-color: rgba(255,255,255,0.2);">
                <i class='bx bx-history'></i> Peminjaman Saya
            </a>
        </div>
    </div>

<?php else: ?>
    <!-- PUBLIC / GUEST HERO BANNER -->
    <div class="hero-banner">
        <div class="hero-title">Perpustakaan Digital Politeknik Negeri Lampung</div>
        <div class="hero-desc">
            Pusat sumber informasi, literasi sains, dan teknologi terapan Politeknik Negeri Lampung (Polinela). Akses koleksi buku akademik, karya ilmiah, dan literatur berkualitas kapan saja.
        </div>
        <div style="display: flex; gap: 12px; flex-wrap: wrap;">
            <a href="index.php?pg=viewbook" class="btn btn-primary" style="background: #ffffff; color: var(--primary) !important;">
                <i class='bx bx-library'></i> Jelajahi Koleksi Buku
            </a>
            <a href="index.php?pg=login" class="btn btn-secondary" style="background: rgba(255,255,255,0.15); color: #fff !important; border-color: rgba(255,255,255,0.2);">
                <i class='bx bx-log-in'></i> Masuk Anggota
            </a>
            <a href="index.php?pg=register" class="btn btn-secondary" style="background: rgba(255,255,255,0.15); color: #fff !important; border-color: rgba(255,255,255,0.2);">
                <i class='bx bx-user-plus'></i> Daftar Anggota Baru
            </a>
        </div>
    </div>

    <!-- Quick Stats -->
    <div class="stats-grid">
        <div class="stat-card stat-indigo">
            <div class="stat-data">
                <h3>Koleksi Buku</h3>
                <div class="number"><?= number_format($total_buku) ?></div>
            </div>
            <div class="stat-icon"><i class='bx bx-book-open'></i></div>
        </div>
        <div class="stat-card stat-emerald">
            <div class="stat-data">
                <h3>Penulis & Pengarang</h3>
                <div class="number"><?= number_format($total_pengarang) ?></div>
            </div>
            <div class="stat-icon"><i class='bx bx-user-voice'></i></div>
        </div>
        <div class="stat-card stat-sky">
            <div class="stat-data">
                <h3>Penerbit Terdaftar</h3>
                <div class="number"><?= number_format($total_penerbit) ?></div>
            </div>
            <div class="stat-icon"><i class='bx bx-buildings'></i></div>
        </div>
    </div>
<?php endif; ?>

<!-- Featured / Recent Books Section -->
<div class="card">
    <div class="card-header">
        <div class="card-title">
            <i class='bx bx-book-bookmark' style="color: var(--primary);"></i>
            <span>Koleksi Buku Terbaru</span>
        </div>
        <a href="index.php?pg=viewbook<?= $admin_query_str ?>" class="btn btn-secondary btn-sm">
            Lihat Semua Buku <i class='bx bx-chevron-right'></i>
        </a>
    </div>

    <div class="book-grid">
        <?php if (empty($buku_list)): ?>
            <div style="grid-column: 1 / -1; padding: 40px; text-align: center; color: var(--text-muted);">
                <i class='bx bx-book-x' style="font-size: 48px; margin-bottom: 12px; display: block; color: var(--text-light);"></i>
                <p>Belum ada data buku yang tersedia.</p>
            </div>
        <?php else: ?>
            <?php foreach ($buku_list as $buku): ?>
                <div class="book-card">
                    <div class="book-cover" style="position: relative; overflow: hidden;">
                        <?php if (!empty($buku['foto']) && file_exists(__DIR__ . '/' . $buku['foto'])): ?>
                           <img src="<?= htmlspecialchars($buku['foto']) ?>" alt="Cover buku <?= htmlspecialchars($buku['judul']) ?>" style="width: 100%; height: 100%; object-fit: cover; display: block;" onerror="this.onerror=null;this.src='images/default-book-cover.svg';">
                        <?php else: ?>
                           <img src="images/default-book-cover.svg" alt="Cover buku default" style="width: 100%; height: 100%; object-fit: cover; display: block;">
                        <?php endif; ?>
                        <span class="book-badge-stock badge <?= $buku['qty_stok'] > 0 ? 'badge-success' : 'badge-danger' ?>">
                            <?= $buku['qty_stok'] > 0 ? 'Stok: ' . $buku['qty_stok'] : 'Habis' ?>
                        </span>
                    </div>
                    <div class="book-body">
                        <div class="book-katalog-tag"><?= htmlspecialchars($buku['nama_katalog'] ?? 'Umum') ?></div>
                        <h4 class="book-title"><?= htmlspecialchars($buku['judul']) ?></h4>
                        <div class="book-meta">
                            <div><i class='bx bx-user'></i> <?= htmlspecialchars($buku['nama_pengarang'] ?? '-') ?></div>
                            <div><i class='bx bx-building'></i> <?= htmlspecialchars($buku['nama_penerbit'] ?? '-') ?> (<?= htmlspecialchars($buku['tahun'] ?? '-') ?>)</div>
                            <div class="book-isbn">ISBN: <?= htmlspecialchars($buku['isbn']) ?></div>
                        </div>
                        <?php if ($user && $user['type'] === 'ANG'): ?>
                            <a href="index.php?pg=peminjaman<?= $admin_query_str ?>" class="btn btn-primary btn-sm" style="width: 100%;">
                                <i class='bx bx-cart-add'></i> Pinjam Buku
                            </a>
                        <?php elseif ($user && $user['type'] === 'ADM'): ?>
                            <a href="index.php?pg=formBuku<?= $admin_query_str ?>&idBuku=<?= urlencode($buku['isbn']) ?>" class="btn btn-secondary btn-sm" style="width: 100%;">
                                <i class='bx bx-edit'></i> Edit Buku
                            </a>
                        <?php endif; ?>
                    </div>
                </div>
            <?php endforeach; ?>
        <?php endif; ?>
    </div>
</div>