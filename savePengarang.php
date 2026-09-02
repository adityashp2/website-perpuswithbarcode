<?php
require_once __DIR__ . '/koneksi.php';

$user = get_current_user_data();
if (!$user || $user['type'] !== 'ADM') {
    set_flash('error', 'Akses ditolak.');
    header("Location: index.php?pg=notadmin");
    exit();
}

$admin = $user['admin_id'];
$idPengarang = trim($_POST['id_pengarang'] ?? '');
$nama = trim($_POST['nama_pengarang'] ?? '');
$email = trim($_POST['email'] ?? '');
$telp = trim($_POST['telp'] ?? '');
$alamat = trim($_POST['alamat'] ?? '');

if (empty($idPengarang) || empty($nama)) {
    set_flash('error', 'Kode dan Nama Pengarang wajib diisi!');
    header("Location: index.php?pg=formPengarang&admin=" . urlencode($admin));
    exit();
}

$idPengarang_esc = db_escape($idPengarang);
$nama_esc = db_escape($nama);
$email_esc = db_escape($email);
$telp_esc = db_escape($telp);
$alamat_esc = db_escape($alamat);

$check = db_query("SELECT id_pengarang FROM pengarang WHERE id_pengarang='$idPengarang_esc' LIMIT 1");
if (db_num_rows($check) > 0) {
    $query = db_query("UPDATE pengarang SET nama_pengarang='$nama_esc', email='$email_esc', telp='$telp_esc', alamat='$alamat_esc' 
        WHERE id_pengarang='$idPengarang_esc'");
    if ($query) {
        set_flash('success', 'Data pengarang "<strong>' . htmlspecialchars($nama) . '</strong>" berhasil diperbarui.');
    } else {
        set_flash('error', 'Gagal memperbarui data pengarang.');
    }
} else {
    $query = db_query("INSERT INTO pengarang (id_pengarang, nama_pengarang, email, telp, alamat) 
        VALUES ('$idPengarang_esc', '$nama_esc', '$email_esc', '$telp_esc', '$alamat_esc')");
    if ($query) {
        set_flash('success', 'Pengarang baru "<strong>' . htmlspecialchars($nama) . '</strong>" berhasil ditambahkan!');
    } else {
        set_flash('error', 'Gagal menambahkan pengarang baru.');
    }
}

header("Location: index.php?pg=pengarang&admin=" . urlencode($admin));
exit();
