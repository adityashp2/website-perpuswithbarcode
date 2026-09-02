<?php
$admin_query_str = $admin_param ? "&admin=" . urlencode($admin_param) : "";
?>
<div class="sidebar-overlay" id="sidebarOverlay"></div>
<aside class="app-sidebar" id="appSidebar">
    <div class="sidebar-brand">
        <div class="brand-wrapper">
            <div class="brand-icon">
                <i class='bx bxs-book-reader'></i>
            </div>
            <div class="brand-info">
                <h2>Pustaka Polinela</h2>
                <p>Politeknik Negeri Lampung</p>
            </div>
        </div>
        <button class="sidebar-close-btn" id="sidebarCloseBtn" title="Tutup Menu">
            <i class='bx bx-x'></i>
        </button>
    </div>

    <div class="sidebar-scroll">
        <?php if ($user && $user['type'] === 'ADM'): ?>
            <!-- Admin Navigation -->
            <div class="nav-section-title">Menu Utama</div>
            <ul class="nav-list">
                <li class="nav-item <?= in_array($current_page, ['beranda', 'home']) ? 'active' : '' ?>">
                    <a href="index.php?pg=beranda<?= $admin_query_str ?>">
                        <i class='bx bx-grid-alt'></i>
                        <span>Dashboard</span>
                    </a>
                </li>
                <li class="nav-item <?= $current_page === 'profile' ? 'active' : '' ?>">
                    <a href="index.php?pg=profile<?= $admin_query_str ?>">
                        <i class='bx bx-user-circle'></i>
                        <span>Profil Saya</span>
                    </a>
                </li>
            </ul>

            <div class="nav-section-title">Master Data Perpustakaan</div>
            <ul class="nav-list">
                <li class="nav-item <?= in_array($current_page, ['buku', 'formBuku']) ? 'active' : '' ?>">
                    <a href="index.php?pg=buku<?= $admin_query_str ?>">
                        <i class='bx bx-book-bookmark'></i>
                        <span>Data Buku</span>
                    </a>
                </li>
                <li class="nav-item <?= in_array($current_page, ['stokBuku', 'formUpdateStok']) ? 'active' : '' ?>">
                    <a href="index.php?pg=stokBuku<?= $admin_query_str ?>">
                        <i class='bx bx-layer'></i>
                        <span>Kelola Stok</span>
                    </a>
                </li>
                <li class="nav-item <?= in_array($current_page, ['katalog', 'formKatalog']) ? 'active' : '' ?>">
                    <a href="index.php?pg=katalog<?= $admin_query_str ?>">
                        <i class='bx bx-category'></i>
                        <span>Katalog Kategori</span>
                    </a>
                </li>
                <li class="nav-item <?= in_array($current_page, ['pengarang', 'formPengarang']) ? 'active' : '' ?>">
                    <a href="index.php?pg=pengarang<?= $admin_query_str ?>">
                        <i class='bx bx-pencil'></i>
                        <span>Pengarang</span>
                    </a>
                </li>
                <li class="nav-item <?= in_array($current_page, ['penerbit', 'formPenerbit']) ? 'active' : '' ?>">
                    <a href="index.php?pg=penerbit<?= $admin_query_str ?>">
                        <i class='bx bx-buildings'></i>
                        <span>Penerbit</span>
                    </a>
                </li>
            </ul>

            <div class="nav-section-title">Sirkulasi & ACC</div>
            <ul class="nav-list">
                <li class="nav-item <?= in_array($current_page, ['acc']) ? 'active' : '' ?>">
                    <a href="index.php?pg=acc<?= $admin_query_str ?>">
                        <i class='bx bx-check-shield'></i>
                        <span>Panel ACC Pinjam/Kembali
                            <?php
                            $cnt_pending = db_fetch_one(db_query("SELECT COUNT(*) as c FROM peminjaman WHERE status IN ('PENDING','KEMBALI')"));
                            $acc_count = (int)($cnt_pending['c'] ?? 0);
                            if ($acc_count > 0) echo '<span style="background:#ef4444;color:#fff;padding:1px 7px;border-radius:99px;font-size:10px;margin-left:4px;">'.$acc_count.'</span>';
                            ?>
                        </span>
                    </a>
                </li>
            </ul>

            <div class="nav-section-title">Pengaturan & Sesi</div>
            <ul class="nav-list">
                <li class="nav-item <?= $current_page === 'config' ? 'active' : '' ?>">
                    <a href="index.php?pg=config<?= $admin_query_str ?>">
                        <i class='bx bx-slider-alt'></i>
                        <span>Konfigurasi Denda</span>
                    </a>
                </li>
                <li class="nav-item">
                    <a href="index.php?pg=logout" style="color: #f87171;" onclick="return confirm('Apakah Anda yakin ingin keluar (logout)?')">
                        <i class='bx bx-log-out'></i>
                        <span>Keluar (Logout)</span>
                    </a>
                </li>
            </ul>

        <?php elseif ($user && $user['type'] === 'ANG'): ?>
            <!-- Member Navigation -->
            <div class="nav-section-title">Menu Anggota</div>
            <ul class="nav-list">
                <li class="nav-item <?= in_array($current_page, ['beranda', 'home']) ? 'active' : '' ?>">
                    <a href="index.php?pg=beranda<?= $admin_query_str ?>">
                        <i class='bx bx-grid-alt'></i>
                        <span>Beranda</span>
                    </a>
                </li>
                <li class="nav-item <?= $current_page === 'profile' ? 'active' : '' ?>">
                    <a href="index.php?pg=profile<?= $admin_query_str ?>">
                        <i class='bx bx-id-card'></i>
                        <span>Kartu Anggota</span>
                    </a>
                </li>
                <li class="nav-item <?= in_array($current_page, ['viewbook', 'cari']) ? 'active' : '' ?>">
                    <a href="index.php?pg=viewbook<?= $admin_query_str ?>">
                        <i class='bx bx-library'></i>
                        <span>Katalog Buku</span>
                    </a>
                </li>
            </ul>

            <div class="nav-section-title">Layanan Sirkulasi</div>
            <ul class="nav-list">
                <li class="nav-item <?= $current_page === 'peminjaman' ? 'active' : '' ?>">
                    <a href="index.php?pg=peminjaman<?= $admin_query_str ?>">
                        <i class='bx bx-cart-add'></i>
                        <span>Pinjam Buku Baru</span>
                    </a>
                </li>
                <li class="nav-item <?= in_array($current_page, ['pengembalian']) ? 'active' : '' ?>">
                    <a href="index.php?pg=pengembalian<?= $admin_query_str ?>">
                        <i class='bx bx-refresh'></i>
                        <span>Peminjaman Aktif & Kembali</span>
                    </a>
                </li>
            </ul>

            <div class="nav-section-title">Akun</div>
            <ul class="nav-list">
                <li class="nav-item">
                    <a href="index.php?pg=logout" style="color: #f87171;" onclick="return confirm('Apakah Anda yakin ingin keluar (logout)?')">
                        <i class='bx bx-log-out'></i>
                        <span>Keluar (Logout)</span>
                    </a>
                </li>
            </ul>

        <?php else: ?>
            <!-- Public / Guest Navigation -->
            <div class="nav-section-title">Eksplorasi</div>
            <ul class="nav-list">
                <li class="nav-item <?= in_array($current_page, ['beranda', 'home', '']) ? 'active' : '' ?>">
                    <a href="index.php?pg=beranda">
                        <i class='bx bx-home-alt'></i>
                        <span>Beranda Utama</span>
                    </a>
                </li>
                <li class="nav-item <?= $current_page === 'profil' ? 'active' : '' ?>">
                    <a href="index.php?pg=profil">
                        <i class='bx bx-info-circle'></i>
                        <span>Profil Perpustakaan</span>
                    </a>
                </li>
                <li class="nav-item <?= in_array($current_page, ['viewbook', 'cari']) ? 'active' : '' ?>">
                    <a href="index.php?pg=viewbook">
                        <i class='bx bx-book-open'></i>
                        <span>Koleksi Buku</span>
                    </a>
                </li>
            </ul>

            <div class="nav-section-title">Portal Akses</div>
            <ul class="nav-list">
                <li class="nav-item <?= $current_page === 'login' ? 'active' : '' ?>">
                    <a href="index.php?pg=login">
                        <i class='bx bx-log-in-circle'></i>
                        <span>Masuk (Login)</span>
                    </a>
                </li>
                <li class="nav-item <?= $current_page === 'register' ? 'active' : '' ?>">
                    <a href="index.php?pg=register">
                        <i class='bx bx-user-plus'></i>
                        <span>Daftar Anggota</span>
                    </a>
                </li>
            </ul>
        <?php endif; ?>
    </div>

    <!-- Sidebar User Footer -->
    <div class="sidebar-user">
        <?php
        $foto_path = (!empty($user['foto']) && file_exists(__DIR__ . '/../foto_profile/' . $user['foto'])) 
            ? 'foto_profile/' . htmlspecialchars($user['foto']) 
            : 'images/profile-default.svg';
        ?>
        <img src="<?= $foto_path ?>" alt="Avatar" class="user-avatar" onerror="this.src='images/profile-default.svg'; this.onerror=null;">
        <div class="user-meta">
            <div class="name"><?= htmlspecialchars($user['nama'] ?? 'Tamu / Pengunjung') ?></div>
            <?php if ($user): ?>
                <?php if ($user['type'] === 'ADM'): ?>
                    <span class="role-badge badge-adm">Administrator</span>
                <?php else: ?>
                    <span class="role-badge badge-ang">Anggota</span>
                <?php endif; ?>
            <?php else: ?>
                <span class="role-badge badge-guest">Tamu</span>
            <?php endif; ?>
        </div>
    </div>
</aside>
