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

    const leaveTimer = window.setTimeout(() => setPhase('leaving'), 2250);
    const doneTimer = window.setTimeout(() => setPhase('gone'), 2780);

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
      className={`fixed inset-0 z-[100] flex flex-col items-center justify-center overflow-hidden bg-[#F3F4F6] transition-all duration-500 ease-out ${
        phase === 'leaving'
          ? 'pointer-events-none scale-[1.015] opacity-0 backdrop-blur-md'
          : 'scale-100 opacity-100'
      }`}
    >
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(620px 380px at 50% 42%, rgba(31, 110, 122, 0.085), transparent 68%), radial-gradient(460px 300px at 56% 52%, rgba(196, 136, 41, 0.065), transparent 72%)',
        }}
      />

      <div className="relative flex flex-col items-center px-6">
        <div className="glass-panel relative flex h-24 w-24 items-center justify-center rounded-[28px] shadow-[0_20px_50px_-24px_rgba(24,27,32,0.18)]">
          <svg
            width="60"
            height="60"
            viewBox="0 0 64 64"
            fill="none"
            className="overflow-visible"
          >
            <path
              d="M12 45 C20 41, 44 41, 52 45"
              stroke="rgba(24, 27, 32, 0.14)"
              strokeWidth="1.25"
              strokeLinecap="round"
              className="splash-stratum-1"
            />
            <path
              d="M16 51 C24 48, 40 48, 48 51"
              stroke="rgba(31, 110, 122, 0.28)"
              strokeWidth="1.25"
              strokeLinecap="round"
              className="splash-stratum-2"
            />
            <path
              d="M19 20 H45"
              stroke="#1F6E7A"
              strokeWidth="2.4"
              strokeLinecap="round"
              className="splash-bar-top"
            />
            <path
              d="M32 20 V44"
              stroke="#1F6E7A"
              strokeWidth="2.4"
              strokeLinecap="round"
              className="splash-core-stem"
            />
            <path
              d="M24 33 L32 41 L40 33"
              stroke="#C48829"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="splash-chevron"
            />
            <circle
              cx="32"
              cy="12.5"
              r="2.6"
              fill="#C48829"
              className="splash-dot"
            />
          </svg>
        </div>

        <div className="mt-7 text-center">
          <h1 className="splash-title text-[28px] font-light text-[#181B20]">TENEUR</h1>
          <p className="splash-subtitle mt-1.5 text-xs font-normal tracking-[0.22em] uppercase text-[#525B68]">
            Gestão de Serviços
          </p>
          {activeCompanyName && (
            <p className="splash-context mt-2 text-[11px] font-light text-[#7C8594]">
              {activeCompanyName}
            </p>
          )}
        </div>

        <div className="mt-8 h-[1.5px] w-44 overflow-hidden rounded-full bg-[#181B20]/10">
          <div className="splash-progress h-full rounded-full bg-gradient-to-r from-[#1F6E7A] via-[#2B8592] to-[#C48829]" />
        </div>
      </div>

      <p className="splash-footer absolute bottom-8 text-[10px] font-light tracking-[0.2em] uppercase text-[#7C8594]">
        Desenvolvido por Okapi Code Forge
      </p>
    </div>
  );
}
