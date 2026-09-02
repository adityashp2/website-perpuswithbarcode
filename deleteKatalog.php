<?php
require_once __DIR__ . '/koneksi.php';

$user = get_current_user_data();
if (!$user || $user['type'] !== 'ADM') {
    set_flash('error', 'Akses ditolak.');
    header("Location: index.php?pg=notadmin");
    exit();
}

$admin = $user['admin_id'];
$kode = $_GET['idKatalog'] ?? '';

if (!empty($kode)) {
    $kode_esc = db_escape($kode);
    // Cek apakah kategori sedang digunakan oleh data buku
    $cek = db_query("SELECT isbn FROM buku WHERE id_katalog='$kode_esc' LIMIT 1");
    if (db_num_rows($cek) > 0) {
        set_flash('error', 'Kategori ini tidak dapat dihapus karena masih digunakan oleh beberapa buku.');
    } else {
        $del = db_query("DELETE FROM katalog WHERE id_katalog='$kode_esc'");
        if ($del) {
            set_flash('success', 'Kategori berhasil dihapus.');
        } else {
            set_flash('error', 'Gagal menghapus kategori.');
        }
    }
} else {
    set_flash('error', 'Kode kategori tidak valid.');
}

header("Location: index.php?pg=katalog&admin=" . urlencode($admin));
exit();
