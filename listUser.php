<?php
require_once __DIR__ . '/koneksi.php';

$user = get_current_user_data();
if (!$user || $user['type'] !== 'ADM') {
    set_flash('error', 'Hanya administrator yang dapat mengakses halaman manajemen pengguna.');
    header("Location: index.php?pg=notadmin");
    exit();
}

$admin_param     = $user['admin_id'];
$admin_query_str = "&admin=" . urlencode($admin_param);
$active_tab      = $_GET['tab'] ?? 'pending';
$search_query    = trim($_GET['q'] ?? '');
$search_esc      = db_escape($search_query);

// Filter search query
$search_where = "";
if ($search_query !== "") {
    $search_where = " AND (a.nama LIKE '%$search_esc%' OR a.email LIKE '%$search_esc%' OR a.telp LIKE '%$search_esc%' OR a.alamat LIKE '%$search_esc%' OR adm.username LIKE '%$search_esc%') ";
}

// Queries for counts
$count_pending  = (int)(db_fetch_one(db_query("SELECT COUNT(*) as c FROM anggota a LEFT JOIN admin adm ON a.id_admin = adm.id WHERE a.status_verifikasi = 'PENDING'"))['c'] ?? 0);
$count_verified = (int)(db_fetch_one(db_query("SELECT COUNT(*) as c FROM anggota a LEFT JOIN admin adm ON a.id_admin = adm.id WHERE a.status_verifikasi = 'TERVERIFIKASI' AND (adm.is_banned = 0 OR adm.is_banned IS NULL)"))['c'] ?? 0);
$count_banned   = (int)(db_fetch_one(db_query("SELECT COUNT(*) as c FROM anggota a LEFT JOIN admin adm ON a.id_admin = adm.id WHERE adm.is_banned = 1"))['c'] ?? 0);
$count_rejected = (int)(db_fetch_one(db_query("SELECT COUNT(*) as c FROM anggota a LEFT JOIN admin adm ON a.id_admin = adm.id WHERE a.status_verifikasi = 'DITOLAK'"))['c'] ?? 0);
$count_all      = (int)(db_fetch_one(db_query("SELECT COUNT(*) as c FROM anggota a LEFT JOIN admin adm ON a.id_admin = adm.id WHERE adm.type != 'ADM' OR adm.type IS NULL"))['c'] ?? 0);

// Base query builder
$query_sql = "
    SELECT 
        a.id_anggota, a.id_admin, a.nama, a.sex, a.telp, a.alamat, a.email, 
        a.tgl_entry, a.descripsi, a.foto, a.ktm_foto, a.status_verifikasi, a.catatan_verifikasi,
        adm.username, adm.type as adm_type, adm.is_banned, adm.banned_reason, adm.banned_at,
        (SELECT COUNT(*) FROM peminjaman p WHERE p.id_anggota = a.id_anggota AND p.status IN ('PENDING', 'DIPINJAM', 'KEMBALI')) as active_loans_count,
        (SELECT COUNT(*) FROM peminjaman p WHERE p.id_anggota = a.id_anggota) as total_loans_count
    FROM anggota a
    LEFT JOIN admin adm ON a.id_admin = adm.id
    WHERE (adm.type != 'ADM' OR adm.type IS NULL)
";

if ($active_tab === 'pending') {
    $query_sql .= " AND a.status_verifikasi = 'PENDING' " . $search_where . " ORDER BY a.id_anggota DESC";
} elseif ($active_tab === 'verified') {
    $query_sql .= " AND a.status_verifikasi = 'TERVERIFIKASI' AND (adm.is_banned = 0 OR adm.is_banned IS NULL) " . $search_where . " ORDER BY a.id_anggota DESC";
} elseif ($active_tab === 'banned') {
    $query_sql .= " AND adm.is_banned = 1 " . $search_where . " ORDER BY adm.banned_at DESC, a.id_anggota DESC";
} elseif ($active_tab === 'rejected') {
    $query_sql .= " AND a.status_verifikasi = 'DITOLAK' " . $search_where . " ORDER BY a.id_anggota DESC";
} else { // 'all'
    $query_sql .= " " . $search_where . " ORDER BY a.id_anggota DESC";
}

$user_list = db_fetch_all(db_query($query_sql));

function get_ktm_url($filename) {
    if (!empty($filename) && file_exists(__DIR__ . '/ktm_uploads/' . $filename)) {
        return 'ktm_uploads/' . htmlspecialchars($filename);
    }
    return '';
}

function get_avatar_url($filename) {
    if (!empty($filename) && file_exists(__DIR__ . '/foto_profile/' . $filename)) {
        return 'foto_profile/' . htmlspecialchars($filename);
    }
    return '';
}
?>

<div class="user-mgmt-header">
    <div class="page-header-info">
        <h1><i class='bx bxs-user-detail' style="color:var(--primary);"></i> Kelola Pengguna & Pendaftaran</h1>
        <p>Kelola verifikasi pendaftaran anggota baru, penolakan, pemblokiran (banned), hingga penghapusan akun anggota perpustakaan.</p>
    </div>
    <div class="header-stats-row">
        <?php if ($count_pending > 0): ?>
            <a href="index.php?pg=user<?= $admin_query_str ?>&tab=pending" class="header-stat-pill pulse-pill">
                <i class='bx bx-bell'></i> <?= $count_pending ?> Menunggu ACC
            </a>
        <?php endif; ?>
        <?php if ($count_banned > 0): ?>
            <a href="index.php?pg=user<?= $admin_query_str ?>&tab=banned" class="header-stat-pill danger-pill">
                <i class='bx bx-block'></i> <?= $count_banned ?> Di-Banned
            </a>
        <?php endif; ?>
    </div>
</div>

