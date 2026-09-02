<?php
require_once __DIR__ . '/koneksi.php';

$user = get_current_user_data();
if (!$user || $user['type'] !== 'ANG') {
    set_flash('error', 'Akses ditolak.');
    header("Location: index.php?pg=notmember");
    exit();
}

$admin = $user['admin_id'];
$idPinjam = (int)($_POST['idPinjam'] ?? 0);
$tglKembali = $_POST['tglKembali'] ?? date('Y-m-d');
$denda = (float)($_POST['denda'] ?? 0);

if (!$idPinjam) {
    set_flash('error', 'Data pengembalian tidak valid.');
    header("Location: index.php?pg=pengembalian&admin=" . urlencode($admin));
    exit();
}

// Cek apakah sudah pernah dikembalikan sebelumnya
$cek = db_query("SELECT id_kembali FROM pengembalian WHERE id_pinjam='$idPinjam' LIMIT 1");
if (db_num_rows($cek) > 0) {
    set_flash('warning', 'Transaksi peminjaman ini sudah pernah diselesaikan sebelumnya.');
    header("Location: index.php?pg=pengembalian&admin=" . urlencode($admin));
    exit();
}

// Simpan data pengembalian
$query = db_query("INSERT INTO pengembalian (id_pinjam, tgl_kembali, denda) VALUES ('$idPinjam', '$tglKembali', '$denda')");

if ($query) {
    // Kembalikan stok buku yang dipinjam (+1 stok untuk tiap detail peminjaman)
    $detail_buku = db_fetch_all(db_query("SELECT isbn, qty FROM detail_peminjaman WHERE id_pinjam='$idPinjam'"));
    foreach ($detail_buku as $dt) {
        $isbn_esc = db_escape($dt['isbn']);
        $qty_val = (int)$dt['qty'];
        db_query("UPDATE buku SET qty_stok = qty_stok + $qty_val WHERE isbn='$isbn_esc'");
    }

    $pesan = 'Pengembalian buku untuk transaksi <strong>#' . $idPinjam . '</strong> berhasil dicatat.';
    if ($denda > 0) {
        $pesan .= ' Denda keterlambatan sebesar <strong>' . rupiah($denda) . '</strong> telah ditagihkan.';
    } else {
        $pesan .= ' Buku dikembalikan tepat waktu tanpa denda.';
    }

    set_flash('success', $pesan);
} else {
    set_flash('error', 'Gagal memproses pengembalian buku.');
}

header("Location: index.php?pg=pengembalian&admin=" . urlencode($admin));
exit();
