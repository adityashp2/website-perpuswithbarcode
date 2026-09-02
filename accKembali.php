<?php
// Handler: Admin ACC Pengembalian Buku
define('APP_INIT', true);
require_once __DIR__ . '/koneksi.php';

$user = get_current_user_data();
if (!$user || $user['type'] !== 'ADM') {
    header("Location: index.php?pg=notadmin");
    exit();
}

$admin_param = $user['admin_id'];
$id_pinjam   = (int)($_GET['id'] ?? 0);
$scan_isbn   = trim($_GET['scan_isbn'] ?? '');
$denda       = (float)($_GET['denda'] ?? 0);
$tgl_kembali_aktual = date('Y-m-d');

if (!$id_pinjam) {
    set_flash('error', 'ID peminjaman tidak valid.');
    header("Location: index.php?pg=acc&tab=kembali&admin=" . urlencode($admin_param));
    exit();
}

if ($scan_isbn === '') {
    set_flash('error', 'Harap scan barcode buku terlebih dahulu sebelum ACC pengembalian.');
    header("Location: index.php?pg=acc&tab=kembali&admin=" . urlencode($admin_param));
    exit();
}

// Pastikan statusnya KEMBALI
$p = db_fetch_one(db_query("SELECT * FROM peminjaman WHERE id_pinjam = '$id_pinjam' AND status = 'KEMBALI' LIMIT 1"));

if (!$p) {
    set_flash('error', 'Data pengembalian tidak ditemukan atau sudah diproses.');
    header("Location: index.php?pg=acc&tab=kembali&admin=" . urlencode($admin_param));
    exit();
}

$detail = db_fetch_all(db_query("SELECT isbn, qty FROM detail_peminjaman WHERE id_pinjam = '$id_pinjam'"));
$allowed_isbns = [];
foreach ($detail as $row) {
    $allowed_isbns[] = trim((string)($row['isbn'] ?? ''));
}

if (!in_array($scan_isbn, $allowed_isbns, true)) {
    set_flash('error', 'Barcode yang discan tidak cocok dengan buku pada pengembalian ini. Scan barcode buku yang benar terlebih dahulu.');
    header("Location: index.php?pg=acc&tab=kembali&admin=" . urlencode($admin_param));
    exit();
}

// Hitung ulang denda berdasarkan tanggal hari ini (akurat)
$q_config      = db_fetch_one(db_query("SELECT dendaPerHari FROM config LIMIT 1"));
$denda_per_hari = (float)($q_config['dendaPerHari'] ?? 500);

$batas = strtotime($p['tgl_kembali']);
$today = strtotime($tgl_kembali_aktual);
$late_days = $today > $batas ? (int)round(($today - $batas) / 86400) : 0;
$denda_final = $late_days * $denda_per_hari;

// Catat pengembalian
$ins = db_query("INSERT INTO pengembalian (id_pinjam, tgl_kembali, denda) VALUES ('$id_pinjam', '$tgl_kembali_aktual', '$denda_final')");

if ($ins) {
    // Update status peminjaman jadi SELESAI
    db_query("UPDATE peminjaman SET status = 'SELESAI' WHERE id_pinjam = '$id_pinjam'");

    // Kembalikan stok buku
    $detail = db_fetch_all(db_query("SELECT isbn, qty FROM detail_peminjaman WHERE id_pinjam = '$id_pinjam'"));
    foreach ($detail as $d) {
        $isbn_esc = db_escape($d['isbn']);
        $qty      = (int)$d['qty'];
        db_query("UPDATE buku SET qty_stok = qty_stok + $qty WHERE isbn = '$isbn_esc'");
    }

    $pesan = 'Pengembalian buku <strong>#' . $id_pinjam . '</strong> telah dikonfirmasi (ACC). Stok buku telah dikembalikan ke rak.';
    if ($denda_final > 0) {
        $pesan .= ' <strong>Denda: ' . rupiah($denda_final) . ' (' . $late_days . ' hari terlambat)</strong>.';
    } else {
        $pesan .= ' Buku dikembalikan tepat waktu — tidak ada denda.';
    }
    set_flash('success', $pesan);
} else {
    set_flash('error', 'Gagal memproses konfirmasi pengembalian.');
}

header("Location: index.php?pg=acc&tab=kembali&admin=" . urlencode($admin_param));
exit();
