<?php
require_once __DIR__ . '/koneksi.php';

$user = get_current_user_data();
if (!$user || $user['type'] !== 'ADM') {
    set_flash('error', 'Akses ditolak.');
    header("Location: index.php?pg=notadmin");
    exit();
}

$admin = $user['admin_id'];
$kode = $_GET['idPenerbit'] ?? '';

if (!empty($kode)) {
    $kode_esc = db_escape($kode);
    // Cek apakah penerbit masih digunakan di data buku
    $cek = db_query("SELECT isbn FROM buku WHERE id_penerbit='$kode_esc' LIMIT 1");
    if (db_num_rows($cek) > 0) {
        set_flash('error', 'Penerbit ini tidak dapat dihapus karena masih tercatat memiliki buku di perpustakaan.');
    } else {
        $del = db_query("DELETE FROM penerbit WHERE id_penerbit='$kode_esc'");
        if ($del) {
            set_flash('success', 'Data penerbit berhasil dihapus.');
        } else {
            set_flash('error', 'Gagal menghapus penerbit.');
        }
    }
} else {
    set_flash('error', 'Kode penerbit tidak valid.');
}

header("Location: index.php?pg=penerbit&admin=" . urlencode($admin));
exit();
