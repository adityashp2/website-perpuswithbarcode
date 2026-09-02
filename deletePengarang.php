<?php
require_once __DIR__ . '/koneksi.php';

$user = get_current_user_data();
if (!$user || $user['type'] !== 'ADM') {
    set_flash('error', 'Akses ditolak.');
    header("Location: index.php?pg=notadmin");
    exit();
}

$admin = $user['admin_id'];
$kode = $_GET['idPengarang'] ?? '';

if (!empty($kode)) {
    $kode_esc = db_escape($kode);
    // Cek apakah pengarang sedang digunakan di data buku
    $cek = db_query("SELECT isbn FROM buku WHERE id_pengarang='$kode_esc' LIMIT 1");
    if (db_num_rows($cek) > 0) {
        set_flash('error', 'Pengarang ini tidak dapat dihapus karena masih tercatat memiliki buku di perpustakaan.');
    } else {
        $del = db_query("DELETE FROM pengarang WHERE id_pengarang='$kode_esc'");
        if ($del) {
            set_flash('success', 'Data pengarang berhasil dihapus.');
        } else {
            set_flash('error', 'Gagal menghapus pengarang.');
        }
    }
} else {
    set_flash('error', 'Kode pengarang tidak valid.');
}

header("Location: index.php?pg=pengarang&admin=" . urlencode($admin));
exit();
