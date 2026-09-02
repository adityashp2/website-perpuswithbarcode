<?php
require_once __DIR__ . '/koneksi.php';

$user = get_current_user_data();
if (!$user) {
    echo "<script>window.location.href='index.php?pg=sessionFailed';</script>";
    exit();
}

$admin_param = $user['admin_id'];
$admin_query_str = "&admin=" . urlencode($admin_param);

$foto_src = (!empty($user['foto']) && file_exists(__DIR__ . '/foto_profile/' . $user['foto'])) 
    ? 'foto_profile/' . htmlspecialchars($user['foto']) 
    : 'https://ui-avatars.com/api/?name=' . urlencode($user['nama']) . '&background=4f46e5&color=fff&size=200';

// Hitung statistik peminjaman jika tipe Anggota
$total_pinjam = 0;
if ($user['id_anggota']) {
    $q_pinjam = db_fetch_one(db_query("SELECT COUNT(*) as total FROM peminjaman WHERE id_anggota = '" . db_escape($user['id_anggota']) . "'"));
    $total_pinjam = $q_pinjam['total'] ?? 0;
}
?>

<div class="page-header">
    <div class="page-header-info">
        <h1>Profil & Kartu Pengguna</h1>
        <p>Informasi identitas dan kartu keanggotaan Perpustakaan Politeknik Negeri Lampung.</p>
    </div>
</div>

<!-- Digital Member ID Card Badge -->
<div class="digital-id-card">
    <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; position: relative; z-index: 2;">
        <div style="display: flex; align-items: center; gap: 12px;">
            <div style="width: 40px; height: 40px; background: rgba(255,255,255,0.2); border-radius: var(--radius-md); display: flex; align-items: center; justify-content: center; font-size: 20px;">
                <i class='bx bxs-book-reader'></i>
            </div>
            <div>
                <h3 style="font-family: var(--font-heading); font-size: 16px; font-weight: 700; letter-spacing: 0.5px;">KARTU PERPUSTAKAAN</h3>
                <p style="font-size: 11px; opacity: 0.8;">POLITEKNIK NEGERI LAMPUNG</p>
            </div>
        </div>
        <span class="role-badge <?= $user['type'] === 'ADM' ? 'badge-adm' : 'badge-ang' ?>" style="font-size: 11px; padding: 4px 12px; background: rgba(255,255,255,0.2); color: #fff; border: 1px solid rgba(255,255,255,0.3);">
            <?= $user['type'] === 'ADM' ? 'ADMINISTRATOR' : 'ANGGOTA RESMI' ?>
        </span>
    </div>

    <div style="display: flex; gap: 20px; align-items: center; position: relative; z-index: 2; flex-wrap: wrap;">
        <img src="<?= $foto_src ?>" alt="Foto Profil" style="width: 72px; height: 72px; border-radius: var(--radius-full); object-fit: cover; border: 3px solid rgba(255,255,255,0.4); box-shadow: var(--shadow-md);">
        <div>
            <div style="font-family: var(--font-heading); font-size: 20px; font-weight: 700; line-height: 1.2;">
                <?= htmlspecialchars($user['nama']) ?>
            </div>
            <div style="font-size: 13px; opacity: 0.85; margin-top: 4px;">
                Username: <code>@<?= htmlspecialchars($user['username']) ?></code>
            </div>
            <div style="font-size: 11.5px; opacity: 0.75; margin-top: 4px; font-family: monospace;">
                ID Registrasi: <?= htmlspecialchars($user['admin_id']) ?>
            </div>
        </div>
    </div>
</div>

<div class="profile-card">
    <div class="profile-avatar-box">
        <img src="<?= $foto_src ?>" alt="Avatar" class="profile-avatar-img">
        <h3 style="font-family: var(--font-heading); font-size: 18px; font-weight: 700; color: #0f172a;"><?= htmlspecialchars($user['nama']) ?></h3>
        <p style="color: var(--text-muted); font-size: 13px; margin-bottom: 16px;">@<?= htmlspecialchars($user['username']) ?></p>
        
        <?php if ($user['type'] === 'ANG'): ?>
            <div style="background: var(--bg-main); padding: 12px; border-radius: var(--radius-md); border: 1px solid var(--card-border); margin-top: 12px;">
                <div style="font-size: 11px; text-transform: uppercase; color: var(--text-muted); font-weight: 700;">Total Peminjaman</div>
                <div style="font-size: 22px; font-weight: 800; color: var(--primary);"><?= $total_pinjam ?> kali</div>
            </div>
        <?php endif; ?>
    </div>

    <div class="card" style="margin-bottom: 0;">
        <div class="card-header">
            <div class="card-title">
                <i class='bx bx-id-card' style="color: var(--primary);"></i>
                <span>Detail Informasi Pribadi</span>
            </div>
        </div>

        <div class="table-responsive" style="border: none;">
            <table class="table-modern">
                <tbody>
                    <tr>
                        <td width="180" style="font-weight: 600; color: var(--text-muted);">Nama Lengkap</td>
                        <td><strong><?= htmlspecialchars($user['nama']) ?></strong></td>
                    </tr>
                    <tr>
                        <td style="font-weight: 600; color: var(--text-muted);">Jenis Kelamin</td>
                        <td><?= $user['sex'] === 'L' ? 'Laki-laki' : 'Perempuan' ?></td>
                    </tr>
                    <tr>
                        <td style="font-weight: 600; color: var(--text-muted);">No. Telepon / WA</td>
                        <td><?= htmlspecialchars($user['telp'] ?: '-') ?></td>
                    </tr>
                    <tr>
                        <td style="font-weight: 600; color: var(--text-muted);">Email</td>
                        <td><?= htmlspecialchars($user['email'] ?: '-') ?></td>
                    </tr>
                    <tr>
                        <td style="font-weight: 600; color: var(--text-muted);">Alamat</td>
                        <td><?= htmlspecialchars($user['alamat'] ?: '-') ?></td>
                    </tr>
                    <tr>
                        <td style="font-weight: 600; color: var(--text-muted);">Tanggal Terdaftar</td>
                        <td><?= tgl_indo($user['tgl_entry']) ?></td>
                    </tr>
                    <tr>
                        <td style="font-weight: 600; color: var(--text-muted);">Keterangan / Bio</td>
                        <td><?= nl2br(htmlspecialchars($user['descripsi'] ?: '-')) ?></td>
                    </tr>
                </tbody>
            </table>
        </div>
    </div>
</div>