<!-- Tabs Navigation -->
<div class="user-tabs-bar">
    <div class="user-tabs-list">
        <a href="index.php?pg=user<?= $admin_query_str ?>&tab=pending" class="user-tab-item <?= $active_tab === 'pending' ? 'active' : '' ?>">
            <i class='bx bx-time-five'></i>
            <span>Menunggu ACC</span>
            <span class="tab-badge <?= $count_pending > 0 ? 'badge-warn' : '' ?>"><?= $count_pending ?></span>
        </a>
        <a href="index.php?pg=user<?= $admin_query_str ?>&tab=verified" class="user-tab-item <?= $active_tab === 'verified' ? 'active' : '' ?>">
            <i class='bx bx-check-shield'></i>
            <span>Anggota Aktif</span>
            <span class="tab-badge"><?= $count_verified ?></span>
        </a>
        <a href="index.php?pg=user<?= $admin_query_str ?>&tab=banned" class="user-tab-item <?= $active_tab === 'banned' ? 'active' : '' ?>">
            <i class='bx bx-block'></i>
            <span>Di-Banned</span>
            <span class="tab-badge <?= $count_banned > 0 ? 'badge-danger' : '' ?>"><?= $count_banned ?></span>
        </a>
        <a href="index.php?pg=user<?= $admin_query_str ?>&tab=rejected" class="user-tab-item <?= $active_tab === 'rejected' ? 'active' : '' ?>">
            <i class='bx bx-x-circle'></i>
            <span>Ditolak</span>
            <span class="tab-badge"><?= $count_rejected ?></span>
        </a>
        <a href="index.php?pg=user<?= $admin_query_str ?>&tab=all" class="user-tab-item <?= $active_tab === 'all' ? 'active' : '' ?>">
            <i class='bx bx-group'></i>
            <span>Semua Pengguna</span>
            <span class="tab-badge"><?= $count_all ?></span>
        </a>
    </div>

    <!-- Search Form -->
    <form method="GET" action="index.php" class="user-search-form">
        <input type="hidden" name="pg" value="user">
        <input type="hidden" name="admin" value="<?= htmlspecialchars($admin_param) ?>">
        <input type="hidden" name="tab" value="<?= htmlspecialchars($active_tab) ?>">
        <div class="search-input-wrap">
            <i class='bx bx-search'></i>
            <input type="text" name="q" value="<?= htmlspecialchars($search_query) ?>" placeholder="Cari nama, username, email...">
            <?php if ($search_query !== ''): ?>
                <a href="index.php?pg=user<?= $admin_query_str ?>&tab=<?= htmlspecialchars($active_tab) ?>" class="search-clear-btn" title="Hapus Pencarian">
                    <i class='bx bx-x'></i>
                </a>
            <?php endif; ?>
        </div>
        <button type="submit" class="btn btn-secondary btn-sm" style="font-weight:600;">Cari</button>
    </form>
</div>

<!-- Content Area -->
<?php if (empty($user_list)): ?>
    <div class="empty-state-card">
        <div class="empty-icon"><i class='bx bx-user-x'></i></div>
        <h3>Tidak Ada Data Pengguna</h3>
        <p>
            <?php if ($search_query !== ''): ?>
                Tidak ditemukan pengguna yang cocok dengan kata kunci "<strong><?= htmlspecialchars($search_query) ?></strong>".
                <br><a href="index.php?pg=user<?= $admin_query_str ?>&tab=<?= htmlspecialchars($active_tab) ?>" class="btn btn-secondary btn-sm" style="margin-top:10px;">Reset Pencarian</a>
            <?php else: ?>
                <?php
                    $empty_msgs = [
                        'pending'  => 'Tidak ada pendaftaran anggota baru yang sedang menunggu verifikasi KTM.',
                        'verified' => 'Belum ada anggota yang terverifikasi aktif.',
                        'banned'   => 'Tidak ada akun anggota yang sedang di-banned / diblokir.',
                        'rejected' => 'Tidak ada pendaftaran yang berstatus ditolak.',
                        'all'      => 'Belum ada data anggota yang terdaftar di sistem perpustakaan.'
                    ];
                    echo $empty_msgs[$active_tab] ?? 'Tidak ada data.';
                ?>
            <?php endif; ?>
        </p>
    </div>
