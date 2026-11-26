import fs from 'node:fs';
import path from 'node:path';
import React from 'react';
import {
  Circle,
  Document,
  Line,
  Page,
  Path,
  Rect,
  StyleSheet,
  Svg,
  Text,
  View,
  renderToBuffer,
} from '@react-pdf/renderer';

const COLORS = {
  canvas: '#F3F4F6',
  cardBg: '#FFFFFF',
  softBg: '#F8FAFB',
  teal: '#1F6E7A',
  tealSoft: '#EAF3F5',
  ochre: '#C48829',
  ochreSoft: '#FBF4E7',
  green: '#1E7A56',
  greenSoft: '#E9F5F0',
  ink: '#181B20',
  slate: '#525B68',
  muted: '#7C8594',
  border: '#E2E6EC',
  danger: '#B53D3D',
};

const s = StyleSheet.create({
  coverPage: {
    backgroundColor: COLORS.canvas,
    fontFamily: 'Helvetica',
    color: COLORS.ink,
    padding: 0,
  },
  coverTopBand: {
    backgroundColor: '#FFFFFF',
    paddingTop: 58,
    paddingHorizontal: 52,
    paddingBottom: 42,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  coverBody: {
    paddingHorizontal: 52,
    paddingTop: 34,
    flex: 1,
    justifyContent: 'space-between',
    paddingBottom: 38,
  },
  page: {
    backgroundColor: '#FFFFFF',
    fontFamily: 'Helvetica',
    color: COLORS.ink,
    paddingTop: 58,
    paddingBottom: 52,
    paddingHorizontal: 46,
    fontSize: 9.2,
    lineHeight: 1.48,
  },
  runningHeader: {
    position: 'absolute',
    top: 20,
    left: 46,
    right: 46,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 0.7,
    borderBottomColor: COLORS.border,
    paddingBottom: 7,
  },
  runningFooter: {
    position: 'absolute',
    bottom: 20,
    left: 46,
    right: 46,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 0.7,
    borderTopColor: COLORS.border,
    paddingTop: 6,
    fontSize: 7.5,
    color: COLORS.muted,
  },
  kicker: {
    fontSize: 7.5,
    fontFamily: 'Helvetica-Bold',
    color: COLORS.teal,
    textTransform: 'uppercase',
    letterSpacing: 1.4,
    marginBottom: 4,
  },
  h1: {
    fontSize: 18,
    fontFamily: 'Helvetica-Bold',
    color: COLORS.ink,
    marginBottom: 6,
    letterSpacing: -0.2,
  },
  h2: {
    fontSize: 11.2,
    fontFamily: 'Helvetica-Bold',
    color: COLORS.ink,
    marginTop: 12,
    marginBottom: 5,
  },
  lead: {
    fontSize: 9.5,
    color: COLORS.slate,
    marginBottom: 12,
    lineHeight: 1.5,
  },
  card: {
    backgroundColor: COLORS.softBg,
    borderWidth: 0.8,
    borderColor: COLORS.border,
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
  },
  cardWhite: {
    backgroundColor: '#FFFFFF',
    borderWidth: 0.8,
    borderColor: COLORS.border,
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
  },
  cardTeal: {
    backgroundColor: COLORS.tealSoft,
    borderWidth: 0.8,
    borderColor: '#C2DCE1',
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
  },
  cardOchre: {
    backgroundColor: COLORS.ochreSoft,
    borderWidth: 0.8,
    borderColor: '#E9D2A8',
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
    gap: 10,
  },
  stepBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: COLORS.teal,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  stepBadgeText: {
    color: '#FFFFFF',
    fontSize: 8.5,
    fontFamily: 'Helvetica-Bold',
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 9.4,
    fontFamily: 'Helvetica-Bold',
    color: COLORS.ink,
    marginBottom: 2,
  },
  stepText: {
    fontSize: 8.7,
    color: COLORS.slate,
    lineHeight: 1.45,
  },
  grid2: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 10,
  },
  col: {
    flex: 1,
  },
  pill: {
    borderRadius: 12,
    paddingVertical: 3,
    paddingHorizontal: 8,
    fontSize: 7.5,
    fontFamily: 'Helvetica-Bold',
  },
  dotRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
});

function TeneurEmblem({ size = 56 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 64 64">
      <Rect x="0" y="0" width="64" height="64" rx="16" fill="#1F6E7A" />
      <Path
        d="M12 46 C20 42, 44 42, 52 46"
        stroke="#7BAEB6"
        strokeWidth="1.4"
        fill="none"
      />
      <Path d="M18 22 H46" stroke="#F4F5F6" strokeWidth="3.2" strokeLinecap="round" />
      <Path d="M32 22 V46" stroke="#F4F5F6" strokeWidth="3.2" strokeLinecap="round" />
      <Path
        d="M23 34 L32 43 L41 34"
        stroke="#E0A94B"
        strokeWidth="2.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <Circle cx="32" cy="14" r="2.6" fill="#E0A94B" />
    </Svg>
  );
}

