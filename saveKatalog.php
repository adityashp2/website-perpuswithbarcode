<?php
require_once __DIR__ . '/koneksi.php';

$user = get_current_user_data();
if (!$user || $user['type'] !== 'ADM') {
    set_flash('error', 'Akses ditolak.');
    header("Location: index.php?pg=notadmin");
    exit();
}

$admin = $user['admin_id'];
$idKatalog = trim($_POST['id_katalog'] ?? '');
$nama = trim($_POST['nama'] ?? '');

if (empty($idKatalog) || empty($nama)) {
    set_flash('error', 'Semua field wajib diisi!');
    header("Location: index.php?pg=formKatalog&admin=" . urlencode($admin));
    exit();
}

$idKatalog_esc = db_escape($idKatalog);
$nama_esc = db_escape($nama);

$check = db_query("SELECT id_katalog FROM katalog WHERE id_katalog='$idKatalog_esc' LIMIT 1");
if (db_num_rows($check) > 0) {
    $query = db_query("UPDATE katalog SET nama='$nama_esc' WHERE id_katalog='$idKatalog_esc'");
    if ($query) {
        set_flash('success', 'Kategori "<strong>' . htmlspecialchars($nama) . '</strong>" berhasil diperbarui.');
    } else {
        set_flash('error', 'Gagal memperbarui kategori.');
    }
} else {
    $query = db_query("INSERT INTO katalog (id_katalog, nama) VALUES ('$idKatalog_esc', '$nama_esc')");
    if ($query) {
        set_flash('success', 'Kategori baru "<strong>' . htmlspecialchars($nama) . '</strong>" berhasil ditambahkan!');
    } else {
        set_flash('error', 'Gagal menambahkan kategori.');
    }
}

header("Location: index.php?pg=katalog&admin=" . urlencode($admin));
exit();