<?php else: ?>

    <?php if ($active_tab === 'pending'): ?>
        <!-- GRID CARD VIEW FOR PENDING VERIFICATION -->
        <div class="pending-user-grid">
            <?php foreach ($user_list as $u): ?>
                <?php
                    $ktm_url = get_ktm_url($u['ktm_foto']);
                    $avatar_url = get_avatar_url($u['foto']);
                ?>
                <div class="pending-card">
                    <div class="pending-card-head">
                        <div class="user-meta-top">
                            <div class="avatar-circle">
                                <?php if ($avatar_url): ?>
                                    <img src="<?= $avatar_url ?>" alt="Avatar">
                                <?php else: ?>
                                    <span><?= strtoupper(substr($u['nama'] ?: 'U', 0, 1)) ?></span>
                                <?php endif; ?>
                            </div>
                            <div>
                                <h3 class="user-title"><?= htmlspecialchars($u['nama']) ?></h3>
                                <div class="user-subtitle">
                                    <i class='bx bx-user'></i> <?= htmlspecialchars($u['username'] ?: '—') ?> &middot; ID #<?= $u['id_anggota'] ?>
                                </div>
                            </div>
                        </div>
                        <span class="status-pill status-pending"><i class='bx bx-time'></i> Menunggu ACC</span>
                    </div>

                    <div class="pending-card-body">
                        <!-- KTM Image Box -->
                        <div class="ktm-preview-box">
                            <div class="ktm-preview-label"><i class='bx bxs-id-card'></i> Foto Kartu Tanda Mahasiswa (KTM)</div>
                            <?php if ($ktm_url): ?>
                                <div class="ktm-thumb-wrapper" onclick="openKtmModal('<?= $ktm_url ?>', '<?= htmlspecialchars(addslashes($u['nama'])) ?>', '<?= htmlspecialchars(addslashes($u['username'])) ?>')">
                                    <img src="<?= $ktm_url ?>" alt="KTM <?= htmlspecialchars($u['nama']) ?>">
                                    <div class="ktm-overlay-zoom">
                                        <i class='bx bx-zoom-in'></i> Klik untuk Memperbesar
                                    </div>
                                </div>
                            <?php else: ?>
                                <div class="ktm-empty-box">
                                    <i class='bx bx-image-alt'></i>
                                    <span>Foto KTM Tidak Tersedia / Hilang</span>
                                </div>
                            <?php endif; ?>
                        </div>

                        <!-- Details list -->
                        <div class="user-details-list">
                            <div class="detail-row">
                                <span class="label"><i class='bx bx-envelope'></i> Email:</span>
                                <span class="value"><?= htmlspecialchars($u['email'] ?: '—') ?></span>
                            </div>
                            <div class="detail-row">
                                <span class="label"><i class='bx bx-phone'></i> Telepon:</span>
                                <span class="value"><?= htmlspecialchars($u['telp'] ?: '—') ?></span>
                            </div>
                            <div class="detail-row">
                                <span class="label"><i class='bx bx-map'></i> Alamat:</span>
                                <span class="value"><?= htmlspecialchars($u['alamat'] ?: '—') ?></span>
                            </div>
                            <div class="detail-row">
                                <span class="label"><i class='bx bx-calendar'></i> Tanggal Daftar:</span>
                                <span class="value"><?= tgl_indo($u['tgl_entry']) ?></span>
                            </div>
                        </div>
                    </div>

                    <div class="pending-card-footer">
                        <a href="manageUserAction.php?aksi=acc&id_anggota=<?= $u['id_anggota'] ?>&tab=pending<?= $admin_query_str ?>" 
                           class="btn btn-success"
                           onclick="return confirm('Setujui verifikasi pendaftaran untuk <?= htmlspecialchars(addslashes($u['nama'])) ?>? Akun akan langsung aktif untuk meminjam buku.');">
                            <i class='bx bx-check'></i> ACC / Setujui
                        </a>
                        <button type="button" class="btn btn-warning" onclick="openRejectModal(<?= $u['id_anggota'] ?>, '<?= htmlspecialchars(addslashes($u['nama'])) ?>', 'pending')">
                            <i class='bx bx-x'></i> Tolak
                        </button>
                        <button type="button" class="btn btn-danger" onclick="openDeleteModal(<?= $u['id_anggota'] ?>, '<?= htmlspecialchars(addslashes($u['nama'])) ?>', 'pending', <?= $u['active_loans_count'] ?>)">
                            <i class='bx bx-trash'></i> Hapus
                        </button>
                    </div>
                </div>
            <?php endforeach; ?>
        </div>

    <?php else: ?>
        <!-- TABLE VIEW FOR VERIFIED, BANNED, REJECTED, ALL -->
        <div class="card user-table-card">
            <div class="table-responsive">
                <table class="table user-table">
                    <thead>
                        <tr>
                            <th width="40">#</th>
                            <th>Anggota / Pengguna</th>
                            <th>Kontak & Alamat</th>
                            <th>Status Akun</th>
                            <th>Peminjaman</th>
                            <th>KTM</th>
                            <th width="190" style="text-align:right;">Aksi & Kelola</th>
                        </tr>
                    </thead>
                    <tbody>
                        <?php $no = 1; foreach ($user_list as $u): ?>
                            <?php
                                $ktm_url = get_ktm_url($u['ktm_foto']);
                                $avatar_url = get_avatar_url($u['foto']);
                                $is_banned = !empty($u['is_banned']);
                            ?>
                            <tr class="<?= $is_banned ? 'row-banned' : '' ?>">
                                <td><?= $no++ ?></td>
                                <td>
                                    <div class="user-inline-cell">
                                        <div class="avatar-circle-sm">
                                            <?php if ($avatar_url): ?>
                                                <img src="<?= $avatar_url ?>" alt="Avatar">
                                            <?php else: ?>
                                                <span><?= strtoupper(substr($u['nama'] ?: 'U', 0, 1)) ?></span>
                                            <?php endif; ?>
                                        </div>
                                        <div>
                                            <div class="user-name-text">
                                                <strong><?= htmlspecialchars($u['nama']) ?></strong>
                                                <?php if ($is_banned): ?>
                                                    <span class="badge-banned-mini"><i class='bx bx-block'></i> BANNED</span>
                                                <?php endif; ?>
                                            </div>
                                            <div class="user-meta-sub">
                                                <span><i class='bx bx-user'></i> <?= htmlspecialchars($u['username'] ?: '—') ?></span>
                                                <span>&bull;</span>
                                                <span>ID #<?= $u['id_anggota'] ?></span>
                                                <span>&bull;</span>
                                                <span>Daftar: <?= tgl_indo($u['tgl_entry']) ?></span>
                                            </div>
                                        </div>
                                    </div>
                                </td>
                                <td>
                                    <div class="contact-info-cell">
                                        <div><i class='bx bx-envelope'></i> <?= htmlspecialchars($u['email'] ?: '—') ?></div>
                                        <div><i class='bx bx-phone'></i> <?= htmlspecialchars($u['telp'] ?: '—') ?></div>
                                        <div class="address-muted" title="<?= htmlspecialchars($u['alamat'] ?: '') ?>">
                                            <i class='bx bx-map'></i> <?= htmlspecialchars($u['alamat'] ?: '—') ?>
                                        </div>
                                    </div>
                                </td>
                                <td>
                                    <?php if ($is_banned): ?>
                                        <div class="status-pill status-banned" title="Alasan: <?= htmlspecialchars($u['banned_reason'] ?: 'Pelanggaran aturan') ?>">
                                            <i class='bx bx-block'></i> Di-Banned
                                        </div>
                                        <div class="reason-note-danger">
                                            <?= htmlspecialchars($u['banned_reason'] ?: 'Akun diblokir') ?>
                                        </div>
                                    <?php elseif ($u['status_verifikasi'] === 'TERVERIFIKASI'): ?>
                                        <div class="status-pill status-verified">
                                            <i class='bx bx-check-shield'></i> Terverifikasi
                                        </div>
                                    <?php elseif ($u['status_verifikasi'] === 'PENDING'): ?>
                                        <div class="status-pill status-pending">
                                            <i class='bx bx-time'></i> Menunggu ACC
                                        </div>
                                    <?php elseif ($u['status_verifikasi'] === 'DITOLAK'): ?>
                                        <div class="status-pill status-rejected" title="<?= htmlspecialchars($u['catatan_verifikasi'] ?: '') ?>">
                                            <i class='bx bx-x-circle'></i> Ditolak
                                        </div>
                                        <?php if (!empty($u['catatan_verifikasi'])): ?>
                                            <div class="reason-note-warning">
                                                <?= htmlspecialchars($u['catatan_verifikasi']) ?>
                                            </div>
                                        <?php endif; ?>
                                    <?php endif; ?>
                                </td>
                                <td>
                                    <div style="font-size:12.5px;">
                                        <?php if ($u['active_loans_count'] > 0): ?>
                                            <span class="badge badge-warning" style="font-size:11.5px; font-weight:700;">
                                                <i class='bx bx-book-open'></i> <?= $u['active_loans_count'] ?> Aktif
                                            </span>
                                        <?php else: ?>
                                            <span style="color:#64748b; font-weight:500;">0 Aktif</span>
                                        <?php endif; ?>
                                        <div style="color:#64748b; font-size:11.5px; margin-top:2px;">
                                            Total: <?= $u['total_loans_count'] ?>x pinjam
                                        </div>
                                    </div>
                                </td>
                                <td>
                                    <?php if ($ktm_url): ?>
                                        <button type="button" class="btn btn-secondary btn-sm" style="padding:5px 10px; font-size:12px;" onclick="openKtmModal('<?= $ktm_url ?>', '<?= htmlspecialchars(addslashes($u['nama'])) ?>', '<?= htmlspecialchars(addslashes($u['username'])) ?>')">
                                            <i class='bx bx-image'></i> Lihat KTM
                                        </button>
                                    <?php else: ?>
                                        <span style="color:#94a3b8; font-size:11.5px;">Tidak ada</span>
                                    <?php endif; ?>
                                </td>
                                <td style="text-align:right;">
                                    <div class="action-buttons-group">
                                        <?php if ($u['status_verifikasi'] === 'PENDING'): ?>
                                            <a href="manageUserAction.php?aksi=acc&id_anggota=<?= $u['id_anggota'] ?>&tab=<?= $active_tab ?><?= $admin_query_str ?>" 
                                               class="btn-icon btn-icon-success" 
                                               title="ACC Pendaftaran"
                                               onclick="return confirm('ACC pendaftaran untuk <?= htmlspecialchars(addslashes($u['nama'])) ?>?');">
                                                <i class='bx bx-check'></i>
                                            </a>
                                            <button type="button" class="btn-icon btn-icon-warning" title="Tolak Pendaftaran" onclick="openRejectModal(<?= $u['id_anggota'] ?>, '<?= htmlspecialchars(addslashes($u['nama'])) ?>', '<?= $active_tab ?>')">
                                                <i class='bx bx-x'></i>
                                            </button>
                                        <?php elseif ($u['status_verifikasi'] === 'DITOLAK'): ?>
                                            <a href="manageUserAction.php?aksi=acc&id_anggota=<?= $u['id_anggota'] ?>&tab=<?= $active_tab ?><?= $admin_query_str ?>" 
                                               class="btn-icon btn-icon-success" 
                                               title="ACC / Pulihkan Status"
                                               onclick="return confirm('Verifikasi & ACC kembali anggota <?= htmlspecialchars(addslashes($u['nama'])) ?>?');">
                                                <i class='bx bx-check-shield'></i>
                                            </a>
                                        <?php endif; ?>

                                        <?php if ($is_banned): ?>
                                            <!-- Tombol Unban -->
                                            <a href="manageUserAction.php?aksi=unban&id_anggota=<?= $u['id_anggota'] ?>&tab=<?= $active_tab ?><?= $admin_query_str ?>" 
                                               class="btn-icon btn-icon-success" 
                                               title="Buka Blokir (Unban Akun)"
                                               onclick="return confirm('Buka blokir (Unban) untuk akun <?= htmlspecialchars(addslashes($u['nama'])) ?>?');">
                                                <i class='bx bx-lock-open'></i>
                                            </a>
                                        <?php else: ?>
                                            <!-- Tombol Ban -->
                                            <button type="button" class="btn-icon btn-icon-danger" title="Banned Akun Ini" onclick="openBanModal(<?= $u['id_anggota'] ?>, '<?= htmlspecialchars(addslashes($u['nama'])) ?>', '<?= $active_tab ?>')">
                                                <i class='bx bx-block'></i>
                                            </button>
                                        <?php endif; ?>

                                        <!-- Tombol Reset Password -->
                                        <a href="manageUserAction.php?aksi=reset_password&id_anggota=<?= $u['id_anggota'] ?>&tab=<?= $active_tab ?><?= $admin_query_str ?>" 
                                           class="btn-icon btn-icon-secondary" 
                                           title="Reset Password ke 12345678"
                                           onclick="return confirm('Reset password akun <?= htmlspecialchars(addslashes($u['username'])) ?> ke default (12345678)?');">
                                            <i class='bx bx-key'></i>
                                        </a>

                                        <!-- Tombol Hapus Akun -->
                                        <button type="button" class="btn-icon btn-icon-danger" title="Hapus Akun Anggota" onclick="openDeleteModal(<?= $u['id_anggota'] ?>, '<?= htmlspecialchars(addslashes($u['nama'])) ?>', '<?= $active_tab ?>', <?= $u['active_loans_count'] ?>)">
                                            <i class='bx bx-trash'></i>
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        <?php endforeach; ?>
                    </tbody>
                </table>
            </div>
        </div>
    <?php endif; ?>

