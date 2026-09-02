<?php
/**
 * Halaman Cetak Label Barcode Buku
 * Standalone page (tidak pakai layout/header/footer) agar bisa langsung di-print
 */
require_once __DIR__ . '/koneksi.php';

$user = get_current_user_data();
if (!$user || $user['type'] !== 'ADM') {
    die("<p style='color:red;font-family:sans-serif;padding:20px;'>Akses ditolak. Silakan login sebagai Admin.</p>");
}

// Kalau ada ISBN spesifik, cetak satu; kalau tidak, cetak semua
$filter_isbn = $_GET['isbn'] ?? '';
$isbn_esc    = db_escape($filter_isbn);

if ($filter_isbn) {
    $where = "WHERE b.isbn = '$isbn_esc'";
} else {
    $where = '';
}

$buku_list = db_fetch_all(db_query("
    SELECT b.isbn, b.judul, b.tahun, b.qty_stok, 
           pg.nama_pengarang, kg.nama as nama_katalog
    FROM buku b
    LEFT JOIN pengarang pg ON pg.id_pengarang = b.id_pengarang
    LEFT JOIN katalog kg ON kg.id_katalog = b.id_katalog
    $where
    ORDER BY b.judul ASC
"));
?>
<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Cetak Label Barcode Buku — Pustaka Polinela</title>
    <script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.11.6/dist/JsBarcode.all.min.js"></script>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700&display=swap');
        
        * { box-sizing: border-box; margin: 0; padding: 0; }
        
        body {
            font-family: 'Plus Jakarta Sans', sans-serif;
            background: #f1f5f9;
            padding: 24px;
        }

        /* Print Controls Bar (hidden on print) */
        .print-controls {
            background: #1e293b;
            color: #fff;
            padding: 16px 24px;
            border-radius: 12px;
            margin-bottom: 24px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            flex-wrap: wrap;
            gap: 12px;
        }
        .print-controls h2 { font-size: 16px; font-weight: 700; }
        .print-controls p  { font-size: 13px; color: #94a3b8; margin-top: 2px; }
        .btn-print {
            background: #4f46e5;
            color: #fff;
            border: none;
            padding: 10px 24px;
            border-radius: 8px;
            font-size: 14px;
            font-weight: 700;
            cursor: pointer;
            display: flex;
            align-items: center;
            gap: 8px;
            text-decoration: none;
        }
        .btn-print:hover { background: #4338ca; }
        .btn-back {
            background: #334155;
            color: #fff;
            border: none;
            padding: 10px 20px;
            border-radius: 8px;
            font-size: 14px;
            font-weight: 600;
            cursor: pointer;
            text-decoration: none;
        }

        /* Label Grid */
        .labels-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
            gap: 16px;
        }

        /* Single Book Label Card */
        .label-card {
            background: #ffffff;
            border: 2px solid #e2e8f0;
            border-radius: 12px;
            padding: 16px;
            text-align: center;
            break-inside: avoid;
            page-break-inside: avoid;
        }

        .label-card .library-name {
            font-size: 9px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.8px;
            color: #64748b;
            margin-bottom: 6px;
        }

        .label-card .book-title {
            font-size: 12px;
            font-weight: 700;
            color: #0f172a;
            line-height: 1.3;
            min-height: 32px;
            margin-bottom: 10px;
            display: -webkit-box;
            -webkit-line-clamp: 2;
            -webkit-box-orient: vertical;
            overflow: hidden;
        }

        .label-card .barcode-wrap {
            display: flex;
            justify-content: center;
            align-items: center;
            background: #f8fafc;
            border-radius: 8px;
            padding: 8px;
            margin-bottom: 8px;
        }

        .label-card .barcode-wrap svg {
            max-width: 100%;
        }

        .label-card .isbn-text {
            font-family: 'Courier New', monospace;
            font-size: 10px;
            font-weight: 700;
            color: #334155;
            letter-spacing: 0.5px;
            margin-bottom: 4px;
        }

        .label-card .meta-row {
            font-size: 10px;
            color: #64748b;
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-top: 6px;
            padding-top: 6px;
            border-top: 1px solid #f1f5f9;
        }

        .label-card .katalog-badge {
            background: #eef2ff;
            color: #4f46e5;
            padding: 1px 7px;
            border-radius: 99px;
            font-weight: 700;
            font-size: 9px;
        }

        @media print {
            body { background: #fff; padding: 0; }
            .print-controls { display: none !important; }
            .labels-grid {
                grid-template-columns: repeat(4, 1fr);
                gap: 8px;
            }
            .label-card {
                border-color: #cbd5e1;
                border-radius: 6px;
                padding: 10px;
            }
        }

        @page {
            size: A4;
            margin: 12mm;
        }
    </style>
</head>
<body>

<!-- Print Controls -->
<div class="print-controls">
    <div>
        <h2>🏷️ Label Barcode Buku — Perpustakaan Politeknik Negeri Lampung</h2>
        <p><?= count($buku_list) ?> label siap cetak. Gunakan gunting/cutter untuk memotong dan tempel pada punggung/halaman buku fisik.</p>
    </div>
    <div style="display:flex; gap:10px; flex-wrap:wrap;">
        <a href="javascript:window.close();" class="btn-back">← Kembali</a>
        <button class="btn-print" onclick="window.print()">🖨️ Cetak Label Sekarang</button>
    </div>
</div>

<!-- Labels Grid -->
<?php if (empty($buku_list)): ?>
    <div style="text-align:center; padding:60px; color:#64748b; background:#fff; border-radius:12px;">
        <p style="font-size:18px; font-weight:700;">Tidak ada buku ditemukan.</p>
    </div>
<?php else: ?>
<div class="labels-grid" id="labelsGrid">
    <?php foreach ($buku_list as $b): ?>
        <div class="label-card">
            <div class="library-name">📚 UPT Perpustakaan — Polinela</div>
            <div class="book-title"><?= htmlspecialchars($b['judul']) ?></div>
            <div class="barcode-wrap">
                <svg class="barcode-render" data-isbn="<?= htmlspecialchars($b['isbn']) ?>"></svg>
            </div>
            <div class="isbn-text"><?= htmlspecialchars($b['isbn']) ?></div>
            <div class="meta-row">
                <span><?= htmlspecialchars($b['nama_pengarang'] ?? '-') ?></span>
                <span class="katalog-badge"><?= htmlspecialchars($b['nama_katalog'] ?? 'Umum') ?></span>
            </div>
        </div>
    <?php endforeach; ?>
</div>
<?php endif; ?>

<script>
document.querySelectorAll('.barcode-render').forEach(function(svg) {
    var isbn = svg.getAttribute('data-isbn');
    try {
        JsBarcode(svg, isbn, {
            format: 'CODE128',
            width: 1.5,
            height: 40,
            displayValue: false,
            margin: 2,
            background: 'transparent',
            lineColor: '#1e293b'
        });
    } catch(e) {
        svg.parentElement.innerHTML = '<span style="font-size:11px;color:#ef4444;">Barcode error: ' + isbn + '</span>';
    }
});
</script>
</body>
</html>
