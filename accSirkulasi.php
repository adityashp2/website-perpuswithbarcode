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
            <button type="button" id="fileScanButton" class="scanner-secondary-btn" style="background:rgba(99,102,241,0.14);border-color:rgba(129,140,248,0.3);color:#e0e7ff;">
                <i class='bx bx-image'></i> Scan File/Foto
            </button>
            <input type="file" id="barcodeFileInput" accept="image/*" style="display:none;">

            <?php if ($scan_isbn): ?>
                <a href="index.php?pg=acc<?= $admin_query_str ?>&tab=<?= htmlspecialchars($active_tab ?? 'pending') ?>" class="scanner-reset-btn">
                    <i class='bx bx-x'></i> Reset
                </a>
            <?php endif; ?>
        </form>

        <div id="scannerContainer" class="scanner-camera-panel" style="display:none;">
            <div class="scanner-camera-frame">
                <div class="scanner-camera-header" style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px; flex-wrap:wrap; gap:8px;">
                    <div style="display:flex; align-items:center; gap:6px; color:#e2e8f0; font-size:13px; font-weight:600;">
                        <i class='bx bx-video'></i> Pemindai Barcode
                    </div>
                    <div style="display:flex; align-items:center; gap:8px;">
                        <select id="cameraDeviceSelect" class="scanner-device-select" style="display:none; background:#0f172a; color:#f1f5f9; border:1px solid rgba(255,255,255,0.2); border-radius:8px; padding:4px 8px; font-size:12px; max-width:200px;">
                        </select>
                        <button type="button" id="stopScannerButton" class="btn btn-secondary btn-sm" style="display:none; padding:4px 10px; font-size:12px;">
                            <i class='bx bx-stop-circle'></i> Tutup
                        </button>
                    </div>
                </div>
                <div id="scannerReader" class="scanner-reader"></div>
                <div class="scanner-camera-footer" style="flex-direction:column; align-items:flex-start;">
                    <div id="scannerStatus">Siap memindai barcode / ISBN</div>
                    <div id="scannerHelpNotice" style="display:none; width:100%; margin-top:8px; padding:10px 14px; border-radius:8px; font-size:12px; line-height:1.5;"></div>
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
                    'PENDING'  => ['Menunggu ACC Pinjam', '#d8b45f', 'acc'],
                    'DIPINJAM' => ['Sedang Dipinjam', '#7fb894', 'dipinjam'],
                    'KEMBALI'  => ['Menunggu ACC Kembali', '#8fb3cf', 'kembali'],
                ];
                [$status_label, $status_color, $tab_hint] = $status_map[$sr['status']] ?? ['—', '#fff', 'pending'];
            ?>
            <div class="scan-result-card success">
                <div class="scan-result-info">
                    <div class="scan-result-kicker"><i class='bx bx-check'></i> Buku ditemukan &middot; Peminjaman #<?= $sr['id_pinjam'] ?></div>
                    <h4><?= htmlspecialchars($sr['nama_anggota']) ?></h4>
                    <p><?= htmlspecialchars($sr['daftar_buku'] ?? '-') ?></p>
                    <div class="scan-result-meta">
                        <span class="status-pill" style="background:<?= $status_color ?>20; color:<?= $status_color ?>; border-color:<?= $status_color ?>40;">
                           <?= $status_label ?>
                        </span>
                        <?php if ($sr['est_denda'] > 0): ?>
                           <span class="status-pill danger"><i class='bx bx-error'></i> Denda Est: <?= rupiah($sr['est_denda']) ?> (<?= $sr['late_days'] ?> hari)</span>
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
        background: var(--sidebar-bg);
        border: 1px solid rgba(244, 234, 217, 0.14);
        border-radius: 18px;
        padding: 24px;
        margin-bottom: 24px;
        color: #fff;
        overflow: hidden;
        position: relative;
    }
 
    .scanner-shell::before {
        content: "";
        position: absolute;
        top: 0;
        left: 0;
        bottom: 0;
        width: 4px;
        background: var(--secondary);
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
        background: rgba(160, 106, 40, 0.22);
        border: 1px solid rgba(216, 180, 95, 0.35);
        border-radius: 14px;
        font-size: 26px;
        color: #f4ead9;
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
        color: #d8b45f;
    }
 
    .scanner-input-wrap input {
        width: 100%;
        padding: 14px 18px 14px 48px;
        border-radius: 14px;
        border: 1px solid rgba(244, 234, 217, 0.3);
        background: rgba(255, 255, 255, 0.06);
        color: #f8fafc;
        font-size: 14px;
        font-family: 'Inter', sans-serif;
        font-weight: 700;
        outline: none;
        box-shadow: inset 0 1px 2px rgba(15, 23, 42, 0.2);
        transition: all 0.2s ease;
    }
 
    .scanner-input-wrap input::placeholder {
        color: rgba(148, 163, 184, 0.9);
    }
 
    .scanner-input-wrap input:focus {
        border-color: rgba(216, 180, 95, 0.7);
        background: rgba(255, 255, 255, 0.09);
        box-shadow: 0 0 0 3px rgba(216, 180, 95, 0.18);
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
        background: var(--secondary);
        color: #fff;
        padding: 14px 18px;
    }
 
    .scanner-primary-btn:hover {
        background: var(--secondary-hover);
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
        border: 1px solid rgba(244, 234, 217, 0.3);
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
        color: #cfe3d5;
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
 
<!-- Load Html5Qrcode (Local first for offline support, CDN as fallback) -->
<script src="assets/js/html5-qrcode.min.js"></script>
<script>
    if (typeof Html5Qrcode === 'undefined') {
        document.write('<script src="https://unpkg.com/html5-qrcode@2.3.8/html5-qrcode.min.js"><\/script>');
    }
</script>
<script>
(function () {
    const scanInput = document.getElementById('scanInput');
    const cameraButton = document.getElementById('cameraScanButton');
    const fileButton = document.getElementById('fileScanButton');
    const fileInput = document.getElementById('barcodeFileInput');
    const scanForm = document.getElementById('scanForm');
    const scannerContainer = document.getElementById('scannerContainer');
    const scannerStatus = document.getElementById('scannerStatus');
    const scannerHelpNotice = document.getElementById('scannerHelpNotice');
    const stopScannerButton = document.getElementById('stopScannerButton');
    const scannerReader = document.getElementById('scannerReader');
    const cameraDeviceSelect = document.getElementById('cameraDeviceSelect');

    let html5QrCode = null;
    let scannerActive = false;
    let scannerStarting = false;
    let availableCameras = [];

    function showStatus(message, type = 'info', helpHtml = '') {
        if (scannerStatus) {
            scannerStatus.innerHTML = message;
        }
        if (scannerHelpNotice) {
            if (helpHtml) {
                scannerHelpNotice.style.display = 'block';
                scannerHelpNotice.style.background = type === 'error' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(59, 130, 246, 0.15)';
                scannerHelpNotice.style.border = type === 'error' ? '1px solid rgba(239, 68, 68, 0.3)' : '1px solid rgba(59, 130, 246, 0.3)';
                scannerHelpNotice.style.color = type === 'error' ? '#fca5a5' : '#93c5fd';
                scannerHelpNotice.innerHTML = helpHtml;
            } else {
                scannerHelpNotice.style.display = 'none';
                scannerHelpNotice.innerHTML = '';
            }
        }
    }

    function stopScanner() {
        if (!html5QrCode) {
            scannerContainer.style.display = 'none';
            if (stopScannerButton) stopScannerButton.style.display = 'none';
            if (cameraDeviceSelect) cameraDeviceSelect.style.display = 'none';
            scannerActive = false;
            scannerStarting = false;
            return;
        }

        const cleanup = () => {
            try { html5QrCode.clear(); } catch (e) {}
            scannerContainer.style.display = 'none';
            if (stopScannerButton) stopScannerButton.style.display = 'none';
            if (cameraDeviceSelect) cameraDeviceSelect.style.display = 'none';
            scannerActive = false;
            scannerStarting = false;
            showStatus('Kamera dinonaktifkan.');
        };

        if (scannerActive) {
            html5QrCode.stop().then(cleanup).catch(cleanup);
        } else {
            cleanup();
        }
    }

    function onScanSuccess(decodedText) {
        const value = decodedText.trim();
        if (!value) return;
        if (scanInput) scanInput.value = value;
        showStatus('Barcode terdeteksi: <strong>' + value + '</strong>. Memuat data...');
        if (navigator.vibrate) {
            try { navigator.vibrate(100); } catch(e) {}
        }
        setTimeout(() => {
            if (scanForm) scanForm.submit();
        }, 300);
    }

    async function startScanner(preferredCameraId = null) {
        if (scannerActive || scannerStarting) {
            stopScanner();
            return;
        }

        scannerContainer.style.display = 'block';
        if (stopScannerButton) stopScannerButton.style.display = 'inline-flex';
        showStatus('Memeriksa izin dan perangkat kamera...', 'info');

        // Check if browser context is secure or localhost
        const isLocal = ['localhost', '127.0.0.1'].includes(location.hostname);
        const isHttps = location.protocol === 'https:';

        if (!isLocal && !isHttps) {
            const localhostUrl = location.href.replace(location.origin, 'http://localhost/web-perpustakaan');
            showStatus('Akses Kamera Dibatasi Browser (Protokol HTTP Non-Localhost)', 'error', 
                '<strong>Penyebab:</strong> Browser modern (Chrome/Edge/Firefox) secara otomatis memblokir akses kamera jika situs dibuka tanpa HTTPS atau bukan localhost.<br><br>' +
                '<strong>Solusi Mudah:</strong><br>' +
                '&bull; <a href="' + localhostUrl + '" style="color:#67e8f9;text-decoration:underline;font-weight:bold;">Klik di sini untuk buka halaman ini via localhost</a> (izin kamera akan langsung aktif)<br>' +
                '&bull; Atau gunakan tombol <strong>"Scan File/Foto"</strong> untuk scan gambar barcode tanpa perlu akses webcam langsung.<br>' +
                '&bull; Atau aktifkan SSL di Laragon (Menu &gt; Apache &gt; SSL &gt; Enabled).'
            );
            return;
        }

        if (typeof Html5Qrcode === 'undefined') {
            showStatus('Pustaka Scanner Belum Terload', 'error',
                'Pustaka scanner belum termuat. Silakan refresh halaman atau gunakan pencarian manual ISBN.');
            return;
        }

        scannerStarting = true;
        showStatus('Meminta izin kamera ke browser...', 'info');

        if (!html5QrCode) {
            html5QrCode = new Html5Qrcode(scannerReader.id);
        }

        try {
            // Get available camera devices
            try {
                availableCameras = await Html5Qrcode.getCameras();
            } catch (err) {
                console.warn('getCameras failed, will try facingMode:', err);
                availableCameras = [];
            }

            let selectedCameraConfig = null;

            if (availableCameras && availableCameras.length > 0) {
                if (cameraDeviceSelect) {
                    cameraDeviceSelect.innerHTML = '';
                    availableCameras.forEach((cam, index) => {
                        const opt = document.createElement('option');
                        opt.value = cam.id;
                        opt.textContent = cam.label || ('Kamera ' + (index + 1));
                        cameraDeviceSelect.appendChild(opt);
                    });
                    cameraDeviceSelect.style.display = 'inline-block';
                }

                if (preferredCameraId) {
                    selectedCameraConfig = preferredCameraId;
                    if (cameraDeviceSelect) cameraDeviceSelect.value = preferredCameraId;
                } else {
                    // Prefer environment/back camera if available
                    const backCam = availableCameras.find(c => 
                        c.label.toLowerCase().includes('back') || 
                        c.label.toLowerCase().includes('rear') || 
                        c.label.toLowerCase().includes('environment') ||
                        c.label.toLowerCase().includes('belakang')
                    );
                    const chosen = backCam || availableCameras[0];
                    selectedCameraConfig = chosen.id;
                    if (cameraDeviceSelect) cameraDeviceSelect.value = chosen.id;
                }
            } else {
                selectedCameraConfig = { facingMode: "environment" };
                if (cameraDeviceSelect) cameraDeviceSelect.style.display = 'none';
            }

            const scanConfig = {
                fps: 15,
                qrbox: { width: 260, height: 180 },
                aspectRatio: 1.333333
            };

            const qrSuccess = (decodedText) => {
                onScanSuccess(decodedText);
            };

            const qrError = (errorMessage) => {};

            try {
                await html5QrCode.start(selectedCameraConfig, scanConfig, qrSuccess, qrError);
                scannerActive = true;
                scannerStarting = false;
                showStatus('Kamera aktif — arahkan barcode buku ke kotak pemindai');
            } catch (startErr) {
                console.warn('First start attempt failed, trying fallback...', startErr);
                // Fallback attempt with generic/user facing mode
                await html5QrCode.start({ facingMode: "user" }, scanConfig, qrSuccess, qrError);
                scannerActive = true;
                scannerStarting = false;
                showStatus('Kamera aktif — arahkan barcode buku ke kotak pemindai');
            }

        } catch (error) {
            console.error('Scanner start error:', error);
            scannerActive = false;
            scannerStarting = false;

            const errStr = String(error && error.message ? error.message : error);
            let userMsg = 'Gagal mengakses kamera.';
            let helpText = '';

            if (errStr.includes('NotAllowedError') || errStr.includes('Permission') || errStr.includes('PermissionDeniedError')) {
                userMsg = 'Izin Akses Kamera Ditolak / Belum Diizinkan Browser.';
                helpText = '<strong>Cara Mengaktifkan Izin Kamera di Browser:</strong><br>' +
                    '1. Klik ikon <strong>Gembok 🔒</strong> atau <strong>Setelan Situs ⚙️</strong> di sebelah kiri kotak alamat URL browser.<br>' +
                    '2. Ubah izin <strong>Camera / Kamera</strong> menjadi <strong>Allow / Izinkan</strong>.<br>' +
                    '3. Muat ulang (refresh) halaman ini lalu klik tombol Kamera lagi.<br><br>' +
                    '<em>Tip alternatif: Anda juga dapat menggunakan tombol <strong>"Scan File/Foto"</strong> untuk scan gambar barcode tanpa perlu webcam.</em>';
            } else if (errStr.includes('NotFoundError') || errStr.includes('DevicesNotFoundError')) {
                userMsg = 'Perangkat Kamera Tidak Ditemukan.';
                helpText = 'Pastikan perangkat/laptop Anda memiliki webcam yang terhubung dan tidak dinonaktifkan.';
            } else if (errStr.includes('NotReadableError') || errStr.includes('TrackStartError')) {
                userMsg = 'Kamera Sedang Digunakan Aplikasi Lain.';
                helpText = 'Tutup aplikasi lain yang sedang memakai webcam (seperti Zoom, Google Meet, OBS, Camera Windows), lalu coba lagi.';
            } else if (errStr.includes('OverconstrainedError')) {
                userMsg = 'Kamera yang dipilih tidak mendukung konfigurasi ini.';
                helpText = 'Coba pilih kamera lain pada dropdown pilihan kamera di atas.';
            } else {
                userMsg = 'Kamera tidak dapat dibuka: ' + errStr;
                helpText = 'Pastikan izin kamera sudah diberikan di browser Anda atau gunakan tombol <strong>Scan File/Foto</strong>.';
            }

            showStatus(userMsg, 'error', helpText);
        }
    }

    // Camera Switch Event
    if (cameraDeviceSelect) {
        cameraDeviceSelect.addEventListener('change', function () {
            const chosenId = this.value;
            if (scannerActive) {
                html5QrCode.stop().then(() => {
                    scannerActive = false;
                    startScanner(chosenId);
                }).catch(() => {
                    scannerActive = false;
                    startScanner(chosenId);
                });
            }
        });
    }

    // Image File Scan handler
    if (fileButton && fileInput) {
        fileButton.addEventListener('click', function () {
            fileInput.click();
        });

        fileInput.addEventListener('change', async function (e) {
            if (!e.target.files || e.target.files.length === 0) return;
            const imageFile = e.target.files[0];
            
            scannerContainer.style.display = 'block';
            showStatus('Memindai gambar barcode...', 'info');

            if (!html5QrCode) {
                html5QrCode = new Html5Qrcode(scannerReader.id);
            }

            try {
                if (scannerActive) {
                    await html5QrCode.stop();
                    scannerActive = false;
                }
                const decodedText = await html5QrCode.scanFile(imageFile, true);
                showStatus('Barcode terdeteksi: <strong>' + decodedText + '</strong>');
                onScanSuccess(decodedText);
            } catch (err) {
                console.error('File scan error:', err);
                showStatus('Gagal membaca barcode dari gambar.', 'error',
                    'Barcode tidak terbaca pada gambar. Pastikan foto barcode jelas, fokus, dan tidak terpotong.');
            } finally {
                fileInput.value = '';
            }
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