import React from 'react';
import {
  Document,
  Line,
  Page,
  Path,
  Polygon,
  Rect,
  StyleSheet,
  Svg,
  Text,
  View,
} from '@react-pdf/renderer';
import type { ExecutiveAnalytics } from '@/domain/analytics';
import {
  formatCurrencyBRL,
  formatDecimalBR,
  formatMonthYearPT,
  formatTimestampBR,
  generateAuthenticityCode,
} from '@/domain/formatters';
import type { SignatoryConfig } from '@/domain/types';

const styles = StyleSheet.create({
  page: {
    paddingTop: 85,
    paddingLeft: 85,
    paddingBottom: 57,
    paddingRight: 57,
    fontFamily: 'Helvetica',
    fontSize: 9.5,
    lineHeight: 1.4,
    color: '#181B20',
    backgroundColor: '#FFFFFF',
  },
  runningHeader: {
    position: 'absolute',
    top: 28,
    left: 85,
    right: 57,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 0.75,
    borderBottomColor: '#CBD5E1',
    paddingBottom: 6,
  },
  runningFooter: {
    position: 'absolute',
    bottom: 22,
    left: 85,
    right: 57,
    flexDirection: 'row',
    justifyContent: 'space-between',
    fontSize: 7.5,
    color: '#64748B',
    borderTopWidth: 0.6,
    borderTopColor: '#CBD5E1',
    paddingTop: 5,
  },
  docCoverBand: {
    borderWidth: 1,
    borderColor: '#1E293B',
    backgroundColor: '#F7F9FA',
    padding: 14,
    marginBottom: 14,
  },
  docKicker: {
    fontSize: 7.5,
    letterSpacing: 1.1,
    color: '#1F6E7A',
    fontFamily: 'Helvetica-Bold',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  docTitle: {
    fontSize: 13.5,
    fontFamily: 'Helvetica-Bold',
    color: '#0F172A',
    lineHeight: 1.3,
    marginBottom: 6,
  },
  docMetaGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    borderTopWidth: 0.6,
    borderTopColor: '#CBD5E1',
    paddingTop: 7,
    marginTop: 4,
  },
  docMetaItem: {
    width: '50%',
    marginBottom: 3,
    fontSize: 8.2,
  },
  sectionHeading: {
    fontSize: 10.5,
    fontFamily: 'Helvetica-Bold',
    color: '#0F172A',
    textTransform: 'uppercase',
    marginTop: 12,
    marginBottom: 5,
    borderBottomWidth: 0.9,
    borderBottomColor: '#1F6E7A',
    paddingBottom: 3,
  },
  paragraph: {
    fontSize: 9.2,
    textAlign: 'justify',
    marginBottom: 7,
    color: '#1E293B',
  },
  kpiRow: {
    flexDirection: 'row',
    gap: 7,
    marginBottom: 10,
  },
  kpiCard: {
    flex: 1,
    borderWidth: 0.75,
    borderColor: '#CBD5E1',
    backgroundColor: '#F8FAFB',
    paddingVertical: 7,
    paddingHorizontal: 8,
  },
  kpiLabel: {
    fontSize: 7,
    color: '#525B68',
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  kpiValue: {
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
    color: '#0F172A',
  },
  kpiSub: {
    fontSize: 7,
    color: '#1F6E7A',
    marginTop: 1,
  },
  abntCaption: {
    fontSize: 8.2,
    fontFamily: 'Helvetica-Bold',
    color: '#0F172A',
    marginTop: 6,
    marginBottom: 4,
  },
  abntSource: {
    fontSize: 7.4,
    color: '#525B68',
    marginTop: 3,
    marginBottom: 8,
  },
  table: {
    borderTopWidth: 1.2,
    borderBottomWidth: 1.2,
    borderColor: '#1E293B',
    marginBottom: 2,
  },
  tableHead: {
    flexDirection: 'row',
    backgroundColor: '#EEF3F5',
    borderBottomWidth: 0.8,
    borderBottomColor: '#1E293B',
    fontFamily: 'Helvetica-Bold',
    fontSize: 7.8,
    paddingVertical: 4.5,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 0.45,
    borderBottomColor: '#CBD5E1',
    fontSize: 8,
    paddingVertical: 3.8,
  },
  tableTotal: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F6',
    borderTopWidth: 0.8,
    borderTopColor: '#1E293B',
    fontFamily: 'Helvetica-Bold',
    fontSize: 8.1,
    paddingVertical: 4.2,
  },
  td: {
    paddingHorizontal: 4,
  },
  right: {
    textAlign: 'right',
  },
  center: {
    textAlign: 'center',
  },
  chartFrame: {
    borderWidth: 0.7,
    borderColor: '#CBD5E1',
    backgroundColor: '#FCFDFE',
    padding: 9,
    marginBottom: 2,
  },
  legendRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 5,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    fontSize: 7.5,
    color: '#334155',
  },
  legendDot: {
    width: 7,
    height: 7,
    marginRight: 4,
  },
  signatureBlock: {
    marginTop: 16,
    borderTopWidth: 0.8,
    borderTopColor: '#CBD5E1',
    paddingTop: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 20,
  },
  signatureCol: {
    flex: 1,
    alignItems: 'center',
  },
  signatureRule: {
    width: '92%',
    borderTopWidth: 0.9,
    borderTopColor: '#1E293B',
    marginTop: 4,
    paddingTop: 4,
    alignItems: 'center',
  },
});