function PageChrome({ section }: { section: string }) {
  return (
    <>
      <View style={s.runningHeader} fixed>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7 }}>
          <TeneurEmblem size={18} />
          <Text style={{ fontSize: 8.5, fontFamily: 'Helvetica-Bold', color: COLORS.ink }}>
            TENEUR{' '}
            <Text style={{ fontFamily: 'Helvetica', color: COLORS.muted }}>
              — Gestão de Serviços
            </Text>
          </Text>
        </View>
        <Text style={{ fontSize: 7.8, color: COLORS.teal, fontFamily: 'Helvetica-Bold' }}>
          {section}
        </Text>
      </View>

      <View style={s.runningFooter} fixed>
        <Text>Teneur - Gestão de Serviços · Desenvolvido por Okapi Code Forge</Text>
        <Text
          render={({ pageNumber, totalPages }) => `Página ${pageNumber} de ${totalPages}`}
        />
      </View>
    </>
  );
}

function Step({
  num,
  title,
  text,
}: {
  num: string;
  title: string;
  text: string;
}) {
  return (
    <View style={s.stepRow}>
      <View style={s.stepBadge}>
        <Text style={s.stepBadgeText}>{num}</Text>
      </View>
      <View style={s.stepContent}>
        <Text style={s.stepTitle}>{title}</Text>
        <Text style={s.stepText}>{text}</Text>
      </View>
    </View>
  );
}

function IphoneInstallDiagram() {
  return (
    <Svg width="495" height="98" viewBox="0 0 495 106">
      {/* Passo A: Barra inferior do Safari */}
      <Rect x="2" y="2" width="152" height="100" rx="10" fill="#F8FAFB" stroke="#DCE3E8" strokeWidth="1" />
      <Text x="14" y="18" style={{ fontSize: 7.4, fontFamily: 'Helvetica-Bold', fill: '#1F6E7A' }}>
        PASSO 1 E 2 · NO SAFARI
      </Text>
      <Rect x="14" y="26" width="128" height="18" rx="5" fill="#FFFFFF" stroke="#CBD5E1" strokeWidth="0.8" />
      <Text x="32" y="37.5" style={{ fontSize: 7, fill: '#181B20' }}>
        teneur.vercel.app
      </Text>
      {/* Barra inferior simulada do Safari */}
      <Rect x="14" y="52" width="128" height="27" rx="6" fill="#FFFFFF" stroke="#CBD5E1" strokeWidth="0.8" />
      <Text x="23" y="69" style={{ fontSize: 9, fill: '#94A3B8' }}>&lt;</Text>
      <Text x="43" y="69" style={{ fontSize: 9, fill: '#94A3B8' }}>&gt;</Text>
      {/* Destaque no botão Compartilhar */}
      <Rect x="64" y="55" width="28" height="21" rx="5" fill="#EAF3F5" stroke="#1F6E7A" strokeWidth="1.2" />
      <Path d="M78 70.5 V60 M74.5 63.5 L78 60 L81.5 63.5" stroke="#1F6E7A" strokeWidth="1.4" fill="none" />
      <Rect x="73" y="66" width="10" height="7" rx="1.2" fill="none" stroke="#1F6E7A" strokeWidth="1.1" />
      <Circle cx="108" cy="66" r="2.2" fill="#CBD5E1" />
      <Rect x="122" y="62" width="10" height="8" rx="1.5" fill="none" stroke="#94A3B8" strokeWidth="1" />
      <Text x="23" y="93" style={{ fontSize: 6.8, fill: '#525B68' }}>
        Toque no ícone em destaque
      </Text>

      {/* Seta 1 */}
      <Path d="M159 52 H170 M166 48 L170 52 L166 56" stroke="#1F6E7A" strokeWidth="1.3" fill="none" />

      {/* Passo B: Menu que sobe no iPhone */}
      <Rect x="175" y="2" width="152" height="100" rx="10" fill="#F8FAFB" stroke="#DCE3E8" strokeWidth="1" />
      <Text x="187" y="18" style={{ fontSize: 7.4, fontFamily: 'Helvetica-Bold', fill: '#1F6E7A' }}>
        PASSO 3 · MENU DO IPHONE
      </Text>
      <Rect x="187" y="27" width="128" height="16" rx="4" fill="#FFFFFF" stroke="#E2E8F0" strokeWidth="0.7" />
      <Text x="195" y="37.5" style={{ fontSize: 6.8, fill: '#94A3B8' }}>Copiar link</Text>
      <Rect x="187" y="47" width="128" height="26" rx="6" fill="#EAF3F5" stroke="#1F6E7A" strokeWidth="1.2" />
      <Text x="195" y="58.5" style={{ fontSize: 7.3, fontFamily: 'Helvetica-Bold', fill: '#181B20' }}>
        Adicionar à Tela de Início
      </Text>
      <Text x="195" y="68" style={{ fontSize: 6.5, fill: '#1F6E7A' }}>
        Toque nesta opção (+)
      </Text>
      <Text x="187" y="93" style={{ fontSize: 6.8, fill: '#525B68' }}>
        Deslize o menu para cima se precisar
      </Text>

      {/* Seta 2 */}
      <Path d="M332 52 H343 M339 48 L343 52 L339 56" stroke="#1F6E7A" strokeWidth="1.3" fill="none" />

      {/* Passo C: Ícone na Tela de Início */}
      <Rect x="348" y="2" width="145" height="100" rx="10" fill="#EAF3F5" stroke="#1F6E7A" strokeWidth="1" />
      <Text x="360" y="18" style={{ fontSize: 7.4, fontFamily: 'Helvetica-Bold', fill: '#1F6E7A' }}>
        PASSO 4 · APP PRONTO!
      </Text>
      <Rect x="401" y="29" width="38" height="38" rx="10" fill="#1F6E7A" />
      <Path d="M411 41 H429 M420 41 V57" stroke="#FFFFFF" strokeWidth="2.3" strokeLinecap="round" />
      <Path d="M414 49 L420 55 L426 49" stroke="#E0A94B" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <Circle cx="420" cy="36" r="1.9" fill="#E0A94B" />
      <Text x="404" y="79" style={{ fontSize: 8, fontFamily: 'Helvetica-Bold', fill: '#181B20' }}>
        Teneur
      </Text>
      <Text x="365" y="92" style={{ fontSize: 6.8, fill: '#525B68' }}>
        Abre em tela cheia como app
      </Text>
    </Svg>
  );
}

