'use client';

import React, { useEffect, useState } from 'react';
import { Bell, BellRing, CalendarPlus, CheckCircle2, Smartphone, X } from 'lucide-react';

interface RemindersModalProps {
  onClose: () => void;
  onNotify: (msg: string) => void;
}

export function RemindersModal({ onClose, onNotify }: RemindersModalProps) {
  const [permission, setPermission] = useState<NotificationPermission | 'unsupported'>('default');
  const [dailyTime, setDailyTime] = useState('18:00');
  const [closingDay, setClosingDay] = useState(28);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const standalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as Navigator & { standalone?: boolean }).standalone === true;
    setIsStandalone(standalone);

    if (!('Notification' in window)) {
      setPermission('unsupported');
    } else {
      setPermission(Notification.permission);
    }

    const savedTime = window.localStorage.getItem('teneur_daily_reminder_time');
    if (savedTime) setDailyTime(savedTime);
    const savedDay = window.localStorage.getItem('teneur_closing_day');
    if (savedDay) setClosingDay(Number(savedDay) || 28);
  }, []);

  async function handleEnableNotifications() {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      onNotify('Para notificações no iPhone, adicione o Teneur à Tela de Início primeiro.');
      return;
    }
    const result = await Notification.requestPermission();
    setPermission(result);
    if (result === 'granted') {
      await sendTestNotification();
      onNotify('Notificações ativadas com sucesso.');
    } else {
      onNotify('Permissão de notificações não concedida.');
    }
  }

  async function sendTestNotification() {
    const title = 'Teneur — Gestão de Serviços';
    const options: NotificationOptions = {
      body: 'Lembrete ativo! Hora de conferir o Diário de Campo e a produção das equipes.',
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      data: { url: '/' },
    };

    if ('serviceWorker' in navigator) {
      const reg = await navigator.serviceWorker.getRegistration();
      if (reg && 'showNotification' in reg) {
        await reg.showNotification(title, options);
        return;
      }
    }
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, options);
    }
  }

  function handleTimeChange(val: string) {
    setDailyTime(val);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('teneur_daily_reminder_time', val);
    }
  }

  function handleClosingDayChange(val: number) {
    setClosingDay(val);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('teneur_closing_day', String(val));
    }
  }

  const [hourStr = '18', minuteStr = '00'] = dailyTime.split(':');
  const queryBase = `hour=${encodeURIComponent(hourStr)}&minute=${encodeURIComponent(minuteStr)}&closingDay=${closingDay}`;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-[#181B20]/35 backdrop-blur-xs sm:items-center sm:p-4">
      <div className="max-h-[92dvh] w-full max-w-lg overflow-y-auto rounded-t-3xl bg-[#F8F9FA] p-5 shadow-2xl sm:rounded-3xl">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#1F6E7A]/10 text-[#1F6E7A]">
              <Bell className="h-4 w-4" strokeWidth={1.7} />
            </div>
            <div>
              <h3 className="text-base font-medium text-[#181B20]">
                Lembretes & Agenda do Celular
              </h3>
              <p className="text-[11px] text-[#7C8594]">
                Notificações no app e sincronização com o Calendário do iPhone
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-[#525B68] hover:bg-black/5"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4">
          <section className="rounded-2xl border border-[#181B20]/10 bg-white p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h4 className="flex items-center gap-1.5 text-sm font-medium text-[#181B20]">
                  <CalendarPlus className="h-4 w-4 text-[#1F6E7A]" strokeWidth={1.6} />
                  <span>Vincular ao Calendário do iPhone / Google</span>
                </h4>
                <p className="mt-1 text-xs leading-relaxed text-[#525B68]">
                  Adicione alertas recorrentes direto no app <strong>Calendário</strong> do celular
                  para lembrar do apontamento diário e do fechamento mensal (Relatório NBR).
                </p>
              </div>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-3 text-xs">
              <div>
                <label className="mb-1 block font-medium text-[#525B68]">
                  Horário do lembrete diário
                </label>
                <input
                  type="time"
                  value={dailyTime}
                  onChange={(e) => handleTimeChange(e.target.value)}
                  className="mineral-input w-full px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="mb-1 block font-medium text-[#525B68]">
                  Dia do fechamento mensal
                </label>
                <select
                  value={closingDay}
                  onChange={(e) => handleClosingDayChange(Number(e.target.value))}
                  className="mineral-input w-full px-3 py-2 text-sm"
                >
                  <option value={25}>Todo dia 25</option>
                  <option value={26}>Todo dia 26</option>
                  <option value={27}>Todo dia 27</option>
                  <option value={28}>Todo dia 28</option>
                </select>
              </div>
            </div>

            <div className="mt-3.5 space-y-2">
              <a
                href={`/api/calendar/reminders?type=all&${queryBase}`}
                data-testid="download-ics-all"
                className="btn-primary flex w-full items-center justify-center gap-2 px-4 py-2.5 text-xs sm:text-sm"
              >
                <CalendarPlus className="h-4 w-4" strokeWidth={1.6} />
                <span>Adicionar Lembrete Diário + Mensal ao Calendário</span>
              </a>

              <div className="grid grid-cols-2 gap-2">
                <a
                  href={`/api/calendar/reminders?type=daily&${queryBase}`}
                  className="btn-secondary py-2 text-center text-[11px]"
                >
                  Só Diário (Seg–Sáb)
                </a>
                <a
                  href={`/api/calendar/reminders?type=monthly&${queryBase}`}
                  className="btn-secondary py-2 text-center text-[11px]"
                >
                  Só Fechamento Mensal
                </a>
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-[#181B20]/10 bg-white p-4">
            <h4 className="flex items-center gap-1.5 text-sm font-medium text-[#181B20]">
              <BellRing className="h-4 w-4 text-[#C48829]" strokeWidth={1.6} />
              <span>Notificações Diretas do App</span>
            </h4>
            <p className="mt-1 text-xs leading-relaxed text-[#525B68]">
              No iPhone (iOS 16.4+), abra o Teneur pelo ícone da <strong>Tela de Início</strong>{' '}
              para habilitar alertas nativos do sistema.
            </p>

            <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
              {permission === 'granted' ? (
                <>
                  <span className="inline-flex items-center gap-1.5 text-xs font-medium text-[#1E7A56]">
                    <CheckCircle2 className="h-4 w-4" />
                    Notificações habilitadas
                  </span>
                  <button
                    type="button"
                    onClick={() => void sendTestNotification()}
                    className="btn-secondary px-3.5 py-1.5 text-xs"
                  >
                    Testar notificação
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => void handleEnableNotifications()}
                  className="btn-secondary w-full py-2 text-xs font-medium text-[#1F6E7A]"
                >
                  {permission === 'unsupported'
                    ? 'Adicione à Tela de Início para ativar no iPhone'
                    : 'Ativar notificações neste dispositivo'}
                </button>
              )}
            </div>

            {!isStandalone && (
              <div className="mt-3 flex items-start gap-2 rounded-xl bg-[#F3F4F6] p-2.5 text-[11px] text-[#525B68]">
                <Smartphone className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#1F6E7A]" />
                <span>
                  Dica iPhone: no Safari, toque em <strong>Compartilhar</strong> →{' '}
                  <strong>Adicionar à Tela de Início</strong> para usar o Teneur em tela cheia como
                  um aplicativo nativo.
                </span>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