function ProductionBarChartSvg({ analytics }: { analytics: ExecutiveAnalytics }) {
  const items = analytics.productionByTeam.slice(0, 6);
  const maxMeters = Math.max(10, ...items.map((i) => i.totalMeters));
  const maxDaily = Math.max(2, ...items.map((i) => i.dailyUnits));
  const width = 420;
  const height = 128;
  const chartBottom = 102;
  const chartTop = 14;
  const plotHeight = chartBottom - chartTop;
  const groupWidth = width / Math.max(1, items.length);

  return (
    <Svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      <Line x1={8} y1={chartBottom} x2={width - 8} y2={chartBottom} stroke="#94A3B8" strokeWidth="0.8" />
      <Line x1={8} y1={chartTop + plotHeight * 0.5} x2={width - 8} y2={chartTop + plotHeight * 0.5} stroke="#E2E8F0" strokeWidth="0.6" />
      {items.map((item, idx) => {
        const cx = idx * groupWidth + groupWidth * 0.5;
        const meterH = (item.totalMeters / maxMeters) * (plotHeight - 10);
        const dailyH = (item.dailyUnits / maxDaily) * (plotHeight - 10);
        return (
          <React.Fragment key={item.teamId}>
            <Rect
              x={cx - 18}
              y={chartBottom - meterH}
              width={15}
              height={Math.max(2, meterH)}
              fill="#1F6E7A"
              rx={2}
            />
            <Rect
              x={cx + 2}
              y={chartBottom - dailyH}
              width={15}
              height={Math.max(2, dailyH)}
              fill="#C48829"
              rx={2}
            />
          </React.Fragment>
        );
      })}
    </Svg>
  );
}

function SemestralFinancialChartSvg({ analytics }: { analytics: ExecutiveAnalytics }) {
  const items = analytics.semestralEvolution;
  const maxGross = Math.max(1000, ...items.map((i) => i.grossValue));
  const width = 420;
  const height = 122;
  const chartBottom = 98;
  const chartTop = 12;
  const plotHeight = chartBottom - chartTop;
  const groupWidth = width / Math.max(1, items.length);

  return (
    <Svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      <Line x1={8} y1={chartBottom} x2={width - 8} y2={chartBottom} stroke="#94A3B8" strokeWidth="0.8" />
      {items.map((item, idx) => {
        const cx = idx * groupWidth + groupWidth * 0.5;
        const grossH = (item.grossValue / maxGross) * (plotHeight - 8);
        const netH = (item.netValue / maxGross) * (plotHeight - 8);
        const mobH = (item.mobilizationValue / maxGross) * (plotHeight - 8);
        return (
          <React.Fragment key={item.referenceMonth}>
            <Rect x={cx - 21} y={chartBottom - grossH} width={12} height={Math.max(2, grossH)} fill="#1F6E7A" rx={1.5} />
            <Rect x={cx - 6} y={chartBottom - netH} width={12} height={Math.max(2, netH)} fill="#1E7A56" rx={1.5} />
            <Rect x={cx + 9} y={chartBottom - mobH} width={12} height={Math.max(2, mobH)} fill="#C48829" rx={1.5} />
          </React.Fragment>
        );
      })}
    </Svg>
  );
}

