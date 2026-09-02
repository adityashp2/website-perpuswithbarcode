<?php
// Handler: Admin ACC/Tolak Permohonan Pinjam
define('APP_INIT', true);
require_once __DIR__ . '/koneksi.php';

$user = get_current_user_data();
if (!$user || $user['type'] !== 'ADM') {
    header("Location: index.php?pg=notadmin");
    exit();
}

$admin_param = $user['admin_id'];
$aksi        = $_GET['aksi'] ?? '';
$id_pinjam   = (int)($_GET['id'] ?? 0);
$scan_isbn   = trim($_GET['scan_isbn'] ?? '');

if (!$id_pinjam) {
    set_flash('error', 'ID peminjaman tidak valid.');
    header("Location: index.php?pg=acc&admin=" . urlencode($admin_param));
    exit();
}

if ($scan_isbn === '') {
    set_flash('error', 'Harap scan barcode buku terlebih dahulu sebelum ACC peminjaman.');
    header("Location: index.php?pg=acc&admin=" . urlencode($admin_param));
    exit();
}

// Ambil data peminjaman beserta detail buku
$p = db_fetch_one(db_query("SELECT * FROM peminjaman WHERE id_pinjam = '$id_pinjam' AND status = 'PENDING' LIMIT 1"));

if (!$p) {
    set_flash('error', 'Permohonan tidak ditemukan atau sudah diproses.');
    header("Location: index.php?pg=acc&admin=" . urlencode($admin_param));
    exit();
}

$detail = db_fetch_all(db_query("SELECT isbn, qty FROM detail_peminjaman WHERE id_pinjam = '$id_pinjam'"));
$allowed_isbns = [];
foreach ($detail as $row) {
    $allowed_isbns[] = trim((string)($row['isbn'] ?? ''));
}

if (!in_array($scan_isbn, $allowed_isbns, true)) {
    set_flash('error', 'Barcode yang discan tidak cocok dengan buku pada peminjaman ini. Scan barcode buku yang benar terlebih dahulu.');
    header("Location: index.php?pg=acc&tab=pending&admin=" . urlencode($admin_param));
    exit();
}

if ($aksi === 'acc') {
    // ACC: Ubah status jadi DIPINJAM dan kurangi stok buku

    db_query("UPDATE peminjaman SET status = 'DIPINJAM' WHERE id_pinjam = '$id_pinjam'");

    foreach ($detail as $d) {
        $isbn_esc = db_escape($d['isbn']);
        $qty      = (int)$d['qty'];
        db_query("UPDATE buku SET qty_stok = GREATEST(qty_stok - $qty, 0) WHERE isbn = '$isbn_esc'");
    }

    set_flash('success', 'Permohonan peminjaman <strong>#' . $id_pinjam . '</strong> telah <strong>disetujui (ACC)</strong>. Stok buku telah disesuaikan.');

} elseif ($aksi === 'tolak') {
    // TOLAK: Ubah status jadi DITOLAK (stok tidak berubah karena belum dikurangi)
    db_query("UPDATE peminjaman SET status = 'DITOLAK' WHERE id_pinjam = '$id_pinjam'");
    set_flash('info', 'Permohonan peminjaman <strong>#' . $id_pinjam . '</strong> telah <strong>ditolak</strong>.');

} else {
    set_flash('error', 'Aksi tidak dikenali.');
}

header("Location: index.php?pg=acc&tab=pending&admin=" . urlencode($admin_param));
exit();
