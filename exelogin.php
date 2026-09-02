<?php
require_once __DIR__ . '/koneksi.php';

$user = trim($_POST['user'] ?? '');
$pass = trim($_POST['pass'] ?? '');

if (empty($user) || empty($pass)) {
    set_flash('error', 'Silakan isi username dan password!');
    header("Location: index.php?pg=login");
    exit();
}

$user_esc = db_escape($user);
$sqlAdmin = db_query("SELECT * FROM admin WHERE username='$user_esc' LIMIT 1");

if (!$sqlAdmin || db_num_rows($sqlAdmin) === 0) {
    set_flash('error', 'Username atau password yang Anda masukkan salah.');
    header("Location: index.php?pg=login");
    exit();
}

$row = db_fetch_one($sqlAdmin);
if (!verify_password($pass, $row['password'] ?? '')) {
    set_flash('error', 'Username atau password yang Anda masukkan salah.');
    header("Location: index.php?pg=login");
    exit();
}

if (password_needs_rehash($row['password'] ?? '', PASSWORD_DEFAULT)) {
    $new_hash = hash_password($pass);
    db_query("UPDATE admin SET password = '" . db_escape($new_hash) . "' WHERE id = '" . db_escape($row['id']) . "' LIMIT 1");
}

session_regenerate_id(true);
$_SESSION['admin_id'] = $row['id'];
$_SESSION['username'] = $row['username'];
$_SESSION['type'] = $row['type'];

set_flash('success', 'Selamat datang kembali, <strong>' . htmlspecialchars($row['username']) . '</strong>!');
header("Location: index.php?pg=beranda");
exit();
