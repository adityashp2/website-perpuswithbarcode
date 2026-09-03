<?php
require_once __DIR__ . '/koneksi.php';
$user = get_current_user_data();
if ($user) {
    echo "<script>window.location.href='index.php?pg=beranda&admin=" . urlencode($user['admin_id']) . "';</script>";
    exit();
}
?>
<div style="max-width: 680px; margin: 20px auto;">
    <div class="card" style="padding: 32px; box-shadow: var(--shadow-lg);">
        <div style="text-align: center; margin-bottom: 28px;">
            <div style="width: 56px; height: 56px; background: var(--primary-light); color: var(--primary); border-radius: var(--radius-md); display: flex; align-items: center; justify-content: center; font-size: 28px; margin: 0 auto 16px;">
                <i class='bx bxs-user-plus'></i>
            </div>
            <h2 style="font-family: var(--font-heading); font-size: 22px; font-weight: 700; color: #0f172a;">Pendaftaran Anggota Baru</h2>
            <p style="color: var(--text-muted); font-size: 13.5px; margin-top: 4px;">Daftar akun untuk meminjam buku dan mengakses layanan sirkulasi. Verifikasi KTM diperlukan sebelum akun aktif meminjam.</p>
        </div>

        <form method="POST" action="exeregister.php" enctype="multipart/form-data">
            <input type="hidden" name="tglentry" value="<?= date('Y-m-d') ?>">
            
            <div class="form-grid">
                <div class="form-group">
                    <label class="form-label">Username <span class="required">*</span></label>
                    <input type="text" name="username" class="form-control" placeholder="Contoh: mhs_polinela" required>
                    <div class="form-hint">Digunakan untuk masuk ke sistem</div>
                </div>

                <div class="form-group">
                    <label class="form-label">Password <span class="required">*</span></label>
                    <input type="password" name="password" class="form-control" maxlength="8" placeholder="Maks. 8 karakter" required>
                    <div class="form-hint">Maksimal 8 karakter</div>
                </div>
            </div>

            <div class="form-grid">
                <div class="form-group">
                    <label class="form-label">Nama Lengkap <span class="required">*</span></label>
                    <input type="text" name="name" class="form-control" placeholder="Nama lengkap siswa/anggota" required>
                </div>

                <div class="form-group">
                    <label class="form-label">Jenis Kelamin <span class="required">*</span></label>
                    <select name="sex" class="form-control" required>
                        <option value="L">Laki-laki (L)</option>
                        <option value="P">Perempuan (P)</option>
                    </select>
                </div>
            </div>

            <div class="form-grid">
                <div class="form-group">
                    <label class="form-label">No. Telepon / WhatsApp <span class="required">*</span></label>
                    <input type="text" name="telp" class="form-control" placeholder="08xxxxxxxxxx" required>
                </div>

                <div class="form-group">
                    <label class="form-label">Alamat Email <span class="required">*</span></label>
                    <input type="email" name="mail" class="form-control" placeholder="email@domain.com" required>
                </div>
            </div>

            <div class="form-group">
                <label class="form-label">Alamat Domisili <span class="required">*</span></label>
                <input type="text" name="alamat" class="form-control" placeholder="Alamat tempat tinggal lengkap" required>
            </div>

            <div class="form-group">
                <label class="form-label">Foto Profil (Opsional)</label>
                <div style="display: flex; gap: 16px; align-items: center;">
                    <div id="previewBox" style="width: 60px; height: 60px; border-radius: var(--radius-full); background: #f1f5f9; display: flex; align-items: center; justify-content: center; overflow: hidden; border: 2px dashed var(--card-border); flex-shrink: 0;">
                        <i class='bx bx-image' style="font-size: 24px; color: var(--text-light);" id="previewIcon"></i>
                        <img id="imagePreview" src="#" alt="Preview" style="display: none; width: 100%; height: 100%; object-fit: cover;">
                    </div>
                    <input type="file" name="file" id="fotoInput" class="form-control" accept="image/*" onchange="previewAvatar(this)">
                </div>
                <div class="form-hint">Format: JPG, PNG, GIF (Maksimal 1 MB)</div>
            </div>

            <div class="form-group" style="background: var(--primary-light); border: 1px solid var(--card-border); border-radius: var(--radius-md); padding: 18px;">
                <label class="form-label" style="display:flex; align-items:center; gap:6px;">
                    <i class='bx bxs-id-card' style="color: var(--primary);"></i>
                    Foto Kartu Tanda Mahasiswa (KTM) <span class="required">*</span>
                </label>
                <p style="font-size: 12.5px; color: var(--text-muted); margin-bottom: 12px;">
                    Wajib diunggah untuk verifikasi keanggotaan. Petugas perpustakaan akan memeriksa KTM Anda sebelum akun dapat digunakan untuk meminjam buku.
                </p>
                <div style="display: flex; gap: 16px; align-items: center; flex-wrap: wrap;">
                    <div id="ktmPreviewBox" style="width: 96px; height: 60px; border-radius: var(--radius-sm); background: #ffffff; display: flex; align-items: center; justify-content: center; overflow: hidden; border: 2px dashed var(--card-border); flex-shrink: 0;">
                        <i class='bx bxs-id-card' style="font-size: 26px; color: var(--text-light);" id="ktmPreviewIcon"></i>
                        <img id="ktmPreview" src="#" alt="Preview KTM" style="display: none; width: 100%; height: 100%; object-fit: cover;">
                    </div>
                    <input type="file" name="ktm_file" id="ktmInput" class="form-control" accept="image/*" onchange="previewKtm(this)" required>
                </div>
                <div class="form-hint">Foto/scan KTM yang jelas dan terbaca. Format: JPG, PNG, WEBP (Maksimal 2 MB).</div>
            </div>

            <div class="form-group">
                <label class="form-label">Deskripsi / Catatan Tambahan</label>
                <textarea name="description" class="form-control" rows="3" placeholder="Informasi kelas, jurusan (RPL, TKJ, dll.) atau keterangan lainnya"></textarea>
            </div>

            <div style="display: flex; gap: 12px; margin-top: 24px;">
                <button type="submit" class="btn btn-primary" style="flex: 1; padding: 12px;">
                    <i class='bx bx-check'></i> Selesaikan Pendaftaran
                </button>
                <button type="reset" class="btn btn-secondary" style="padding: 12px 20px;">
                    Reset
                </button>
            </div>
        </form>

        <div style="margin-top: 24px; padding-top: 20px; border-top: 1px solid var(--card-border); text-align: center; font-size: 13px; color: var(--text-muted);">
            Sudah memiliki akun? <a href="index.php?pg=login" style="font-weight: 600;">Masuk sekarang</a>
        </div>
    </div>
</div>

<script>
function previewAvatar(input) {
    const preview = document.getElementById('imagePreview');
    const icon = document.getElementById('previewIcon');
    if (input.files && input.files[0]) {
        const reader = new FileReader();
        reader.onload = function(e) {
            preview.src = e.target.result;
            preview.style.display = 'block';
            icon.style.display = 'none';
        }
        reader.readAsDataURL(input.files[0]);
    }
}

function previewKtm(input) {
    const preview = document.getElementById('ktmPreview');
    const icon = document.getElementById('ktmPreviewIcon');
    if (input.files && input.files[0]) {
        const reader = new FileReader();
        reader.onload = function(e) {
            preview.src = e.target.result;
            preview.style.display = 'block';
            icon.style.display = 'none';
        }
        reader.readAsDataURL(input.files[0]);
    }
}
</script>
