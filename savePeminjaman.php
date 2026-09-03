<?php
require_once __DIR__ . '/koneksi.php';

$user = get_current_user_data();
if (!$user || $user['type'] !== 'ANG') {
    set_flash('error', 'Hanya anggota yang dapat meminjam buku.');
    header("Location: index.php?pg=notmember");
    exit();
}

if (($user['status_verifikasi'] ?? '') !== 'TERVERIFIKASI') {
    set_flash('error', 'KTM Anda belum diverifikasi oleh petugas perpustakaan. Peminjaman buku belum dapat dilakukan sampai verifikasi selesai.');
    header("Location: index.php?pg=peminjaman&admin=" . urlencode($user['admin_id']));
    exit();
}

$admin = $user['admin_id'];
$idAnggota = (int)($_POST['id_anggota'] ?? $user['id_anggota']);
$tglPinjam = $_POST['tglPinjam'] ?? date('Y-m-d');
$tglKembali = $_POST['tglKembali'] ?? date('Y-m-d', strtotime('+3 days'));

// Ambil list ISBN dan Quantity buku yang dipilih
$items = [];
if (isset($_POST['isbn']) && is_array($_POST['isbn'])) {
    foreach ($_POST['isbn'] as $idx => $isbn_val) {
        $isbn_clean = trim($isbn_val);
        if (!empty($isbn_clean)) {
            $qty_clean = isset($_POST['qty'][$idx]) ? max(1, (int)$_POST['qty'][$idx]) : 1;
            $items[$isbn_clean] = ($items[$isbn_clean] ?? 0) + $qty_clean;
        }
    }
}

$items = array_map(function ($qty) { return ['qty' => $qty]; }, $items);
$items = array_values(array_map(function ($isbn, $data) { return ['isbn' => $isbn, 'qty' => $data['qty']]; }, array_keys($items), $items));

if (empty($items)) {
    set_flash('error', 'Harap pilih minimal 1 judul buku yang akan dipinjam!');
    header("Location: index.php?pg=peminjaman&admin=" . urlencode($admin));
    exit();
}

foreach ($items as $item) {
    $isbn_esc = db_escape($item['isbn']);
    $book = db_fetch_one(db_query("SELECT qty_stok, maks_pinjam_per_anggota FROM buku WHERE isbn = '$isbn_esc' LIMIT 1"));
    if (!$book) {
        set_flash('error', 'Buku yang dipilih tidak ditemukan atau sudah tidak tersedia.');
        header("Location: index.php?pg=peminjaman&admin=" . urlencode($admin));
        exit();
    }

    $requested_qty = (int)$item['qty'];
    $available_stock = (int)($book['qty_stok'] ?? 0);
    $limit_per_akun = max(1, (int)($book['maks_pinjam_per_anggota'] ?? 1));

    $current_active = db_fetch_one(db_query("SELECT COALESCE(SUM(dp.qty), 0) AS total FROM detail_peminjaman dp JOIN peminjaman p ON p.id_pinjam = dp.id_pinjam WHERE p.id_anggota = '$idAnggota' AND p.status IN ('PENDING', 'DIPINJAM') AND dp.isbn = '$isbn_esc'"));
    $current_total = (int)($current_active['total'] ?? 0);

    if ($requested_qty > $available_stock) {
        set_flash('error', 'Jumlah buku "' . htmlspecialchars($item['isbn']) . '" melebihi stok yang tersedia.');
        header("Location: index.php?pg=peminjaman&admin=" . urlencode($admin));
        exit();
    }

    if ($current_total + $requested_qty > $limit_per_akun) {
        set_flash('error', 'Anda sudah mencapai batas pinjam maksimal untuk buku ini. Maksimal per akun: ' . $limit_per_akun . ' eksemplar.');
        header("Location: index.php?pg=peminjaman&admin=" . urlencode($admin));
        exit();
    }
}

// Simpan Header Peminjaman dengan status PENDING (menunggu ACC admin)
$insHeader = db_query("INSERT INTO peminjaman (id_anggota, tgl_pinjam, tgl_kembali, status) 
    VALUES ('$idAnggota', '$tglPinjam', '$tglKembali', 'PENDING')");

if ($insHeader) {
    $id_pinjam = db_insert_id();

    foreach ($items as $item) {
        $isbn_esc = db_escape($item['isbn']);
        $qty_val  = (int)$item['qty'];
        // Simpan detail (stok BELUM dikurangi - akan dikurangi saat admin ACC)
        db_query("INSERT INTO detail_peminjaman (id_pinjam, isbn, qty) VALUES ('$id_pinjam', '$isbn_esc', '$qty_val')");
    }

    set_flash('success', 'Permohonan peminjaman <strong>#' . $id_pinjam . '</strong> berhasil diajukan! Harap tunggu konfirmasi (ACC) dari petugas perpustakaan.');
    header("Location: index.php?pg=pengembalian&admin=" . urlencode($admin));
    exit();
} else {
    set_flash('error', 'Gagal memproses permohonan peminjaman buku.');
    header("Location: index.php?pg=peminjaman&admin=" . urlencode($admin));
    exit();
}