<?php endif; ?>

<!-- ═══════════════════ MODALS ═══════════════════ -->

<!-- 1. Modal Preview KTM -->
<div id="ktmModal" class="user-modal-overlay" style="display:none;" onclick="if(event.target === this) closeKtmModal();">
    <div class="user-modal-box ktm-modal-box">
        <div class="user-modal-header">
            <div>
                <h3 id="ktmModalTitle"><i class='bx bxs-id-card' style="color:var(--primary);"></i> Foto Kartu Tanda Mahasiswa (KTM)</h3>
                <p id="ktmModalSubtitle" style="font-size:12px; color:#64748b; margin-top:2px;"></p>
            </div>
            <button type="button" class="modal-close-btn" onclick="closeKtmModal()">&times;</button>
        </div>
        <div class="user-modal-body text-center" style="padding:16px;">
            <div class="ktm-full-wrapper">
                <img id="ktmModalImg" src="" alt="Foto KTM">
            </div>
        </div>
        <div class="user-modal-footer">
            <a id="ktmDownloadBtn" href="" target="_blank" download class="btn btn-secondary btn-sm">
                <i class='bx bx-download'></i> Buka Tab Baru / Unduh
            </a>
            <button type="button" class="btn btn-primary btn-sm" onclick="closeKtmModal()">Tutup</button>
        </div>
    </div>
