<?php
require_once __DIR__ . '/koneksi.php';
$pg = $_GET['pg'] ?? 'beranda';
$admin = $_SESSION['admin_id'] ?? '';
$url = "index.php?pg=" . urlencode($pg) . ($admin ? "&admin=" . urlencode($admin) : "");
header("Location: $url");
exit();
