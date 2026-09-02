<?php
require_once __DIR__ . '/koneksi.php';

$user = get_current_user_data();
if (!$user || $user['type'] !== 'ADM') {
    set_flash('error', 'Akses ditolak.');
    header("Location: index.php?pg=notadmin");
    exit();
}

$admin = $user['admin_id'];
$isbn = trim($_POST['isbn'] ?? '');
$judul = trim($_POST['judul'] ?? '');
$tahun = (int)($_POST['tahun'] ?? date('Y'));
$pengarang = trim($_POST['pengarang'] ?? '');
$penerbit = trim($_POST['penerbit'] ?? '');
$katalog = trim($_POST['katalog'] ?? '');
$qty_stok = isset($_POST['qty_stok']) ? (int)$_POST['qty_stok'] : null;
$maks_pinjam_per_anggota = max(1, (int)($_POST['maks_pinjam_per_anggota'] ?? 1));
$is_edit = !empty($_POST['is_edit']) && $_POST['is_edit'] == '1';

if (!$is_edit && empty($isbn) && !empty($katalog)) {
    $isbn = generate_book_isbn_by_katalog($katalog);
}

if (empty($isbn) || empty($judul) || empty($pengarang) || empty($penerbit) || empty($katalog)) {
    set_flash('error', 'Semua field wajib diisi!');
    header("Location: index.php?pg=formBuku&admin=" . urlencode($admin) . ($isbn ? "&idBuku=" . urlencode($isbn) : ""));
    exit();
}

$foto_path = '';
$isbn_esc = db_escape($isbn);
$upload_dir = __DIR__ . '/images/buku/';
if (!is_dir($upload_dir)) {
    mkdir($upload_dir, 0777, true);
}

if (isset($_FILES['foto_buku']) && !empty($_FILES['foto_buku']['name'])) {
    $file_name = $_FILES['foto_buku']['name'];
    $file_tmp = $_FILES['foto_buku']['tmp_name'];
    $file_ext = strtolower(pathinfo($file_name, PATHINFO_EXTENSION));
    $allowed = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
    if (!in_array($file_ext, $allowed) || $_FILES['foto_buku']['size'] > 2097152) {
        set_flash('error', 'Format foto buku tidak valid atau ukuran melebihi 2 MB.');
        header("Location: index.php?pg=formBuku&admin=" . urlencode($admin) . "&idBuku=" . urlencode($isbn));
        exit();
    }

    $safe_name = time() . '_' . preg_replace('/[^a-zA-Z0-9._-]/', '', basename($file_name));
    $foto_path = 'images/buku/' . $safe_name;
    if (!move_uploaded_file($file_tmp, __DIR__ . '/' . $foto_path)) {
        set_flash('error', 'Gagal mengupload foto buku.');
        header("Location: index.php?pg=formBuku&admin=" . urlencode($admin) . "&idBuku=" . urlencode($isbn));
        exit();
    }

    if ($is_edit) {
        $existing = db_fetch_one(db_query("SELECT foto FROM buku WHERE isbn='$isbn_esc' LIMIT 1"));
        if (!empty($existing['foto']) && file_exists(__DIR__ . '/' . $existing['foto'])) {
            @unlink(__DIR__ . '/' . $existing['foto']);
        }
    }
}

$judul_esc = db_escape($judul);
$pengarang_esc = db_escape($pengarang);
$penerbit_esc = db_escape($penerbit);
$katalog_esc = db_escape($katalog);
$foto_esc = db_escape($foto_path);
$maks_pinjam_esc = (int)$maks_pinjam_per_anggota;

$check = db_query("SELECT isbn FROM buku WHERE isbn='$isbn_esc' LIMIT 1");
if (db_num_rows($check) > 0) {
    $update_sql = "UPDATE buku SET judul='$judul_esc', tahun='$tahun', id_penerbit='$penerbit_esc', 
        id_pengarang='$pengarang_esc', id_katalog='$katalog_esc', maks_pinjam_per_anggota='$maks_pinjam_esc'";
    if ($foto_path !== '') {
        $update_sql .= ", foto='$foto_esc'";
    }
    $update_sql .= " WHERE isbn='$isbn_esc'";

    $query = db_query($update_sql);
    if ($query) {
        set_flash('success', 'Data buku "<strong>' . htmlspecialchars($judul) . '</strong>" berhasil diperbarui.');
    } else {
        set_flash('error', 'Gagal memperbarui data buku.');
    }
} else {
    $stok_val = $qty_stok !== null ? $qty_stok : 0;
    $query = db_query("INSERT INTO buku (isbn, judul, tahun, id_penerbit, id_pengarang, id_katalog, qty_stok, foto, maks_pinjam_per_anggota) 
        VALUES ('$isbn_esc', '$judul_esc', '$tahun', '$penerbit_esc', '$pengarang_esc', '$katalog_esc', '$stok_val', '$foto_esc', '$maks_pinjam_esc')");
    if ($query) {
        set_flash('success', 'Buku baru "<strong>' . htmlspecialchars($judul) . '</strong>" berhasil ditambahkan!');
    } else {
        set_flash('error', 'Gagal menyimpan buku baru.');
    }
}

header("Location: index.php?pg=buku&admin=" . urlencode($admin));
exit();