</div>

<!-- 2. Modal Tolak Pendaftaran -->
<div id="rejectModal" class="user-modal-overlay" style="display:none;" onclick="if(event.target === this) closeRejectModal();">
    <div class="user-modal-box">
        <form action="manageUserAction.php" method="POST">
            <input type="hidden" name="aksi" value="tolak">
            <input type="hidden" name="admin" value="<?= htmlspecialchars($admin_param) ?>">
            <input type="hidden" name="id_anggota" id="rejectIdAnggota" value="">
            <input type="hidden" name="tab" id="rejectTab" value="pending">

            <div class="user-modal-header">
                <div>
                    <h3 style="color:#d97706;"><i class='bx bx-x-circle'></i> Tolak Pendaftaran Anggota</h3>
                    <p id="rejectModalUser" style="font-size:12.5px; color:#64748b; margin-top:2px;"></p>
                </div>
                <button type="button" class="modal-close-btn" onclick="closeRejectModal()">&times;</button>
            </div>
            <div class="user-modal-body" style="padding:20px;">
                <label style="display:block; font-size:13px; font-weight:700; margin-bottom:6px; color:#1e293b;">
                    Alasan / Catatan Penolakan:
                </label>
                <textarea name="catatan" id="rejectCatatan" rows="3" class="form-control" 
                    placeholder="Contoh: Foto KTM buram tidak terbaca, mohon unggah ulang foto KTM yang jelas." 
                    style="width:100%; padding:10px 12px; background:#ffffff; border:1px solid #cbd5e1; border-radius:8px; color:#0f172a; font-size:13px;" required></textarea>
                <div style="font-size:12px; color:#64748b; margin-top:6px;">
                    Catatan ini akan tampil di profil anggota sehingga mereka tahu alasan penolakan dan dapat menghubungi petugas.
                </div>
            </div>
            <div class="user-modal-footer">
                <button type="button" class="btn btn-secondary btn-sm" onclick="closeRejectModal()">Batal</button>
                <button type="submit" class="btn btn-warning btn-sm">
                    <i class='bx bx-x'></i> Konfirmasi Tolak
                </button>
            </div>
        </form>
    </div>
</div>

<!-- 3. Modal Banned Akun -->
<div id="banModal" class="user-modal-overlay" style="display:none;" onclick="if(event.target === this) closeBanModal();">
    <div class="user-modal-box">
        <form action="manageUserAction.php" method="POST">
            <input type="hidden" name="aksi" value="ban">
            <input type="hidden" name="admin" value="<?= htmlspecialchars($admin_param) ?>">
            <input type="hidden" name="id_anggota" id="banIdAnggota" value="">
            <input type="hidden" name="tab" id="banTab" value="verified">

            <div class="user-modal-header">
                <div>
                    <h3 style="color:#dc2626;"><i class='bx bx-block'></i> Banned / Blokir Akun Pengguna</h3>
                    <p id="banModalUser" style="font-size:12.5px; color:#64748b; margin-top:2px;"></p>
                </div>
                <button type="button" class="modal-close-btn" onclick="closeBanModal()">&times;</button>
            </div>
            <div class="user-modal-body" style="padding:20px;">
                <div class="alert alert-danger" style="margin-bottom:15px; font-size:12.5px; padding:10px 14px;">
                    <i class='bx bx-error-circle' style="font-size:18px;"></i>
                    <div>Akun yang di-banned <strong>tidak akan bisa login</strong> ke sistem perpustakaan sampai administrator membuka blokir (unban).</div>
                </div>
                <label style="display:block; font-size:13px; font-weight:700; margin-bottom:6px; color:#1e293b;">
                    Alasan Pemblokiran (Banned):
                </label>
                <textarea name="alasan" id="banAlasan" rows="3" class="form-control" 
                    placeholder="Contoh: Terlambat mengembalikan buku lebih dari 30 hari tanpa konfirmasi / merusak buku perpustakaan." 
                    style="width:100%; padding:10px 12px; background:#ffffff; border:1px solid #cbd5e1; border-radius:8px; color:#0f172a; font-size:13px;" required></textarea>
            </div>
            <div class="user-modal-footer">
                <button type="button" class="btn btn-secondary btn-sm" onclick="closeBanModal()">Batal</button>
                <button type="submit" class="btn btn-danger btn-sm">
                    <i class='bx bx-block'></i> Banned Akun Ini
                </button>
            </div>
        </form>
    </div>
</div>

