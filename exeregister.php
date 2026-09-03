<?php
require_once __DIR__ . '/koneksi.php';

$user = trim($_POST['username'] ?? '');
$pass = trim($_POST['password'] ?? '');
$name = trim($_POST['name'] ?? '');
$sex = $_POST['sex'] ?? 'L';
$telp = trim($_POST['telp'] ?? '');
$alamat = trim($_POST['alamat'] ?? '');
$mail = trim($_POST['mail'] ?? '');
$desc = trim($_POST['description'] ?? '');
$tgl = $_POST['tglentry'] ?? date('Y-m-d');

if (empty($user) || empty($pass) || empty($name)) {
    set_flash('error', 'Semua field bertanda bintang wajib diisi!');
    header("Location: index.php?pg=register");
    exit();
}

if (strlen($pass) < 6 || strlen($pass) > 72) {
    set_flash('error', 'Password minimal 6 karakter dan maksimal 72 karakter.');
    header("Location: index.php?pg=register");
    exit();
}

$user_esc = db_escape($user);
$md_username = md5($user);
$password_hash = hash_password($pass);

$check_user = db_query("SELECT id FROM admin WHERE username='$user_esc' LIMIT 1");
if (db_num_rows($check_user) > 0) {
    set_flash('error', 'Username "<strong>' . htmlspecialchars($user) . '</strong>" sudah digunakan! Silakan gunakan username lain.');
    header("Location: index.php?pg=register");
    exit();
}

$filename = '';

if (isset($_FILES["file"]) && !empty($_FILES["file"]["name"])) {
    $file_tmp = $_FILES["file"]["tmp_name"] ?? '';
    $file_size = (int)($_FILES["file"]["size"] ?? 0);
    $file_name_orig = $_FILES["file"]["name"] ?? '';
    $file_ext = strtolower(pathinfo($file_name_orig, PATHINFO_EXTENSION));

    $allowed_exts = ['jpg', 'jpeg', 'png', 'gif', 'webp'];

    if (!is_uploaded_file($file_tmp) || !in_array($file_ext, $allowed_exts, true) || $file_size > 2097152) {
        set_flash('error', 'File foto profil tidak valid. Gunakan JPG, PNG, GIF, atau WEBP dengan ukuran maksimal 2 MB.');
        header("Location: index.php?pg=register");
        exit();
    }

    $target_dir = __DIR__ . "/foto_profile/";
    if (!is_dir($target_dir)) {
        mkdir($target_dir, 0755, true);
    }

    $filename = time() . "_" . preg_replace('/[^a-zA-Z0-9._-]/', '', $file_name_orig);
    if (!move_uploaded_file($file_tmp, $target_dir . $filename)) {
        set_flash('error', 'Gagal menyimpan foto profil. Silakan coba lagi.');
        header("Location: index.php?pg=register");
        exit();
    }
}

// Foto KTM (wajib) untuk proses verifikasi keanggotaan
$ktm_filename = '';
$ktm_allowed_exts = ['jpg', 'jpeg', 'png', 'webp'];

if (empty($_FILES["ktm_file"]["name"] ?? '')) {
    set_flash('error', 'Foto Kartu Tanda Mahasiswa (KTM) wajib diunggah untuk proses verifikasi.');
    header("Location: index.php?pg=register");
    exit();
}

$ktm_tmp = $_FILES["ktm_file"]["tmp_name"] ?? '';
$ktm_size = (int)($_FILES["ktm_file"]["size"] ?? 0);
$ktm_name_orig = $_FILES["ktm_file"]["name"] ?? '';
$ktm_ext = strtolower(pathinfo($ktm_name_orig, PATHINFO_EXTENSION));

if (!is_uploaded_file($ktm_tmp) || !in_array($ktm_ext, $ktm_allowed_exts, true) || $ktm_size > 2097152) {
    set_flash('error', 'File foto KTM tidak valid. Gunakan JPG, PNG, atau WEBP dengan ukuran maksimal 2 MB.');
    header("Location: index.php?pg=register");
    exit();
}

$ktm_target_dir = __DIR__ . "/ktm_uploads/";
if (!is_dir($ktm_target_dir)) {
    mkdir($ktm_target_dir, 0755, true);
}

$ktm_filename = "ktm_" . time() . "_" . preg_replace('/[^a-zA-Z0-9._-]/', '', $ktm_name_orig);
if (!move_uploaded_file($ktm_tmp, $ktm_target_dir . $ktm_filename)) {
    set_flash('error', 'Gagal menyimpan foto KTM. Silakan coba lagi.');
    header("Location: index.php?pg=register");
    exit();
}

$ins_admin = db_query("INSERT INTO admin (id, username, password, type) VALUES ('$md_username', '$user_esc', '" . db_escape($password_hash) . "', 'ANG')");

if ($ins_admin) {
    $name_esc = db_escape($name);
    $sex_esc = db_escape($sex);
    $telp_esc = db_escape($telp);
    $alamat_esc = db_escape($alamat);
    $mail_esc = db_escape($mail);
    $desc_esc = db_escape($desc);
    $filename_esc = db_escape($filename);
    $ktm_filename_esc = db_escape($ktm_filename);

    $ins_anggota = db_query("INSERT INTO anggota (id_admin, nama, sex, telp, alamat, email, tgl_entry, descripsi, foto, ktm_foto, status_verifikasi) 
        VALUES ('$md_username', '$name_esc', '$sex_esc', '$telp_esc', '$alamat_esc', '$mail_esc', '$tgl', '$desc_esc', '$filename_esc', '$ktm_filename_esc', 'PENDING')");

    if ($ins_anggota) {
        set_flash('success', 'Pendaftaran berhasil! Akun Anda sudah bisa digunakan untuk masuk, namun peminjaman buku baru dapat dilakukan setelah KTM Anda diverifikasi oleh petugas perpustakaan.');
        header("Location: index.php?pg=login");
        exit();
    }
}

set_flash('error', 'Terjadi kendala saat menyimpan pendaftaran. Silakan coba kembali.');
header("Location: index.php?pg=register");
exit();
