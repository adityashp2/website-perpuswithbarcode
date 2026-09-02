<?php
require_once __DIR__ . '/koneksi.php';

$user = get_current_user_data();
if (!$user || $user['type'] !== 'ANG') {
    echo "<script>window.location.href='index.php?pg=notmember';</script>";
    exit();
}

$admin_param    = $user['admin_id'];
$admin_query_str = "&admin=" . urlencode($admin_param);
$id_anggota     = $user['id_anggota'];

$q_config      = db_fetch_one(db_query("SELECT dendaPerHari FROM config LIMIT 1"));
$denda_per_hari = (float)($q_config['dendaPerHari'] ?? 500);
$today          = strtotime(date('Y-m-d'));

// Semua peminjaman aktif (belum SELESAI / DITOLAK)
$peminjaman_aktif = db_fetch_all(db_query("
    SELECT p.id_pinjam, p.tgl_pinjam, p.tgl_kembali, p.status,
           GROUP_CONCAT(CONCAT(b.judul, ' <small style=\"color:var(--primary);font-weight:700;\">(&times;', dp.qty, ' eks)</small>') SEPARATOR '<br>&bull; ') AS daftar_buku
    FROM peminjaman p
    LEFT JOIN detail_peminjaman dp ON dp.id_pinjam = p.id_pinjam
    LEFT JOIN buku b ON b.isbn = dp.isbn
    WHERE p.id_anggota = '$id_anggota' AND p.status NOT IN ('SELESAI', 'DITOLAK')
    GROUP BY p.id_pinjam
    ORDER BY p.id_pinjam DESC
"));

// Riwayat selesai/ditolak
$history = db_fetch_all(db_query("
    SELECT p.id_pinjam, p.tgl_pinjam, p.tgl_kembali, p.status,
           k.tgl_kembali AS tgl_dikembalikan, k.denda,
           GROUP_CONCAT(CONCAT(b.judul, ' <small style=\"color:var(--text-muted);\">(&times;', dp.qty, ' eks)</small>') SEPARATOR '<br>&bull; ') AS daftar_buku
    FROM peminjaman p
    LEFT JOIN pengembalian k ON k.id_pinjam = p.id_pinjam
    LEFT JOIN detail_peminjaman dp ON dp.id_pinjam = p.id_pinjam
    LEFT JOIN buku b ON b.isbn = dp.isbn
    WHERE p.id_anggota = '$id_anggota' AND p.status IN ('SELESAI', 'DITOLAK')
    GROUP BY p.id_pinjam
    ORDER BY p.id_pinjam DESC LIMIT 10
"));
?>

<div class="page-header">
    <div class="page-header-info">
        <h1>Peminjaman & Pengembalian Buku</h1>
        <p>Pantau status permohonan pinjam dan ajukan pengembalian buku Anda.</p>
    </div>
    <div class="page-actions">
        <a href="index.php?pg=peminjaman<?= $admin_query_str ?>" class="btn btn-primary">
            <i class='bx bx-cart-add'></i> Ajukan Pinjam Buku
        </a>
    </div>
</div>

<!-- Status Legend -->
<div style="display:flex; gap:10px; flex-wrap:wrap; margin-bottom:20px;">
    <span style="font-size:12.5px; font-weight:600; color:var(--text-muted);">Keterangan Status:</span>
    <span class="badge badge-warning"><i class='bx bx-time'></i> Menunggu ACC Petugas</span>
    <span class="badge badge-info"><i class='bx bx-book-open'></i> Sedang Dipinjam</span>
    <span class="badge badge-danger"><i class='bx bx-package'></i> Pengajuan Kembali Terkirim</span>
    <span class="badge badge-success"><i class='bx bx-check'></i> Selesai</span>
    <span class="badge" style="background:#fee2e2;color:#991b1b;"><i class='bx bx-x'></i> Ditolak</span>
</div>

<!-- Tabel Peminjaman Aktif -->
<div class="card">
    <div class="card-header">
        <div class="card-title">
            <i class='bx bx-time-five' style="color:var(--warning);"></i>
            <span>Peminjaman Aktif & Permohonan</span>
        </div>
    </div>
    <div class="table-responsive">
        <table class="table-modern">
            <thead>
                <tr>
                    <th width="80">ID</th>
                    <th>Buku yang Dipinjam</th>
                    <th width="120">Tgl Ajukan</th>
                    <th width="130">Batas Kembali</th>
                    <th width="160">Status</th>
                    <th width="170" style="text-align:center;">Aksi</th>
                </tr>
            </thead>
            <tbody>
                <?php if (empty($peminjaman_aktif)): ?>
                    <tr><td colspan="6" style="text-align:center; padding:40px; color:var(--text-muted);">
                        <i class='bx bx-check-circle' style="font-size:36px;display:block;margin-bottom:8px;color:var(--success);"></i>
                        Tidak ada peminjaman aktif saat ini.
                    </td></tr>
                <?php else: ?>
                    <?php foreach ($peminjaman_aktif as $p):
                        $deadline   = strtotime($p['tgl_kembali']);
                        $is_overdue = $p['status'] === 'DIPINJAM' && $today > $deadline;
                        $late_days  = $is_overdue ? (int)round(($today - $deadline) / 86400) : 0;
                        $est_denda  = $late_days * $denda_per_hari;
                    ?>
                        <tr>
                            <td><span style="font-family:monospace;font-weight:700;">#<?= $p['id_pinjam'] ?></span></td>
                            <td>
                                <div style="font-weight:600;color:#1e293b;line-height:1.7;">
                                    &bull; <?= $p['daftar_buku'] ?: 'Buku Perpustakaan' ?>
                                </div>
                            </td>
                            <td><?= tgl_indo($p['tgl_pinjam']) ?></td>
                            <td>
                                <strong><?= tgl_indo($p['tgl_kembali']) ?></strong>
                                <?php if ($is_overdue): ?>
                                    <div style="font-size:11px;color:var(--danger);font-weight:700;margin-top:2px;">
                                        Telat <?= $late_days ?> hari — Est. <?= rupiah($est_denda) ?>
                                    </div>
                                <?php endif; ?>
                            </td>
                            <td>
                                <?php if ($p['status'] === 'PENDING'): ?>
                                    <span class="badge badge-warning"><i class='bx bx-time'></i> Menunggu ACC</span>
                                <?php elseif ($p['status'] === 'DIPINJAM'): ?>
                                    <?php if ($is_overdue): ?>
                                        <span class="badge badge-danger"><i class='bx bx-alarm-exclamation'></i> Terlambat</span>
                                    <?php else: ?>
                                        <span class="badge badge-info"><i class='bx bx-book-open'></i> Sedang Dipinjam</span>
                                    <?php endif; ?>
                                <?php elseif ($p['status'] === 'KEMBALI'): ?>
                                    <span class="badge badge-danger"><i class='bx bx-package'></i> Pengembalian Diajukan</span>
                                <?php endif; ?>
                            </td>
                            <td style="text-align:center;">
                                <?php if ($p['status'] === 'PENDING'): ?>
                                    <span style="font-size:12px;color:var(--text-muted);"><i class='bx bx-loader-alt'></i> Menunggu Petugas</span>
                                <?php elseif ($p['status'] === 'DIPINJAM'): ?>
                                    <a href="ajukanKembali.php?id=<?= $p['id_pinjam'] ?>&admin=<?= urlencode($admin_param) ?>"
                                       class="btn btn-success btn-sm"
                                       onclick="return confirm('Ajukan pengembalian buku #<?= $p['id_pinjam'] ?>? Pastikan Anda membawa buku fisik ke meja petugas.')">
                                        <i class='bx bx-undo'></i> Ajukan Kembali
                                    </a>
                                <?php elseif ($p['status'] === 'KEMBALI'): ?>
                                    <span style="font-size:12px;color:var(--text-muted);"><i class='bx bx-check'></i> Menunggu Konfirmasi Petugas</span>
                                <?php endif; ?>
                            </td>
                        </tr>
                    <?php endforeach; ?>
                <?php endif; ?>
            </tbody>
        </table>
    </div>
</div>

<!-- Riwayat Selesai -->
<?php if (!empty($history)): ?>
<div class="card" style="margin-top:24px;">
    <div class="card-header">
        <div class="card-title">
            <i class='bx bx-history' style="color:var(--primary);"></i>
            <span>Riwayat Sirkulasi Selesai</span>
        </div>
    </div>
    <div class="table-responsive">
        <table class="table-modern">
            <thead>
                <tr>
                    <th width="80">ID</th>
                    <th>Judul Buku</th>
                    <th width="120">Tgl Pinjam</th>
                    <th width="130">Tgl Dikembalikan</th>
                    <th width="130">Denda</th>
                    <th width="100" style="text-align:center;">Status</th>
                </tr>
            </thead>
            <tbody>
                <?php foreach ($history as $h): ?>
                    <tr>
                        <td><span style="font-family:monospace;">#<?= $h['id_pinjam'] ?></span></td>
                        <td>&bull; <?= $h['daftar_buku'] ?: '-' ?></td>
                        <td><?= tgl_indo($h['tgl_pinjam']) ?></td>
                        <td><?= $h['tgl_dikembalikan'] ? tgl_indo($h['tgl_dikembalikan']) : '-' ?></td>
                        <td>
                            <?php if (isset($h['denda']) && $h['denda'] > 0): ?>
                                <strong style="color:var(--danger);"><?= rupiah($h['denda']) ?></strong>
                            <?php else: ?>
                                <span style="color:var(--success);">Rp 0 (Tepat Waktu)</span>
                            <?php endif; ?>
                        </td>
                        <td style="text-align:center;">
                            <?php if ($h['status'] === 'DITOLAK'): ?>
                                <span class="badge" style="background:#fee2e2;color:#991b1b;"><i class='bx bx-x'></i> Ditolak</span>
                            <?php else: ?>
                                <span class="badge badge-success"><i class='bx bx-check'></i> Selesai</span>
                            <?php endif; ?>
                        </td>
                    </tr>
                <?php endforeach; ?>
            </tbody>
        </table>
    </div>
</div>
<?php endif; ?>