<!-- 4. Modal Hapus Akun -->
<div id="deleteModal" class="user-modal-overlay" style="display:none;" onclick="if(event.target === this) closeDeleteModal();">
    <div class="user-modal-box">
        <form action="manageUserAction.php" method="POST">
            <input type="hidden" name="aksi" value="delete">
            <input type="hidden" name="admin" value="<?= htmlspecialchars($admin_param) ?>">
            <input type="hidden" name="id_anggota" id="deleteIdAnggota" value="">
            <input type="hidden" name="tab" id="deleteTab" value="all">

            <div class="user-modal-header">
                <div>
                    <h3 style="color:#dc2626;"><i class='bx bx-trash'></i> Konfirmasi Hapus Akun</h3>
                    <p id="deleteModalUser" style="font-size:12.5px; color:#64748b; margin-top:2px;"></p>
                </div>
                <button type="button" class="modal-close-btn" onclick="closeDeleteModal()">&times;</button>
            </div>
            <div class="user-modal-body" style="padding:20px;">
                <div id="deleteLoanWarning" class="alert alert-danger" style="display:none; margin-bottom:15px; font-size:12.5px;">
                    <i class='bx bx-error'></i>
                    <div id="deleteLoanWarningText">Anggota ini masih memiliki transaksi peminjaman aktif. Hapus akun tidak diperbolehkan sebelum buku dikembalikan.</div>
                </div>
                <p style="font-size:13.5px; color:#334155; line-height:1.5;">
                    Apakah Anda yakin ingin menghapus akun anggota ini secara permanen? Seluruh data profil, kredensial login, dan file foto/KTM akan dihapus dari sistem. Tindakan ini <strong>tidak dapat dibatalkan</strong>.
                </p>
            </div>
            <div class="user-modal-footer">
                <button type="button" class="btn btn-secondary btn-sm" onclick="closeDeleteModal()">Batal</button>
                <button type="submit" id="deleteConfirmBtn" class="btn btn-danger btn-sm">
                    <i class='bx bx-trash'></i> Hapus Permanen
                </button>
            </div>
        </form>
    </div>
</div>

<style>
/* ═══════════════════ LIGHT THEME HIGH CONTRAST STYLES ═══════════════════ */
.user-mgmt-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    flex-wrap: wrap;
    gap: 16px;
    margin-bottom: 24px;
}

.header-stats-row {
    display: flex;
    gap: 10px;
    flex-wrap: wrap;
}

.header-stat-pill {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 8px 14px;
    border-radius: 99px;
    font-size: 13px;
    font-weight: 700;
    text-decoration: none;
    transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.pulse-pill {
    background: #fef3c7;
    border: 1px solid #fcd34d;
    color: #92400e;
    box-shadow: 0 2px 8px rgba(245, 158, 11, 0.15);
}

.danger-pill {
    background: #fee2e2;
    border: 1px solid #fca5a5;
    color: #b91c1c;
    box-shadow: 0 2px 8px rgba(239, 68, 68, 0.15);
}

.header-stat-pill:hover {
    transform: translateY(-2px);
}

/* Tabs Bar */
.user-tabs-bar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: 14px;
    margin-bottom: 22px;
}

.user-tabs-list {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
}

.user-tab-item {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 10px 16px;
    border-radius: 12px;
    font-size: 13.5px;
    font-weight: 600;
    text-decoration: none;
    color: #475569;
    background: #ffffff;
    border: 1px solid #e2e8f0;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
    transition: all 0.2s ease;
}

.user-tab-item:hover {
    color: var(--primary);
    background: #f8fafc;
    border-color: #cbd5e1;
}

.user-tab-item.active {
    color: #ffffff;
    background: var(--primary);
    border-color: var(--primary);
    box-shadow: 0 4px 14px rgba(79, 70, 229, 0.25);
}

.tab-badge {
    padding: 2px 8px;
    border-radius: 99px;
    font-size: 11.5px;
    font-weight: 700;
    background: #f1f5f9;
    color: #334155;
}

.user-tab-item.active .tab-badge {
    background: rgba(255, 255, 255, 0.25);
    color: #ffffff;
}

.tab-badge.badge-warn {
    background: #f59e0b;
    color: #ffffff;
}

.tab-badge.badge-danger {
    background: #ef4444;
    color: #ffffff;
}

/* Search Form */
.user-search-form {
    display: flex;
    gap: 8px;
    align-items: center;
}

.search-input-wrap {
    position: relative;
    display: flex;
    align-items: center;
}

.search-input-wrap i.bx-search {
    position: absolute;
    left: 12px;
    color: #64748b;
    font-size: 18px;
}

.search-input-wrap input {
    padding: 9px 34px 9px 36px;
    border-radius: 10px;
    background: #ffffff;
    border: 1px solid #cbd5e1;
    color: #0f172a;
    font-size: 13.5px;
    font-weight: 500;
    width: 240px;
    box-shadow: 0 1px 2px rgba(0,0,0,0.04);
    transition: all 0.2s ease;
}

.search-input-wrap input:focus {
    width: 280px;
    outline: none;
    border-color: var(--primary);
    box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.15);
}

.search-input-wrap input::placeholder {
    color: #94a3b8;
}

.search-clear-btn {
    position: absolute;
    right: 10px;
    color: #64748b;
    font-size: 18px;
    cursor: pointer;
    text-decoration: none;
}

.search-clear-btn:hover {
    color: #0f172a;
}

/* Pending Card Grid */
.pending-user-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(360px, 1fr));
    gap: 22px;
}

.pending-card {
    background: #ffffff;
    border: 1px solid #e2e8f0;
    border-top: 4px solid #f59e0b;
    border-radius: 18px;
    padding: 22px;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.06);
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.pending-card:hover {
    transform: translateY(-3px);
    box-shadow: 0 10px 24px rgba(0, 0, 0, 0.1);
}

.pending-card-head {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 16px;
    gap: 10px;
}

.user-meta-top {
    display: flex;
    align-items: center;
    gap: 12px;
}

