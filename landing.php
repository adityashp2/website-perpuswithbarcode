<?php
// Standalone Dedicated Landing Page for Public Visitors / Guests (Tamu)
if (!defined('APP_INIT')) {
    define('APP_INIT', true);
}
require_once __DIR__ . '/koneksi.php';

// If user is already logged in, redirect them directly to their internal dashboard
$user = get_current_user_data();
if ($user) {
    header("Location: index.php?pg=beranda");
    exit();
}

// Fetch Quick Stats from DB
$stat_buku = (int)(db_fetch_one(db_query("SELECT COUNT(*) as total FROM buku"))['total'] ?? 0);
$stat_stok = (int)(db_fetch_one(db_query("SELECT SUM(qty_stok) as total FROM buku"))['total'] ?? 0);
$stat_katalog = (int)(db_fetch_one(db_query("SELECT COUNT(*) as total FROM katalog"))['total'] ?? 0);
$stat_pengarang = (int)(db_fetch_one(db_query("SELECT COUNT(*) as total FROM pengarang"))['total'] ?? 0);
$stat_anggota = (int)(db_fetch_one(db_query("SELECT COUNT(*) as total FROM anggota"))['total'] ?? 0);

// Fetch Featured Books
$q_featured = db_query("
    SELECT b.isbn, b.judul, b.tahun, b.qty_stok, b.foto, 
           pn.nama_penerbit, pg.nama_pengarang, kg.nama as nama_katalog, kg.id_katalog
    FROM buku b 
    LEFT JOIN penerbit pn ON pn.id_penerbit = b.id_penerbit 
    LEFT JOIN pengarang pg ON pg.id_pengarang = b.id_pengarang 
    LEFT JOIN katalog kg ON kg.id_katalog = b.id_katalog 
    ORDER BY b.tahun DESC, b.qty_stok DESC 
    LIMIT 8
");
$featured_books = db_fetch_all($q_featured);

// Fetch All Categories / Katalog with Book Counts
$q_categories = db_query("
    SELECT k.id_katalog, k.nama, COUNT(b.isbn) as total_buku
    FROM katalog k
    LEFT JOIN buku b ON b.id_katalog = k.id_katalog
    GROUP BY k.id_katalog, k.nama
    ORDER BY total_buku DESC, k.nama ASC
");
$categories_list = db_fetch_all($q_categories);

$category_icons = [
    'KG0' => 'bx-code-alt',
    'KG1' => 'bx-leaf',
    'KG2' => 'bx-line-chart',
    'KG3' => 'bx-wrench',
    'KG4' => 'bx-dna',
    'KG5' => 'bx-book-reader',
];
?>
<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Pustaka Polinela | Perpustakaan Politeknik Negeri Lampung</title>
    <meta name="description" content="Portal Resmi Perpustakaan Politeknik Negeri Lampung (Polinela). Pusat literasi sains, teknologi terapan, buku vokasi, dan sirkulasi digital barcode.">
    <!-- Google Fonts -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800;900&family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
    <!-- Boxicons -->
    <link href="https://unpkg.com/boxicons@2.1.4/css/boxicons.min.css" rel="stylesheet">
    
    <style>
        /* ═══════════════════ STANDALONE LANDING PAGE STYLES ═══════════════════ */
        *, *::before, *::after {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
        }

        :root {
            --primary: #4f46e5;
            --primary-hover: #4338ca;
            --primary-light: #eef2ff;
            --secondary: #0ea5e9;
            --dark-navy: #0f172a;
            --dark-slate: #1e293b;
            --text-main: #0f172a;
            --text-muted: #64748b;
            --bg-light: #f8fafc;
            --card-border: #e2e8f0;
            --font-heading: 'Outfit', sans-serif;
            --font-body: 'Plus Jakarta Sans', sans-serif;
        }

        html {
            scroll-behavior: smooth;
        }

        body {
            font-family: var(--font-body);
            background-color: #ffffff;
            color: var(--text-main);
            line-height: 1.6;
            overflow-x: hidden;
            -webkit-font-smoothing: antialiased;
        }

        a {
            text-decoration: none;
            color: inherit;
            transition: all 0.2s ease;
        }

        /* ═══════════════════ TOP NAVIGATION NAVBAR ═══════════════════ */
        .landing-navbar {
            position: sticky;
            top: 0;
            z-index: 1000;
            background: rgba(255, 255, 255, 0.9);
            backdrop-filter: blur(12px);
            border-bottom: 1px solid #e2e8f0;
            transition: all 0.3s ease;
        }

        .nav-container {
            max-width: 1240px;
            margin: 0 auto;
            padding: 14px 24px;
            display: flex;
            align-items: center;
            justify-content: space-between;
        }

        .nav-brand {
            display: flex;
            align-items: center;
            gap: 12px;
        }

        .brand-logo-icon {
            width: 42px;
            height: 42px;
            border-radius: 12px;
            background: linear-gradient(135deg, var(--primary), #8b5cf6);
            color: #ffffff;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 22px;
            box-shadow: 0 4px 12px rgba(79, 70, 229, 0.3);
        }

        .brand-text h1 {
            font-family: var(--font-heading);
            font-size: 18px;
            font-weight: 800;
            color: var(--dark-navy);
            line-height: 1.1;
        }

        .brand-text p {
            font-size: 11.5px;
            color: var(--text-muted);
            font-weight: 600;
        }

        .nav-links {
            display: flex;
            align-items: center;
            gap: 28px;
            list-style: none;
        }

        .nav-link {
            font-size: 14px;
            font-weight: 600;
            color: #475569;
            transition: color 0.2s ease;
        }

        .nav-link:hover {
            color: var(--primary);
        }

        .nav-auth-buttons {
            display: flex;
            align-items: center;
            gap: 10px;
        }

        .btn-nav-login {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            padding: 9px 18px;
            border-radius: 10px;
            font-size: 13.5px;
            font-weight: 700;
            color: #1e293b;
            background: #f1f5f9;
            border: 1px solid #cbd5e1;
            transition: all 0.2s ease;
        }

        .btn-nav-login:hover {
            background: #e2e8f0;
            color: #0f172a;
        }

        .btn-nav-register {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            padding: 9px 20px;
            border-radius: 10px;
            font-size: 13.5px;
            font-weight: 700;
            color: #ffffff;
            background: linear-gradient(135deg, var(--primary), var(--primary-hover));
            box-shadow: 0 4px 14px rgba(79, 70, 229, 0.3);
            transition: all 0.2s ease;
        }

        .btn-nav-register:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 18px rgba(79, 70, 229, 0.45);
        }

        /* ═══════════════════ HERO SECTION ═══════════════════ */
        .landing-hero {
            position: relative;
            background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%);
            padding: 90px 24px 80px 24px;
            color: #ffffff;
            overflow: hidden;
        }

        .hero-glow-bg {
            position: absolute;
            top: -20%;
            left: 50%;
            transform: translateX(-50%);
            width: 800px;
            height: 500px;
            background: radial-gradient(circle, rgba(79, 70, 229, 0.35) 0%, rgba(14, 165, 233, 0.15) 50%, transparent 70%);
            filter: blur(80px);
            pointer-events: none;
        }

        .hero-container {
            max-width: 1080px;
            margin: 0 auto;
            position: relative;
            z-index: 2;
            text-align: center;
        }

        .hero-badge {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            background: rgba(255, 255, 255, 0.1);
            border: 1px solid rgba(255, 255, 255, 0.2);
            backdrop-filter: blur(8px);
            padding: 7px 18px;
            border-radius: 99px;
            font-size: 13px;
            font-weight: 700;
            color: #e0e7ff;
            margin-bottom: 28px;
            box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
        }

        .pulse-dot {
            width: 8px;
            height: 8px;
            background: #10b981;
            border-radius: 50%;
            box-shadow: 0 0 10px #10b981;
            animation: pulseGlow 1.8s infinite;
        }

        @keyframes pulseGlow {
            0% { transform: scale(0.95); opacity: 0.8; }
            50% { transform: scale(1.3); opacity: 1; }
            100% { transform: scale(0.95); opacity: 0.8; }
        }

        .hero-title {
            font-family: var(--font-heading);
            font-size: clamp(34px, 5.5vw, 54px);
            font-weight: 900;
            line-height: 1.15;
            letter-spacing: -1px;
            margin-bottom: 20px;
        }

        .text-gradient {
            background: linear-gradient(135deg, #38bdf8 0%, #818cf8 50%, #c084fc 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
        }

        .hero-subtitle {
            font-size: 17px;
            line-height: 1.65;
            color: #cbd5e1;
            max-width: 760px;
            margin: 0 auto 38px auto;
        }

        /* Search Box in Hero */
        .hero-search-box {
            background: rgba(255, 255, 255, 0.08);
            backdrop-filter: blur(16px);
            border: 1px solid rgba(255, 255, 255, 0.18);
            border-radius: 22px;
            padding: 12px;
            max-width: 760px;
            margin: 0 auto 48px auto;
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.35);
        }

        .hero-search-form {
            display: flex;
            gap: 10px;
            align-items: center;
        }

        .hero-input-wrap {
            position: relative;
            flex: 1;
            display: flex;
            align-items: center;
        }

        .hero-input-wrap i {
            position: absolute;
            left: 18px;
            font-size: 22px;
            color: #94a3b8;
        }

        .hero-input-wrap input {
            width: 100%;
            padding: 15px 20px 15px 52px;
            border-radius: 14px;
            background: #ffffff;
            border: none;
            font-size: 15px;
            font-weight: 500;
            color: #0f172a;
            outline: none;
            box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.04);
        }

        .hero-input-wrap input::placeholder {
            color: #94a3b8;
        }

        .hero-btn-submit {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            background: linear-gradient(135deg, #4f46e5, #4338ca);
            color: #ffffff;
            border: none;
            padding: 15px 28px;
            border-radius: 14px;
            font-size: 15px;
            font-weight: 700;
            cursor: pointer;
            box-shadow: 0 4px 14px rgba(79, 70, 229, 0.4);
            transition: all 0.2s ease;
            white-space: nowrap;
        }

        .hero-btn-submit:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 24px rgba(79, 70, 229, 0.55);
        }

        .hero-quick-chips {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            flex-wrap: wrap;
            margin-top: 12px;
            padding-top: 10px;
            border-top: 1px solid rgba(255, 255, 255, 0.1);
        }

        .quick-chip {
            display: inline-block;
            padding: 5px 14px;
            border-radius: 99px;
            font-size: 12px;
            font-weight: 600;
            background: rgba(255, 255, 255, 0.12);
            color: #f1f5f9;
            border: 1px solid rgba(255, 255, 255, 0.16);
            transition: all 0.2s ease;
        }

        .quick-chip:hover {
            background: rgba(255, 255, 255, 0.25);
            color: #ffffff;
            transform: translateY(-1px);
        }

        /* Hero Live Stats Cards */
        .hero-stats-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 16px;
        }

        .stat-card-glass {
            background: rgba(255, 255, 255, 0.06);
            border: 1px solid rgba(255, 255, 255, 0.12);
            backdrop-filter: blur(10px);
            border-radius: 18px;
            padding: 18px;
            display: flex;
            align-items: center;
            gap: 14px;
            text-align: left;
            transition: transform 0.2s ease, background 0.2s ease;
        }

        .stat-card-glass:hover {
            transform: translateY(-3px);
            background: rgba(255, 255, 255, 0.1);
        }

        .stat-icon {
            width: 48px;
            height: 48px;
            border-radius: 14px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 24px;
            flex-shrink: 0;
        }

        .stat-icon.icon-indigo { background: rgba(99, 102, 241, 0.25); color: #818cf8; }
        .stat-icon.icon-emerald { background: rgba(16, 185, 129, 0.25); color: #34d399; }
        .stat-icon.icon-sky { background: rgba(14, 165, 233, 0.25); color: #38bdf8; }
        .stat-icon.icon-amber { background: rgba(245, 158, 11, 0.25); color: #fbbf24; }

        .stat-num {
            font-family: var(--font-heading);
            font-size: 22px;
            font-weight: 800;
            color: #ffffff;
            line-height: 1.1;
        }

        .stat-desc {
            font-size: 12.5px;
            color: #94a3b8;
            margin-top: 3px;
            font-weight: 500;
        }

        /* ═══════════════════ COMMON SECTIONS ═══════════════════ */
        .section-container {
            max-width: 1240px;
            margin: 0 auto;
            padding: 80px 24px;
        }

        .section-head {
            text-align: center;
            max-width: 700px;
            margin: 0 auto 48px auto;
        }

        .section-tag {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            padding: 6px 14px;
            border-radius: 99px;
            background: #eef2ff;
            color: var(--primary);
            font-size: 13px;
            font-weight: 700;
            margin-bottom: 12px;
            border: 1px solid #e0e7ff;
        }

        .section-heading {
            font-family: var(--font-heading);
            font-size: clamp(28px, 4vw, 36px);
            font-weight: 800;
            color: var(--dark-navy);
            letter-spacing: -0.5px;
            margin-bottom: 12px;
        }

        .section-subtext {
            font-size: 16px;
            color: var(--text-muted);
            line-height: 1.6;
        }

        /* ═══════════════════ FEATURED BOOKS ═══════════════════ */
        .books-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(270px, 1fr));
            gap: 26px;
        }

        .book-card-item {
            background: #ffffff;
            border: 1px solid #e2e8f0;
            border-radius: 20px;
            overflow: hidden;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .book-card-item:hover {
            transform: translateY(-6px);
            box-shadow: 0 16px 32px rgba(0, 0, 0, 0.1);
            border-color: #cbd5e1;
        }

        .book-cover-wrap {
            position: relative;
            width: 100%;
            height: 220px;
            background: #0f172a;
            overflow: hidden;
        }

        .book-cover-wrap img {
            width: 100%;
            height: 100%;
            object-fit: cover;
            transition: transform 0.3s ease;
        }

        .book-card-item:hover .book-cover-wrap img {
            transform: scale(1.05);
        }

        .book-year-pill {
            position: absolute;
            top: 12px;
            left: 12px;
            background: rgba(15, 23, 42, 0.85);
            backdrop-filter: blur(6px);
            color: #ffffff;
            font-size: 11px;
            font-weight: 700;
            padding: 4px 9px;
            border-radius: 6px;
        }

        .book-katalog-pill {
            position: absolute;
            bottom: 12px;
            left: 12px;
            background: var(--primary);
            color: #ffffff;
            font-size: 11.5px;
            font-weight: 700;
            padding: 4px 12px;
            border-radius: 99px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        }

        .book-card-body {
            padding: 20px;
            display: flex;
            flex-direction: column;
            flex: 1;
            justify-content: space-between;
        }

        .book-name {
            font-family: var(--font-heading);
            font-size: 16px;
            font-weight: 800;
            color: var(--dark-navy);
            margin-bottom: 12px;
            line-height: 1.35;
            display: -webkit-box;
            -webkit-line-clamp: 2;
            -webkit-box-orient: vertical;
            overflow: hidden;
            height: 44px;
        }

        .book-meta-list {
            display: flex;
            flex-direction: column;
            gap: 6px;
            font-size: 12.5px;
            color: var(--text-muted);
            margin-bottom: 18px;
        }

        .book-meta-list div {
            display: flex;
            align-items: center;
            gap: 6px;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }

        .book-card-bottom {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding-top: 14px;
            border-top: 1px solid #f1f5f9;
        }

        .stock-tag {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            font-size: 12px;
            font-weight: 700;
        }

        .stock-tag.in { color: #059669; }
        .stock-tag.out { color: #dc2626; }

        .btn-view-book {
            display: inline-flex;
            align-items: center;
            gap: 4px;
            padding: 7px 14px;
            border-radius: 8px;
            background: #f1f5f9;
            color: var(--dark-navy);
            font-size: 12.5px;
            font-weight: 700;
            transition: all 0.2s ease;
        }

        .btn-view-book:hover {
            background: var(--primary);
            color: #ffffff;
        }

        /* ═══════════════════ CATEGORIES SECTION ═══════════════════ */
        .bg-light-section {
            background: #f8fafc;
            border-top: 1px solid #e2e8f0;
            border-bottom: 1px solid #e2e8f0;
        }

        .categories-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
            gap: 20px;
        }

        .category-box {
            background: #ffffff;
            border: 1px solid #e2e8f0;
            border-radius: 18px;
            padding: 20px;
            display: flex;
            align-items: center;
            gap: 16px;
            transition: all 0.2s ease;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.03);
        }

        .category-box:hover {
            transform: translateY(-4px);
            border-color: var(--primary);
            box-shadow: 0 10px 28px rgba(79, 70, 229, 0.12);
        }

        .cat-icon-holder {
            width: 50px;
            height: 50px;
            border-radius: 14px;
            background: #eef2ff;
            color: var(--primary);
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 26px;
            flex-shrink: 0;
            transition: all 0.2s ease;
        }

        .category-box:hover .cat-icon-holder {
            background: var(--primary);
            color: #ffffff;
        }

        .cat-info h4 {
            font-family: var(--font-heading);
            font-size: 16px;
            font-weight: 700;
            color: var(--dark-navy);
            margin-bottom: 3px;
        }

        .cat-info p {
            font-size: 12.5px;
            color: var(--text-muted);
            font-weight: 500;
        }

        /* ═══════════════════ ADVANTAGES SECTION ═══════════════════ */
        .advantages-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
            gap: 26px;
        }

        .adv-card {
            background: #ffffff;
            border: 1px solid #e2e8f0;
            border-radius: 22px;
            padding: 32px 26px;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            box-shadow: 0 4px 18px rgba(0, 0, 0, 0.04);
            transition: transform 0.2s ease, box-shadow 0.2s ease;
        }

        .adv-card:hover {
            transform: translateY(-5px);
            box-shadow: 0 14px 32px rgba(0, 0, 0, 0.08);
        }

        .adv-icon-box {
            width: 54px;
            height: 54px;
            border-radius: 16px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 28px;
            margin-bottom: 22px;
        }

        .icon-emerald { background: #d1fae5; color: #059669; }
        .icon-indigo { background: #e0e7ff; color: #4338ca; }
        .icon-sky { background: #e0f2fe; color: #0284c7; }
        .icon-amber { background: #fef3c7; color: #d97706; }

        .adv-card h3 {
            font-family: var(--font-heading);
            font-size: 18px;
            font-weight: 800;
            color: var(--dark-navy);
            margin-bottom: 10px;
        }

        .adv-card p {
            font-size: 14px;
            color: var(--text-muted);
            line-height: 1.6;
            margin-bottom: 20px;
            flex: 1;
        }

        .adv-badge-chip {
            display: inline-flex;
            align-items: center;
            gap: 4px;
            font-size: 12px;
            font-weight: 700;
            color: #475569;
            background: #f8fafc;
            padding: 5px 12px;
            border-radius: 99px;
            border: 1px solid #e2e8f0;
            align-self: flex-start;
        }

        /* ═══════════════════ WORKFLOW SECTION ═══════════════════ */
        .steps-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 22px;
        }

        .step-item {
            background: #ffffff;
            border: 1px solid #e2e8f0;
            border-radius: 22px;
            padding: 28px 22px;
            position: relative;
            box-shadow: 0 4px 16px rgba(0, 0, 0, 0.04);
        }

        .step-num {
            font-family: var(--font-heading);
            font-size: 36px;
            font-weight: 900;
            color: #e2e8f0;
            line-height: 1;
            margin-bottom: 12px;
        }

        .step-icon-round {
            width: 46px;
            height: 46px;
            border-radius: 14px;
            background: #eef2ff;
            color: var(--primary);
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 24px;
            margin-bottom: 16px;
        }

        .step-item h4 {
            font-family: var(--font-heading);
            font-size: 16px;
            font-weight: 800;
            color: var(--dark-navy);
            margin-bottom: 8px;
        }

        .step-item p {
            font-size: 13.5px;
            color: var(--text-muted);
            line-height: 1.5;
        }

        /* ═══════════════════ OPERATIONAL & FACILITIES ═══════════════════ */
        .info-split-grid {
            display: grid;
            grid-template-columns: 1fr 1.2fr;
            gap: 32px;
        }

        .info-card-box {
            background: #ffffff;
            border: 1px solid #e2e8f0;
            border-radius: 24px;
            padding: 38px 32px;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.04);
        }

        .info-card-box h2 {
            font-family: var(--font-heading);
            font-size: 26px;
            font-weight: 800;
            color: var(--dark-navy);
            margin: 12px 0 14px 0;
        }

        .schedule-rows {
            display: flex;
            flex-direction: column;
            gap: 12px;
            margin: 24px 0;
        }

        .schedule-row {
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 12px;
            padding: 14px 18px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            flex-wrap: wrap;
            gap: 8px;
            font-size: 14px;
        }

        .schedule-row strong {
            color: var(--dark-navy);
            display: flex;
            align-items: center;
            gap: 6px;
        }

        .schedule-row span.open { color: #059669; font-weight: 700; }
        .schedule-row span.closed { color: #dc2626; font-weight: 700; }

        .location-banner {
            display: flex;
            align-items: flex-start;
            gap: 14px;
            background: #eef2ff;
            border: 1px solid #e0e7ff;
            padding: 16px 20px;
            border-radius: 16px;
            color: var(--primary);
        }

        .location-banner i {
            font-size: 26px;
            margin-top: 2px;
        }

        .location-banner div {
            font-size: 13.5px;
            color: #334155;
        }

        .location-banner strong {
            display: block;
            color: var(--dark-navy);
            font-weight: 700;
            margin-bottom: 2px;
        }

        .facility-mini-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 16px;
            margin-top: 20px;
        }

        .fac-card {
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 18px;
            padding: 18px;
            display: flex;
            gap: 12px;
            align-items: flex-start;
        }

        .fac-icon-holder {
            width: 40px;
            height: 40px;
            border-radius: 12px;
            background: #e0e7ff;
            color: var(--primary);
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 22px;
            flex-shrink: 0;
        }

        .fac-card h4 {
            font-family: var(--font-heading);
            font-size: 14.5px;
            font-weight: 700;
            color: var(--dark-navy);
            margin-bottom: 4px;
        }

        .fac-card p {
            font-size: 12.5px;
            color: var(--text-muted);
            line-height: 1.4;
        }

        /* ═══════════════════ CTA BANNER ═══════════════════ */
        .cta-section {
            background: linear-gradient(135deg, #4338ca 0%, #3730a3 50%, #1e1b4b 100%);
            border-radius: 32px;
            padding: 56px 48px;
            color: #ffffff;
            box-shadow: 0 24px 48px rgba(67, 56, 202, 0.25);
            margin: 0 24px 80px 24px;
        }

        .cta-wrapper {
            max-width: 1140px;
            margin: 0 auto;
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 36px;
            flex-wrap: wrap;
        }

        .cta-text {
            max-width: 620px;
        }

        .cta-text h2 {
            font-family: var(--font-heading);
            font-size: clamp(26px, 4vw, 36px);
            font-weight: 800;
            margin-bottom: 12px;
            letter-spacing: -0.5px;
        }

        .cta-text p {
            font-size: 16px;
            color: #e0e7ff;
            line-height: 1.6;
            margin-bottom: 28px;
        }

        .cta-btns {
            display: flex;
            gap: 14px;
            flex-wrap: wrap;
        }

        .btn-cta-white {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            background: #ffffff;
            color: #4338ca;
            font-weight: 800;
            font-size: 15px;
            padding: 14px 28px;
            border-radius: 14px;
            box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
            transition: transform 0.2s ease;
        }

        .btn-cta-white:hover {
            transform: translateY(-2px);
        }

        .btn-cta-outline {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            background: rgba(255, 255, 255, 0.15);
            color: #ffffff;
            border: 1px solid rgba(255, 255, 255, 0.25);
            font-weight: 700;
            font-size: 15px;
            padding: 14px 26px;
            border-radius: 14px;
            transition: all 0.2s ease;
        }

        .btn-cta-outline:hover {
            background: rgba(255, 255, 255, 0.25);
            transform: translateY(-2px);
        }

        /* ═══════════════════ FOOTER ═══════════════════ */
        .landing-footer {
            background: #0f172a;
            color: #94a3b8;
            padding: 70px 24px 30px 24px;
            border-top: 1px solid #1e293b;
        }

        .footer-container {
            max-width: 1240px;
            margin: 0 auto;
            display: grid;
            grid-template-columns: 2fr 1fr 1fr 1.5fr;
            gap: 40px;
            margin-bottom: 50px;
        }

        .footer-brand h3 {
            font-family: var(--font-heading);
            color: #ffffff;
            font-size: 20px;
            font-weight: 800;
            margin-bottom: 12px;
            display: flex;
            align-items: center;
            gap: 8px;
        }

        .footer-brand p {
            font-size: 14px;
            line-height: 1.6;
            margin-bottom: 20px;
        }

        .footer-col h4 {
            font-family: var(--font-heading);
            color: #ffffff;
            font-size: 16px;
            font-weight: 700;
            margin-bottom: 18px;
        }

        .footer-links-list {
            list-style: none;
            display: flex;
            flex-direction: column;
            gap: 10px;
            font-size: 14px;
        }

        .footer-links-list a:hover {
            color: #ffffff;
        }

        .footer-bottom {
            max-width: 1240px;
            margin: 0 auto;
            padding-top: 24px;
            border-top: 1px solid #1e293b;
            display: flex;
            justify-content: space-between;
            align-items: center;
            font-size: 13px;
            flex-wrap: wrap;
            gap: 12px;
        }

        /* Responsive */
        @media (max-width: 1024px) {
            .hero-stats-grid { grid-template-columns: repeat(2, 1fr); }
            .steps-grid { grid-template-columns: repeat(2, 1fr); }
            .info-split-grid { grid-template-columns: 1fr; }
            .footer-container { grid-template-columns: 1fr 1fr; }
        }

        @media (max-width: 768px) {
            .nav-links { display: none; }
            .landing-hero { padding: 60px 16px 50px 16px; }
            .hero-search-form { flex-direction: column; }
            .hero-btn-submit { width: 100%; justify-content: center; }
            .hero-stats-grid { grid-template-columns: 1fr; }
            .steps-grid { grid-template-columns: 1fr; }
            .facility-mini-grid { grid-template-columns: 1fr; }
            .cta-section { padding: 40px 24px; margin: 0 16px 60px 16px; }
            .footer-container { grid-template-columns: 1fr; }
            .footer-bottom { flex-direction: column; text-align: center; }
        }
    </style>
</head>
<body>

    <!-- ═══════════════════ NAVBAR ═══════════════════ -->
    <header class="landing-navbar">
        <div class="nav-container">
            <a href="index.php" class="nav-brand">
                <div class="brand-logo-icon">
                    <i class='bx bxs-book-reader'></i>
                </div>
                <div class="brand-text">
                    <h1>Pustaka Polinela</h1>
                    <p>Politeknik Negeri Lampung</p>
                </div>
            </a>

            <ul class="nav-links">
                <li><a href="#hero" class="nav-link">Beranda</a></li>
                <li><a href="#koleksi" class="nav-link">Koleksi Buku</a></li>
                <li><a href="#kategori" class="nav-link">Kategori</a></li>
                <li><a href="#keunggulan" class="nav-link">Keunggulan</a></li>
                <li><a href="#alur" class="nav-link">Alur Pinjam</a></li>
                <li><a href="#jadwal" class="nav-link">Jam Buka</a></li>
            </ul>

            <div class="nav-auth-buttons">
                <a href="index.php?pg=login" class="btn-nav-login">
                    <i class='bx bx-log-in'></i> Masuk
                </a>
                <a href="index.php?pg=register" class="btn-nav-register">
                    <i class='bx bx-user-plus'></i> Daftar Anggota
                </a>
            </div>
        </div>
    </header>

    <!-- ═══════════════════ HERO ═══════════════════ -->
    <section class="landing-hero" id="hero">
        <div class="hero-glow-bg"></div>
        <div class="hero-container">
            <div class="hero-badge">
                <span class="pulse-dot"></span>
                <i class='bx bxs-institution'></i> UPT Perpustakaan Politeknik Negeri Lampung
            </div>

            <h1 class="hero-title">
                Pintu Gerbang Literasi & <span class="text-gradient">Sains Terapan</span> Vokasi
            </h1>

            <p class="hero-subtitle">
                Akses ribuan koleksi buku akademik terakreditasi, referensi praktikum, jurnal ilmiah, dan layanan peminjaman kilat berbasis barcode scanner dalam satu platform terpadu.
            </p>

            <!-- Search Form in Hero -->
            <div class="hero-search-box">
                <form action="index.php" method="GET" class="hero-search-form">
                    <input type="hidden" name="pg" value="cari">
                    <div class="hero-input-wrap">
                        <i class='bx bx-search'></i>
                        <input type="text" name="keyword" placeholder="Cari judul buku, topik keilmuan, pengarang, atau ISBN..." autocomplete="off">
                    </div>
                    <button type="submit" class="hero-btn-submit">
                        <i class='bx bx-search'></i> Cari Buku
                    </button>
                </form>

                <div class="hero-quick-chips">
                    <span style="font-size:12px; color:#94a3b8; font-weight:600;"><i class='bx bx-trending-up'></i> Populer:</span>
                    <?php 
                    $chips = array_slice($categories_list, 0, 4);
                    foreach ($chips as $ch): 
                    ?>
                        <a href="index.php?pg=cari&keyword=<?= urlencode($ch['nama']) ?>" class="quick-chip">
                            <?= htmlspecialchars($ch['nama']) ?>
                        </a>
                    <?php endforeach; ?>
                </div>
            </div>

            <!-- Stats Grid -->
            <div class="hero-stats-grid">
                <div class="stat-card-glass">
                    <div class="stat-icon icon-indigo"><i class='bx bx-book-bookmark'></i></div>
                    <div>
                        <div class="stat-num"><?= number_format($stat_buku) ?>+</div>
                        <div class="stat-desc">Judul Buku Terdaftar</div>
                    </div>
                </div>

                <div class="stat-card-glass">
                    <div class="stat-icon icon-emerald"><i class='bx bx-layer'></i></div>
                    <div>
                        <div class="stat-num"><?= number_format($stat_stok) ?>+</div>
                        <div class="stat-desc">Eksemplar Stok Tersedia</div>
                    </div>
                </div>

                <div class="stat-card-glass">
                    <div class="stat-icon icon-sky"><i class='bx bx-user-voice'></i></div>
                    <div>
                        <div class="stat-num"><?= number_format($stat_pengarang) ?>+</div>
                        <div class="stat-desc">Penulis & Akademisi</div>
                    </div>
                </div>

                <div class="stat-card-glass">
                    <div class="stat-icon icon-amber"><i class='bx bx-barcode-reader'></i></div>
                    <div>
                        <div class="stat-num">Kilat</div>
                        <div class="stat-desc">Scan Barcode Instan</div>
                    </div>
                </div>
            </div>
        </div>
    </section>

    <!-- ═══════════════════ FEATURED BOOKS ═══════════════════ -->
    <section class="section-container" id="koleksi">
        <div class="section-head">
            <div class="section-tag"><i class='bx bx-star'></i> Koleksi Pilihan</div>
            <h2 class="section-heading">Buku Terbaru & Paling Dicari</h2>
            <p class="section-subtext">Temukan literatur vokasi terkini untuk menunjang perkuliahan, tugas akhir, dan riset terapan Anda.</p>
        </div>

        <?php if (!empty($featured_books)): ?>
            <div class="books-grid">
                <?php foreach ($featured_books as $b): ?>
                    <?php
                        $cover_img = (!empty($b['foto']) && file_exists(__DIR__ . '/images/buku/' . $b['foto']))
                            ? 'images/buku/' . htmlspecialchars($b['foto'])
                            : 'images/default-book-cover.svg';
                        $is_available = $b['qty_stok'] > 0;
                    ?>
                    <div class="book-card-item">
                        <div class="book-cover-wrap">
                            <img src="<?= $cover_img ?>" alt="<?= htmlspecialchars($b['judul']) ?>" loading="lazy">
                            <span class="book-year-pill"><?= $b['tahun'] ?: 'Terbaru' ?></span>
                            <?php if (!empty($b['nama_katalog'])): ?>
                                <span class="book-katalog-pill"><?= htmlspecialchars($b['nama_katalog']) ?></span>
                            <?php endif; ?>
                        </div>

                        <div class="book-card-body">
                            <h3 class="book-name" title="<?= htmlspecialchars($b['judul']) ?>">
                                <?= htmlspecialchars($b['judul']) ?>
                            </h3>

                            <div class="book-meta-list">
                                <div><i class='bx bx-user'></i> <?= htmlspecialchars($b['nama_pengarang'] ?: 'Penulis Polinela') ?></div>
                                <div><i class='bx bx-buildings'></i> <?= htmlspecialchars($b['nama_penerbit'] ?: 'Penerbit Akademik') ?></div>
                                <div><i class='bx bx-barcode'></i> ISBN: <?= htmlspecialchars($b['isbn']) ?></div>
                            </div>

                            <div class="book-card-bottom">
                                <div class="stock-tag <?= $is_available ? 'in' : 'out' ?>">
                                    <span class="pulse-dot" style="background:<?= $is_available ? '#10b981' : '#ef4444' ?>;"></span>
                                    <span><?= $is_available ? $b['qty_stok'] . ' Eks' : 'Habis' ?></span>
                                </div>
                                <a href="index.php?pg=cari&keyword=<?= urlencode($b['isbn']) ?>" class="btn-view-book">
                                    Detail <i class='bx bx-right-arrow-alt'></i>
                                </a>
                            </div>
                        </div>
                    </div>
                <?php endforeach; ?>
            </div>

            <div style="text-align:center; margin-top:40px;">
                <a href="index.php?pg=login" class="btn-nav-register" style="padding:14px 28px; font-size:15px;">
                    <i class='bx bx-library'></i> Masuk untuk Pinjam Buku Ini
                </a>
            </div>
        <?php endif; ?>
    </section>

    <!-- ═══════════════════ CATEGORIES ═══════════════════ -->
    <?php if (!empty($categories_list)): ?>
    <section class="bg-light-section" id="kategori">
        <div class="section-container">
            <div class="section-head">
                <div class="section-tag"><i class='bx bx-category'></i> Jurusan & Bidang Ilmu</div>
                <h2 class="section-heading">Kategori Koleksi Buku</h2>
                <p class="section-subtext">Jelajahi buku dan referensi sesuai dengan program studi dan peminatan Anda.</p>
            </div>

            <div class="categories-grid">
                <?php foreach ($categories_list as $cat): ?>
                    <?php $icon_c = $category_icons[$cat['id_katalog']] ?? 'bx-book-content'; ?>
                    <a href="index.php?pg=cari&keyword=<?= urlencode($cat['nama']) ?>" class="category-box">
                        <div class="cat-icon-holder"><i class='bx <?= $icon_c ?>'></i></div>
                        <div class="cat-info">
                            <h4><?= htmlspecialchars($cat['nama']) ?></h4>
                            <p><?= $cat['total_buku'] ?> Judul Buku Terkatalog</p>
                        </div>
                        <i class='bx bx-chevron-right' style="color:#cbd5e1; font-size:22px; margin-left:auto;"></i>
                    </a>
                <?php endforeach; ?>
            </div>
        </div>
    </section>
    <?php endif; ?>

    <!-- ═══════════════════ ADVANTAGES ═══════════════════ -->
    <section class="section-container" id="keunggulan">
        <div class="section-head">
            <div class="section-tag"><i class='bx bx-check-shield'></i> Keunggulan Layanan</div>
            <h2 class="section-heading">Mengapa Memilih Pustaka Polinela?</h2>
            <p class="section-subtext">Layanan sirkulasi cerdas yang mengutamakan kecepatan akses dan kenyamanan mahasiswa.</p>
        </div>

        <div class="advantages-grid">
            <div class="adv-card">
                <div class="adv-icon-box icon-emerald"><i class='bx bx-barcode-reader'></i></div>
                <h3>Sirkulasi Barcode Scanner</h3>
                <p>Pinjam dan kembalikan buku dalam hitungan detik. Cukup scan label barcode pada buku dengan kamera web atau pemindai di meja layanan.</p>
                <div class="adv-badge-chip"><i class='bx bx-bolt-circle'></i> Instan & Akurat</div>
            </div>

            <div class="adv-card">
                <div class="adv-icon-box icon-indigo"><i class='bx bxs-id-card'></i></div>
                <h3>Verifikasi KTM Digital</h3>
                <p>Pendaftaran anggota daring praktis. Cukup unggah foto Kartu Tanda Mahasiswa (KTM) aktif untuk disetujui petugas perpustakaan.</p>
                <div class="adv-badge-chip"><i class='bx bx-shield-quarter'></i> Terintegrasi</div>
            </div>

            <div class="adv-card">
                <div class="adv-icon-box icon-sky"><i class='bx bx-time-five'></i></div>
                <h3>Denda & Waktu Transparan</h3>
                <p>Pantau jatuh tempo peminjaman dan estimasi perhitungan denda keterlambatan secara otomatis langsung dari akun anggota Anda.</p>
                <div class="adv-badge-chip"><i class='bx bx-check-double'></i> Real-Time</div>
            </div>

            <div class="adv-card">
                <div class="adv-icon-box icon-amber"><i class='bx bx-devices'></i></div>
                <h3>Akses Katalog Responsif 24/7</h3>
                <p>Katalog buku daring dapat diakses fleksibel kapan saja, baik melalui PC, laptop, maupun smartphone dengan tampilan yang nyaman.</p>
                <div class="adv-badge-chip"><i class='bx bx-mobile-alt'></i> Multi-Platform</div>
            </div>
        </div>
    </section>

    <!-- ═══════════════════ WORKFLOW ═══════════════════ -->
    <section class="bg-light-section" id="alur">
        <div class="section-container">
            <div class="section-head">
                <div class="section-tag"><i class='bx bx-git-commit'></i> Alur Layanan</div>
                <h2 class="section-heading">4 Langkah Mudah Meminjam Buku</h2>
                <p class="section-subtext">Alur praktis bagi seluruh mahasiswa Politeknik Negeri Lampung.</p>
            </div>

            <div class="steps-grid">
                <div class="step-item">
                    <div class="step-num">01</div>
                    <div class="step-icon-round"><i class='bx bx-user-plus'></i></div>
                    <h4>Daftar & Upload KTM</h4>
                    <p>Buat akun di website dan unggah foto KTM aktif Anda untuk verifikasi identitas.</p>
                </div>

                <div class="step-item">
                    <div class="step-num">02</div>
                    <div class="step-icon-round"><i class='bx bx-check-shield'></i></div>
                    <h4>Verifikasi Petugas</h4>
                    <p>Petugas memeriksa data KTM Anda. Setelah di-ACC, akun langsung aktif meminjam.</p>
                </div>

                <div class="step-item">
                    <div class="step-num">03</div>
                    <div class="step-icon-round"><i class='bx bx-barcode-reader'></i></div>
                    <h4>Pilih & Scan Barcode</h4>
                    <p>Pilih buku yang diinginkan, scan barcode buku di meja sirkulasi untuk ACC instan.</p>
                </div>

                <div class="step-item">
                    <div class="step-num">04</div>
                    <div class="step-icon-round"><i class='bx bx-book-reader'></i></div>
                    <h4>Ambil & Belajar!</h4>
                    <p>Buku siap dibawa pulang. Kembalikan tepat waktu sebelum tanggal batas kembali.</p>
                </div>
            </div>
        </div>
    </section>

    <!-- ═══════════════════ OPERATIONAL & FACILITIES ═══════════════════ -->
    <section class="section-container" id="jadwal">
        <div class="info-split-grid">
            <div class="info-card-box">
                <div class="section-tag"><i class='bx bx-time'></i> Jam Layanan</div>
                <h2>Jadwal Buka Perpustakaan</h2>
                <p style="color:#64748b; font-size:14px;">Kami siap melayani kebutuhan literatur seluruh mahasiswa dan dosen Polinela.</p>

                <div class="schedule-rows">
                    <div class="schedule-row">
                        <strong><i class='bx bx-calendar'></i> Senin — Kamis</strong>
                        <span class="open">08.00 — 16.00 WIB</span>
                    </div>
                    <div class="schedule-row">
                        <strong><i class='bx bx-calendar'></i> Jumat</strong>
                        <span class="open">08.00 — 16.30 WIB</span>
                    </div>
                    <div class="schedule-row">
                        <strong><i class='bx bx-calendar-x'></i> Sabtu, Minggu & Hari Libur</strong>
                        <span class="closed">Tutup</span>
                    </div>
                </div>

                <div class="location-banner">
                    <i class='bx bx-map-pin'></i>
                    <div>
                        <strong>Gedung UPT Perpustakaan Polinela</strong>
                        <span>Jl. Soekarno Hatta No.10, Rajabasa, Bandar Lampung, Lampung 35144</span>
                    </div>
                </div>
            </div>

            <div class="info-card-box">
                <div class="section-tag"><i class='bx bx-buildings'></i> Fasilitas</div>
                <h2>Kenyamanan Belajar Terpadu</h2>
                
                <div class="facility-mini-grid">
                    <div class="fac-card">
                        <div class="fac-icon-holder"><i class='bx bx-wind'></i></div>
                        <div>
                            <h4>Ruang Baca Ber-AC</h4>
                            <p>Suasana sejuk, tenang, dan kondusif untuk belajar mandiri maupun diskusi.</p>
                        </div>
                    </div>

                    <div class="fac-card">
                        <div class="fac-icon-holder"><i class='bx bx-wifi'></i></div>
                        <div>
                            <h4>Free Wi-Fi Cepat</h4>
                            <p>Koneksi internet nirkabel untuk riset literatur dan akses e-jurnal.</p>
                        </div>
                    </div>

                    <div class="fac-card">
                        <div class="fac-icon-holder"><i class='bx bx-desktop'></i></div>
                        <div>
                            <h4>Pojok Komputer OPAC</h4>
                            <p>Terminal komputer pencarian katalog buku digital secara gratis.</p>
                        </div>
                    </div>

                    <div class="fac-card">
                        <div class="fac-icon-holder"><i class='bx bx-cabinet'></i></div>
                        <div>
                            <h4>Loker Penitipan</h4>
                            <p>Loker penyimpanan tas dan barang bawaan yang aman dan terpantau.</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </section>

    <!-- ═══════════════════ CTA BANNER ═══════════════════ -->
    <div class="cta-section">
        <div class="cta-wrapper">
            <div class="cta-text">
                <h2>Siap Mengembangkan Wawasan Akademikmu?</h2>
                <p>Bergabunglah dengan ribuan mahasiswa Polinela lainnya. Daftarkan diri Anda sekarang dan nikmati kemudahan akses buku terlengkap.</p>
                <div class="cta-btns">
                    <a href="index.php?pg=register" class="btn-cta-white">
                        <i class='bx bx-user-plus'></i> Daftar Anggota Baru
                    </a>
                    <a href="index.php?pg=login" class="btn-cta-outline">
                        <i class='bx bx-log-in'></i> Masuk Portal
                    </a>
                </div>
            </div>
            <div style="font-size:64px; color:rgba(255,255,255,0.2);">
                <i class='bx bxs-book-reader'></i>
            </div>
        </div>
    </div>

    <!-- ═══════════════════ FOOTER ═══════════════════ -->
    <footer class="landing-footer">
        <div class="footer-container">
            <div class="footer-brand">
                <h3><i class='bx bxs-book-reader' style="color:var(--primary);"></i> Pustaka Polinela</h3>
                <p>Pusat literasi digital, sains terapan, dan rujukan vokasi Politeknik Negeri Lampung. Mendukung riset, inovasi, dan prestasi mahasiswa.</p>
                <div style="display:flex; gap:10px; font-size:20px; color:#ffffff;">
                    <a href="#" style="color:#94a3b8;"><i class='bx bxl-facebook-circle'></i></a>
                    <a href="#" style="color:#94a3b8;"><i class='bx bxl-instagram'></i></a>
                    <a href="#" style="color:#94a3b8;"><i class='bx bxl-youtube'></i></a>
                </div>
            </div>

            <div class="footer-col">
                <h4>Navigasi</h4>
                <ul class="footer-links-list">
                    <li><a href="#hero">Beranda</a></li>
                    <li><a href="#koleksi">Koleksi Buku</a></li>
                    <li><a href="#kategori">Kategori Jurusan</a></li>
                    <li><a href="#keunggulan">Keunggulan</a></li>
                </ul>
            </div>

            <div class="footer-col">
                <h4>Layanan</h4>
                <ul class="footer-links-list">
                    <li><a href="index.php?pg=login">Masuk Anggota</a></li>
                    <li><a href="index.php?pg=register">Daftar Akun Baru</a></li>
                    <li><a href="index.php?pg=cari">Pencarian OPAC</a></li>
                    <li><a href="#jadwal">Jam Operasional</a></li>
                </ul>
            </div>

            <div class="footer-col">
                <h4>Kontak & Lokasi</h4>
                <p style="font-size:13.5px; line-height:1.6; margin-bottom:10px;">
                    Gedung UPT Perpustakaan Polinela<br>
                    Jl. Soekarno Hatta No.10, Rajabasa, Bandar Lampung 35144
                </p>
                <p style="font-size:13.5px; color:#cbd5e1;">
                    <i class='bx bx-envelope'></i> perpustakaan@polinela.ac.id
                </p>
            </div>
        </div>

        <div class="footer-bottom">
            <div>&copy; <?= date('Y') ?> <strong>Perpustakaan Politeknik Negeri Lampung</strong>. All Rights Reserved.</div>
            <div style="color:#64748b;">Sistem Informasi Perpustakaan Terpadu dengan Barcode Scanner</div>
        </div>
    </footer>

</body>
</html>