function OccupancyStackedBarSvg({ analytics }: { analytics: ExecutiveAnalytics }) {
  const width = 420;
  const height = 26;
  let cursor = 0;

  return (
    <Svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      <Rect x={0} y={4} width={width} height={18} fill="#E2E8F0" rx={4} />
      {analytics.fleetOccupancy.items.map((seg) => {
        const segW = (seg.percent / 100) * width;
        const x = cursor;
        cursor += segW;
        if (segW <= 0.5) return null;
        return (
          <Rect
            key={seg.key}
            x={x}
            y={4}
            width={segW}
            height={18}
            fill={seg.color}
          />
        );
      })}
    </Svg>
  );
}

export interface RelatorioExecutivoNbrPdfProps {
  analytics: ExecutiveAnalytics;
  signatory: SignatoryConfig;
  generatedAt?: Date;
}

export function RelatorioExecutivoNbrPdf({
  analytics,
  signatory,
  generatedAt = new Date(),
}: RelatorioExecutivoNbrPdfProps) {
  const monthLabel = formatMonthYearPT(analytics.referenceMonth);
  const timestamp = formatTimestampBR(generatedAt);
  const docCode = generateAuthenticityCode('RELATORIO-NBR', analytics.referenceMonth, analytics.kpis.totalNet);

  return (
    <Document
      title={`Relatório Técnico-Gerencial NBR - ${monthLabel} - Terra Sol`}
      author={signatory.engineerName}
      subject={`Relatório Executivo de Operações Geotécnicas - ${monthLabel}`}
      creator="Teneur — Okapi Code Forge"
    >
      <Page size="A4" style={styles.page}>
        <View style={styles.runningHeader} fixed>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Svg width="18" height="18" viewBox="0 0 44 48">
              <Polygon points="22,2 40,20 33,27 22,16 11,27 4,20" fill="#E6B800" />
              <Polygon points="22,46 40,28 33,21 22,32 11,21 4,28" fill="#1E7B8C" />
            </Svg>
            <View>
              <Text style={{ fontSize: 8.5, fontFamily: 'Helvetica-Bold', color: '#1F6E7A' }}>
                {signatory.companyName} — {signatory.companySubtitle}
              </Text>
              <Text style={{ fontSize: 6.8, color: '#64748B' }}>
                Relatório Técnico-Gerencial · Referência ABNT NBR 10719 / NBR 6484
              </Text>
            </View>
          </View>
          <Text style={{ fontSize: 7.5, fontFamily: 'Helvetica-Bold', color: '#334155' }}>
            {monthLabel}
          </Text>
        </View>

        <View style={styles.docCoverBand}>
          <Text style={styles.docKicker}>Relatório Técnico-Gerencial de Campo · Sistema Teneur</Text>
          <Text style={styles.docTitle}>
            DESEMPENHO OPERACIONAL, OCUPAÇÃO DE FROTA E CONSOLIDADO FINANCEIRO DE EQUIPES DE SONDAGEM — {monthLabel.toUpperCase()}
          </Text>
          <View style={styles.docMetaGrid}>
            <Text style={styles.docMetaItem}>
              <Text style={{ fontFamily: 'Helvetica-Bold' }}>Empresa: </Text>
              {signatory.companyName} Engenharia Geotécnica
            </Text>
            <Text style={styles.docMetaItem}>
              <Text style={{ fontFamily: 'Helvetica-Bold' }}>Referência: </Text>
              {monthLabel}
            </Text>
            <Text style={styles.docMetaItem}>
              <Text style={{ fontFamily: 'Helvetica-Bold' }}>Responsável Técnica: </Text>
              {signatory.engineerName} ({signatory.engineerTitle})
            </Text>
            <Text style={styles.docMetaItem}>
              <Text style={{ fontFamily: 'Helvetica-Bold' }}>Normas Aplicáveis: </Text>
              ABNT NBR 10719 · NBR 6024 · NBR 6484
            </Text>
            <Text style={styles.docMetaItem}>
              <Text style={{ fontFamily: 'Helvetica-Bold' }}>Emissão: </Text>
              {timestamp}
            </Text>
            <Text style={styles.docMetaItem}>
              <Text style={{ fontFamily: 'Helvetica-Bold' }}>Código de Autenticidade: </Text>
              {docCode}
            </Text>
          </View>
        </View>

        <Text style={styles.sectionHeading}>1 Objetivo e Resumo Executivo</Text>
        <Text style={styles.paragraph}>
          Este relatório apresenta a consolidação técnica e financeira das atividades das {analytics.kpis.activeTeamsCount} equipes de campo da {signatory.companyName} Engenharia Geotécnica no período de {monthLabel}, abrangendo produção em sondagem SPT e a trado, diárias de ensaios geotécnicos, deslocamentos de mobilização, taxa de ocupação da frota e produtividade média diária por equipe, estruturado conforme diretrizes da ABNT NBR 10719 para relatórios técnico-gerenciais.
        </Text>

        <View style={styles.kpiRow}>
          <View style={styles.kpiCard}>
            <Text style={styles.kpiLabel}>Medição Bruta</Text>
            <Text style={styles.kpiValue}>{formatCurrencyBRL(analytics.kpis.totalGross)}</Text>
            <Text style={styles.kpiSub}>
              Mob.: {formatDecimalBR(analytics.kpis.mobilizationSharePercent, 1)}% do bruto
            </Text>
          </View>
          <View style={styles.kpiCard}>
            <Text style={styles.kpiLabel}>Líquido a Pagar</Text>
            <Text style={styles.kpiValue}>{formatCurrencyBRL(analytics.kpis.totalNet)}</Text>
            <Text style={styles.kpiSub}>
              Desc.: {formatCurrencyBRL(analytics.kpis.totalDeductions)}
            </Text>
          </View>
          <View style={styles.kpiCard}>
            <Text style={styles.kpiLabel}>Produção de Campo</Text>
            <Text style={styles.kpiValue}>{formatDecimalBR(analytics.kpis.totalMeters)} m</Text>
            <Text style={styles.kpiSub}>
              {formatDecimalBR(analytics.kpis.totalDailyUnits)} diárias · {formatDecimalBR(analytics.kpis.totalMobilizationKm, 0)} km
            </Text>
          </View>
          <View style={styles.kpiCard}>
            <Text style={styles.kpiLabel}>Ocupação da Frota</Text>
            <Text style={styles.kpiValue}>
              {formatDecimalBR(analytics.kpis.occupancyRatePercent, 1)}%
            </Text>
            <Text style={styles.kpiSub}>
              {analytics.fleetOccupancy.productiveDays + analytics.fleetOccupancy.travelDays} dias produtivos
            </Text>
          </View>
        </View>

        <Text style={styles.sectionHeading}>2 Produção por Equipe e Evolução Semestral</Text>
        <Text style={styles.abntCaption}>
          Tabela 1 — Produção medida por equipe em {monthLabel} (metros, diárias, km e valores)
        </Text>
        <View style={styles.table}>
          <View style={styles.tableHead}>
            <Text style={[styles.td, { flex: 1.3 }]}>Equipe</Text>
            <Text style={[styles.td, { flex: 0.9 }, styles.right]}>SPT (m)</Text>
            <Text style={[styles.td, { flex: 0.9 }, styles.right]}>Trado (m)</Text>
            <Text style={[styles.td, { flex: 0.85 }, styles.right]}>Diárias</Text>
            <Text style={[styles.td, { flex: 0.85 }, styles.right]}>Mob. (km)</Text>
            <Text style={[styles.td, { flex: 1.25 }, styles.right]}>Bruto (R$)</Text>
            <Text style={[styles.td, { flex: 1.25 }, styles.right]}>Líquido (R$)</Text>
          </View>
          {analytics.productionByTeam.map((row) => (
            <View style={styles.tableRow} key={row.teamId}>
              <Text style={[styles.td, { flex: 1.3, fontFamily: 'Helvetica-Bold' }]}>{row.teamName}</Text>
              <Text style={[styles.td, { flex: 0.9 }, styles.right]}>{formatDecimalBR(row.sptMeters)}</Text>
              <Text style={[styles.td, { flex: 0.9 }, styles.right]}>{formatDecimalBR(row.tradoMeters)}</Text>
              <Text style={[styles.td, { flex: 0.85 }, styles.right]}>{formatDecimalBR(row.dailyUnits)}</Text>
              <Text style={[styles.td, { flex: 0.85 }, styles.right]}>{formatDecimalBR(row.mobilizationKm, 0)}</Text>
              <Text style={[styles.td, { flex: 1.25 }, styles.right]}>{formatCurrencyBRL(row.grossValue)}</Text>
              <Text style={[styles.td, { flex: 1.25 }, styles.right]}>{formatCurrencyBRL(row.netValue)}</Text>
            </View>
          ))}
          <View style={styles.tableTotal}>
            <Text style={[styles.td, { flex: 1.3 }]}>TOTAL</Text>
            <Text style={[styles.td, { flex: 0.9 }, styles.right]}>{formatDecimalBR(analytics.kpis.totalSptMeters)}</Text>
            <Text style={[styles.td, { flex: 0.9 }, styles.right]}>{formatDecimalBR(analytics.kpis.totalTradoMeters)}</Text>
            <Text style={[styles.td, { flex: 0.85 }, styles.right]}>{formatDecimalBR(analytics.kpis.totalDailyUnits)}</Text>
            <Text style={[styles.td, { flex: 0.85 }, styles.right]}>{formatDecimalBR(analytics.kpis.totalMobilizationKm, 0)}</Text>
            <Text style={[styles.td, { flex: 1.25 }, styles.right]}>{formatCurrencyBRL(analytics.kpis.totalGross)}</Text>
            <Text style={[styles.td, { flex: 1.25 }, styles.right]}>{formatCurrencyBRL(analytics.kpis.totalNet)}</Text>
          </View>
        </View>
        <Text style={styles.abntSource}>
          Fonte: Sistema Teneur — {signatory.companyName} Engenharia Geotécnica ({analytics.referenceMonth.slice(0, 4)}).
        </Text>

        <View wrap={false}>
          <Text style={styles.abntCaption}>
            Figura 1 — Comparativo relativo de produção por equipe (Metros perfurados vs. Diárias)
          </Text>
          <View style={styles.chartFrame}>
            <ProductionBarChartSvg analytics={analytics} />
            <View style={{ flexDirection: 'row', justifyContent: 'space-around', marginTop: 2 }}>
              {analytics.productionByTeam.slice(0, 6).map((item) => (
                <Text key={item.teamId} style={{ fontSize: 7.4, color: '#334155', textAlign: 'center', width: 65 }}>
                  {item.teamName}
                </Text>
              ))}
            </View>
            <View style={styles.legendRow}>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: '#1F6E7A' }]} />
                <Text>Metros Perfurados (escala normalizada)</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: '#C48829' }]} />
                <Text>Diárias de Campo (escala normalizada)</Text>
              </View>
            </View>
          </View>
          <Text style={styles.abntSource}>
            Fonte: Sistema Teneur — Elaboração técnica da Coordenação de Campo ({analytics.referenceMonth.slice(0, 4)}).
          </Text>
        </View>

        <Text style={styles.sectionHeading} break>
          3 Taxa de Ocupação e Disponibilidade da Frota
        </Text>
        <Text style={styles.paragraph}>
          A taxa de ocupação operacional mensura a proporção entre dias efetivamente produtivos em obra ou deslocamento frente aos dias parados aguardando liberação de cliente, ociosidade em base/casa ou manutenção corretiva e preventiva de veículos.
        </Text>

        <View wrap={false}>
          <Text style={styles.abntCaption}>
            Figura 2 — Distribuição percentual da ocupação operacional da frota em {monthLabel}
          </Text>
          <View style={styles.chartFrame}>
            <OccupancyStackedBarSvg analytics={analytics} />
            <View style={styles.legendRow}>
              {analytics.fleetOccupancy.items.map((item) => (
                <View style={styles.legendItem} key={item.key}>
                  <View style={[styles.legendDot, { backgroundColor: item.color }]} />
                  <Text>
                    {item.label}: {item.days}d ({formatDecimalBR(item.percent, 1)}%)
                  </Text>
                </View>
              ))}
            </View>
          </View>
          <Text style={styles.abntSource}>
            Fonte: Apontamentos diários de campo — Sistema Teneur ({analytics.referenceMonth.slice(0, 4)}).
          </Text>
        </View>

        <Text style={styles.sectionHeading}>
          4 Financeiro Consolidado e Evolução Semestral
        </Text>
        <Text style={styles.abntCaption}>
          Tabela 2 — Evolução financeira semestral (Bruto, Descontos, Líquido e Peso da Mobilização)
        </Text>
        <View style={styles.table}>
          <View style={styles.tableHead}>
            <Text style={[styles.td, { flex: 0.9 }]}>Mês</Text>
            <Text style={[styles.td, { flex: 0.9 }, styles.right]}>Metros</Text>
            <Text style={[styles.td, { flex: 0.8 }, styles.right]}>Diárias</Text>
            <Text style={[styles.td, { flex: 1.25 }, styles.right]}>Bruto (R$)</Text>
            <Text style={[styles.td, { flex: 1.15 }, styles.right]}>Descontos</Text>
            <Text style={[styles.td, { flex: 1.25 }, styles.right]}>Líquido (R$)</Text>
            <Text style={[styles.td, { flex: 0.85 }, styles.right]}>Mob. (%)</Text>
          </View>
          {analytics.semestralEvolution.map((m) => (
            <View style={styles.tableRow} key={m.referenceMonth}>
              <Text style={[styles.td, { flex: 0.9, fontFamily: 'Helvetica-Bold' }]}>{m.label}</Text>
              <Text style={[styles.td, { flex: 0.9 }, styles.right]}>{formatDecimalBR(m.totalMeters)}</Text>
              <Text style={[styles.td, { flex: 0.8 }, styles.right]}>{formatDecimalBR(m.dailyUnits)}</Text>
              <Text style={[styles.td, { flex: 1.25 }, styles.right]}>{formatCurrencyBRL(m.grossValue)}</Text>
              <Text style={[styles.td, { flex: 1.15 }, styles.right]}>{formatCurrencyBRL(m.deductionsValue)}</Text>
              <Text style={[styles.td, { flex: 1.25 }, styles.right]}>{formatCurrencyBRL(m.netValue)}</Text>
              <Text style={[styles.td, { flex: 0.85 }, styles.right]}>
                {formatDecimalBR(m.mobilizationSharePercent, 1)}%
              </Text>
            </View>
          ))}
        </View>
        <Text style={styles.abntSource}>
          Fonte: Histórico de medições consolidadas — Sistema Teneur ({analytics.referenceMonth.slice(0, 4)}).
        </Text>

        <View wrap={false}>
          <Text style={styles.abntCaption}>
            Figura 3 — Evolução semestral financeira (Bruto, Líquido e Mobilização)
          </Text>
          <View style={styles.chartFrame}>
            <SemestralFinancialChartSvg analytics={analytics} />
            <View style={{ flexDirection: 'row', justifyContent: 'space-around', marginTop: 2 }}>
              {analytics.semestralEvolution.map((item) => (
                <Text key={item.referenceMonth} style={{ fontSize: 7.4, color: '#334155', textAlign: 'center', width: 65 }}>
                  {item.label}
                </Text>
              ))}
            </View>
            <View style={styles.legendRow}>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: '#1F6E7A' }]} />
                <Text>Valor Bruto</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: '#1E7A56' }]} />
                <Text>Valor Líquido</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: '#C48829' }]} />
                <Text>Custo de Mobilização</Text>
              </View>
            </View>
          </View>
          <Text style={styles.abntSource}>
            Fonte: Sistema Teneur — {signatory.companyName} Engenharia Geotécnica ({analytics.referenceMonth.slice(0, 4)}).
          </Text>
        </View>

        <Text style={styles.sectionHeading}>
          5 Produtividade Média (m/dia) por Equipe e Sondagem
        </Text>
        <Text style={styles.abntCaption}>
          Tabela 3 — Rendimento médio diário de perfuração SPT e a Trado por equipe em {monthLabel}
        </Text>
        <View style={styles.table}>
          <View style={styles.tableHead}>
            <Text style={[styles.td, { flex: 1.5 }]}>Equipe</Text>
            <Text style={[styles.td, { flex: 0.9 }, styles.center]}>Dias SPT</Text>
            <Text style={[styles.td, { flex: 1.2 }, styles.right]}>Média SPT (m/dia)</Text>
            <Text style={[styles.td, { flex: 0.9 }, styles.center]}>Dias Trado</Text>
            <Text style={[styles.td, { flex: 1.2 }, styles.right]}>Média Trado (m/dia)</Text>
            <Text style={[styles.td, { flex: 1.2 }, styles.right]}>Média Geral (m/dia)</Text>
          </View>
          {analytics.productivityByTeam.map((p) => (
            <View style={styles.tableRow} key={p.teamId}>
              <Text style={[styles.td, { flex: 1.5, fontFamily: 'Helvetica-Bold' }]}>{p.teamName}</Text>
              <Text style={[styles.td, { flex: 0.9 }, styles.center]}>{p.sptDays}</Text>
              <Text style={[styles.td, { flex: 1.2 }, styles.right]}>{formatDecimalBR(p.sptAvgMetersPerDay)}</Text>
              <Text style={[styles.td, { flex: 0.9 }, styles.center]}>{p.tradoDays}</Text>
              <Text style={[styles.td, { flex: 1.2 }, styles.right]}>{formatDecimalBR(p.tradoAvgMetersPerDay)}</Text>
              <Text style={[styles.td, { flex: 1.2 }, styles.right]}>{formatDecimalBR(p.overallAvgMetersPerDay)}</Text>
            </View>
          ))}
        </View>
        <Text style={styles.abntSource}>
          Fonte: Controle diário de perfuração — Sistema Teneur ({analytics.referenceMonth.slice(0, 4)}).
        </Text>

        <View wrap={false}>
          <Text style={styles.sectionHeading}>6 Responsabilidade Técnica e Assinatura</Text>
          <Text style={styles.paragraph}>
            Os dados consolidados neste documento foram auditados com base nos boletins de campo e memórias de cálculo do período de {monthLabel}, estando aptos para apresentação gerencial e tomada de decisão da diretoria técnica da {signatory.companyName} Engenharia Geotécnica.
          </Text>

          <View style={styles.signatureBlock}>
            <View style={styles.signatureCol}>
              <Svg width="144" height="28" viewBox="0 0 180 34">
                <Path
                  d="M14 23 C18 8, 30 6, 26 21 C24 27, 34 26, 40 16 C44 10, 48 22, 54 18 C58 15, 62 12, 64 21 C68 17, 74 12, 80 18 C85 22, 92 10, 96 19 C101 23, 110 12, 116 18 C124 24, 134 11, 146 17 C154 20, 162 15, 168 18"
                  stroke="#1E3A5F"
                  strokeWidth="1.25"
                  fill="none"
                />
                <Path
                  d="M20 28 C58 24, 118 23, 162 27"
                  stroke="#1E3A5F"
                  strokeWidth="0.7"
                  fill="none"
                />
              </Svg>
              <View style={styles.signatureRule}>
                <Text style={{ fontSize: 8.6, fontFamily: 'Helvetica-Bold' }}>
                  {signatory.engineerName}
                </Text>
                <Text style={{ fontSize: 7.6, color: '#475569' }}>
                  {signatory.engineerTitle}
                  {signatory.engineerCrea ? ` · ${signatory.engineerCrea}` : ''}
                </Text>
                <Text style={{ fontSize: 7, color: '#64748B', marginTop: 2 }}>
                  Gerado pelo sistema Teneur em {timestamp}
                </Text>
              </View>
            </View>

            {signatory.includeLegalRepresentative && (
              <View style={[styles.signatureCol, { justifyContent: 'flex-end' }]}>
                <View style={styles.signatureRule}>
                  <Text style={{ fontSize: 8.6, fontFamily: 'Helvetica-Bold' }}>
                    {signatory.legalRepName}
                  </Text>
                  <Text style={{ fontSize: 7.6, color: '#475569' }}>
                    {signatory.legalRepRole} · CPF: {signatory.legalRepCpf}
                  </Text>
                </View>
              </View>
            )}
          </View>
        </View>

        <View style={styles.runningFooter} fixed>
          <Text>
            {docCode} · Gerado em {timestamp} · Desenvolvido por Okapi Code Forge
          </Text>
          <Text
            render={({ pageNumber, totalPages }) => `Página ${pageNumber} de ${totalPages}`}
          />
        </View>
      </Page>
    </Document>
  );
}
