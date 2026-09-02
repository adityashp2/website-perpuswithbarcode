<?php
// Handler: Anggota ajukan pengembalian buku
define('APP_INIT', true);
require_once __DIR__ . '/koneksi.php';

$user = get_current_user_data();
if (!$user || $user['type'] !== 'ANG') {
    header("Location: index.php?pg=notmember");
    exit();
}

$admin_param = $user['admin_id'];
$id_pinjam   = (int)($_GET['id'] ?? 0);
$id_anggota  = $user['id_anggota'];

if (!$id_pinjam) {
    set_flash('error', 'ID peminjaman tidak valid.');
    header("Location: index.php?pg=pengembalian&admin=" . urlencode($admin_param));
    exit();
}

// Verifikasi bahwa peminjaman ini milik anggota ini & statusnya DIPINJAM
$p = db_fetch_one(db_query("SELECT * FROM peminjaman WHERE id_pinjam = '$id_pinjam' AND id_anggota = '$id_anggota' AND status = 'DIPINJAM' LIMIT 1"));

if (!$p) {
    set_flash('error', 'Data peminjaman tidak ditemukan atau bukan milik Anda.');
    header("Location: index.php?pg=pengembalian&admin=" . urlencode($admin_param));
    exit();
}

// Update status jadi KEMBALI (menunggu ACC admin)
db_query("UPDATE peminjaman SET status = 'KEMBALI' WHERE id_pinjam = '$id_pinjam'");

set_flash('success', 'Permohonan pengembalian buku <strong>#' . $id_pinjam . '</strong> telah diajukan. Harap bawa buku fisik ke meja petugas untuk konfirmasi pengembalian.');
header("Location: index.php?pg=pengembalian&admin=" . urlencode($admin_param));
exit();
