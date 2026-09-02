<?php
require_once __DIR__ . '/koneksi.php';

$user = get_current_user_data();
if (!$user || $user['type'] !== 'ANG') {
    echo "<script>window.location.href='index.php?pg=notmember';</script>";
    exit();
}

$admin_param = $user['admin_id'];
$admin_query_str = "&admin=" . urlencode($admin_param);

$idPinjam = (int)($_GET['idPinjam'] ?? 0);
$tglKembaliSeharusnya = $_GET['tglKembali'] ?? '';

if (!$idPinjam) {
    set_flash('error', 'ID Transaksi peminjaman tidak valid.');
    header("Location: index.php?pg=pengembalian$admin_query_str");
    exit();
}

// Ambil data peminjaman
$q_pinjam = db_query("SELECT p.*, a.nama as nama_anggota,
    GROUP_CONCAT(CONCAT(b.judul, ' <small style=\"color:var(--primary);font-weight:700;\">(&times;', dp.qty, ' eks)</small>') SEPARATOR '<br>&bull; ') as daftar_buku
    FROM peminjaman p 
    INNER JOIN anggota a ON a.id_anggota = p.id_anggota 
    LEFT JOIN detail_peminjaman dp ON dp.id_pinjam = p.id_pinjam 
    LEFT JOIN buku b ON b.isbn = dp.isbn 
    WHERE p.id_pinjam = '$idPinjam' 
    GROUP BY p.id_pinjam LIMIT 1");

$dtPinjam = db_fetch_one($q_pinjam);

if (!$dtPinjam) {
    set_flash('error', 'Data peminjaman tidak ditemukan.');
    header("Location: index.php?pg=pengembalian$admin_query_str");
    exit();
}

// Hitung Denda
$selectConfig = db_fetch_one(db_query("SELECT dendaPerHari FROM config LIMIT 1"));
$dendaPerHari = $selectConfig['dendaPerHari'] ?? 500;

$tglKembaliSebenarnya = date("Y-m-d");
$timeSebenarnya = strtotime($tglKembaliSebenarnya);
$timeSeharusnya = strtotime($dtPinjam['tgl_kembali']);

$telat = 0;
$denda = 0;

if ($timeSebenarnya > $timeSeharusnya) {
    $telat = round(($timeSebenarnya - $timeSeharusnya) / 86400);
    $denda = $dendaPerHari * $telat;
}
?>

<div class="page-header">
    <div class="page-header-info">
        <h1>Konfirmasi Pengembalian Buku</h1>
        <p>Periksa rincian peminjaman dan kalkulasi denda keterlambatan sebelum pengembalian.</p>
    </div>
    <div class="page-actions">
        <a href="index.php?pg=pengembalian<?= $admin_query_str ?>" class="btn btn-secondary btn-sm">
            <i class='bx bx-arrow-back'></i> Kembali
        </a>
    </div>
</div>

<div class="card" style="max-width: 650px;">
    <form method="POST" action="savePengembalian.php">
        <input type="hidden" name="admin" value="<?= htmlspecialchars($admin_param) ?>">
        <input type="hidden" name="idPinjam" value="<?= $idPinjam ?>">
        <input type="hidden" name="tglKembali" value="<?= $tglKembaliSebenarnya ?>">
        <input type="hidden" name="denda" value="<?= $denda ?>">

        <div style="background: var(--bg-main); border-radius: var(--radius-md); padding: 20px; border: 1px solid var(--card-border); margin-bottom: 24px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; padding-bottom: 12px; border-bottom: 1px dashed var(--card-border);">
                <div>
                    <span style="font-size: 11.5px; font-weight: 700; color: var(--text-muted); text-transform: uppercase;">ID Peminjaman</span>
                    <div style="font-family: monospace; font-size: 18px; font-weight: 800; color: var(--primary);">#<?= $idPinjam ?></div>
                </div>
                <div style="text-align: right;">
                    <span style="font-size: 11.5px; font-weight: 700; color: var(--text-muted); text-transform: uppercase;">Peminjam</span>
                    <div style="font-size: 14px; font-weight: 700; color: #0f172a;"><?= htmlspecialchars($dtPinjam['nama_anggota']) ?></div>
                </div>
            </div>

            <div style="margin-bottom: 16px;">
                <span style="font-size: 11.5px; font-weight: 700; color: var(--text-muted); text-transform: uppercase; display: block; margin-bottom: 4px;">Buku yang Dikembalikan</span>
                <div style="font-size: 13.5px; font-weight: 600; color: #1e293b; line-height: 1.6;">
                    &bull; <?= $dtPinjam['daftar_buku'] ?: 'Buku Perpustakaan' ?>
                </div>
            </div>

            <div class="form-grid" style="grid-template-columns: 1fr 1fr; gap: 16px;">
                <div>
                    <span style="font-size: 11.5px; font-weight: 700; color: var(--text-muted); text-transform: uppercase;">Tgl Peminjaman</span>
                    <div style="font-size: 13.5px; font-weight: 600; color: #0f172a;"><?= tgl_indo($dtPinjam['tgl_pinjam']) ?></div>
                </div>
                <div>
                    <span style="font-size: 11.5px; font-weight: 700; color: var(--text-muted); text-transform: uppercase;">Batas Waktu Pengembalian</span>
                    <div style="font-size: 13.5px; font-weight: 600; color: #0f172a;"><?= tgl_indo($dtPinjam['tgl_kembali']) ?></div>
                </div>
                <div>
                    <span style="font-size: 11.5px; font-weight: 700; color: var(--text-muted); text-transform: uppercase;">Tgl Pengembalian Hari Ini</span>
                    <div style="font-size: 13.5px; font-weight: 700; color: var(--primary);"><?= tgl_indo($tglKembaliSebenarnya) ?></div>
                </div>
                <div>
                    <span style="font-size: 11.5px; font-weight: 700; color: var(--text-muted); text-transform: uppercase;">Keterlambatan</span>
                    <div style="font-size: 13.5px; font-weight: 700; color: <?= $telat > 0 ? 'var(--danger)' : 'var(--success)' ?>;">
                        <?= $telat > 0 ? "$telat Hari Terlambat" : "Tepat Waktu (0 Hari)" ?>
                    </div>
                </div>
            </div>
        </div>

        <!-- Total Denda Box -->
        <div style="background: <?= $denda > 0 ? '#fef2f2' : '#ecfdf5' ?>; border: 1px solid <?= $denda > 0 ? '#fecaca' : '#a7f3d0' ?>; border-radius: var(--radius-md); padding: 20px; display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px;">
            <div>
                <div style="font-size: 12px; font-weight: 700; text-transform: uppercase; color: <?= $denda > 0 ? '#991b1b' : '#065f46' ?>;">Total Tagihan Denda</div>
                <div style="font-size: 12px; color: <?= $denda > 0 ? '#b91c1c' : '#047857' ?>;">Tarif denda: <?= rupiah($dendaPerHari) ?> / hari</div>
            </div>
            <div style="font-family: var(--font-heading); font-size: 26px; font-weight: 800; color: <?= $denda > 0 ? '#dc2626' : '#059669' ?>;">
                <?= rupiah($denda) ?>
            </div>
        </div>

        <div style="display: flex; gap: 12px; flex-wrap: wrap;">
            <button type="submit" class="btn btn-primary" style="flex: 1; min-width: 180px; padding: 12px;">
                <i class='bx bx-check'></i> Konfirmasi Selesai Pengembalian
            </button>
            <a href="index.php?pg=pengembalian<?= $admin_query_str ?>" class="btn btn-secondary" style="flex: 1; min-width: 100px; padding: 12px;">Batal</a>
        </div>
    </form>
</div>