function TeneurManualDocument() {
  return (
    <Document
      title="Teneur — Manual de Uso"
      author="Okapi Code Forge"
      subject="Guia Completo de Utilização — Teneur Gestão de Serviços"
      creator="Okapi Code Forge"
    >
      {/* CAPA */}
      <Page size="A4" style={s.coverPage}>
        <View style={s.coverTopBand}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <TeneurEmblem size={62} />
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={{ fontSize: 8, color: COLORS.teal, fontFamily: 'Helvetica-Bold', letterSpacing: 1.2 }}>
                GUIA OFICIAL DO USUÁRIO
              </Text>
              <Text style={{ fontSize: 8, color: COLORS.muted, marginTop: 2 }}>
                Versão 1.0 · Celular (iPhone / Android) & Notebook
              </Text>
            </View>
          </View>

          <Text style={{ fontSize: 34, fontFamily: 'Helvetica-Bold', letterSpacing: 4, color: COLORS.ink, marginTop: 34 }}>
            TENEUR
          </Text>
          <Text style={{ fontSize: 13, color: COLORS.teal, letterSpacing: 2.2, textTransform: 'uppercase', marginTop: 4 }}>
            Gestão de Serviços
          </Text>

          <View style={{ width: 64, height: 2.5, backgroundColor: COLORS.ochre, marginTop: 18, marginBottom: 18, borderRadius: 2 }} />

          <Text style={{ fontSize: 15, color: COLORS.ink, lineHeight: 1.45, maxWidth: 440 }}>
            Manual prático, leve e passo a passo para acompanhar equipes de campo, fechar medições automáticas e gerar apresentações em PDF com padrão de engenharia.
          </Text>
        </View>

        <View style={s.coverBody}>
          <View>
            <View style={[s.cardWhite, { padding: 18 }]}>
              <Text style={s.kicker}>Preparado especialmente para</Text>
              <Text style={{ fontSize: 14, fontFamily: 'Helvetica-Bold', color: COLORS.ink }}>
                Catherine Irina Pascoal Gouveia
              </Text>
              <Text style={{ fontSize: 9.5, color: COLORS.slate, marginTop: 2 }}>
                Engenheira de Minas · Coordenação de Serviços e Equipes de Campo
              </Text>
              <View style={{ height: 0.7, backgroundColor: COLORS.border, marginVertical: 11 }} />
              <Text style={{ fontSize: 8.8, color: COLORS.slate, lineHeight: 1.55 }}>
                O Teneur nasceu para transformar horas de planilhas e conferências manuais em poucos toques — com precisão matemática no centavo, sincronização em tempo real entre seu iPhone e seu notebook, e relatórios prontos para encantar em qualquer reunião.
              </Text>
            </View>

            <View style={[s.grid2, { marginTop: 6 }]}>
              <View style={[s.cardTeal, s.col]}>
                <Text style={{ fontSize: 7.5, fontFamily: 'Helvetica-Bold', color: COLORS.teal, textTransform: 'uppercase' }}>
                  Acesso Oficial
                </Text>
                <Text style={{ fontSize: 11, fontFamily: 'Helvetica-Bold', color: COLORS.ink, marginTop: 4 }}>
                  https://teneur.vercel.app
                </Text>
                <Text style={{ fontSize: 8, color: COLORS.slate, marginTop: 3 }}>
                  Funciona em tempo real no celular e no computador, sem precisar instalar nada da loja.
                </Text>
              </View>

              <View style={[s.cardOchre, s.col]}>
                <Text style={{ fontSize: 7.5, fontFamily: 'Helvetica-Bold', color: COLORS.ochre, textTransform: 'uppercase' }}>
                  O que você vai dominar
                </Text>
                <Text style={{ fontSize: 8.3, color: COLORS.ink, marginTop: 4, lineHeight: 1.5 }}>
                  • App nativo no iPhone + Lembretes na Agenda{'\n'}
                  • Diário de campo e regra Metro x Diária{'\n'}
                  • Boletins PDF, S10 Prata e Relatório NBR
                </Text>
              </View>
            </View>
          </View>

          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 0.8, borderTopColor: COLORS.border, paddingTop: 12 }}>
            <Text style={{ fontSize: 8.5, color: COLORS.slate }}>
              Teneur - Gestão de Serviços
            </Text>
            <Text style={{ fontSize: 8.5, fontFamily: 'Helvetica-Bold', color: COLORS.teal }}>
              Desenvolvido por Okapi Code Forge
            </Text>
          </View>
        </View>
      </Page>

      {/* PÁGINA 2 — VISÃO GERAL E NAVEGAÇÃO */}
      <Page size="A4" style={s.page}>
        <PageChrome section="1. Visão Geral & Navegação" />

        <Text style={s.kicker}>Capítulo 1</Text>
        <Text style={s.h1}>Como o Teneur está organizado</Text>
        <Text style={s.lead}>
          Ao abrir o Teneur, você verá uma tela de boas-vindas suave de 2,5 segundos e logo entra no painel principal. Tudo o que você salvar no celular aparece na hora no notebook (e vice-versa), gravado em nuvem em tempo real.
        </Text>

        <Text style={s.h2}>Os 5 módulos principais (menu lateral no notebook / barra inferior no iPhone)</Text>

        <View style={s.card}>
          <Step
            num="1"
            title="Visão Geral (Painel)"
            text="Mostra os 4 indicadores do mês (Medição Bruta, Líquido a Pagar, Produção em metros/diárias e Taxa de Ocupação), 4 gráficos interativos, o botão para baixar o Relatório Executivo NBR em PDF e o Termômetro de Produção em tempo real de cada equipe."
          />
          <Step
            num="2"
            title="Diário de Campo (Diário)"
            text="É a sua tela do dia a dia. Mostra o calendário mensal de cada equipe, avisa quantos dias estão sem apontamento e calcula automaticamente se o dia fechou por Metro Perfurado ou Diária Mínima."
          />
          <Step
            num="3"
            title="Medições"
            text="Monta sozinho o Boletim de Medição completo do mês: junta furos, diárias, trechos de mobilização (km), descontos automáticos (7% veículo, 15% equipamento SPT), folha CLT, reembolsos e gera o PDF oficial com a Memória de Cálculo."
          />
          <Step
            num="4"
            title="Equipes"
            text="Guarda os contratos individuais de cada sondador (diária mínima, valor do metro SPT e Trado, valor do km de mobilização, % de equipamento SPT e taxa de rastreador). Você pode editar ou cadastrar novas equipes quando precisar."
          />
          <Step
            num="5"
            title="Obras & Pastas (Obras)"
            text="Organiza suas Pastas, Clientes, OS e cidades sem erros de digitação — e mostra automaticamente quantos metros, diárias e qual o custo de campo acumulado em cada obra no mês."
          />
        </View>

        <Text style={s.h2}>Os 4 atalhos inteligentes da barra superior</Text>
        <View style={s.grid2}>
          <View style={[s.cardWhite, s.col]}>
            <Text style={s.stepTitle}>Seletor de Mês (&lt; Outubro/2026 &gt;)</Text>
            <Text style={s.stepText}>
              Troca instantaneamente todo o sistema (gráficos, calendário, medições e PDFs) entre meses passados, mês atual e meses futuros.
            </Text>
          </View>
          <View style={[s.cardWhite, s.col]}>
            <Text style={s.stepTitle}>Empresa Ativa (logo abaixo de Teneur)</Text>
            <Text style={s.stepText}>
              Toque em “Terra Sol” (com a setinha ao lado) para alternar entre empresas ou adicionar outra empresa futuramente — os PDFs acompanham automaticamente a empresa escolhida.
            </Text>
          </View>
        </View>
        <View style={s.grid2}>
          <View style={[s.cardWhite, s.col]}>
            <Text style={s.stepTitle}>Sininho & Modo Noturno (Lua / Sol)</Text>
            <Text style={s.stepText}>
              O sininho ativa notificações e lembretes no Calendário; o ícone de Lua/Sol alterna instantaneamente entre o Modo Claro e o Modo Noturno em vidro fosco.
            </Text>
          </View>
          <View style={[s.cardWhite, s.col]}>
            <Text style={s.stepTitle}>Engrenagem (Assinatura & CREA)</Text>
            <Text style={s.stepText}>
              Permite ajustar seu nome, título (Engenheira de Minas), incluir seu número do CREA e definir o padrão da assinatura da Representante Legal.
            </Text>
          </View>
        </View>
      </Page>

      {/* PÁGINA 3 — IPHONE APP NATIVO, NOTIFICAÇÕES E CALENDÁRIO */}
      <Page size="A4" style={s.page}>
        <PageChrome section="2. iPhone App Nativo, Notificações & Agenda" />

        <Text style={s.kicker}>Capítulo 2 · Experiência no iPhone</Text>
        <Text style={s.h1}>Colocando o Teneur na Tela Inicial do iPhone</Text>
        <Text style={s.lead}>
          Você pode salvar o Teneur direto na tela do seu iPhone para usá-lo igualzinho a um aplicativo baixado da App Store — em tela cheia, super rápido e sem precisar digitar o site toda vez.
        </Text>

        <Text style={[s.h2, { marginTop: 6, marginBottom: 4 }]}>2.1 Passo a passo para instalar no iPhone (leva 20 segundos)</Text>
        <View style={[s.cardWhite, { padding: 8, marginBottom: 7 }]}>
          <IphoneInstallDiagram />
        </View>

        <View style={[s.card, { padding: 10, marginBottom: 7 }]}>
          <Step
            num="1"
            title="Abra o link usando o Safari"
            text="No seu iPhone, abra o Safari (ícone da bússola azul) e acesse https://teneur.vercel.app. Faça sempre pelo Safari para liberar o modo aplicativo em tela cheia."
          />
          <Step
            num="2"
            title="Toque no botão Compartilhar (na barra lá embaixo)"
            text="Na barra inferior do Safari, bem no meio, toque no quadradinho com uma seta apontando para cima."
          />
          <Step
            num="3"
            title="Escolha “Adicionar à Tela de Início”"
            text="Um menu vai subir. Deslize esse menu para cima e toque na opção “Adicionar à Tela de Início”."
          />
          <Step
            num="4"
            title="Toque em “Adicionar” e pronto!"
            text="Confirme no canto superior direito. O ícone verde-petróleo do Teneur aparecerá junto com seus outros aplicativos!"
          />
        </View>

        <View style={[s.grid2, { marginBottom: 7 }]}>
          <View style={[s.cardTeal, s.col, { padding: 10, marginBottom: 0 }]}>
            <Text style={s.kicker}>2.2 Notificações no iPhone</Text>
            <Text style={s.stepTitle}>Alertas diretos no aparelho</Text>
            <Text style={[s.stepText, { marginTop: 2 }]}>
              1. Abra o Teneur pelo ícone da Tela de Início.{'\n'}
              2. Toque no ícone de Sininho no topo direito.{'\n'}
              3. Toque em “Ativar notificações neste dispositivo” e depois em “Permitir”.{'\n'}
              4. Use “Testar notificação” para confirmar!
            </Text>
          </View>

          <View style={[s.cardOchre, s.col, { padding: 10, marginBottom: 0 }]}>
            <Text style={[s.kicker, { color: COLORS.ochre }]}>2.3 Calendário do Celular</Text>
            <Text style={s.stepTitle}>Lembretes automáticos (Diário + Mensal)</Text>
            <Text style={[s.stepText, { marginTop: 2 }]}>
              1. No mesmo menu do Sininho, escolha o horário do lembrete diário (ex.: 18:00) e o dia do fechamento mensal (ex.: dia 28).{'\n'}
              2. Toque em “Adicionar Lembrete Diário + Mensal ao Calendário”.{'\n'}
              3. Toque em “Adicionar Tudo” no app Calendário!
            </Text>
          </View>
        </View>

        <View style={[s.card, { padding: 10, marginBottom: 0 }]}>
          <Text style={s.stepTitle}>O que o Calendário vai te lembrar automaticamente</Text>
          <Text style={s.stepText}>
            • Segunda a sábado (no horário escolhido): aviso 10 minutos antes com link direto para o Diário de Campo.{'\n'}
            • Todo dia 28 (e na véspera): lembrete para conferir dias sem registro, fechar os Boletins e baixar o Relatório NBR mensal.
          </Text>
        </View>
      </Page>

      {/* PÁGINA 4 — DIÁRIO DE CAMPO E REGRA AUTOMÁTICA */}
      <Page size="A4" style={s.page}>
        <PageChrome section="3. Diário de Campo & Cálculo Automático" />

        <Text style={s.kicker}>Capítulo 3 · Rotina de 15 segundos</Text>
        <Text style={s.h1}>Registrando a produção diária no Diário de Campo</Text>
        <Text style={s.lead}>
          Com o Diário de Campo sempre atualizado, o fechamento do fim do mês acontece praticamente sozinho — sem precisar procurar anotações perdidas ou somar planilhas manualmente.
        </Text>

        <View style={s.card}>
          <Step
            num="1"
            title="Escolha a equipe e toque no dia desejado"
            text="Na aba Diário, selecione o sondador nas pílulas do topo (Leonardo, Ramon, Marcos, Luís, Junior ou Dulcivan) e toque direto no número do dia no calendário (ou no botão “+ Apontar Dia”)."
          />
          <Step
            num="2"
            title="Informe Status, Pasta/Obra e Atividade"
            text="Escolha se a equipe estava Em Obra, em Mobilização/Viagem, Parada c/ Diária (aguardando cliente/liberação), Em Casa, Folga/Domingo ou Manutenção. Depois selecione a Pasta/Obra correspondente."
          />
          <Step
            num="3"
            title="Lance os Furos ou o Ensaio do dia"
            text="Se houve perfuração, informe o código (ex.: SP-01), o tipo (SPT, Trado ou Rotativa), a profundidade em metros e toque em “+ Add” (você pode adicionar quantos furos quiser no mesmo dia). Se foi ensaio (EP, E.A, Vane Test, Resistividade), preencha a descrição."
          />
          <Step
            num="4"
            title="Marque o Equipamento SPT quando aplicável e Salve"
            text="Se a equipe usou o equipamento SPT da empresa (ex.: regra de 15% do Leonardo), deixe marcada a caixinha “Usou equipamento SPT”. Confira a Prévia Automática no rodapé do formulário e toque em “Salvar Apontamento”."
          />
        </View>

        <Text style={s.h2}>Como funciona a Regra Automática (Metro × Diária Mínima)</Text>
        <View style={s.grid2}>
          <View style={[s.cardTeal, s.col]}>
            <Text style={[s.stepTitle, { color: COLORS.teal }]}>
              Quando vira Diária Mínima (Auto)
            </Text>
            <Text style={s.stepText}>
              • Dias apenas de ensaios (EP, E.A, Vane Test) ou parada aguardando liberação de cliente;{'\n'}
              • Dias de sondagem em que (metros x R$/m) for MENOR que a diária mínima.{'\n'}
              Ex.: 8,45 m x R$ 60 = R$ 507,00 (menor que R$ 1.050,00): o Teneur converte sozinho para 1,0 Diária (R$ 1.050,00)!
            </Text>
          </View>

          <View style={[s.cardWhite, s.col, { borderColor: '#B8DEC9', backgroundColor: COLORS.greenSoft }]}>
            <Text style={[s.stepTitle, { color: COLORS.green }]}>
              Quando fatura por Metro (Auto)
            </Text>
            <Text style={s.stepText}>
              • Dias de sondagem em que (metros x R$/m) atingir ou superar a diária mínima.{'\n'}
              Ex.: 23,44 m x R$ 60 = R$ 1.406,40 (maior que R$ 1.050,00): fatura automaticamente por Metro Perfurado (R$ 1.406,40)!{'\n'}
              • Precisa de exceção? Em “Regra de Faturamento”, você pode escolher Meia Diária (0,5) ou ajuste manual.
            </Text>
          </View>
        </View>

        <View style={s.card}>
          <Text style={s.stepTitle}>Legenda visual do Calendário + Radar de Lacunas</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 14, marginTop: 4 }}>
            <View style={s.dotRow}>
              <View style={[s.dot, { backgroundColor: COLORS.green }]} />
              <Text style={s.stepText}>Verde: Metro perfurado</Text>
            </View>
            <View style={s.dotRow}>
              <View style={[s.dot, { backgroundColor: COLORS.teal }]} />
              <Text style={s.stepText}>Petróleo: Diária / Ensaio</Text>
            </View>
            <View style={s.dotRow}>
              <View style={[s.dot, { backgroundColor: COLORS.ochre }]} />
              <Text style={s.stepText}>Ocre: Parado c/ Diária</Text>
            </View>
            <View style={s.dotRow}>
              <View style={[s.dot, { backgroundColor: '#8B95A5' }]} />
              <Text style={s.stepText}>Cinza: Em Casa / Folga</Text>
            </View>
            <View style={s.dotRow}>
              <View style={[s.dot, { backgroundColor: COLORS.danger }]} />
              <Text style={s.stepText}>Terracota: Manutenção</Text>
            </View>
          </View>
          <Text style={[s.stepText, { marginTop: 5 }]}>
            O cartão “Cobertura do Mês” no topo da aba Diário avisa discretamente quantos dias ainda estão sem registro, evitando qualquer esquecimento antes de fechar a medição.
          </Text>
        </View>
      </Page>

      {/* PÁGINA 5 — FECHAMENTO MENSAL E BOLETIM PDF */}
      <Page size="A4" style={s.page}>
        <PageChrome section="4. Fechamento Mensal & Boletim PDF" />

        <Text style={s.kicker}>Capítulo 4 · Precisão até o centavo</Text>
        <Text style={s.h1}>Fechando Medições e Gerando o Boletim em PDF</Text>
        <Text style={s.lead}>
          No fim do mês (ou sempre que quiser conferir o valor parcial), acesse a aba Medições. Todos os metros e diárias lançados no Diário já estarão somados nos Itens 1 a 3.
        </Text>

        <View style={s.card}>
          <Step
            num="1"
            title="Lançar trechos de Mobilização (Item 1.1)"
            text="No bloco “Trechos de Mobilização”, toque em “+ Trecho”, informe Data, Tipo (Mobilização, Desmobilização ou Deslocamento), Origem, Destino e Distância (km). Se a empresa já adiantou o pagamento daquele trecho, marque “Pago antecipado” e informe o valor — o desconto entra sozinho no Item 4.1!"
          />
          <Step
            num="2"
            title="Conferir Descontos Automáticos e lançar Folha / Reembolsos (Item 4)"
            text="Os descontos contratuais aparecem automaticamente com a etiqueta “Auto”: Mobilizações pagas (4.1), Compra do Veículo 7% (4.2) e Equipamento SPT 15% (4.3). Para incluir Folha CLT (4.6), Rastreador (4.5) ou Reembolsos de compras (4.7, ex.: termômetro, cimento com NFC-e), clique em “+ Lançar”. Reembolsos aparecem em verde somando ao saldo líquido."
          />
          <Step
            num="3"
            title="Acompanhar a Amortização do Veículo (ex.: S10 Prata)"
            text="Para equipes com financiamento ativo, o quadro de Amortização é atualizado sozinho todo mês: calcula os 7% sobre o bruto, soma ao valor pago acumulado e mostra o novo saldo devedor exato — sem copiar nenhuma célula!"
          />
          <Step
            num="4"
            title="Aprovar status, copiar Resumo WhatsApp e baixar o PDF"
            text="Mude o status do mês no topo (Aberta > Em Revisão > Fechada > Paga). Use “Resumo WhatsApp” para enviar o fechamento pronto em texto para o sondador ou financeiro, e clique em “Baixar Boletim PDF”."
          />
        </View>

        <View style={s.cardTeal}>
          <Text style={s.kicker}>O que vem dentro do Boletim de Medição PDF</Text>
          <View style={s.grid2}>
            <View style={s.col}>
              <Text style={s.stepTitle}>Página 1 — Boletim Oficial (A4 Paisagem)</Text>
              <Text style={s.stepText}>
                • Cabeçalho com empresa ativa, período e código único de autenticidade;{'\n'}
                • Itens 1 a 3 (Mobilização, Sondagem, Diárias) e Subtotal Bruto;{'\n'}
                • Item 4 (Pagamentos, Descontos e Reembolsos) + Quadro do Veículo;{'\n'}
                • Destaque do Saldo Líquido a Pagar e bloco de assinaturas.
              </Text>
            </View>
            <View style={s.col}>
              <Text style={s.stepTitle}>Página 2+ — Memória de Cálculo (A4 Retrato)</Text>
              <Text style={s.stepText}>
                • Detalhamento linha a linha de cada trecho (km), furo (SP/ST), diária por Pasta/Obra e data, além dos reembolsos com referência fiscal;{'\n'}
                • Assinatura eletrônica de Catherine Irina Pascoal Gouveia — Engenheira de Minas, com data e hora exata da geração.
              </Text>
            </View>
          </View>
          <Text style={[s.stepText, { marginTop: 4 }]}>
            Dica: Antes de baixar o PDF, você pode marcar ou desmarcar a caixinha “Assinatura Eng. Damiana” no topo para incluir ou ocultar a assinatura da Representante Legal.
          </Text>
        </View>
      </Page>

      {/* PÁGINA 6 — PAINEL EXECUTIVO E RELATÓRIO ABNT NBR */}
      <Page size="A4" style={s.page}>
        <PageChrome section="5. Painel Executivo & Relatório ABNT NBR" />

        <Text style={s.kicker}>Capítulo 5 · Apresentações de alto nível</Text>
        <Text style={s.h1}>Gráficos Interativos e Relatório Executivo NBR</Text>
        <Text style={s.lead}>
          Na aba Visão Geral, o Teneur transforma seus lançamentos diários em indicadores executivos prontos para reuniões de diretoria — com visual limpo e download direto em PDF seguindo diretrizes da ABNT NBR.
        </Text>

        <View style={s.grid2}>
          <View style={[s.cardWhite, s.col]}>
            <Text style={s.stepTitle}>1. Produção por Equipe</Text>
            <Text style={s.stepText}>
              Compara em barras duplas os Metros Perfurados e as Diárias faturadas de cada sondador no mês selecionado.
            </Text>
          </View>
          <View style={[s.cardWhite, s.col]}>
            <Text style={s.stepTitle}>2. Taxa de Ocupação da Frota</Text>
            <Text style={s.stepText}>
              Mostra o equilíbrio entre dias Produtivos em Obra, Parados por Cliente/Liberação, Em Casa/Ocioso e Manutenção.
            </Text>
          </View>
        </View>

        <View style={s.grid2}>
          <View style={[s.cardWhite, s.col]}>
            <Text style={s.stepTitle}>3. Financeiro & Evolução Semestral</Text>
            <Text style={s.stepText}>
              Acompanha os últimos 6 meses de Bruto vs. Líquido junto com a linha do peso percentual da Mobilização sobre o total.
            </Text>
          </View>
          <View style={[s.cardWhite, s.col]}>
            <Text style={s.stepTitle}>4. Produtividade Média (m/dia)</Text>
            <Text style={s.stepText}>
              Exibe o rendimento médio diário de perfuração em SPT e a Trado por equipe para identificar rapidamente alta performance.
            </Text>
          </View>
        </View>

        <View style={s.card}>
          <Text style={s.stepTitle}>Termômetro em Tempo Real (“Quanto produziu até hoje?”)</Text>
          <Text style={s.stepText}>
            Logo abaixo dos gráficos, cada equipe tem um cartão vivo com metros acumulados, diárias, km de mobilização, status e líquido estimado até o momento — além de botões rápidos para ir direto ao Diário ou ao Boletim daquela equipe.
          </Text>
        </View>

        <View style={s.cardTeal}>
          <Text style={s.kicker}>Como baixar a apresentação mensal em PDF (Padrão ABNT NBR)</Text>
          <Step
            num="1"
            title="Selecione o mês desejado no topo"
            text="Certifique-se de que o seletor de mês está no período da reunião (ex.: Outubro/2026)."
          />
          <Step
            num="2"
            title="Defina se deseja incluir a Representante Legal"
            text="Marque ou desmarque “Assinatura Eng. Damiana” ao lado do botão de download."
          />
          <Step
            num="3"
            title="Toque em “Baixar Relatório NBR (PDF)”"
            text="O Teneur gera na hora um Relatório Técnico-Gerencial estruturado conforme ABNT NBR 10719 / NBR 6024 / NBR 6484 (margens 3 cm / 2 cm, seções numeradas de 1 a 6, tabelas com título e Fonte, gráficos vetoriais nítidos, paginação Página X de Y e sua assinatura técnica com data/hora)."
          />
        </View>

        <Text style={[s.stepText, { marginTop: 2 }]}>
          Dica extra para slides (PowerPoint / Canva): cada gráfico na tela também possui um pequeno ícone de menu no canto superior direito que permite salvar aquele gráfico individual em imagem PNG de alta qualidade.
        </Text>
      </Page>

      {/* PÁGINA 7 — EQUIPES, OBRAS, MULTI-EMPRESAS E CHECKLIST */}
      <Page size="A4" style={s.page}>
        <PageChrome section="6. Cadastros, Multi-Empresas & Checklist" />

        <Text style={s.kicker}>Capítulo 6 · Controle completo</Text>
        <Text style={s.h1}>Equipes, Obras/Pastas, Multi-Empresas & Rotina</Text>

        <View style={s.grid2}>
          <View style={[s.cardWhite, s.col]}>
            <Text style={s.stepTitle}>Equipes & Tabelas Contratuais</Text>
            <Text style={s.stepText}>
              Na aba Equipes, toque no ícone de lápis em qualquer sondador para ajustar Diária Mínima, R$/m SPT, R$/m Trado, R$/km, % de Equipamento SPT ou Rastreador — ou clique em “+ Nova Equipe” para cadastrar novos profissionais.
            </Text>
          </View>
          <View style={[s.cardWhite, s.col]}>
            <Text style={s.stepTitle}>Obras & Pastas (Mini-CRM)</Text>
            <Text style={s.stepText}>
              Na aba Obras, cadastre cada nova Pasta, Cliente, OS e Cidade/UF em “+ Nova Pasta / Obra”. Assim ela fica pronta para seleção no Diário e acumula automaticamente metros, diárias e custo de campo da obra.
            </Text>
          </View>
        </View>

        <View style={s.grid2}>
          <View style={[s.cardWhite, s.col]}>
            <Text style={s.stepTitle}>Adicionando Outra Empresa</Text>
            <Text style={s.stepText}>
              O Teneur é a sua ferramenta pessoal de gestão. Toque no nome da empresa logo abaixo de “Teneur” e clique em “+ Adicionar outra empresa” sempre que prestar serviços ou coordenar projetos para uma nova contratante.
            </Text>
          </View>
          <View style={[s.cardWhite, s.col]}>
            <Text style={s.stepTitle}>Assinatura Técnica & CREA</Text>
            <Text style={s.stepText}>
              Toque na Engrenagem (Configurações) para adicionar ou atualizar seu número do CREA abaixo de “Catherine Irina Pascoal Gouveia — Engenheira de Minas” em todos os PDFs emitidos pelo sistema.
            </Text>
          </View>
        </View>

        <Text style={s.h2}>Checklist de Bolso — Sua rotina leve com o Teneur</Text>
        <View style={s.cardOchre}>
          <View style={{ marginBottom: 7 }}>
            <Text style={[s.stepTitle, { color: COLORS.teal }]}>
              Todo fim de tarde (15 segundos no iPhone)
            </Text>
            <Text style={s.stepText}>
              Abrir o app Teneur, acessar a aba Diário, tocar no dia de hoje das equipes ativas e lançar os furos, ensaios ou status do dia.
            </Text>
          </View>
          <View style={{ marginBottom: 7 }}>
            <Text style={[s.stepTitle, { color: COLORS.ochre }]}>
              Durante o mês (quando ocorrer)
            </Text>
            <Text style={s.stepText}>
              Lançar trechos de mobilização (km) e reembolsos com foto/número da nota fiscal na aba Medições para não acumular nada para o último dia.
            </Text>
          </View>
          <View>
            <Text style={[s.stepTitle, { color: COLORS.green }]}>
              Todo dia 28 / fechamento do mês
            </Text>
            <Text style={s.stepText}>
              1. Conferir se restou algum dia sem registro no Radar de Lacunas;{'\n'}
              2. Lançar a Folha CLT (Item 4.6) de cada equipe aplicável;{'\n'}
              3. Conferir o Saldo a Pagar, mudar o status para “Fechada” e baixar o Boletim PDF + copiar o Resumo WhatsApp;{'\n'}
              4. Ir em Visão Geral e baixar o Relatório Executivo NBR (PDF) pronto para apresentação!
            </Text>
          </View>
        </View>

        <View style={[s.cardTeal, { marginTop: 10, alignItems: 'center', paddingVertical: 14 }]}>
          <TeneurEmblem size={30} />
          <Text style={{ fontSize: 10, fontFamily: 'Helvetica-Bold', color: COLORS.ink, marginTop: 7 }}>
            Teneur — Gestão de Serviços
          </Text>
          <Text style={{ fontSize: 8.4, color: COLORS.slate, textAlign: 'center', marginTop: 3, maxWidth: 380 }}>
            Criado com engenharia de precisão e muito carinho para deixar o dia a dia da Engenheira de Minas Catherine Irina Pascoal Gouveia mais simples, rápido e elegante.
          </Text>
          <Text style={{ fontSize: 8, fontFamily: 'Helvetica-Bold', color: COLORS.teal, marginTop: 7 }}>
            https://teneur.vercel.app · Desenvolvido por Okapi Code Forge
          </Text>
        </View>
      </Page>
    </Document>
  );
}

async function main() {
  const primaryPath = path.resolve(process.cwd(), '..', 'Teneur - Manual de Uso.pdf');
  const fallbackPath = path.resolve(
    process.cwd(),
    '..',
    'Teneur - Manual de Uso (Atualizado).pdf'
  );
  const buffer = await renderToBuffer(
    React.createElement(TeneurManualDocument) as unknown as React.ReactElement<Record<string, unknown>>
  );
  try {
    fs.writeFileSync(primaryPath, buffer);
    console.log(`Manual gerado com sucesso em: ${primaryPath} (${buffer.byteLength} bytes)`);
  } catch (err) {
    const code = (err as NodeJS.ErrnoException).code;
    if (code === 'EBUSY' || code === 'EPERM') {
      fs.writeFileSync(fallbackPath, buffer);
      console.log(`Arquivo principal em uso. Manual atualizado salvo em: ${fallbackPath} (${buffer.byteLength} bytes)`);
      return;
    }
    throw err;
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
