<?php
if (session_status() === PHP_SESSION_NONE) {
    session_set_cookie_params([
        'lifetime' => 3600,
        'path' => '/',
        'domain' => '',
        'secure' => false,
        'httponly' => true,
        'samesite' => 'Lax'
    ]);
    session_name('pustaka_polinela');
    session_start();
}

// Matikan exception throwing otomatis dari mysqli di PHP 8.1+
mysqli_report(MYSQLI_REPORT_OFF);

$db_host = "localhost";
$db_user = "root";
$db_pass = "";
$db_name = "perpustakaan";

// 1. Coba koneksi ke MySQL Server
$koneksi = @mysqli_connect($db_host, $db_user, $db_pass);

if (!$koneksi) {
    // Fallback coba password 'admin'
    $db_pass = "admin";
    $koneksi = @mysqli_connect($db_host, $db_user, $db_pass);
}

if (!$koneksi) {
    die("<div style='font-family:sans-serif;padding:30px;background:#fee2e2;color:#991b1b;border-radius:12px;margin:30px auto;max-width:600px;box-shadow:0 10px 15px -3px rgba(0,0,0,0.1);'>
        <h2 style='margin-top:0;'>⚠️ Gagal Terhubung ke MySQL Server</h2>
        <p>Pastikan <strong>MySQL di Laragon sudah dinyalakan (Klik Start All di Laragon)</strong>.</p>
        <p><em>Error: " . htmlspecialchars(mysqli_connect_error()) . "</em></p>
    </div>");
}

// 2. Buat database 'perpustakaan' otomatis jika belum ada
mysqli_query($koneksi, "CREATE DATABASE IF NOT EXISTS `$db_name` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");

// 3. Pilih database 'perpustakaan'
if (!mysqli_select_db($koneksi, $db_name)) {
    die("<div style='font-family:sans-serif;padding:30px;background:#fee2e2;color:#991b1b;border-radius:12px;margin:30px auto;max-width:600px;box-shadow:0 10px 15px -3px rgba(0,0,0,0.1);'>
        <h2 style='margin-top:0;'>⚠️ Gagal Memilih Database '$db_name'</h2>
        <p><em>Error: " . htmlspecialchars(mysqli_error($koneksi)) . "</em></p>
    </div>");
}

mysqli_set_charset($koneksi, "utf8mb4");

// 4. Inisialisasi Skema Tabel & Kolom Status Sirkulasi
function init_database_tables($db) {
    mysqli_query($db, "CREATE TABLE IF NOT EXISTS `admin` (
      `id` varchar(255) NOT NULL,
      `username` varchar(255) NOT NULL,
      `password` varchar(255) NOT NULL,
      `type` char(3) NOT NULL,
      PRIMARY KEY (`id`),
      UNIQUE KEY `username` (`username`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;");

    mysqli_query($db, "CREATE TABLE IF NOT EXISTS `anggota` (
      `id_anggota` int(11) NOT NULL AUTO_INCREMENT,
      `id_admin` varchar(255) NOT NULL,
      `nama` varchar(255) NOT NULL,
      `sex` char(1) NOT NULL,
      `telp` varchar(15) NOT NULL,
      `alamat` varchar(255) NOT NULL,
      `email` varchar(255) NOT NULL,
      `tgl_entry` date NOT NULL,
      `descripsi` text NOT NULL,
      `foto` varchar(255) DEFAULT NULL,
      PRIMARY KEY (`id_anggota`),
      KEY `admin` (`id_admin`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;");

    mysqli_query($db, "CREATE TABLE IF NOT EXISTS `katalog` (
      `id_katalog` varchar(3) NOT NULL,
      `nama` varchar(255) DEFAULT NULL,
      PRIMARY KEY (`id_katalog`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;");

    mysqli_query($db, "CREATE TABLE IF NOT EXISTS `penerbit` (
      `id_penerbit` varchar(8) NOT NULL,
      `nama_penerbit` varchar(255) DEFAULT NULL,
      `email` varchar(50) DEFAULT NULL,
      `telp` varchar(12) DEFAULT NULL,
      `alamat` varchar(255) DEFAULT NULL,
      PRIMARY KEY (`id_penerbit`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;");

    mysqli_query($db, "CREATE TABLE IF NOT EXISTS `pengarang` (
      `id_pengarang` varchar(8) NOT NULL,
      `nama_pengarang` varchar(255) DEFAULT NULL,
      `email` varchar(50) DEFAULT NULL,
      `telp` varchar(12) DEFAULT NULL,
      `alamat` varchar(255) DEFAULT NULL,
      PRIMARY KEY (`id_pengarang`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;");

    mysqli_query($db, "CREATE TABLE IF NOT EXISTS `buku` (
      `isbn` varchar(25) NOT NULL,
      `judul` varchar(255) DEFAULT NULL,
      `tahun` int(11) DEFAULT NULL,
      `id_penerbit` varchar(8) DEFAULT NULL,
      `id_pengarang` varchar(8) DEFAULT NULL,
      `id_katalog` varchar(3) DEFAULT NULL,
      `qty_stok` int(11) DEFAULT '0',
      `foto` varchar(255) DEFAULT NULL,
      PRIMARY KEY (`isbn`),
      KEY `penerbit` (`id_penerbit`),
      KEY `pengarang` (`id_pengarang`),
      KEY `katalog` (`id_katalog`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;");

    mysqli_query($db, "CREATE TABLE IF NOT EXISTS `config` (
      `id` int(11) NOT NULL AUTO_INCREMENT,
      `maxLamaPinjam` int(11) DEFAULT NULL,
      `dendaPerHari` decimal(19,0) DEFAULT NULL,
      PRIMARY KEY (`id`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;");

    mysqli_query($db, "CREATE TABLE IF NOT EXISTS `peminjaman` (
      `id_pinjam` int(11) NOT NULL AUTO_INCREMENT,
      `id_anggota` int(11) DEFAULT NULL,
      `tgl_pinjam` date DEFAULT NULL,
      `tgl_kembali` date DEFAULT NULL,
      `status` varchar(25) NOT NULL DEFAULT 'DIPINJAM',
      PRIMARY KEY (`id_pinjam`),
      KEY `anggota` (`id_anggota`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;");

    mysqli_query($db, "CREATE TABLE IF NOT EXISTS `detail_peminjaman` (
      `id_pinjam` int(11) NOT NULL DEFAULT '0',
      `isbn` varchar(25) NOT NULL DEFAULT '',
      `qty` int(11) DEFAULT NULL,
      PRIMARY KEY (`id_pinjam`,`isbn`),
      KEY `id_pinjam` (`id_pinjam`),
      KEY `isbn` (`isbn`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;");

    mysqli_query($db, "CREATE TABLE IF NOT EXISTS `pengembalian` (
      `id_kembali` int(11) NOT NULL AUTO_INCREMENT,
      `id_pinjam` int(11) DEFAULT NULL,
      `tgl_kembali` date DEFAULT NULL,
      `denda` decimal(19,0) DEFAULT NULL,
      PRIMARY KEY (`id_kembali`),
      KEY `id_pinjam` (`id_pinjam`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;");

    // Seed data default jika masih kosong
    $chk_adm = mysqli_query($db, "SELECT id FROM admin WHERE username='admin' LIMIT 1");
    if (!$chk_adm || mysqli_num_rows($chk_adm) === 0) {
        $admin_hash = password_hash('admin', PASSWORD_DEFAULT);
        mysqli_query($db, "INSERT INTO `admin` VALUES ('21232f297a57a5a743894a0e4a801fc3','admin','" . mysqli_real_escape_string($db, $admin_hash) . "','ADM')");
        mysqli_query($db, "INSERT INTO `anggota` VALUES (1,'21232f297a57a5a743894a0e4a801fc3','Administrator Polinela','L','081270000000','UPT Perpustakaan Polinela','admin@polinela.ac.id','2024-01-01','Administrator Perpustakaan Polinela','pusio-gmail-tux.png')");
    }

    $chk_cfg = mysqli_query($db, "SELECT id FROM config LIMIT 1");
    if (!$chk_cfg || mysqli_num_rows($chk_cfg) === 0) {
        mysqli_query($db, "INSERT INTO `config` VALUES (1,3,'500')");
    }

    $chk_kat = mysqli_query($db, "SELECT id_katalog FROM katalog LIMIT 1");
    if (!$chk_kat || mysqli_num_rows($chk_kat) === 0) {
        mysqli_query($db, "INSERT INTO `katalog` VALUES ('KG0','Komputer & Pemrograman')");
        mysqli_query($db, "INSERT INTO `penerbit` VALUES ('PN01','Informatika Bandung','info@informatika.com','022-7208123','Jl. Buah Batu Bandung')");
        mysqli_query($db, "INSERT INTO `pengarang` VALUES ('PG01','Budi Raharjo','budi@raharjo.id','08123456789','Bandung')");
        mysqli_query($db, "INSERT INTO `buku` VALUES ('092-111','Belajar Pemrograman PHP & MySQL Modern',2024,'PN01','PG01','KG0',15)");
    }
}

// Jalankan auto-init tabel
$check_tables = mysqli_query($koneksi, "SHOW TABLES LIKE 'buku'");
if (!$check_tables || mysqli_num_rows($check_tables) === 0) {
    init_database_tables($koneksi);
}

// Pastikan kolom status ada pada tabel peminjaman
$chk_col = mysqli_query($koneksi, "SHOW COLUMNS FROM `peminjaman` LIKE 'status'");
if ($chk_col && mysqli_num_rows($chk_col) === 0) {
    mysqli_query($koneksi, "ALTER TABLE `peminjaman` ADD COLUMN `status` VARCHAR(25) NOT NULL DEFAULT 'DIPINJAM'");
}

// Pastikan kolom foto ada pada tabel buku
$chk_buku_foto = mysqli_query($koneksi, "SHOW COLUMNS FROM `buku` LIKE 'foto'");
if ($chk_buku_foto && mysqli_num_rows($chk_buku_foto) === 0) {
    mysqli_query($koneksi, "ALTER TABLE `buku` ADD COLUMN `foto` VARCHAR(255) DEFAULT NULL AFTER `qty_stok`");
}

// Pastikan kolom batas pinjam per anggota ada pada tabel buku
$chk_buku_limit = mysqli_query($koneksi, "SHOW COLUMNS FROM `buku` LIKE 'maks_pinjam_per_anggota'");
if ($chk_buku_limit && mysqli_num_rows($chk_buku_limit) === 0) {
    mysqli_query($koneksi, "ALTER TABLE `buku` ADD COLUMN `maks_pinjam_per_anggota` INT NOT NULL DEFAULT 1 AFTER `qty_stok`");
}

// Global variable backward compatibility
$cnc = $koneksi;

function hash_password($password) {
    return password_hash((string)$password, PASSWORD_DEFAULT);
}

function verify_password($password, $hash) {
    if (empty($password) || empty($hash)) {
        return false;
    }

    if (password_verify((string)$password, (string)$hash)) {
        return true;
    }

    if (is_string($hash) && strlen($hash) === 32 && hash_equals(md5((string)$password), $hash)) {
        return true;
    }

    return false;
}

// Helper Functions
function db_escape($str) {
    global $koneksi;
    return mysqli_real_escape_string($koneksi, (string)$str);
}

function db_query($sql) {
    global $koneksi;
    $res = mysqli_query($koneksi, $sql);
    if (!$res) {
        error_log("Database Error: " . mysqli_error($koneksi) . " on SQL: " . $sql);
    }
    return $res;
}

function db_fetch_all($query) {
    $rows = [];
    if ($query && $query instanceof mysqli_result) {
        while ($row = mysqli_fetch_assoc($query)) {
            $rows[] = $row;
        }
    }
    return $rows;
}

function db_fetch_one($query) {
    if ($query && $query instanceof mysqli_result) {
        return mysqli_fetch_assoc($query);
    }
    return null;
}

function db_insert_id() {
    global $koneksi;
    return mysqli_insert_id($koneksi);
}

function db_num_rows($query) {
    if ($query && $query instanceof mysqli_result) {
        return mysqli_num_rows($query);
    }
    return 0;
}

function generate_book_isbn_by_katalog($katalog_id) {
    $prefix = strtoupper(preg_replace('/[^A-Z0-9]/', '', (string)$katalog_id));
    if ($prefix === '') {
        $prefix = 'BK';
    }

    $pattern = $prefix . '%';
    $query = db_query("SELECT isbn FROM buku WHERE isbn LIKE '" . db_escape($pattern) . "' ORDER BY isbn DESC");
    $highest = 0;

    if ($query) {
        while ($row = db_fetch_one($query)) {
            $candidate = (string)($row['isbn'] ?? '');
            if (preg_match('/(\d+)$/', $candidate, $matches)) {
                $value = (int)$matches[1];
                if ($value > $highest) {
                    $highest = $value;
                }
            }
        }
    }

    return sprintf('%s-%04d', $prefix, $highest + 1);
}

// Flash Message Helpers
function set_flash($type, $message) {
    $_SESSION['flash_msg'] = [
        'type' => $type,
        'message' => $message
    ];
}

function get_flash() {
    if (isset($_SESSION['flash_msg'])) {
        $msg = $_SESSION['flash_msg'];
        unset($_SESSION['flash_msg']);
        return $msg;
    }
    return null;
}

// User Auth Helpers
function get_current_user_data() {
    global $koneksi;
    $admin_id = $_SESSION['admin_id'] ?? '';
    if (!$admin_id) {
        return null;
    }

    $admin_id_esc = db_escape($admin_id);
    $q_admin = db_query("SELECT * FROM admin WHERE id = '$admin_id_esc' LIMIT 1");
    if ($q_admin && db_num_rows($q_admin) > 0) {
        $admin = db_fetch_one($q_admin);

        $q_anggota = db_query("SELECT * FROM anggota WHERE id_admin = '$admin_id_esc' LIMIT 1");
        $anggota = $q_anggota ? db_fetch_one($q_anggota) : null;

        return [
            'admin_id' => $admin['id'],
            'username' => $admin['username'],
            'type' => $admin['type'],
            'nama' => $anggota['nama'] ?? ($admin['type'] === 'ADM' ? 'Administrator' : $admin['username']),
            'email' => $anggota['email'] ?? '',
            'telp' => $anggota['telp'] ?? '',
            'alamat' => $anggota['alamat'] ?? '',
            'sex' => $anggota['sex'] ?? 'L',
            'descripsi' => $anggota['descripsi'] ?? '',
            'foto' => $anggota['foto'] ?? '',
            'id_anggota' => $anggota['id_anggota'] ?? null,
            'tgl_entry' => $anggota['tgl_entry'] ?? ''
        ];
    }

    $_SESSION = [];
    session_destroy();
    return null;
}

function rupiah($angka) {
    return 'Rp ' . number_format((float)$angka, 0, ',', '.');
}

function tgl_indo($tanggal) {
    if (!$tanggal || $tanggal == '0000-00-00') return '-';
    $bulan = [
        1 => 'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
        'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ];
    $pecahkan = explode('-', $tanggal);
    if (count($pecahkan) === 3) {
        return (int)$pecahkan[2] . ' ' . ($bulan[(int)$pecahkan[1]] ?? '') . ' ' . $pecahkan[0];
    }
    return $tanggal;
}
