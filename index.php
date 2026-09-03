<?php
define('APP_INIT', true);
require_once __DIR__ . '/koneksi.php';

$pg = $_GET['pg'] ?? 'beranda';

// Tangani logout sebelum rendering header / HTML agar tidak ada error headers already sent
if ($pg === 'logout') {
    require_once __DIR__ . '/logout.php';
    exit();
}

// Session is the single source of truth for auth state.
$user = get_current_user_data();

// Landing page handling:
// Tamu / pengunjung yang belum login akan langsung melihat Standalone Landing Page
if (!$user && in_array($pg, ['beranda', 'home', 'landing', ''])) {
    require __DIR__ . '/landing.php';
    exit();
}

// Jika pengguna sudah login dan mengakses landing, arahkan langsung ke dashboard internal
if ($user && $pg === 'landing') {
    header("Location: index.php?pg=beranda");
    exit();
}

$admin_id = $user ? $user['admin_id'] : '';
$admin_query_str = $admin_id ? "&admin=" . urlencode($admin_id) : "";

include __DIR__ . '/layout/header.php';
include __DIR__ . '/layout/sidebar.php';
?>

<main class="app-main">
    <!-- Topbar Navigation -->
    <header class="app-topbar">
        <div class="topbar-left">
            <button class="mobile-toggle-btn" id="mobileToggle" title="Buka Menu">
                <i class='bx bx-menu'></i>
            </button>
            <form action="index.php" method="GET" class="topbar-search">
                <input type="hidden" name="pg" value="cari">
                <?php if ($admin_id): ?>
                    <input type="hidden" name="admin" value="<?= htmlspecialchars($admin_id) ?>">
                <?php endif; ?>
                <i class='bx bx-search search-icon'></i>
                <input type="text" name="keyword" placeholder="Cari judul buku atau pengarang..." value="<?= htmlspecialchars($_GET['keyword'] ?? '') ?>">
            </form>
        </div>

        <div class="topbar-right">
            <!-- Live Real-Time Clock -->
            <div class="date-pill" id="liveClock" style="flex-direction:column; align-items:flex-end; gap:0; padding:6px 14px; line-height:1.3;">
                <div style="display:flex; align-items:center; gap:6px;">
                    <i class='bx bx-calendar-event' style="font-size:14px;"></i>
                    <span id="clockDate" style="font-size:12px; font-weight:600;"><?= tgl_indo(date('Y-m-d')) ?></span>
                </div>
                <div style="display:flex; align-items:center; gap:5px; margin-top:1px;">
                    <i class='bx bx-time' style="font-size:13px;"></i>
                    <span id="clockTime" style="font-family:monospace; font-size:13px; font-weight:800; color:var(--primary); letter-spacing:0.5px;"><?= date('H:i:s') ?> WIB</span>
                </div>
            </div>

            <?php if ($user): ?>
                <a href="index.php?pg=profile<?= $admin_query_str ?>" class="btn btn-secondary btn-sm" style="border-radius: var(--radius-full); gap: 6px;">
                    <i class='bx bx-user'></i>
                    <span><?= htmlspecialchars(explode(' ', $user['nama'])[0]) ?></span>
                </a>
                <a href="index.php?pg=logout" class="btn btn-danger btn-sm" title="Keluar" style="border-radius: var(--radius-full); padding: 6px 10px;" onclick="return confirm('Apakah Anda yakin ingin keluar (logout)?')">
                    <i class='bx bx-log-out'></i>
                </a>
            <?php else: ?>
                <a href="index.php?pg=login" class="btn btn-primary btn-sm">
                    <i class='bx bx-log-in'></i> Masuk
                </a>
                <a href="index.php?pg=register" class="btn btn-secondary btn-sm">
                    Daftar
                </a>
            <?php endif; ?>
        </div>
    </header>

    <!-- Page Content Container -->
    <div class="page-container">
        <?php if ($flash): ?>
            <div class="alert alert-<?= $flash['type'] === 'error' ? 'danger' : htmlspecialchars($flash['type']) ?>">
                <i class='bx <?= $flash['type'] === 'success' ? 'bx-check-circle' : ($flash['type'] === 'error' ? 'bx-error-circle' : 'bx-info-circle') ?>' style="font-size: 20px;"></i>
                <div><?= $flash['message'] ?></div>
            </div>
        <?php endif; ?>

        <?php
        switch ($pg) {
            case 'landing':
                include __DIR__ . '/landing.php';
                break;
            case 'home':
            case 'beranda':
                if (!$user) {
                    include __DIR__ . '/landing.php';
                } else {
                    include __DIR__ . '/beranda.php';
                }
                break;
            case 'register':
                include __DIR__ . '/register.php';
                break;
            case 'viewbook':
                include __DIR__ . '/viewbook.php';
                break;
            case 'login':
                include __DIR__ . '/login.php';
                break;
            case 'cari':
                include __DIR__ . '/searching.php';
                break;
            case 'logout':
                include __DIR__ . '/logout.php';
                break;
            case 'profile':
                include __DIR__ . '/profile.php';
                break;
            case 'sessionFailed':
                include __DIR__ . '/sessionFailed.php';
                break;
            case 'pengarang':
                include __DIR__ . '/listPengarang.php';
                break;
            case 'penerbit':
                include __DIR__ . '/listPenerbit.php';
                break;
            case 'katalog':
                include __DIR__ . '/listKatalog.php';
                break;
            case 'buku':
                include __DIR__ . '/listBuku.php';
                break;
            case 'notadmin':
                include __DIR__ . '/notadmin.php';
                break;
            case 'notmember':
                include __DIR__ . '/notmember.php';
                break;
            case 'formPenerbit':
                include __DIR__ . '/formPenerbit.php';
                break;
            case 'deletePenerbit':
                include __DIR__ . '/deletePenerbit.php';
                break;
            case 'formKatalog':
                include __DIR__ . '/formKatalog.php';
                break;
            case 'deleteKatalog':
                include __DIR__ . '/deleteKatalog.php';
                break;
            case 'formPengarang':
                include __DIR__ . '/formPengarang.php';
                break;
            case 'deletePengarang':
                include __DIR__ . '/deletePengarang.php';
                break;
            case 'formBuku':
                include __DIR__ . '/formBuku.php';
                break;
            case 'deleteBuku':
                include __DIR__ . '/deleteBuku.php';
                break;
            case 'acc':
                include __DIR__ . '/accSirkulasi.php';
                break;
            case 'user':
            case 'anggota':
            case 'verifikasi':
                include __DIR__ . '/listUser.php';
                break;
            case 'profil':
                include __DIR__ . '/profil.php';
                break;
            case 'config':
                include __DIR__ . '/config.php';
                break;
            case 'stokBuku':
                include __DIR__ . '/listStok.php';
                break;
            case 'formUpdateStok':
                include __DIR__ . '/formUpdateStok.php';
                break;
            case 'peminjaman':
                include __DIR__ . '/formPeminjaman.php';
                break;
            case 'pengembalian':
                include __DIR__ . '/listPeminjaman.php';
                break;
            case 'formPengembalian':
                include __DIR__ . '/formPengembalian.php';
                break;
            default:
                include __DIR__ . '/beranda.php';
                break;
        }
        ?>
    </div>

<?php
include __DIR__ . '/layout/footer.php';
?>