.avatar-circle {
    width: 48px;
    height: 48px;
    border-radius: 50%;
    background: linear-gradient(135deg, var(--primary), #8b5cf6);
    color: #ffffff;
    font-weight: 800;
    font-size: 18px;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
    flex-shrink: 0;
    box-shadow: 0 2px 8px rgba(79, 70, 229, 0.25);
}

.avatar-circle img {
    width: 100%;
    height: 100%;
    object-fit: cover;
}

.user-title {
    font-size: 16px;
    font-weight: 800;
    margin: 0;
    color: #0f172a;
    line-height: 1.3;
}

.user-subtitle {
    font-size: 12.5px;
    color: #64748b;
    margin-top: 3px;
    font-weight: 500;
}

/* KTM Preview Box */
.ktm-preview-box {
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 14px;
    padding: 12px;
    margin-bottom: 16px;
}

.ktm-preview-label {
    font-size: 12px;
    font-weight: 700;
    color: #334155;
    margin-bottom: 8px;
    display: flex;
    align-items: center;
    gap: 6px;
}

.ktm-thumb-wrapper {
    position: relative;
    width: 100%;
    height: 160px;
    border-radius: 10px;
    overflow: hidden;
    background: #0f172a;
    cursor: pointer;
    border: 1px solid #cbd5e1;
}

.ktm-thumb-wrapper img {
    width: 100%;
    height: 100%;
    object-fit: contain;
    background: #0f172a;
    transition: transform 0.3s ease;
}

.ktm-thumb-wrapper:hover img {
    transform: scale(1.04);
}

.ktm-overlay-zoom {
    position: absolute;
    inset: 0;
    background: rgba(15, 23, 42, 0.6);
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    color: #ffffff;
    font-size: 13px;
    font-weight: 700;
    opacity: 0;
    transition: opacity 0.2s ease;
}

.ktm-thumb-wrapper:hover .ktm-overlay-zoom {
    opacity: 1;
}

.ktm-empty-box {
    padding: 24px;
    text-align: center;
    color: #94a3b8;
    font-size: 12.5px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 6px;
}

.ktm-empty-box i {
    font-size: 28px;
}

/* Details list */
.user-details-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
    font-size: 13px;
    margin-bottom: 18px;
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    padding: 12px 14px;
    border-radius: 12px;
}

.detail-row {
    display: flex;
    justify-content: space-between;
    gap: 8px;
}

.detail-row .label {
    color: #64748b;
    font-weight: 500;
    display: flex;
    align-items: center;
    gap: 6px;
}

