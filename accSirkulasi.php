<?php
require_once __DIR__ . '/koneksi.php';

$user = get_current_user_data();
if (!$user || $user['type'] !== 'ADM') {
    set_flash('error', 'Hanya admin yang dapat mengakses halaman ini.');
    header("Location: index.php?pg=notadmin");
    exit();
}

$admin_param   = $user['admin_id'];
$admin_query_str = "&admin=" . urlencode($admin_param);

// Ambil konfigurasi denda
$q_config      = db_fetch_one(db_query("SELECT * FROM config LIMIT 1"));
$denda_per_hari = (float)($q_config['dendaPerHari'] ?? 500);

// ─── SCANNER: cari peminjaman berdasarkan ISBN yang di-scan ──────────────────
$scan_isbn   = trim($_GET['scan_isbn'] ?? '');
$scan_result = null;
$scan_error  = '';
if ($scan_isbn !== '') {
    $isbn_esc = db_escape($scan_isbn);
    // Cari peminjaman aktif (PENDING/DIPINJAM/KEMBALI) yang mengandung ISBN ini
    $scan_row = db_fetch_one(db_query("
        SELECT p.id_pinjam, p.status, p.tgl_kembali, a.nama AS nama_anggota,
               GROUP_CONCAT(CONCAT(b2.judul, ' (&times;', dp2.qty, ' eks)') SEPARATOR ', ') AS daftar_buku
        FROM detail_peminjaman dp
        INNER JOIN peminjaman p ON p.id_pinjam = dp.id_pinjam
        INNER JOIN anggota a   ON a.id_anggota = p.id_anggota
        LEFT JOIN detail_peminjaman dp2 ON dp2.id_pinjam = p.id_pinjam
        LEFT JOIN buku b2 ON b2.isbn = dp2.isbn
        WHERE dp.isbn = '$isbn_esc'
          AND p.status IN ('PENDING','DIPINJAM','KEMBALI')
        GROUP BY p.id_pinjam
        ORDER BY p.id_pinjam DESC
        LIMIT 1
    "));
    if ($scan_row) {
        $scan_result = $scan_row;
        // Hitung denda estimasi
        $dl = strtotime($scan_row['tgl_kembali']);
        $td = strtotime(date('Y-m-d'));
        $late = $td > $dl ? (int)round(($td - $dl) / 86400) : 0;
        $scan_result['est_denda'] = $late * $denda_per_hari;
        $scan_result['late_days'] = $late;
    } else {
        // Cek apakah ISBN ada di database buku
        $buku_check = db_fetch_one(db_query("SELECT judul FROM buku WHERE isbn='$isbn_esc' LIMIT 1"));
        if ($buku_check) {
            $scan_error = 'Buku "<strong>' . htmlspecialchars($buku_check['judul']) . '</strong>" tidak sedang dalam proses peminjaman aktif.';
        } else {
            $scan_error = 'ISBN <code>' . htmlspecialchars($scan_isbn) . '</code> tidak ditemukan di database buku.';
        }
    }
}

// ─── DATA TABS ───────────────────────────────────────────────────────────────

// 1. Permohonan Pending
$pending = db_fetch_all(db_query("
    SELECT p.id_pinjam, p.tgl_pinjam, p.tgl_kembali, p.status,
           a.nama AS nama_anggota, a.email,
           GROUP_CONCAT(CONCAT(b.judul, ' <small style=\"color:var(--primary);font-weight:700;\">(&times;', dp.qty, ' eks)</small>') SEPARATOR '<br>&bull; ') AS daftar_buku
    FROM peminjaman p
    INNER JOIN anggota a  ON a.id_anggota  = p.id_anggota
    LEFT  JOIN detail_peminjaman dp ON dp.id_pinjam = p.id_pinjam
    LEFT  JOIN buku b ON b.isbn = dp.isbn
    WHERE p.status = 'PENDING'
    GROUP BY p.id_pinjam
    ORDER BY p.id_pinjam DESC
"));

// 2. Sedang Dipinjam (sudah di-ACC, belum dikembalikan)
$dipinjam = db_fetch_all(db_query("
    SELECT p.id_pinjam, p.tgl_pinjam, p.tgl_kembali, p.status,
           a.nama AS nama_anggota,
           GROUP_CONCAT(CONCAT(b.judul, ' <small style=\"color:var(--primary);font-weight:700;\">(&times;', dp.qty, ' eks)</small>') SEPARATOR '<br>&bull; ') AS daftar_buku
    FROM peminjaman p
    INNER JOIN anggota a  ON a.id_anggota  = p.id_anggota
    LEFT  JOIN detail_peminjaman dp ON dp.id_pinjam = p.id_pinjam
    LEFT  JOIN buku b ON b.isbn = dp.isbn
    WHERE p.status = 'DIPINJAM'
    GROUP BY p.id_pinjam
    ORDER BY p.tgl_kembali ASC
"));

// 3. Permintaan Pengembalian (status KEMBALI - anggota minta dikembalikan)
$req_kembali = db_fetch_all(db_query("
    SELECT p.id_pinjam, p.tgl_pinjam, p.tgl_kembali, p.status,
           a.nama AS nama_anggota,
           GROUP_CONCAT(CONCAT(b.judul, ' <small style=\"color:var(--primary);font-weight:700;\">(&times;', dp.qty, ' eks)</small>') SEPARATOR '<br>&bull; ') AS daftar_buku
    FROM peminjaman p
    INNER JOIN anggota a  ON a.id_anggota  = p.id_anggota
    LEFT  JOIN detail_peminjaman dp ON dp.id_pinjam = p.id_pinjam
    LEFT  JOIN buku b ON b.isbn = dp.isbn
    WHERE p.status = 'KEMBALI'
    GROUP BY p.id_pinjam
    ORDER BY p.id_pinjam DESC
"));

// 4. Riwayat Selesai (terakhir 20)
$selesai = db_fetch_all(db_query("
    SELECT p.id_pinjam, p.tgl_pinjam, p.tgl_kembali, p.status,
           a.nama AS nama_anggota, k.tgl_kembali AS tgl_dikembalikan, k.denda,
           GROUP_CONCAT(CONCAT(b.judul, ' <small style=\"color:var(--text-muted);\">(&times;', dp.qty, ' eks)</small>') SEPARATOR '<br>&bull; ') AS daftar_buku
    FROM peminjaman p
    INNER JOIN anggota a  ON a.id_anggota  = p.id_anggota
    LEFT  JOIN pengembalian k  ON k.id_pinjam = p.id_pinjam
    LEFT  JOIN detail_peminjaman dp ON dp.id_pinjam = p.id_pinjam
    LEFT  JOIN buku b ON b.isbn = dp.isbn
    WHERE p.status IN ('SELESAI', 'DITOLAK')
    GROUP BY p.id_pinjam
    ORDER BY p.id_pinjam DESC LIMIT 20
"));

$today = strtotime(date('Y-m-d'));
?>
<!-- ═══════════════════ BARCODE SCANNER WIDGET ═══════════════════ -->
<div class="scanner-shell">
    <div class="scanner-topbar">
        <div class="scanner-icon-wrap">
            <i class='bx bx-barcode-reader'></i>
        </div>
        <div class="scanner-badge">Mode scanner</div>
    </div>

    <div class="scanner-content">
        <div class="scanner-copy">
            <h3>Scan ISBN buku untuk ACC instan</h3>
            <p>Arahkan kamera ke barcode label buku, atau ketik ISBN manual. Sistem akan otomatis mencari transaksi yang relevan.</p>
        </div>

        <form method="GET" action="index.php" id="scanForm" class="scanner-form">
            <input type="hidden" name="pg" value="acc">
            <input type="hidden" name="admin" value="<?= htmlspecialchars($admin_param) ?>">
            <input type="hidden" name="tab" value="<?= htmlspecialchars($active_tab ?? 'pending') ?>">

            <div class="scanner-input-wrap">
                <i class='bx bx-barcode'></i>
                <input type="text" name="scan_isbn" id="scanInput"
                    value="<?= htmlspecialchars($scan_isbn) ?>"
                    placeholder="Scan atau ketik ISBN buku..."
                    autocomplete="off"
                    autofocus
                    required>
            </div>

            <button type="submit" class="scanner-primary-btn">
                <i class='bx bx-search'></i> Cari
            </button>
            <button type="button" id="cameraScanButton" class="scanner-secondary-btn">
                <i class='bx bx-camera'></i> Kamera
            </button>

            <?php if ($scan_isbn): ?>
                <a href="index.php?pg=acc<?= $admin_query_str ?>&tab=<?= htmlspecialchars($active_tab ?? 'pending') ?>" class="scanner-reset-btn">
                    <i class='bx bx-x'></i> Reset
                </a>
            <?php endif; ?>
        </form>

        <div id="scannerContainer" class="scanner-camera-panel" style="display:none;">
            <div class="scanner-camera-frame">
                <div id="scannerReader" class="scanner-reader">
                    <video id="scannerVideo" playsinline autoplay muted></video>
                </div>
                <div class="scanner-camera-footer">
                    <div id="scannerStatus">Siap memindai barcode / ISBN</div>
                    <button type="button" id="stopScannerButton" class="btn btn-secondary btn-sm" style="display:none;">
                        <i class='bx bx-stop-circle'></i> Stop Kamera
                    </button>
                </div>
            </div>
        </div>
    </div>

    <?php if ($scan_isbn): ?>
    <div class="scan-result-shell">
        <?php if ($scan_result): ?>
            <?php
                $sr = $scan_result;
                $status_map = [
                    'PENDING'  => ['⏳ Menunggu ACC Pinjam', '#fbbf24', 'acc'],
                    'DIPINJAM' => ['📖 Sedang Dipinjam', '#34d399', 'dipinjam'],
                    'KEMBALI'  => ['📦 Menunggu ACC Kembali', '#60a5fa', 'kembali'],
                ];
                [$status_label, $status_color, $tab_hint] = $status_map[$sr['status']] ?? ['—', '#fff', 'pending'];
            ?>
            <div class="scan-result-card success">
                <div class="scan-result-info">
                    <div class="scan-result-kicker">✅ Buku ditemukan · Peminjaman #<?= $sr['id_pinjam'] ?></div>
                    <h4><?= htmlspecialchars($sr['nama_anggota']) ?></h4>
                    <p><?= htmlspecialchars($sr['daftar_buku'] ?? '-') ?></p>
                    <div class="scan-result-meta">
                        <span class="status-pill" style="background:<?= $status_color ?>20; color:<?= $status_color ?>; border-color:<?= $status_color ?>40;">
                           <?= $status_label ?>
                        </span>
                        <?php if ($sr['est_denda'] > 0): ?>
                           <span class="status-pill danger">⚠️ Denda Est: <?= rupiah($sr['est_denda']) ?> (<?= $sr['late_days'] ?> hari)</span>
                        <?php endif; ?>
                    </div>
                </div>

                <div class="scan-result-actions">
                    <?php if ($sr['status'] === 'PENDING'): ?>
                        <a href="accPinjam.php?aksi=acc&id=<?= $sr['id_pinjam'] ?>&admin=<?= urlencode($admin_param) ?>&scan_isbn=<?= urlencode($scan_isbn) ?>"
                           class="scan-action-btn success"
                           onclick="return confirm('ACC & setujui peminjaman #<?= $sr['id_pinjam'] ?>?') && !!document.getElementById('scanInput') && document.getElementById('scanInput').value.trim() !== ''">
                           <i class='bx bx-check'></i> ACC Setujui Pinjam
                        </a>
                        <a href="accPinjam.php?aksi=tolak&id=<?= $sr['id_pinjam'] ?>&admin=<?= urlencode($admin_param) ?>&scan_isbn=<?= urlencode($scan_isbn) ?>"
                           class="scan-action-btn danger"
                           onclick="return confirm('Tolak peminjaman #<?= $sr['id_pinjam'] ?>?') && !!document.getElementById('scanInput') && document.getElementById('scanInput').value.trim() !== ''">
                           <i class='bx bx-x'></i> Tolak
                        </a>
                    <?php elseif ($sr['status'] === 'KEMBALI'): ?>
                        <a href="accKembali.php?id=<?= $sr['id_pinjam'] ?>&admin=<?= urlencode($admin_param) ?>&denda=<?= $sr['est_denda'] ?>&scan_isbn=<?= urlencode($scan_isbn) ?>"
                           class="scan-action-btn success"
                           onclick="return confirm('Konfirmasi terima buku dan selesaikan pengembalian #<?= $sr['id_pinjam'] ?>?') && !!document.getElementById('scanInput') && document.getElementById('scanInput').value.trim() !== ''">
                           <i class='bx bx-check-double'></i> ACC Terima Buku
                        </a>
                    <?php else: ?>
                        <a href="index.php?pg=acc<?= $admin_query_str ?>&tab=dipinjam" class="scan-action-btn info">
                           Lihat di Tab Dipinjam →
                        </a>
                    <?php endif; ?>
                </div>
            </div>
        <?php elseif ($scan_error): ?>
            <div class="scan-result-card error">
                <i class='bx bx-error-circle'></i>
                <?= $scan_error ?>
            </div>
        <?php endif; ?>
    </div>
    <?php endif; ?>
</div>

<div class="page-header">
    <div class="page-header-info">
        <h1><i class='bx bx-check-shield' style="color:var(--primary);"></i> Panel ACC Sirkulasi</h1>
        <p>Verifikasi, setujui, atau tolak permohonan peminjaman dan pengembalian buku dari anggota.</p>
    </div>
    <div class="page-actions">
        <?php
        $count_pending   = count($pending);
        $count_kembali   = count($req_kembali);
        if ($count_pending > 0): ?>
            <span class="badge badge-warning" style="font-size:14px; padding: 8px 14px;">
                <i class='bx bx-time'></i> <?= $count_pending ?> Permohonan Pinjam
            </span>
        <?php endif; ?>
        <?php if ($count_kembali > 0): ?>
            <span class="badge badge-info" style="font-size:14px; padding: 8px 14px;">
                <i class='bx bx-package'></i> <?= $count_kembali ?> Permintaan Kembali
            </span>
        <?php endif; ?>
    </div>
</div>

<!-- Tab Nav -->
<div style="display:flex; gap:8px; margin-bottom:20px; flex-wrap:wrap;">
    <?php
    $tabs = [
        'pending'   => ['label' => 'Permohonan Pinjam',     'icon' => 'bx-time',     'badge' => count($pending),    'color' => '--warning'],
        'dipinjam'  => ['label' => 'Sedang Dipinjam',        'icon' => 'bx-book-open','badge' => count($dipinjam),   'color' => '--primary'],
        'kembali'   => ['label' => 'Permintaan Pengembalian','icon' => 'bx-package',  'badge' => count($req_kembali),'color' => '--info'],
        'selesai'   => ['label' => 'Riwayat Selesai',        'icon' => 'bx-history',  'badge' => count($selesai),    'color' => '--success'],
    ];
    $active_tab = $_GET['tab'] ?? 'pending';
    foreach ($tabs as $key => $tab): ?>
        <a href="index.php?pg=acc<?= $admin_query_str ?>&tab=<?= $key ?>"
           class="btn <?= $active_tab === $key ? 'btn-primary' : 'btn-secondary' ?>"
           style="<?= $active_tab === $key ? '' : '' ?>">
            <i class='bx <?= $tab['icon'] ?>'></i>
            <?= $tab['label'] ?>
            <?php if ($tab['badge'] > 0): ?>
                <span style="background:<?= $active_tab === $key ? 'rgba(255,255,255,0.3)' : 'var('.$tab['color'].')' ?>;color:<?= $active_tab === $key ? '#fff' : '#fff' ?>;padding:1px 8px;border-radius:99px;font-size:11px;margin-left:4px;">
                    <?= $tab['badge'] ?>
                </span>
            <?php endif; ?>
        </a>
    <?php endforeach; ?>
</div>

<!-- ═══════════════════ TAB: PENDING ═══════════════════ -->
<?php if ($active_tab === 'pending'): ?>
<div class="card">
    <div class="card-header">
        <div class="card-title"><i class='bx bx-time' style="color:var(--warning);"></i> Permohonan Pinjam Baru — Menunggu ACC</div>
    </div>
    <div class="table-responsive">
        <table class="table-modern">
            <thead>
                <tr>
                    <th width="80">ID</th>
                    <th>Anggota</th>
                    <th>Buku yang Diminta</th>
                    <th width="120">Tgl Ajukan</th>
                    <th width="120">Batas Kembali</th>
                    <th width="200" style="text-align:center;">Aksi ACC</th>
                </tr>
            </thead>
            <tbody>
                <?php if (empty($pending)): ?>
                    <tr><td colspan="6" style="text-align:center;padding:40px;color:var(--text-muted);">
                        <i class='bx bx-check-circle' style="font-size:36px;display:block;margin-bottom:8px;color:var(--success);"></i>
                        Tidak ada permohonan pinjam yang menunggu persetujuan.
                    </td></tr>
                <?php else: ?>
                    <?php foreach ($pending as $p): ?>
                        <tr>
                            <td><span style="font-family:monospace;font-weight:700;">#<?= $p['id_pinjam'] ?></span></td>
                            <td>
                                <div style="font-weight:700;color:#0f172a;"><?= htmlspecialchars($p['nama_anggota']) ?></div>
                                <div style="font-size:12px;color:var(--text-muted);"><?= htmlspecialchars($p['email'] ?? '') ?></div>
                            </td>
                            <td><div style="line-height:1.7;">&bull; <?= $p['daftar_buku'] ?: '-' ?></div></td>
                            <td><?= tgl_indo($p['tgl_pinjam']) ?></td>
                            <td><strong><?= tgl_indo($p['tgl_kembali']) ?></strong></td>
                            <td style="text-align:center;">
                                <div style="display:flex;gap:8px;justify-content:center;flex-wrap:wrap;">
                                    <a href="accPinjam.php?aksi=acc&id=<?= $p['id_pinjam'] ?>&admin=<?= urlencode($admin_param) ?><?= $scan_isbn !== '' ? '&scan_isbn=' . urlencode($scan_isbn) : '' ?>"
                                       class="btn btn-success btn-sm"
                                       data-require-scan="1"
                                       onclick="if (!document.getElementById('scanInput') || document.getElementById('scanInput').value.trim() === '') { alert('Harap scan barcode buku terlebih dahulu sebelum ACC.'); return false; } return confirm('Setujui permohonan pinjam #<?= $p['id_pinjam'] ?> dari <?= htmlspecialchars(addslashes($p['nama_anggota'])) ?>?');">
                                        <i class='bx bx-check'></i> ACC Setujui
                                    </a>
                                    <a href="accPinjam.php?aksi=tolak&id=<?= $p['id_pinjam'] ?>&admin=<?= urlencode($admin_param) ?><?= $scan_isbn !== '' ? '&scan_isbn=' . urlencode($scan_isbn) : '' ?>"
                                       class="btn btn-danger btn-sm"
                                       data-require-scan="1"
                                       onclick="if (!document.getElementById('scanInput') || document.getElementById('scanInput').value.trim() === '') { alert('Harap scan barcode buku terlebih dahulu sebelum ACC.'); return false; } return confirm('Tolak permohonan pinjam #<?= $p['id_pinjam'] ?>?');">
                                        <i class='bx bx-x'></i> Tolak
                                    </a>
                                </div>
                            </td>
                        </tr>
                    <?php endforeach; ?>
                <?php endif; ?>
            </tbody>
        </table>
    </div>
</div>

<!-- ═══════════════════ TAB: DIPINJAM ═══════════════════ -->
<?php elseif ($active_tab === 'dipinjam'): ?>
<div class="card">
    <div class="card-header">
        <div class="card-title"><i class='bx bx-book-open' style="color:var(--primary);"></i> Buku Sedang Dipinjam</div>
    </div>
    <div class="table-responsive">
        <table class="table-modern">
            <thead>
                <tr>
                    <th width="80">ID</th>
                    <th>Anggota</th>
                    <th>Buku Dipinjam</th>
                    <th width="120">Tgl Pinjam</th>
                    <th width="130">Batas Kembali</th>
                    <th width="150">Status</th>
                </tr>
            </thead>
            <tbody>
                <?php if (empty($dipinjam)): ?>
                    <tr><td colspan="6" style="text-align:center;padding:40px;color:var(--text-muted);">
                        Tidak ada buku yang sedang dipinjam saat ini.
                    </td></tr>
                <?php else: ?>
                    <?php foreach ($dipinjam as $p):
                        $deadline   = strtotime($p['tgl_kembali']);
                        $is_overdue = $today > $deadline;
                        $late_days  = $is_overdue ? (int)round(($today - $deadline) / 86400) : 0;
                    ?>
                        <tr>
                            <td><span style="font-family:monospace;font-weight:700;">#<?= $p['id_pinjam'] ?></span></td>
                            <td><div style="font-weight:700;color:#0f172a;"><?= htmlspecialchars($p['nama_anggota']) ?></div></td>
                            <td><div style="line-height:1.7;">&bull; <?= $p['daftar_buku'] ?: '-' ?></div></td>
                            <td><?= tgl_indo($p['tgl_pinjam']) ?></td>
                            <td>
                                <strong><?= tgl_indo($p['tgl_kembali']) ?></strong>
                                <?php if ($is_overdue): ?>
                                    <div style="font-size:11px;color:var(--danger);font-weight:700;margin-top:2px;">
                                        Telat <?= $late_days ?> hari
                                    </div>
                                <?php endif; ?>
                            </td>
                            <td>
                                <?php if ($is_overdue): ?>
                                    <span class="badge badge-danger"><i class='bx bx-alarm-exclamation'></i> Terlambat</span>
                                <?php else: ?>
                                    <span class="badge badge-success"><i class='bx bx-check'></i> Aktif</span>
                                <?php endif; ?>
                            </td>
                        </tr>
                    <?php endforeach; ?>
                <?php endif; ?>
            </tbody>
        </table>
    </div>
</div>

<!-- ═══════════════════ TAB: PERMINTAAN KEMBALI ═══════════════════ -->
<?php elseif ($active_tab === 'kembali'): ?>
<div class="card">
    <div class="card-header">
        <div class="card-title"><i class='bx bx-package' style="color:var(--info);"></i> Permintaan Pengembalian — Menunggu ACC</div>
    </div>
    <div class="table-responsive">
        <table class="table-modern">
            <thead>
                <tr>
                    <th width="80">ID</th>
                    <th>Anggota</th>
                    <th>Buku Dikembalikan</th>
                    <th width="120">Tgl Pinjam</th>
                    <th width="130">Batas Kembali</th>
                    <th width="140">Est. Denda</th>
                    <th width="150" style="text-align:center;">Aksi</th>
                </tr>
            </thead>
            <tbody>
                <?php if (empty($req_kembali)): ?>
                    <tr><td colspan="7" style="text-align:center;padding:40px;color:var(--text-muted);">
                        <i class='bx bx-check-circle' style="font-size:36px;display:block;margin-bottom:8px;color:var(--success);"></i>
                        Tidak ada permintaan pengembalian yang menunggu konfirmasi.
                    </td></tr>
                <?php else: ?>
                    <?php foreach ($req_kembali as $p):
                        $deadline   = strtotime($p['tgl_kembali']);
                        $is_overdue = $today > $deadline;
                        $late_days  = $is_overdue ? (int)round(($today - $deadline) / 86400) : 0;
                        $est_denda  = $late_days * $denda_per_hari;
                    ?>
                        <tr>
                            <td><span style="font-family:monospace;font-weight:700;">#<?= $p['id_pinjam'] ?></span></td>
                            <td><div style="font-weight:700;color:#0f172a;"><?= htmlspecialchars($p['nama_anggota']) ?></div></td>
                            <td><div style="line-height:1.7;">&bull; <?= $p['daftar_buku'] ?: '-' ?></div></td>
                            <td><?= tgl_indo($p['tgl_pinjam']) ?></td>
                            <td><strong><?= tgl_indo($p['tgl_kembali']) ?></strong></td>
                            <td>
                                <?php if ($est_denda > 0): ?>
                                    <strong style="color:var(--danger);"><?= rupiah($est_denda) ?></strong>
                                    <div style="font-size:11px;color:var(--text-muted);"><?= $late_days ?> hari × <?= rupiah($denda_per_hari) ?></div>
                                <?php else: ?>
                                    <span style="color:var(--success);font-weight:600;">Tepat Waktu</span>
                                <?php endif; ?>
                            </td>
                            <td style="text-align:center;">
                                <a href="accKembali.php?id=<?= $p['id_pinjam'] ?>&admin=<?= urlencode($admin_param) ?>&denda=<?= $est_denda ?><?= $scan_isbn !== '' ? '&scan_isbn=' . urlencode($scan_isbn) : '' ?>"
                                   class="btn btn-primary btn-sm"
                                   data-require-scan="1"
                                   onclick="if (!document.getElementById('scanInput') || document.getElementById('scanInput').value.trim() === '') { alert('Harap scan barcode buku terlebih dahulu sebelum ACC.'); return false; } return confirm('Konfirmasi pengembalian buku #<?= $p['id_pinjam'] ?>? Denda: <?= rupiah($est_denda) ?>');">
                                    <i class='bx bx-check-double'></i> ACC Terima Buku
                                </a>
                            </td>
                        </tr>
                    <?php endforeach; ?>
                <?php endif; ?>
            </tbody>
        </table>
    </div>
</div>

<!-- ═══════════════════ TAB: RIWAYAT SELESAI ═══════════════════ -->
<?php elseif ($active_tab === 'selesai'): ?>
<div class="card">
    <div class="card-header">
        <div class="card-title"><i class='bx bx-history' style="color:var(--success);"></i> Riwayat Sirkulasi Selesai / Ditolak</div>
    </div>
    <div class="table-responsive">
        <table class="table-modern">
            <thead>
                <tr>
                    <th width="80">ID</th>
                    <th>Anggota</th>
                    <th>Buku</th>
                    <th width="120">Tgl Pinjam</th>
                    <th width="130">Tgl Dikembalikan</th>
                    <th width="130">Denda</th>
                    <th width="100" style="text-align:center;">Status</th>
                </tr>
            </thead>
            <tbody>
                <?php if (empty($selesai)): ?>
                    <tr><td colspan="7" style="text-align:center;padding:40px;color:var(--text-muted);">Belum ada riwayat sirkulasi.</td></tr>
                <?php else: ?>
                    <?php foreach ($selesai as $p): ?>
                        <tr>
                            <td><span style="font-family:monospace;">#<?= $p['id_pinjam'] ?></span></td>
                            <td><?= htmlspecialchars($p['nama_anggota']) ?></td>
                            <td><div style="line-height:1.7;">&bull; <?= $p['daftar_buku'] ?: '-' ?></div></td>
                            <td><?= tgl_indo($p['tgl_pinjam']) ?></td>
                            <td><?= $p['tgl_dikembalikan'] ? tgl_indo($p['tgl_dikembalikan']) : '-' ?></td>
                            <td><?= isset($p['denda']) && $p['denda'] > 0 ? '<strong style="color:var(--danger);">'.rupiah($p['denda']).'</strong>' : '<span style="color:var(--success);">-</span>' ?></td>
                            <td style="text-align:center;">
                                <?php if ($p['status'] === 'DITOLAK'): ?>
                                    <span class="badge badge-danger">Ditolak</span>
                                <?php else: ?>
                                    <span class="badge badge-success">Selesai</span>
                                <?php endif; ?>
                            </td>
                        </tr>
                    <?php endforeach; ?>
                <?php endif; ?>
            </tbody>
        </table>
    </div>
</div>
<?php endif; ?>

<style>
    .scanner-shell {
        background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 55%, #312e81 100%);
        border: 1px solid rgba(129, 140, 248, 0.25);
        border-radius: 24px;
        box-shadow: 0 24px 60px rgba(79, 70, 229, 0.28);
        padding: 24px;
        margin-bottom: 24px;
        color: #fff;
        overflow: hidden;
        position: relative;
    }

    .scanner-shell::before {
        content: "";
        position: absolute;
        inset: 0 auto auto 0;
        width: 220px;
        height: 220px;
        background: radial-gradient(circle, rgba(96, 165, 250, 0.22), transparent 70%);
        pointer-events: none;
    }

    .scanner-topbar {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 14px;
        margin-bottom: 18px;
        position: relative;
        z-index: 1;
    }

    .scanner-icon-wrap {
        width: 56px;
        height: 56px;
        display: flex;
        align-items: center;
        justify-content: center;
        background: rgba(99, 102, 241, 0.24);
        border: 1px solid rgba(165, 180, 252, 0.38);
        border-radius: 18px;
        font-size: 26px;
        color: #e2e8ff;
        box-shadow: 0 12px 30px rgba(79, 70, 229, 0.25);
    }

    .scanner-badge {
        background: rgba(255, 255, 255, 0.08);
        border: 1px solid rgba(255, 255, 255, 0.12);
        color: #dbeafe;
        padding: 7px 12px;
        border-radius: 999px;
        font-size: 11px;
        font-weight: 700;
        letter-spacing: 0.08em;
        text-transform: uppercase;
    }

    .scanner-content {
        position: relative;
        z-index: 1;
    }

    .scanner-copy {
        margin-bottom: 18px;
    }

    .scanner-copy h3 {
        font-size: clamp(24px, 2vw, 32px);
        font-weight: 800;
        line-height: 1.2;
        margin: 0 0 8px;
        letter-spacing: -0.04em;
        color: #fff;
    }

    .scanner-copy p {
        margin: 0;
        max-width: 760px;
        color: rgba(226, 232, 240, 0.8);
        font-size: 14px;
    }

    .scanner-form {
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
        align-items: center;
        max-width: 760px;
    }

    .scanner-input-wrap {
        position: relative;
        flex: 1 1 260px;
        min-width: 220px;
    }

    .scanner-input-wrap i {
        position: absolute;
        left: 16px;
        top: 50%;
        transform: translateY(-50%);
        font-size: 20px;
        color: #8b5cf6;
    }

    .scanner-input-wrap input {
        width: 100%;
        padding: 14px 18px 14px 48px;
        border-radius: 14px;
        border: 1px solid rgba(165, 180, 252, 0.45);
        background: rgba(15, 23, 42, 0.35);
        color: #f8fafc;
        font-size: 14px;
        font-family: 'Plus Jakarta Sans', sans-serif;
        font-weight: 700;
        outline: none;
        box-shadow: inset 0 1px 2px rgba(15, 23, 42, 0.2);
        transition: all 0.2s ease;
    }

    .scanner-input-wrap input::placeholder {
        color: rgba(148, 163, 184, 0.9);
    }

    .scanner-input-wrap input:focus {
        border-color: rgba(165, 180, 252, 0.9);
        background: rgba(15, 23, 42, 0.45);
        box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.2);
    }

    .scanner-primary-btn,
    .scanner-secondary-btn,
    .scanner-reset-btn,
    .scan-action-btn {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        border-radius: 12px;
        font-weight: 700;
        font-size: 13px;
        text-decoration: none;
        border: none;
        cursor: pointer;
        transition: all 0.2s ease;
    }

    .scanner-primary-btn {
        background: linear-gradient(135deg, #4f46e5, #6366f1);
        color: #fff;
        padding: 14px 18px;
        box-shadow: 0 12px 28px rgba(79, 70, 229, 0.32);
    }

    .scanner-primary-btn:hover {
        transform: translateY(-1px);
        box-shadow: 0 16px 30px rgba(79, 70, 229, 0.38);
        color: #fff;
    }

    .scanner-secondary-btn {
        background: rgba(16, 185, 129, 0.14);
        border: 1px solid rgba(52, 211, 153, 0.3);
        color: #d1fae5;
        padding: 13px 16px;
    }

    .scanner-secondary-btn:hover {
        background: rgba(16, 185, 129, 0.2);
        color: #ecfdf5;
    }

    .scanner-reset-btn {
        background: rgba(255, 255, 255, 0.08);
        color: #e2e8f0;
        padding: 13px 16px;
        border: 1px solid rgba(255, 255, 255, 0.1);
    }

    .scanner-reset-btn:hover {
        background: rgba(255, 255, 255, 0.12);
        color: #fff;
    }

    .scanner-camera-panel {
        margin-top: 18px;
        max-width: 700px;
    }

    .scanner-camera-frame {
        background: rgba(15, 23, 42, 0.7);
        border: 1px solid rgba(165, 180, 252, 0.34);
        border-radius: 18px;
        padding: 12px;
        box-shadow: 0 18px 34px rgba(15, 23, 42, 0.24);
    }

    .scanner-reader {
        width: 100%;
        min-height: 220px;
        border-radius: 14px;
        overflow: hidden;
        background: #020617;
        position: relative;
    }

    .scanner-reader video {
        width: 100%;
        height: 220px;
        object-fit: cover;
        display: block;
    }

    .scanner-camera-footer {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 12px;
        margin-top: 12px;
        flex-wrap: wrap;
    }

    .scanner-camera-footer div {
        color: #cbd5e1;
        font-size: 12px;
    }

    .scan-result-shell {
        margin-top: 20px;
        padding-top: 22px;
        border-top: 1px solid rgba(255, 255, 255, 0.12);
        position: relative;
        z-index: 1;
    }

    .scan-result-card {
        display: flex;
        align-items: center;
        justify-content: space-between;
        flex-wrap: wrap;
        gap: 18px;
        background: rgba(15, 118, 110, 0.12);
        border: 1px solid rgba(45, 212, 191, 0.4);
        border-radius: 18px;
        padding: 18px 20px;
        box-shadow: inset 0 1px 0 rgba(255,255,255,0.12);
    }

    .scan-result-card.error {
        background: rgba(153, 27, 27, 0.16);
        border-color: rgba(248, 113, 113, 0.35);
        color: #fecaca;
    }

    .scan-result-card.error i {
        margin-right: 8px;
        font-size: 20px;
        vertical-align: middle;
    }

    .scan-result-info {
        flex: 1;
        min-width: 220px;
    }

    .scan-result-kicker {
        font-size: 11px;
        font-weight: 800;
        color: #a7f3d0;
        text-transform: uppercase;
        letter-spacing: 0.08em;
        margin-bottom: 8px;
    }

    .scan-result-info h4 {
        margin: 0 0 6px;
        font-size: 22px;
        font-weight: 800;
        color: #fff;
    }

    .scan-result-info p {
        margin: 0;
        color: rgba(226, 232, 240, 0.8);
        font-size: 13px;
    }

    .scan-result-meta {
        display: flex;
        gap: 10px;
        flex-wrap: wrap;
        align-items: center;
        margin-top: 12px;
    }

    .status-pill {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        border-radius: 999px;
        border: 1px solid rgba(255,255,255,0.2);
        padding: 5px 12px;
        font-weight: 700;
        font-size: 12px;
        line-height: 1.2;
    }

    .status-pill.danger {
        background: rgba(239, 68, 68, 0.14);
        color: #fecaca;
        border-color: rgba(248, 113, 113, 0.38);
    }

    .scan-result-actions {
        display: flex;
        gap: 10px;
        flex-wrap: wrap;
        align-items: center;
        justify-content: flex-end;
    }

    .scan-action-btn {
        padding: 11px 18px;
        border-radius: 12px;
        font-size: 13px;
        font-weight: 700;
        min-height: 44px;
    }

    .scan-action-btn.success {
        background: linear-gradient(135deg, #10b981, #059669);
        color: #fff;
        box-shadow: 0 12px 24px rgba(16, 185, 129, 0.22);
    }

    .scan-action-btn.success:hover { color: #fff; }

    .scan-action-btn.danger {
        background: linear-gradient(135deg, #ef4444, #dc2626);
        color: #fff;
        box-shadow: 0 12px 24px rgba(239, 68, 68, 0.2);
    }

    .scan-action-btn.danger:hover { color: #fff; }

    .scan-action-btn.info {
        background: linear-gradient(135deg, #3b82f6, #2563eb);
        color: #fff;
        box-shadow: 0 12px 24px rgba(59, 130, 246, 0.2);
    }

    .scan-action-btn.info:hover { color: #fff; }

    @media (max-width: 640px) {
        .scanner-shell {
            padding: 18px 16px;
            border-radius: 18px;
        }

        .scanner-form {
            display: grid;
            grid-template-columns: 1fr;
        }

        .scanner-primary-btn,
        .scanner-secondary-btn,
        .scanner-reset-btn {
            width: 100%;
        }

        .scan-result-card {
            padding: 16px;
        }

        .scan-result-actions {
            width: 100%;
            justify-content: stretch;
        }

        .scan-result-actions a {
            flex: 1 1 100%;
        }
    }
</style>

<script src="https://cdn.jsdelivr.net/npm/html5-qrcode@2.3.8/minified/html5-qrcode.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/html5-qrcode/2.3.8/html5-qrcode.min.js"></script>
<script>
(function () {
    const scanInput = document.getElementById('scanInput');
    const cameraButton = document.getElementById('cameraScanButton');
    const scanForm = document.getElementById('scanForm');
    const scannerContainer = document.getElementById('scannerContainer');
    const scannerStatus = document.getElementById('scannerStatus');
    const stopScannerButton = document.getElementById('stopScannerButton');
    const scannerReader = document.getElementById('scannerReader');

    let html5QrCode = null;
    let scannerActive = false;

    function stopScanner() {
        if (!html5QrCode) return;
        html5QrCode.stop().then(() => {
            scannerContainer.style.display = 'none';
            stopScannerButton.style.display = 'none';
            scannerActive = false;
            scannerStatus.textContent = 'Kamera berhenti.';
        }).catch(() => {
            scannerContainer.style.display = 'none';
            stopScannerButton.style.display = 'none';
            scannerActive = false;
        });
    }

    function onScanSuccess(decodedText) {
        const value = decodedText.trim();
        if (!value) return;
        if (scanInput) scanInput.value = value;
        if (scanForm) scanForm.submit();
    }

    function startScanner() {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            scannerStatus.textContent = 'Browser ini tidak bisa akses kamera. Gunakan input manual.';
            scannerContainer.style.display = 'block';
            return;
        }

        if (!window.Html5Qrcode) {
            scannerStatus.textContent = 'Scanner kamera belum dimuat. Silakan refresh halaman atau pakai input manual.';
            scannerContainer.style.display = 'block';
            return;
        }

        if (scannerActive && html5QrCode) {
            return;
        }

        scannerContainer.style.display = 'block';
        stopScannerButton.style.display = 'inline-flex';
        scannerStatus.textContent = 'Meminta izin kamera...';
        html5QrCode = new Html5Qrcode(scannerReader.id);

        html5QrCode.start(
            { facingMode: { ideal: 'environment' } },
            { fps: 10, qrbox: { width: 240, height: 240 }, aspectRatio: 1 },
            (decodedText) => {
                scannerStatus.textContent = 'Barcode terdeteksi: ' + decodedText;
                onScanSuccess(decodedText);
            },
            (errorMessage) => {
                if (typeof errorMessage === 'string' && errorMessage.indexOf('NotFoundException') === -1) {
                    scannerStatus.textContent = 'Mencari barcode...';
                }
            }
        ).then(() => {
            scannerActive = true;
            scannerStatus.textContent = 'Scanner aktif — arahkan barcode ke kamera';
        }).catch((error) => {
            console.error('Scanner error:', error);
            scannerStatus.textContent = 'Kamera tidak bisa dibuka. Klik tombol Kamera lagi setelah izin browser disetujui.';
            scannerContainer.style.display = 'block';
            stopScannerButton.style.display = 'none';
            scannerActive = false;
            html5QrCode = null;
        });
    }

    if (cameraButton) {
        cameraButton.addEventListener('click', function () {
            startScanner();
        });
    }

    if (stopScannerButton) {
        stopScannerButton.addEventListener('click', stopScanner);
    }
})();
</script>
