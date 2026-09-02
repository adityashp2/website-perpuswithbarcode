<?php
require_once __DIR__ . '/koneksi.php';

$user = get_current_user_data();
if (!$user || $user['type'] !== 'ADM') {
    set_flash('error', 'Akses ditolak.');
    header("Location: index.php?pg=notadmin");
    exit();
}

$admin = $user['admin_id'];
$kode = $_GET['idBuku'] ?? '';

if (!empty($kode)) {
    $kode_esc = db_escape($kode);
    // Cek apakah buku sedang dipinjam
    $cek_pinjam = db_query("SELECT id_pinjam FROM detail_peminjaman WHERE isbn='$kode_esc' LIMIT 1");
    if (db_num_rows($cek_pinjam) > 0) {
        set_flash('error', 'Buku tidak dapat dihapus karena masih memiliki riwayat transaksi peminjaman.');
    } else {
        $del = db_query("DELETE FROM buku WHERE isbn='$kode_esc'");
        if ($del) {
            set_flash('success', 'Buku berhasil dihapus dari perpustakaan.');
        } else {
            set_flash('error', 'Gagal menghapus buku.');
        }
    }
} else {
    set_flash('error', 'Kode ISBN buku tidak valid.');
}

header("Location: index.php?pg=buku&admin=" . urlencode($admin));
exit();
