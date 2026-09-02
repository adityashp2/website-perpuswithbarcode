<?php
require_once __DIR__ . '/koneksi.php';

$_SESSION = [];
unset($_SESSION['admin_id']);
unset($_SESSION['username']);
unset($_SESSION['type']);

if (ini_get("session.use_cookies")) {
    $params = session_get_cookie_params();
    setcookie(session_name(), '', time() - 42000,
        $params["path"], $params["domain"],
        $params["secure"], $params["httponly"]
    );
}
session_destroy();

if (session_status() === PHP_SESSION_NONE) {
    session_start();
}
set_flash('info', 'Anda telah berhasil keluar (logout) dari sistem.');
header("Location: index.php?pg=beranda");
exit();
