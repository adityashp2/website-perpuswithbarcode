<?php
// Handler: Admin Mengelola User (ACC Pendaftaran, Tolak, Delete, Ban, Unban, Reset Password)
if (!defined('APP_INIT')) {
    define('APP_INIT', true);
}
require_once __DIR__ . '/koneksi.php';

$user = get_current_user_data();
if (!$user || $user['type'] !== 'ADM') {
    set_flash('error', 'Hanya admin yang memiliki izin untuk mengelola pengguna.');
    header("Location: index.php?pg=notadmin");
    exit();
}

$admin_param = $user['admin_id'];
$admin_query_str = "&admin=" . urlencode($admin_param);

$aksi       = $_REQUEST['aksi'] ?? '';
$id_anggota = (int)($_REQUEST['id_anggota'] ?? $_REQUEST['id'] ?? 0);
$tab        = $_REQUEST['tab'] ?? 'pending';
$catatan    = trim($_REQUEST['catatan'] ?? '');
$alasan     = trim($_REQUEST['alasan'] ?? '');

$redirect_url = "index.php?pg=user" . $admin_query_str . "&tab=" . urlencode($tab);

if (!$id_anggota) {
    set_flash('error', 'ID Anggota tidak valid.');
    header("Location: " . $redirect_url);
    exit();
}

$anggota = db_fetch_one(db_query("
    SELECT a.*, adm.username, adm.type as adm_type, adm.is_banned, adm.banned_reason 
    FROM anggota a 
    LEFT JOIN admin adm ON a.id_admin = adm.id 
    WHERE a.id_anggota = '$id_anggota' 
    LIMIT 1
"));

if (!$anggota) {
    set_flash('error', 'Data anggota tidak ditemukan.');
    header("Location: " . $redirect_url);
    exit();
}

$nama_user = htmlspecialchars($anggota['nama'] ?: $anggota['username']);
$id_admin_esc = db_escape($anggota['id_admin']);

switch ($aksi) {
    case 'acc':
    case 'setujui':
        db_query("UPDATE anggota SET status_verifikasi = 'TERVERIFIKASI', catatan_verifikasi = NULL WHERE id_anggota = '$id_anggota'");
        if (!empty($id_admin_esc)) {
            db_query("UPDATE admin SET is_banned = 0, banned_reason = NULL, banned_at = NULL WHERE id = '$id_admin_esc'");
        }
        set_flash('success', 'Pendaftaran dan KTM <strong>' . $nama_user . '</strong> telah <strong>disetujui (ACC)</strong>. Akun kini aktif dan dapat meminjam buku.');
        break;

    case 'tolak':
        $catatan_esc = db_escape($catatan !== '' ? $catatan : 'Foto KTM tidak valid / buram / tidak sesuai identitas. Silakan hubungi petugas perpustakaan.');
        db_query("UPDATE anggota SET status_verifikasi = 'DITOLAK', catatan_verifikasi = '$catatan_esc' WHERE id_anggota = '$id_anggota'");
        set_flash('info', 'Verifikasi pendaftaran <strong>' . $nama_user . '</strong> telah <strong>ditolak</strong> dengan catatan: <em>' . htmlspecialchars($catatan ?: 'Foto KTM tidak valid') . '</em>.');
        break;

    case 'ban':
    case 'banned':
        if ($anggota['adm_type'] === 'ADM') {
            set_flash('error', 'Tidak dapat mem-banned akun Administrator.');
            break;
        }
        $alasan_esc = db_escape($alasan !== '' ? $alasan : 'Pelanggaran aturan & tata tertib perpustakaan.');
        if (!empty($id_admin_esc)) {
            db_query("UPDATE admin SET is_banned = 1, banned_reason = '$alasan_esc', banned_at = NOW() WHERE id = '$id_admin_esc'");
        }
        set_flash('warning', 'Akun <strong>' . $nama_user . '</strong> telah <strong>di-banned</strong>. Pengguna tidak dapat login sampai blokir dibuka.');
        break;

    case 'unban':
    case 'aktifkan':
        if (!empty($id_admin_esc)) {
            db_query("UPDATE admin SET is_banned = 0, banned_reason = NULL, banned_at = NULL WHERE id = '$id_admin_esc'");
        }
        set_flash('success', 'Akun <strong>' . $nama_user . '</strong> telah <strong>dipulihkan (unban)</strong> dan kini dapat login kembali.');
        break;

    case 'delete':
    case 'hapus':
        if ($anggota['adm_type'] === 'ADM') {
            set_flash('error', 'Tidak dapat menghapus akun Administrator utama.');
            break;
        }

        // Cek apakah anggota memiliki peminjaman aktif yang belum selesai
        $active_loans = db_fetch_all(db_query("
            SELECT id_pinjam, status 
            FROM peminjaman 
            WHERE id_anggota = '$id_anggota' AND status IN ('PENDING', 'DIPINJAM', 'KEMBALI')
        "));

        if (!empty($active_loans)) {
            $list_id = array_map(function($l) { return '#' . $l['id_pinjam'] . ' (' . $l['status'] . ')'; }, $active_loans);
            set_flash('error', 'Tidak dapat menghapus anggota <strong>' . $nama_user . '</strong> karena masih memiliki transaksi peminjaman aktif: ' . implode(', ', $list_id) . '. Harap selesaikan transaksi terlebih dahulu.');
            break;
        }

        // Hapus file fisik foto & KTM jika ada
        if (!empty($anggota['foto']) && file_exists(__DIR__ . '/foto_profile/' . $anggota['foto'])) {
            @unlink(__DIR__ . '/foto_profile/' . $anggota['foto']);
        }
        if (!empty($anggota['ktm_foto']) && file_exists(__DIR__ . '/ktm_uploads/' . $anggota['ktm_foto'])) {
            @unlink(__DIR__ . '/ktm_uploads/' . $anggota['ktm_foto']);
        }

        // Hapus data riwayat transaksi peminjaman anggota yang sudah selesai/ditolak
        $loans = db_fetch_all(db_query("SELECT id_pinjam FROM peminjaman WHERE id_anggota = '$id_anggota'"));
        foreach ($loans as $l) {
            $pid = (int)$l['id_pinjam'];
            db_query("DELETE FROM pengembalian WHERE id_pinjam = '$pid'");
            db_query("DELETE FROM detail_peminjaman WHERE id_pinjam = '$pid'");
            db_query("DELETE FROM peminjaman WHERE id_pinjam = '$pid'");
        }

        // Hapus data anggota & kredensial admin
        db_query("DELETE FROM anggota WHERE id_anggota = '$id_anggota'");
        if (!empty($id_admin_esc)) {
            db_query("DELETE FROM admin WHERE id = '$id_admin_esc' AND type != 'ADM'");
        }

        set_flash('success', 'Akun anggota <strong>' . $nama_user . '</strong> beserta datanya telah <strong>berhasil dihapus</strong> dari sistem.');
        break;

    case 'reset_password':
        if (!empty($id_admin_esc)) {
            $default_pass = '12345678';
            $hash = hash_password($default_pass);
            db_query("UPDATE admin SET password = '" . db_escape($hash) . "' WHERE id = '$id_admin_esc'");
            set_flash('success', 'Password untuk akun <strong>' . $nama_user . '</strong> berhasil direset menjadi: <code>12345678</code>');
        } else {
            set_flash('error', 'Akun login tidak ditemukan.');
        }
        break;

    default:
        set_flash('error', 'Aksi tidak dikenali.');
        break;
}

header("Location: " . $redirect_url);
exit();
