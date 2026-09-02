<?php
if (!defined('APP_INIT')) {
    define('APP_INIT', true);
}
require_once __DIR__ . '/../koneksi.php';

$user = get_current_user_data();
$current_page = $_GET['pg'] ?? 'beranda';
$admin_param = $user ? $user['admin_id'] : '';
$flash = get_flash();
?>
<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Pustaka Polinela | Perpustakaan Politeknik Negeri Lampung</title>
    <link rel="stylesheet" href="assets/css/style.css">
    <!-- Boxicons CDN for modern crisp icons -->
    <link href='https://unpkg.com/boxicons@2.1.4/css/boxicons.min.css' rel='stylesheet'>
</head>
<body>
<div class="app-layout">
