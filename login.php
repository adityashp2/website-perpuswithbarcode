<?php
require_once __DIR__ . '/koneksi.php';
$user = get_current_user_data();
if ($user) {
    echo "<script>window.location.href='index.php?pg=beranda&admin=" . urlencode($user['admin_id']) . "';</script>";
    exit();
}
?>
<div style="max-width: 440px; margin: 20px auto;">
    <div class="card" style="padding: 32px; box-shadow: var(--shadow-lg);">
        <div style="text-align: center; margin-bottom: 28px;">
            <div style="width: 56px; height: 56px; background: var(--primary-light); color: var(--primary); border-radius: var(--radius-md); display: flex; align-items: center; justify-content: center; font-size: 28px; margin: 0 auto 16px;">
                <i class='bx bxs-user-lock'></i>
            </div>
            <h2 style="font-family: var(--font-heading); font-size: 22px; font-weight: 700; color: #0f172a;">Masuk ke Akun</h2>
            <p style="color: var(--text-muted); font-size: 13.5px; margin-top: 4px;">Akses layanan perpustakaan digital Polinela</p>
        </div>

        <form method="POST" action="exelogin.php">
            <div class="form-group">
                <label class="form-label">Username</label>
                <div style="position: relative;">
                    <i class='bx bx-user' style="position: absolute; left: 14px; top: 50%; transform: translateY(-50%); color: var(--text-muted); font-size: 18px;"></i>
                    <input type="text" name="user" id="loginUsername" class="form-control" style="padding-left: 42px;" placeholder="Masukkan username Anda" required autofocus>
                </div>
            </div>

            <div class="form-group">
                <label class="form-label">Password</label>
                <div style="position: relative;">
                    <i class='bx bx-lock-alt' style="position: absolute; left: 14px; top: 50%; transform: translateY(-50%); color: var(--text-muted); font-size: 18px;"></i>
                    <input type="password" name="pass" id="loginPassword" class="form-control" style="padding-left: 42px; padding-right: 42px;" placeholder="Masukkan password" required>
                    <button type="button" onclick="togglePassVisibility()" style="position: absolute; right: 14px; top: 50%; transform: translateY(-50%); background: none; border: none; color: var(--text-muted); cursor: pointer;">
                        <i class='bx bx-show' id="passIcon" style="font-size: 18px;"></i>
                    </button>
                </div>
            </div>

            <button type="submit" class="btn btn-primary" style="width: 100%; padding: 12px; font-size: 14px; margin-top: 8px;">
                <i class='bx bx-log-in'></i> Masuk Sekarang
            </button>
        </form>

        <div style="margin-top: 24px; padding-top: 20px; border-top: 1px solid var(--card-border); text-align: center; font-size: 13px; color: var(--text-muted);">
            Belum memiliki akun anggota? <a href="index.php?pg=register" style="font-weight: 600;">Daftar di sini</a>
        </div>

        <!-- Demo Account Quick Fill Helper -->
        <div style="margin-top: 20px; padding: 12px 14px; background: #f8fafc; border-radius: var(--radius-sm); border: 1px dashed var(--card-border); font-size: 12px;">
            <div style="font-weight: 600; color: #475569; margin-bottom: 4px;">Akun Demo Default:</div>
            <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 6px;">
                <span>Admin: <code>admin</code> / <code>admin</code></span>
                <button type="button" class="btn btn-secondary btn-sm" style="padding: 3px 8px; font-size: 11px;" onclick="fillLogin('admin', 'admin')">Isi Form</button>
            </div>
        </div>
    </div>
</div>

<script>
function togglePassVisibility() {
    const passInput = document.getElementById('loginPassword');
    const passIcon = document.getElementById('passIcon');
    if (passInput.type === 'password') {
        passInput.type = 'text';
        passIcon.classList.replace('bx-show', 'bx-hide');
    } else {
        passInput.type = 'password';
        passIcon.classList.replace('bx-hide', 'bx-show');
    }
}

function fillLogin(u, p) {
    document.getElementById('loginUsername').value = u;
    document.getElementById('loginPassword').value = p;
}
</script>
