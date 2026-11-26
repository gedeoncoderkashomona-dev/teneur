'use client';

import React, { useEffect, useState } from 'react';

interface TeneurSplashProps {
  activeCompanyName?: string;
}

export function TeneurSplash({ activeCompanyName }: TeneurSplashProps) {
  const [phase, setPhase] = useState<'visible' | 'leaving' | 'gone'>('visible');

  useEffect(() => {
    const prefersReduced =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReduced) {
      setPhase('gone');
      return;
    }

    const leaveTimer = window.setTimeout(() => setPhase('leaving'), 1950);
    const doneTimer = window.setTimeout(() => setPhase('gone'), 2420);

    return () => {
      window.clearTimeout(leaveTimer);
      window.clearTimeout(doneTimer);
    };
  }, []);

  if (phase === 'gone') return null;

  return (
    <div
      data-testid="teneur-splash"
      aria-label="Carregando Teneur"
      className={`fixed inset-0 z-[100] flex flex-col items-center justify-center overflow-hidden bg-[var(--bg-canvas)] transition-all duration-500 ease-out ${
        phase === 'leaving'
          ? 'pointer-events-none scale-[1.015] opacity-0 backdrop-blur-md'
          : 'scale-100 opacity-100'
      }`}
    >
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(620px 380px at 50% 42%, var(--canvas-glow-1), transparent 68%), radial-gradient(460px 300px at 56% 52%, var(--canvas-glow-2), transparent 72%)',
        }}
      />

      <div className="relative flex flex-col items-center px-6">
        <div className="glass-panel relative flex h-24 w-24 items-center justify-center rounded-[28px]">
          <svg
            width="60"
            height="60"
            viewBox="0 0 64 64"
            fill="none"
            className="overflow-visible"
          >
            <path
              d="M12 45 C20 41, 44 41, 52 45"
              stroke="var(--border-strong)"
              strokeWidth="1.25"
              strokeLinecap="round"
              className="splash-stratum-1"
            />
            <path
              d="M16 51 C24 48, 40 48, 48 51"
              stroke="var(--accent-mineral)"
              strokeOpacity="0.4"
              strokeWidth="1.25"
              strokeLinecap="round"
              className="splash-stratum-2"
            />
            <path
              d="M19 20 H45"
              stroke="var(--accent-mineral)"
              strokeWidth="2.4"
              strokeLinecap="round"
              className="splash-bar-top"
            />
            <path
              d="M32 20 V44"
              stroke="var(--accent-mineral)"
              strokeWidth="2.4"
              strokeLinecap="round"
              className="splash-core-stem"
            />
            <path
              d="M24 33 L32 41 L40 33"
              stroke="var(--accent-ochre)"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="splash-chevron"
            />
            <circle
              cx="32"
              cy="12.5"
              r="2.6"
              fill="var(--accent-ochre)"
              className="splash-dot"
            />
          </svg>
        </div>

        <div className="mt-7 text-center">
          <h1 className="splash-title text-[28px] font-light text-[var(--ink-primary)]">TENEUR</h1>
          <p className="splash-subtitle mt-1.5 text-xs font-normal tracking-[0.22em] uppercase text-[var(--ink-secondary)]">
            Gestão de Serviços
          </p>
          {activeCompanyName && (
            <p className="splash-context mt-2 text-[11px] font-light text-[var(--ink-muted)]">
              {activeCompanyName}
            </p>
          )}
        </div>

        <div className="mt-8 h-[1.5px] w-44 overflow-hidden rounded-full bg-[var(--border-hairline)]">
          <div
            className="splash-progress h-full rounded-full"
            style={{
              background:
                'linear-gradient(90deg, var(--accent-mineral), var(--accent-ochre))',
            }}
          />
        </div>
      </div>

      <p className="splash-footer absolute bottom-8 text-[10px] font-light tracking-[0.2em] uppercase text-[var(--ink-muted)]">
        Desenvolvido por Okapi Code Forge
      </p>
    </div>
  );
}