.detail-row .value {
    color: #0f172a;
    font-weight: 700;
    text-align: right;
    max-width: 200px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.pending-card-footer {
    display: flex;
    gap: 8px;
    margin-top: 10px;
    padding-top: 16px;
    border-top: 1px solid #f1f5f9;
}

.pending-card-footer .btn {
    flex: 1;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    padding: 10px 14px;
    font-size: 13px;
    font-weight: 700;
    border-radius: 10px;
}

/* Table Card */
.user-table-card {
    padding: 0;
    overflow: hidden;
    border-radius: 18px;
    background: #ffffff;
    border: 1px solid #e2e8f0;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.04);
}

.user-table {
    margin-bottom: 0;
    border-collapse: collapse;
    width: 100%;
}

.user-table th {
    background: #f8fafc;
    font-size: 12px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    padding: 14px 18px;
    color: #475569;
    border-bottom: 1px solid #e2e8f0;
}

.user-table td {
    padding: 14px 18px;
    vertical-align: middle;
    border-bottom: 1px solid #f1f5f9;
    color: #1e293b;
}

.row-banned {
    background: #fff1f2;
}

.user-inline-cell {
    display: flex;
    align-items: center;
    gap: 12px;
}

.avatar-circle-sm {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background: linear-gradient(135deg, var(--primary), #8b5cf6);
    color: #ffffff;
    font-weight: 800;
    font-size: 15px;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
    flex-shrink: 0;
    box-shadow: 0 2px 6px rgba(79, 70, 229, 0.2);
}

.avatar-circle-sm img {
    width: 100%;
    height: 100%;
    object-fit: cover;
}

.user-name-text {
    font-size: 14px;
    color: #0f172a;
    display: flex;
    align-items: center;
    gap: 6px;
    font-weight: 700;
}

.user-meta-sub {
    font-size: 12px;
    color: #64748b;
    margin-top: 2px;
    display: flex;
    align-items: center;
    gap: 6px;
}

.badge-banned-mini {
    background: #ef4444;
    color: #ffffff;
    font-size: 10px;
    font-weight: 800;
    padding: 1px 6px;
    border-radius: 4px;
    display: inline-flex;
    align-items: center;
    gap: 2px;
}

.contact-info-cell {
    font-size: 13px;
    color: #1e293b;
    line-height: 1.4;
}

.contact-info-cell i {
    color: #64748b;
    margin-right: 4px;
}

.address-muted {
    color: #64748b;
    font-size: 12px;
    max-width: 220px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    margin-top: 2px;
}

/* Status Pills */
.status-pill {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    padding: 5px 12px;
    border-radius: 99px;
    font-size: 12px;
    font-weight: 700;
}

.status-verified {
    background: #d1fae5;
    color: #065f46;
    border: 1px solid #a7f3d0;
}

.status-pending {
    background: #fef3c7;
    color: #92400e;
    border: 1px solid #fde68a;
}

.status-banned {
    background: #fee2e2;
    color: #991b1b;
    border: 1px solid #fca5a5;
}

.status-rejected {
    background: #ffe4e6;
    color: #9f1239;
    border: 1px solid #fecdd3;
}

.reason-note-danger {
    font-size: 11.5px;
    color: #b91c1c;
    font-weight: 600;
    margin-top: 4px;
    max-width: 180px;
    line-height: 1.3;
}

.reason-note-warning {
    font-size: 11.5px;
    color: #b45309;
    font-weight: 600;
    margin-top: 4px;
    max-width: 180px;
    line-height: 1.3;
}

/* Action Button Groups */
.action-buttons-group {
    display: inline-flex;
    align-items: center;
    gap: 6px;
}

.btn-icon {
    width: 34px;
    height: 34px;
    border-radius: 8px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    font-size: 17px;
    border: 1px solid #e2e8f0;
    cursor: pointer;
    text-decoration: none;
    transition: all 0.15s ease;
    background: #ffffff;
    color: #475569;
}

.btn-icon:hover {
    transform: scale(1.08);
}

.btn-icon-success {
    color: #059669;
    border-color: #a7f3d0;
    background: #ecfdf5;
}
.btn-icon-success:hover {
    background: #10b981;
    color: #ffffff;
    border-color: #10b981;
}

.btn-icon-warning {
    color: #d97706;
    border-color: #fde68a;
    background: #fffbeb;
}
.btn-icon-warning:hover {
    background: #f59e0b;
    color: #ffffff;
    border-color: #f59e0b;
}

.btn-icon-danger {
    color: #dc2626;
    border-color: #fca5a5;
    background: #fef2f2;
}
.btn-icon-danger:hover {
    background: #ef4444;
    color: #ffffff;
    border-color: #ef4444;
}

.btn-icon-secondary {
    color: #475569;
    border-color: #cbd5e1;
    background: #f8fafc;
}
.btn-icon-secondary:hover {
    background: #475569;
    color: #ffffff;
    border-color: #475569;
}

/* Empty State */
.empty-state-card {
    text-align: center;
    padding: 60px 20px;
    background: #ffffff;
    border: 1px dashed #cbd5e1;
    border-radius: 18px;
    margin-top: 10px;
}

.empty-state-card .empty-icon {
    font-size: 52px;
    color: #94a3b8;
    margin-bottom: 12px;
}

.empty-state-card h3 {
    font-size: 17px;
    color: #0f172a;
    margin-bottom: 6px;
    font-weight: 700;
}

.empty-state-card p {
    color: #64748b;
    font-size: 13.5px;
    max-width: 480px;
    margin: 0 auto;
    line-height: 1.5;
}

/* Modals */
.user-modal-overlay {
    position: fixed;
    inset: 0;
    background: rgba(15, 23, 42, 0.65);
    backdrop-filter: blur(6px);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 9999;
    padding: 16px;
}

.user-modal-box {
    background: #ffffff;
    border: 1px solid #e2e8f0;
    border-radius: 18px;
    width: 100%;
    max-width: 500px;
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
    overflow: hidden;
    animation: modalPop 0.2s ease-out;
}

.ktm-modal-box {
    max-width: 680px;
}

@keyframes modalPop {
    from { opacity: 0; transform: scale(0.95); }
    to { opacity: 1; transform: scale(1); }
}

.user-modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px 20px;
    background: #f8fafc;
    border-bottom: 1px solid #e2e8f0;
}

.user-modal-header h3 {
    margin: 0;
    font-size: 16px;
    font-weight: 800;
    color: #0f172a;
    display: flex;
    align-items: center;
    gap: 8px;
}

.modal-close-btn {
    background: transparent;
    border: none;
    color: #64748b;
    font-size: 26px;
    cursor: pointer;
    line-height: 1;
}

.modal-close-btn:hover {
    color: #0f172a;
}

.user-modal-footer {
    display: flex;
    justify-content: flex-end;
    gap: 8px;
    padding: 14px 20px;
    background: #f8fafc;
    border-top: 1px solid #e2e8f0;
}

.ktm-full-wrapper {
    max-height: 480px;
    overflow: auto;
    border-radius: 12px;
    background: #0f172a;
    border: 1px solid #cbd5e1;
}

.ktm-full-wrapper img {
    width: 100%;
    height: auto;
    display: block;
}

@media (max-width: 768px) {
    .user-mgmt-header {
        flex-direction: column;
        align-items: stretch;
    }
    .header-stats-row {
        width: 100%;
    }
    .user-tabs-bar {
        flex-direction: column;
        align-items: stretch;
        gap: 12px;
    }
    .user-tabs-list {
        overflow-x: auto;
        -webkit-overflow-scrolling: touch;
        padding-bottom: 4px;
        flex-wrap: nowrap;
        width: 100%;
    }
    .user-tab-item {
        white-space: nowrap;
        flex-shrink: 0;
        padding: 8px 12px;
        font-size: 13px;
    }
    .user-search-form {
        width: 100%;
    }
    .search-input-wrap {
        flex: 1;
        width: 100%;
    }
    .search-input-wrap input {
        width: 100% !important;
    }
    .pending-user-grid {
        grid-template-columns: 1fr;
    }
    .user-modal-box {
        max-width: calc(100vw - 28px);
        margin: 14px;
    }
}
</style>

<script>
// KTM Preview Modal
function openKtmModal(url, nama, username) {
    document.getElementById('ktmModalImg').src = url;
    document.getElementById('ktmDownloadBtn').href = url;
    document.getElementById('ktmModalSubtitle').textContent = 'Anggota: ' + nama + (username ? ' (' + username + ')' : '');
    document.getElementById('ktmModal').style.display = 'flex';
}
function closeKtmModal() {
    document.getElementById('ktmModal').style.display = 'none';
    document.getElementById('ktmModalImg').src = '';
}

// Reject Modal
function openRejectModal(id, nama, tab) {
    document.getElementById('rejectIdAnggota').value = id;
    document.getElementById('rejectTab').value = tab;
    document.getElementById('rejectModalUser').textContent = 'Anggota: ' + nama;
    document.getElementById('rejectCatatan').value = '';
    document.getElementById('rejectModal').style.display = 'flex';
}
function closeRejectModal() {
    document.getElementById('rejectModal').style.display = 'none';
}

// Ban Modal
function openBanModal(id, nama, tab) {
    document.getElementById('banIdAnggota').value = id;
    document.getElementById('banTab').value = tab;
    document.getElementById('banModalUser').textContent = 'Anggota: ' + nama;
    document.getElementById('banAlasan').value = '';
    document.getElementById('banModal').style.display = 'flex';
}
function closeBanModal() {
    document.getElementById('banModal').style.display = 'none';
}

// Delete Modal
function openDeleteModal(id, nama, tab, activeLoans) {
    document.getElementById('deleteIdAnggota').value = id;
    document.getElementById('deleteTab').value = tab;
    document.getElementById('deleteModalUser').textContent = 'Anggota: ' + nama;

    const warnBox = document.getElementById('deleteLoanWarning');
    const confirmBtn = document.getElementById('deleteConfirmBtn');
    if (activeLoans > 0) {
        warnBox.style.display = 'flex';
        confirmBtn.disabled = true;
        confirmBtn.title = 'Tidak dapat dihapus karena masih ada peminjaman aktif';
    } else {
        warnBox.style.display = 'none';
        confirmBtn.disabled = false;
        confirmBtn.title = '';
    }

    document.getElementById('deleteModal').style.display = 'flex';
}
function closeDeleteModal() {
    document.getElementById('deleteModal').style.display = 'none';
}

// Esc Key Listener for Modals
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        closeKtmModal();
        closeRejectModal();
        closeBanModal();
        closeDeleteModal();
    }
});
</script>
