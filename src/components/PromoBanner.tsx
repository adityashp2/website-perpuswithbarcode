'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useBanners } from '@/lib/useBanners';

export default function PromoBanner() {
  const { activeBanners } = useBanners();
  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);
  const [animating, setAnimating] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const total = activeBanners.length;

  const goTo = (idx: number) => {
    if (animating || idx === current) return;
    setAnimating(true);
    setTimeout(() => {
      setCurrent(idx);
      setAnimating(false);
    }, 250);
  };

  const prev = () => goTo((current - 1 + total) % total);
  const next = () => goTo((current + 1) % total);

  useEffect(() => {
    if (total <= 1 || paused) return;
    timerRef.current = setInterval(() => {
      setCurrent((c) => (c + 1) % total);
    }, 5000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [total, paused]);

  if (total === 0) return null;

  const banner = activeBanners[current];

  return (
    <div
      style={{ marginBottom: '28px', borderRadius: '16px', overflow: 'hidden', position: 'relative', userSelect: 'none' }}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* Banner Slide */}
      <div
        style={{
          background: banner.bg_color,
          color: banner.text_color,
          padding: '28px 32px',
          display: 'flex',
          alignItems: 'center',
          gap: '24px',
          minHeight: '120px',
          transition: 'opacity 0.25s ease',
          opacity: animating ? 0 : 1,
          position: 'relative',
        }}
      >
        {/* Icon */}
        <div style={{
          width: '64px',
          height: '64px',
          borderRadius: '16px',
          background: 'rgba(255,255,255,0.18)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          fontSize: '28px',
        }}>
          <i className={`bx ${banner.icon}`} />
        </div>

        {/* Copy */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontWeight: 800,
            fontSize: '17px',
            lineHeight: 1.3,
            marginBottom: '5px',
            textWrap: 'balance',
          }}>
            {banner.title}
          </div>
          <div style={{
            fontSize: '13px',
            opacity: 0.85,
            lineHeight: 1.6,
            maxWidth: '600px',
          }}>
            {banner.subtitle}
          </div>
        </div>

        {/* CTA */}
        {banner.cta_label && banner.cta_href && (
          <Link
            href={banner.cta_href}
            style={{
              background: 'rgba(255,255,255,0.95)',
              color: '#0f172a',
              padding: '9px 20px',
              borderRadius: '10px',
              fontWeight: 700,
              fontSize: '13px',
              textDecoration: 'none',
              flexShrink: 0,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'transform 0.15s ease, box-shadow 0.15s ease',
              boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
              whiteSpace: 'nowrap',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-1px)';
              e.currentTarget.style.boxShadow = '0 4px 14px rgba(0,0,0,0.18)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.12)';
            }}
          >
            {banner.cta_label} <i className="bx bx-arrow-back" style={{ transform: 'rotate(180deg)', fontSize: '14px' }} />
          </Link>
        )}

        {/* Prev / Next arrows */}
        {total > 1 && (
          <>
            <button
              onClick={prev}
              aria-label="Banner sebelumnya"
              style={{
                position: 'absolute',
                left: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'rgba(255,255,255,0.2)',
                border: 'none',
                color: banner.text_color,
                width: '30px',
                height: '30px',
                borderRadius: '50%',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '16px',
                transition: 'background 0.2s',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.35)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.2)'; }}
            >
              <i className="bx bx-chevron-left" />
            </button>
            <button
              onClick={next}
              aria-label="Banner berikutnya"
              style={{
                position: 'absolute',
                right: total > 1 ? '12px' : '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'rgba(255,255,255,0.2)',
                border: 'none',
                color: banner.text_color,
                width: '30px',
                height: '30px',
                borderRadius: '50%',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '16px',
                transition: 'background 0.2s',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.35)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.2)'; }}
            >
              <i className="bx bx-chevron-right" />
            </button>
          </>
        )}
      </div>

      {/* Dot indicators */}
      {total > 1 && (
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          gap: '6px',
          padding: '8px',
          background: banner.bg_color,
          borderTop: '1px solid rgba(255,255,255,0.1)',
        }}>
          {activeBanners.map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              aria-label={`Ke banner ${i + 1}`}
              style={{
                width: i === current ? '24px' : '8px',
                height: '8px',
                borderRadius: '99px',
                background: i === current ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.35)',
                border: 'none',
                cursor: 'pointer',
                padding: 0,
                transition: 'all 0.3s ease',
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
