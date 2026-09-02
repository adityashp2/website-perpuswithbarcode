<?php
require_once __DIR__ . '/koneksi.php';

$user = get_current_user_data();
if (!$user || $user['type'] !== 'ADM') {
    set_flash('error', 'Akses ditolak.');
    header("Location: index.php?pg=notadmin");
    exit();
}

$admin = $user['admin_id'];
$idPenerbit = trim($_POST['id_penerbit'] ?? '');
$nama = trim($_POST['nama_penerbit'] ?? '');
$email = trim($_POST['email'] ?? '');
$telp = trim($_POST['telp'] ?? '');
$alamat = trim($_POST['alamat'] ?? '');

if (empty($idPenerbit) || empty($nama)) {
    set_flash('error', 'Kode dan Nama Penerbit wajib diisi!');
    header("Location: index.php?pg=formPenerbit&admin=" . urlencode($admin));
    exit();
}

$idPenerbit_esc = db_escape($idPenerbit);
$nama_esc = db_escape($nama);
$email_esc = db_escape($email);
$telp_esc = db_escape($telp);
$alamat_esc = db_escape($alamat);

$check = db_query("SELECT id_penerbit FROM penerbit WHERE id_penerbit='$idPenerbit_esc' LIMIT 1");
if (db_num_rows($check) > 0) {
    $query = db_query("UPDATE penerbit SET nama_penerbit='$nama_esc', email='$email_esc', telp='$telp_esc', alamat='$alamat_esc' 
        WHERE id_penerbit='$idPenerbit_esc'");
    if ($query) {
        set_flash('success', 'Data penerbit "<strong>' . htmlspecialchars($nama) . '</strong>" berhasil diperbarui.');
    } else {
        set_flash('error', 'Gagal memperbarui data penerbit.');
    }
} else {
    $query = db_query("INSERT INTO penerbit (id_penerbit, nama_penerbit, email, telp, alamat) 
        VALUES ('$idPenerbit_esc', '$nama_esc', '$email_esc', '$telp_esc', '$alamat_esc')");
    if ($query) {
        set_flash('success', 'Penerbit baru "<strong>' . htmlspecialchars($nama) . '</strong>" berhasil ditambahkan!');
    } else {
        set_flash('error', 'Gagal menambahkan penerbit baru.');
    }
}

header("Location: index.php?pg=penerbit&admin=" . urlencode($admin));
exit();
