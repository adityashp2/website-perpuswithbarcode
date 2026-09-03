        <footer class="app-footer">
            <div>
                <strong>Perpustakaan Politeknik Negeri Lampung</strong> &copy; <?= date('Y') ?> &bull; Sistem Informasi Perpustakaan Terpadu
            </div>
            <div>
                Dikembangkan dengan antarmuka modern & responsif
            </div>
        </footer>
    </main>
</div>

<script>
    // Toggle Mobile Sidebar Drawer & Overlay
    const mobileToggle = document.getElementById('mobileToggle');
    const appSidebar = document.getElementById('appSidebar');
    const sidebarOverlay = document.getElementById('sidebarOverlay');
    const sidebarCloseBtn = document.getElementById('sidebarCloseBtn');

    function openSidebar() {
        if (appSidebar) appSidebar.classList.add('show');
        if (sidebarOverlay) sidebarOverlay.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    function closeSidebar() {
        if (appSidebar) appSidebar.classList.remove('show');
        if (sidebarOverlay) sidebarOverlay.classList.remove('active');
        document.body.style.overflow = '';
    }

    if (mobileToggle) {
        mobileToggle.addEventListener('click', (e) => {
            e.stopPropagation();
            openSidebar();
        });
    }

    if (sidebarCloseBtn) {
        sidebarCloseBtn.addEventListener('click', closeSidebar);
    }

    if (sidebarOverlay) {
        sidebarOverlay.addEventListener('click', closeSidebar);
    }

    // Real-Time Live Clock (Waktu & Detik Berjalan Realtime)
    function updateLiveClock() {
        const timeEl = document.getElementById('clockTime');
        const dateEl = document.getElementById('clockDate');
        if (!timeEl && !dateEl) return;

        const now = new Date();
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        const seconds = String(now.getSeconds()).padStart(2, '0');

        if (timeEl) {
            timeEl.textContent = `${hours}:${minutes}:${seconds} WIB`;
        }

        if (dateEl) {
            const months = [
                'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
                'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
            ];
            const day = now.getDate();
            const month = months[now.getMonth()];
            const year = now.getFullYear();
            dateEl.textContent = `${day} ${month} ${year}`;
        }
    }

    // Jalankan segera dan update setiap detik
    updateLiveClock();
    setInterval(updateLiveClock, 1000);

    // Auto dismiss flash alerts after 5 seconds
    setTimeout(() => {
        const alerts = document.querySelectorAll('.alert');
        alerts.forEach(el => {
            el.style.transition = 'opacity 0.5s ease';
            el.style.opacity = '0';
            setTimeout(() => el.remove(), 500);
        });
    }, 5000);
</script>
</body>
</html>
