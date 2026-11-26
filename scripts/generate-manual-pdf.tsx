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
      subject="Manual de Uso — Teneur Gestão de Serviços"
      creator="Okapi Code Forge"
    >
      {/* CAPA */}
      <Page size="A4" style={s.coverPage}>
        <View style={s.coverTopBand}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <TeneurEmblem size={62} />
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={{ fontSize: 8, color: COLORS.teal, fontFamily: 'Helvetica-Bold', letterSpacing: 1.2 }}>
                MANUAL DO USUÁRIO
              </Text>
              <Text style={{ fontSize: 8, color: COLORS.muted, marginTop: 2 }}>
                Versão 1.0 · Celular (iPhone / Android) e Notebook
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
            Guia prático de uso para acompanhar equipes de campo, fechar medições mensais e gerar relatórios técnicos em PDF.
          </Text>
        </View>

        <View style={s.coverBody}>
          <View>
            <View style={[s.cardWhite, { padding: 18 }]}>
              <Text style={s.kicker}>Responsável Técnica</Text>
              <Text style={{ fontSize: 14, fontFamily: 'Helvetica-Bold', color: COLORS.ink }}>
                Catherine Irina Pascoal Gouveia
              </Text>
              <Text style={{ fontSize: 9.5, color: COLORS.slate, marginTop: 2 }}>
                Engenheira de Minas · Coordenação de Equipes e Serviços de Campo
              </Text>
              <View style={{ height: 0.7, backgroundColor: COLORS.border, marginVertical: 11 }} />
              <Text style={{ fontSize: 8.8, color: COLORS.slate, lineHeight: 1.55 }}>
                O Teneur centraliza o registro diário das equipes, o cálculo de medições e a emissão dos documentos mensais em um único lugar. Tudo o que você lança no celular aparece na hora no computador, reduzindo o trabalho manual no fechamento do mês.
              </Text>
            </View>

            <View style={[s.grid2, { marginTop: 6 }]}>
              <View style={[s.cardTeal, s.col]}>
                <Text style={{ fontSize: 7.5, fontFamily: 'Helvetica-Bold', color: COLORS.teal, textTransform: 'uppercase' }}>
                  Endereço de Acesso
                </Text>
                <Text style={{ fontSize: 11, fontFamily: 'Helvetica-Bold', color: COLORS.ink, marginTop: 4 }}>
                  https://teneur.vercel.app
                </Text>
                <Text style={{ fontSize: 8, color: COLORS.slate, marginTop: 3 }}>
                  Acesso direto pelo navegador do celular ou computador, com sincronização automática.
                </Text>
              </View>

              <View style={[s.cardOchre, s.col]}>
                <Text style={{ fontSize: 7.5, fontFamily: 'Helvetica-Bold', color: COLORS.ochre, textTransform: 'uppercase' }}>
                  Conteúdo deste manual
                </Text>
                <Text style={{ fontSize: 8.3, color: COLORS.ink, marginTop: 4, lineHeight: 1.5 }}>
                  • Instalação na tela inicial do iPhone e agenda{'\n'}
                  • Diário de campo e regra Metro x Diária{'\n'}
                  • Fechamento mensal, boletins e relatório NBR
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
        <PageChrome section="1. Visão Geral e Navegação" />

        <Text style={s.kicker}>Capítulo 1</Text>
        <Text style={s.h1}>Como o Teneur está organizado</Text>
        <Text style={s.lead}>
          Ao abrir o sistema, todos os dados são carregados e sincronizados em nuvem. Qualquer alteração feita no celular fica disponível imediatamente no notebook.
        </Text>

        <Text style={s.h2}>Os 5 módulos principais (menu lateral no notebook / barra inferior no celular)</Text>

        <View style={s.card}>
          <Step
            num="1"
            title="Visão Geral (Painel)"
            text="Exibe os 4 indicadores do mês (Medição Bruta, Líquido a Pagar, Produção em metros/diárias e Taxa de Ocupação), 4 gráficos interativos, o resumo parcial de cada equipe e o botão para baixar o Relatório Executivo NBR em PDF."
          />
          <Step
            num="2"
            title="Diário de Campo (Diário)"
            text="Tela usada no dia a dia. Mostra o calendário mensal de cada equipe, indica quantos dias ainda estão sem registro e define automaticamente se o dia será faturado por Metro Perfurado ou Diária Mínima."
          />
          <Step
            num="3"
            title="Medições"
            text="Reúne automaticamente os metros, diárias, trechos de mobilização (km), descontos contratuais (7% veículo, 15% equipamento SPT), folha CLT e reembolsos, gerando o Boletim de Medição e a Memória de Cálculo em PDF."
          />
          <Step
            num="4"
            title="Equipes"
            text="Mantém as regras contratuais de cada sondador (diária mínima, valor do metro SPT e Trado, valor do km de mobilização, percentual de equipamento SPT e rastreador). Permite editar contratos e cadastrar novas equipes."
          />
          <Step
            num="5"
            title="Obras & Pastas (Obras)"
            text="Cadastra Pastas, Clientes, OS e cidades de forma padronizada, mostrando quantos metros, diárias e qual o custo de campo acumulado em cada obra durante o mês."
          />
        </View>

        <Text style={s.h2}>Controles da barra superior</Text>
        <View style={s.grid2}>
          <View style={[s.cardWhite, s.col]}>
            <Text style={s.stepTitle}>Seletor de Mês (&lt; Outubro/2026 &gt;)</Text>
            <Text style={s.stepText}>
              Altera o período exibido em todo o sistema (gráficos, calendário, medições e PDFs) entre meses anteriores, mês atual e próximos meses.
            </Text>
          </View>
          <View style={[s.cardWhite, s.col]}>
            <Text style={s.stepTitle}>Empresa Ativa (abaixo de Teneur)</Text>
            <Text style={s.stepText}>
              Toque em “Terra Sol” para alternar entre empresas ou cadastrar outra contratante no futuro. O cabeçalho dos PDFs acompanha a empresa selecionada.
            </Text>
          </View>
        </View>
        <View style={s.grid2}>
          <View style={[s.cardWhite, s.col]}>
            <Text style={s.stepTitle}>Sininho e Modo Noturno (Lua / Sol)</Text>
            <Text style={s.stepText}>
              O sininho configura notificações e lembretes no Calendário do celular. O botão Lua/Sol alterna entre o Modo Claro e o Modo Noturno.
            </Text>
          </View>
          <View style={[s.cardWhite, s.col]}>
            <Text style={s.stepTitle}>Engrenagem (Assinatura e CREA)</Text>
            <Text style={s.stepText}>
              Permite editar seu nome, título profissional (Engenheira de Minas), incluir o número do CREA e definir se a assinatura da Representante Legal vem marcada por padrão.
            </Text>
          </View>
        </View>
      </Page>

      {/* PÁGINA 3 — IPHONE APP NATIVO, NOTIFICAÇÕES E CALENDÁRIO */}
      <Page size="A4" style={s.page}>
        <PageChrome section="2. App no iPhone, Notificações e Agenda" />

        <Text style={s.kicker}>Capítulo 2 · Uso no iPhone</Text>
        <Text style={s.h1}>Colocando o Teneur na Tela Inicial do iPhone</Text>
        <Text style={s.lead}>
          Você pode adicionar o Teneur à tela inicial do iPhone para abri-lo em tela cheia, como um aplicativo normal, sem precisar abrir o navegador nem digitar o endereço toda vez.
        </Text>

        <Text style={[s.h2, { marginTop: 6, marginBottom: 4 }]}>2.1 Como adicionar o Teneur à Tela de Início</Text>
        <View style={[s.cardWhite, { padding: 8, marginBottom: 7 }]}>
          <IphoneInstallDiagram />
        </View>

        <View style={[s.card, { padding: 10, marginBottom: 7 }]}>
          <Step
            num="1"
            title="Abra o link no Safari"
            text="No iPhone, abra o Safari (ícone da bússola azul) e acesse https://teneur.vercel.app. Use sempre o Safari para liberar o modo tela cheia."
          />
          <Step
            num="2"
            title="Toque no botão Compartilhar (na barra inferior)"
            text="Na parte de baixo do Safari, bem no centro, toque no quadradinho com uma seta apontando para cima."
          />
          <Step
            num="3"
            title="Toque em “Adicionar à Tela de Início”"
            text="Um menu vai subir na tela. Deslize esse menu para cima até encontrar “Adicionar à Tela de Início” e toque nessa opção."
          />
          <Step
            num="4"
            title="Confirme em “Adicionar”"
            text="Toque em “Adicionar” no canto superior direito. O ícone do Teneur vai aparecer na tela inicial do iPhone junto com os seus outros aplicativos."
          />
        </View>

        <View style={[s.grid2, { marginBottom: 7 }]}>
          <View style={[s.cardTeal, s.col, { padding: 10, marginBottom: 0 }]}>
            <Text style={s.kicker}>2.2 Notificações no iPhone</Text>
            <Text style={s.stepTitle}>Alertas diretos no aparelho</Text>
            <Text style={[s.stepText, { marginTop: 2 }]}>
              1. Abra o Teneur pelo ícone da Tela de Início.{'\n'}
              2. Toque no ícone de Sininho no canto superior direito.{'\n'}
              3. Toque em “Ativar notificações neste dispositivo” e depois em “Permitir”.{'\n'}
              4. Use “Testar notificação” para confirmar o recebimento.
            </Text>
          </View>

          <View style={[s.cardOchre, s.col, { padding: 10, marginBottom: 0 }]}>
            <Text style={[s.kicker, { color: COLORS.ochre }]}>2.3 Calendário do Celular</Text>
            <Text style={s.stepTitle}>Lembretes recorrentes (Diário e Mensal)</Text>
            <Text style={[s.stepText, { marginTop: 2 }]}>
              1. No menu do Sininho, defina o horário do lembrete diário (ex.: 18:00) e o dia do fechamento mensal (ex.: dia 28).{'\n'}
              2. Toque em “Adicionar Lembrete Diário + Mensal ao Calendário”.{'\n'}
              3. Toque em “Adicionar Tudo” no app Calendário.
            </Text>
          </View>
        </View>

        <View style={[s.card, { padding: 10, marginBottom: 0 }]}>
          <Text style={s.stepTitle}>Como funcionam os lembretes na agenda</Text>
          <Text style={s.stepText}>
            • Segunda a sábado (no horário configurado): aviso 10 minutos antes com link direto para atualizar o Diário de Campo.{'\n'}
            • Todo dia 28 (e um dia antes): lembrete para revisar pendências do mês, fechar os boletins e gerar o Relatório NBR.
          </Text>
        </View>
      </Page>

      {/* PÁGINA 4 — DIÁRIO DE CAMPO E REGRA AUTOMÁTICA */}
      <Page size="A4" style={s.page}>
        <PageChrome section="3. Diário de Campo e Cálculo Automático" />

        <Text style={s.kicker}>Capítulo 3 · Acompanhamento diário</Text>
        <Text style={s.h1}>Registrando a produção no Diário de Campo</Text>
        <Text style={s.lead}>
          Mantendo o Diário de Campo preenchido durante o mês, os totais de metros e diárias ficam prontos automaticamente para o fechamento da medição.
        </Text>

        <View style={s.card}>
          <Step
            num="1"
            title="Selecione a equipe e toque no dia"
            text="Na aba Diário, escolha o sondador no topo (Leonardo, Ramon, Marcos, Luís, Junior ou Dulcivan) e toque direto no dia do calendário ou no botão “+ Apontar Dia”."
          />
          <Step
            num="2"
            title="Defina Status, Pasta/Obra e Atividade"
            text="Informe se a equipe esteve Em Obra, em Mobilização/Viagem, Parada c/ Diária (aguardando cliente ou liberação), Em Casa, Folga/Domingo ou Manutenção, e vincule a Pasta/Obra."
          />
          <Step
            num="3"
            title="Lance os Furos ou o Ensaio realizado"
            text="Em dias de perfuração, preencha o código do furo (ex.: SP-01), o tipo (SPT, Trado ou Rotativa), a profundidade em metros e clique em “+ Add”. Para ensaios (EP, E.A, Vane Test, Resistividade), preencha o campo de descrição."
          />
          <Step
            num="4"
            title="Indique uso de Equipamento SPT e salve"
            text="Quando a equipe utilizar equipamento SPT sujeito a desconto contratual (como a regra de 15% do Leonardo), mantenha marcada a opção “Usou equipamento SPT”. Confira a prévia do valor e toque em “Salvar Apontamento”."
          />
        </View>

        <Text style={s.h2}>Regra automática de cálculo (Metro x Diária Mínima)</Text>
        <View style={s.grid2}>
          <View style={[s.cardTeal, s.col]}>
            <Text style={[s.stepTitle, { color: COLORS.teal }]}>
              Faturamento por Diária Mínima (Auto)
            </Text>
            <Text style={s.stepText}>
              • Dias apenas com ensaios (EP, E.A, Vane Test) ou parada aguardando liberação do cliente;{'\n'}
              • Dias de sondagem em que (metros x R$/m) ficar abaixo da diária mínima.{'\n'}
              Ex.: 8,45 m x R$ 60 = R$ 507,00 (abaixo de R$ 1.050,00): o sistema contabiliza 1,0 Diária (R$ 1.050,00).
            </Text>
          </View>

          <View style={[s.cardWhite, s.col, { borderColor: '#B8DEC9', backgroundColor: COLORS.greenSoft }]}>
            <Text style={[s.stepTitle, { color: COLORS.green }]}>
              Faturamento por Metro (Auto)
            </Text>
            <Text style={s.stepText}>
              • Dias de sondagem em que (metros x R$/m) atingir ou ultrapassar a diária mínima.{'\n'}
              Ex.: 23,44 m x R$ 60 = R$ 1.406,40 (acima de R$ 1.050,00): o sistema fatura por Metro Perfurado (R$ 1.406,40).{'\n'}
              • Para exceções, use o campo “Regra de Faturamento” (ex.: Forçar Meia Diária 0,5).
            </Text>
          </View>
        </View>

        <View style={s.card}>
          <Text style={s.stepTitle}>Legenda do calendário e dias sem registro</Text>
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
            O indicador “Cobertura do Mês” no topo da tela mostra quantos dias ainda não têm lançamento para facilitar a revisão antes do fechamento.
          </Text>
        </View>
      </Page>

      {/* PÁGINA 5 — FECHAMENTO MENSAL E BOLETIM PDF */}
      <Page size="A4" style={s.page}>
        <PageChrome section="4. Fechamento Mensal e Boletim PDF" />

        <Text style={s.kicker}>Capítulo 4 · Fechamento mensal</Text>
        <Text style={s.h1}>Fechando Medições e Gerando o Boletim em PDF</Text>
        <Text style={s.lead}>
          Na aba Medições, os serviços lançados no Diário já aparecem consolidados nos Itens 1 a 3. Basta conferir as mobilizações, incluir os lançamentos financeiros do mês e emitir o PDF.
        </Text>

        <View style={s.card}>
          <Step
            num="1"
            title="Lançar trechos de Mobilização (Item 1.1)"
            text="Em “Trechos de Mobilização”, clique em “+ Trecho” e informe Data, Tipo (Mobilização, Desmobilização ou Deslocamento), Origem, Destino e Distância (km). Caso o trecho já tenha sido pago antecipadamente, marque “Pago antecipado” e informe o valor para gerar o desconto automático no Item 4.1."
          />
          <Step
            num="2"
            title="Conferir Descontos Automáticos e lançar Folha / Reembolsos (Item 4)"
            text="Mobilizações pagas (4.1), Compra do Veículo 7% (4.2) e Equipamento SPT 15% (4.3) são calculados automaticamente (etiqueta “Auto”). Clique em “+ Lançar” para registrar Folha CLT (4.6), Rastreador (4.5) ou Reembolsos de compras (4.7, com referência da NFC-e). Reembolsos aparecem em verde somando ao saldo líquido."
          />
          <Step
            num="3"
            title="Conferir a Amortização do Veículo (ex.: S10 Prata)"
            text="Para equipes com financiamento ativo, o quadro de amortização aplica os 7% sobre o valor bruto da medição, atualiza o valor pago acumulado e calcula o saldo devedor restante de forma automática."
          />
          <Step
            num="4"
            title="Atualizar status, enviar resumo e baixar o PDF"
            text="Avance o status no topo (Aberta > Em Revisão > Fechada > Paga). Use “Resumo WhatsApp” para copiar os totais formatados em texto e clique em “Baixar Boletim PDF” para salvar o arquivo."
          />
        </View>

        <View style={s.cardTeal}>
          <Text style={s.kicker}>Estrutura do Boletim de Medição PDF</Text>
          <View style={s.grid2}>
            <View style={s.col}>
              <Text style={s.stepTitle}>Página 1 · Boletim Oficial (A4 Paisagem)</Text>
              <Text style={s.stepText}>
                • Cabeçalho com empresa ativa, período e código de controle;{'\n'}
                • Itens 1 a 3 (Mobilização, Sondagem, Diárias) e Subtotal Bruto;{'\n'}
                • Item 4 (Pagamentos, Descontos e Reembolsos) e quadro do veículo;{'\n'}
                • Saldo Líquido a Pagar e bloco de assinaturas.
              </Text>
            </View>
            <View style={s.col}>
              <Text style={s.stepTitle}>Página 2+ · Memória de Cálculo (A4 Retrato)</Text>
              <Text style={s.stepText}>
                • Lista detalhada de cada trecho (km), furo (SP/ST), diária por Pasta/Obra e data, além dos reembolsos com nota ou comprovante;{'\n'}
                • Assinatura técnica de Catherine Irina Pascoal Gouveia (Engenheira de Minas) com data e hora da emissão.
              </Text>
            </View>
          </View>
          <Text style={[s.stepText, { marginTop: 4 }]}>
            Antes de gerar o PDF, você pode marcar ou desmarcar “Assinatura Eng. Damiana” no topo para incluir ou ocultar a assinatura da Representante Legal.
          </Text>
        </View>
      </Page>

      {/* PÁGINA 6 — PAINEL EXECUTIVO E RELATÓRIO ABNT NBR */}
      <Page size="A4" style={s.page}>
        <PageChrome section="5. Indicadores e Relatório ABNT NBR" />

        <Text style={s.kicker}>Capítulo 5 · Indicadores e Relatórios</Text>
        <Text style={s.h1}>Gráficos Interativos e Relatório Executivo NBR</Text>
        <Text style={s.lead}>
          Na aba Visão Geral, o sistema consolida os registros do mês em gráficos e indicadores prontos para acompanhamento gerencial e exportação em PDF no padrão ABNT NBR.
        </Text>

        <View style={s.grid2}>
          <View style={[s.cardWhite, s.col]}>
            <Text style={s.stepTitle}>1. Produção por Equipe</Text>
            <Text style={s.stepText}>
              Compara em barras os Metros Perfurados e as Diárias faturadas de cada sondador no mês selecionado.
            </Text>
          </View>
          <View style={[s.cardWhite, s.col]}>
            <Text style={s.stepTitle}>2. Taxa de Ocupação da Frota</Text>
            <Text style={s.stepText}>
              Mostra a divisão entre dias Produtivos em Obra, Parados por Cliente/Liberação, Em Casa/Ocioso e Manutenção.
            </Text>
          </View>
        </View>

        <View style={s.grid2}>
          <View style={[s.cardWhite, s.col]}>
            <Text style={s.stepTitle}>3. Financeiro e Evolução Semestral</Text>
            <Text style={s.stepText}>
              Exibe os últimos 6 meses de Bruto vs. Líquido junto com a curva do peso percentual da Mobilização sobre o total.
            </Text>
          </View>
          <View style={[s.cardWhite, s.col]}>
            <Text style={s.stepTitle}>4. Produtividade Média (m/dia)</Text>
            <Text style={s.stepText}>
              Apresenta o rendimento médio diário em sondagem SPT e a Trado por equipe para comparar o desempenho de campo.
            </Text>
          </View>
        </View>

        <View style={s.card}>
          <Text style={s.stepTitle}>Resumo Parcial por Equipe (até a data atual)</Text>
          <Text style={s.stepText}>
            Abaixo dos gráficos, cada equipe possui um resumo em tempo real com metros acumulados, diárias, km de mobilização, status e valor líquido estimado até o momento, além de atalhos diretos para o Diário e o Boletim.
          </Text>
        </View>

        <View style={s.cardTeal}>
          <Text style={s.kicker}>Como emitir o Relatório Executivo NBR (PDF)</Text>
          <Step
            num="1"
            title="Selecione o mês de referência no topo"
            text="Confira no seletor superior se o mês escolhido corresponde ao período da apresentação (ex.: Outubro/2026)."
          />
          <Step
            num="2"
            title="Defina as assinaturas"
            text="Marque ou desmarque “Assinatura Eng. Damiana” ao lado do botão de download conforme a necessidade do documento."
          />
          <Step
            num="3"
            title="Clique em “Baixar Relatório NBR (PDF)”"
            text="O arquivo é gerado em formato ABNT NBR 10719 / NBR 6024 / NBR 6484, com margens oficiais (3 cm / 2 cm), seções numeradas de 1 a 6, tabelas com título e Fonte, gráficos vetoriais, paginação Página X de Y e sua assinatura técnica datada."
          />
        </View>

        <Text style={[s.stepText, { marginTop: 2 }]}>
          Para usar um gráfico separado em slides (PowerPoint ou Canva), toque no pequeno ícone de menu no canto superior direito do gráfico e salve a imagem em PNG.
        </Text>
      </Page>

      {/* PÁGINA 7 — EQUIPES, OBRAS, MULTI-EMPRESAS E CHECKLIST */}
      <Page size="A4" style={s.page}>
        <PageChrome section="6. Cadastros e Rotina de Uso" />

        <Text style={s.kicker}>Capítulo 6 · Cadastros e Rotina</Text>
        <Text style={s.h1}>Equipes, Obras/Pastas, Empresas e Rotina</Text>

        <View style={s.grid2}>
          <View style={[s.cardWhite, s.col]}>
            <Text style={s.stepTitle}>Equipes e Tabelas Contratuais</Text>
            <Text style={s.stepText}>
              Na aba Equipes, clique no ícone de edição em qualquer sondador para atualizar Diária Mínima, R$/m SPT, R$/m Trado, R$/km, % de Equipamento SPT ou Rastreador, ou use “+ Nova Equipe” para incluir novos profissionais.
            </Text>
          </View>
          <View style={[s.cardWhite, s.col]}>
            <Text style={s.stepTitle}>Obras e Pastas</Text>
            <Text style={s.stepText}>
              Na aba Obras, cadastre cada nova Pasta, Cliente, OS e Cidade/UF em “+ Nova Pasta / Obra”. A obra fica disponível no Diário e acumula automaticamente metros, diárias e custo mensal.
            </Text>
          </View>
        </View>

        <View style={s.grid2}>
          <View style={[s.cardWhite, s.col]}>
            <Text style={s.stepTitle}>Adicionando Outra Empresa</Text>
            <Text style={s.stepText}>
              Toque no nome da empresa logo abaixo de “Teneur” e escolha “+ Adicionar outra empresa” sempre que precisar gerenciar medições para outra contratante sem misturar os cabeçalhos dos PDFs.
            </Text>
          </View>
          <View style={[s.cardWhite, s.col]}>
            <Text style={s.stepTitle}>Assinatura Técnica e CREA</Text>
            <Text style={s.stepText}>
              No ícone de Engrenagem (Configurações), você pode informar ou atualizar o número do seu CREA abaixo de “Catherine Irina Pascoal Gouveia — Engenheira de Minas” em todos os PDFs gerados.
            </Text>
          </View>
        </View>

        <Text style={s.h2}>Rotina recomendada de uso</Text>
        <View style={s.cardOchre}>
          <View style={{ marginBottom: 7 }}>
            <Text style={[s.stepTitle, { color: COLORS.teal }]}>
              No fim do dia
            </Text>
            <Text style={s.stepText}>
              Abrir o Teneur, acessar a aba Diário, selecionar o dia das equipes ativas e registrar os furos, ensaios ou status do dia.
            </Text>
          </View>
          <View style={{ marginBottom: 7 }}>
            <Text style={[s.stepTitle, { color: COLORS.ochre }]}>
              Ao longo do mês
            </Text>
            <Text style={s.stepText}>
              Registrar trechos de mobilização (km) e reembolsos com referência da nota fiscal na aba Medições conforme forem acontecendo.
            </Text>
          </View>
          <View>
            <Text style={[s.stepTitle, { color: COLORS.green }]}>
              No fechamento do mês (dia 28)
            </Text>
            <Text style={s.stepText}>
              1. Verificar se restou algum dia sem registro na Cobertura do Mês;{'\n'}
              2. Lançar a Folha CLT (Item 4.6) das equipes aplicáveis;{'\n'}
              3. Conferir o Saldo a Pagar, alterar o status para “Fechada”, baixar o Boletim PDF e copiar o Resumo WhatsApp;{'\n'}
              4. Abrir a Visão Geral e baixar o Relatório Executivo NBR em PDF.
            </Text>
          </View>
        </View>

        <View style={[s.cardTeal, { marginTop: 10, alignItems: 'center', paddingVertical: 14 }]}>
          <TeneurEmblem size={30} />
          <Text style={{ fontSize: 10, fontFamily: 'Helvetica-Bold', color: COLORS.ink, marginTop: 7 }}>
            Teneur — Gestão de Serviços
          </Text>
          <Text style={{ fontSize: 8.4, color: COLORS.slate, textAlign: 'center', marginTop: 3, maxWidth: 380 }}>
            Manual de referência preparado para Catherine Irina Pascoal Gouveia, Engenheira de Minas. Consulte este guia sempre que precisar revisar alguma etapa do sistema.
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
