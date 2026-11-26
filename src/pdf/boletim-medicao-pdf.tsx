import React from 'react';
import {
  Document,
  Page,
  Path,
  Polygon,
  StyleSheet,
  Svg,
  Text,
  View,
} from '@react-pdf/renderer';
import {
  formatCurrencyBRL,
  formatDateBR,
  formatDecimalBR,
  formatMonthShortPT,
  formatMonthYearPT,
  formatTimestampBR,
} from '@/domain/formatters';
import type { MeasurementCalculation, SignatoryConfig } from '@/domain/types';

const styles = StyleSheet.create({
  pageLandscape: {
    paddingTop: 24,
    paddingBottom: 28,
    paddingHorizontal: 26,
    fontFamily: 'Helvetica',
    fontSize: 8,
    color: '#181B20',
    backgroundColor: '#FFFFFF',
  },
  pagePortrait: {
    paddingTop: 30,
    paddingBottom: 34,
    paddingHorizontal: 32,
    fontFamily: 'Helvetica',
    fontSize: 8.5,
    color: '#181B20',
    backgroundColor: '#FFFFFF',
  },
  headerBox: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: '#1E293B',
    marginBottom: 8,
  },
  headerLeft: {
    flex: 3.3,
    borderRightWidth: 1,
    borderRightColor: '#1E293B',
  },
  headerRight: {
    flex: 1.2,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
    backgroundColor: '#F8FAFB',
  },
  titleBanner: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
    backgroundColor: '#F1F5F6',
  },
  titleMain: {
    flex: 2.3,
    paddingVertical: 5,
    paddingHorizontal: 8,
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    borderRightWidth: 1,
    borderRightColor: '#CBD5E1',
    textAlign: 'center',
  },
  titleSide: {
    flex: 1,
    paddingVertical: 5,
    paddingHorizontal: 6,
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    textAlign: 'center',
    color: '#1F6E7A',
  },
  metaRow: {
    flexDirection: 'row',
    borderBottomWidth: 0.75,
    borderBottomColor: '#CBD5E1',
  },
  metaCell: {
    paddingVertical: 3,
    paddingHorizontal: 6,
    borderRightWidth: 0.75,
    borderRightColor: '#CBD5E1',
  },
  metaLabel: {
    fontSize: 6.5,
    color: '#475569',
    textTransform: 'uppercase',
    marginBottom: 1,
  },
  metaValue: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    color: '#0F172A',
  },
  table: {
    borderWidth: 0.9,
    borderColor: '#1E293B',
    marginBottom: 6,
  },
  tHeadRow: {
    flexDirection: 'row',
    backgroundColor: '#1F6E7A',
    color: '#FFFFFF',
    fontFamily: 'Helvetica-Bold',
    fontSize: 7.2,
    borderBottomWidth: 0.9,
    borderBottomColor: '#1E293B',
  },
  tGroupRow: {
    flexDirection: 'row',
    backgroundColor: '#E8F0F2',
    fontFamily: 'Helvetica-Bold',
    fontSize: 7.5,
    borderBottomWidth: 0.6,
    borderBottomColor: '#CBD5E1',
  },
  tRow: {
    flexDirection: 'row',
    borderBottomWidth: 0.5,
    borderBottomColor: '#CBD5E1',
    fontSize: 7.6,
  },
  tSubtotalRow: {
    flexDirection: 'row',
    backgroundColor: '#DFF0E8',
    fontFamily: 'Helvetica-Bold',
    fontSize: 8.2,
    borderTopWidth: 0.9,
    borderTopColor: '#1E293B',
  },
  tNetPayableRow: {
    flexDirection: 'row',
    backgroundColor: '#C9E5D8',
    fontFamily: 'Helvetica-Bold',
    fontSize: 9.2,
    borderWidth: 1,
    borderColor: '#1E293B',
    marginTop: 4,
    marginBottom: 8,
  },
  cell: {
    paddingVertical: 3.5,
    paddingHorizontal: 5,
    borderRightWidth: 0.5,
    borderRightColor: '#CBD5E1',
  },
  cellLast: {
    paddingVertical: 3.5,
    paddingHorizontal: 5,
  },
  right: {
    textAlign: 'right',
  },
  center: {
    textAlign: 'center',
  },
  amortBox: {
    marginTop: 5,
    marginBottom: 6,
    borderWidth: 0.8,
    borderColor: '#B4823E',
    backgroundColor: '#FDF8F2',
  },
  amortHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#F3E3CE',
    paddingVertical: 3.5,
    paddingHorizontal: 8,
    borderBottomWidth: 0.7,
    borderBottomColor: '#B4823E',
    fontFamily: 'Helvetica-Bold',
    fontSize: 7.6,
  },
  amortHeadRow: {
    flexDirection: 'row',
    backgroundColor: '#F8EFE2',
    borderBottomWidth: 0.6,
    borderBottomColor: '#D6B993',
    fontFamily: 'Helvetica-Bold',
    fontSize: 7,
  },
  amortRow: {
    flexDirection: 'row',
    borderBottomWidth: 0.4,
    borderBottomColor: '#E5D3B8',
    fontSize: 7,
  },
  amortRowCurrent: {
    flexDirection: 'row',
    backgroundColor: '#F5E7D3',
    fontFamily: 'Helvetica-Bold',
    fontSize: 7.2,
  },
  signatureSection: {
    flexDirection: 'row',
    borderWidth: 0.9,
    borderColor: '#1E293B',
    marginTop: 4,
    minHeight: 74,
  },
  signatureBox: {
    flex: 1,
    padding: 8,
    justifyContent: 'space-between',
    borderRightWidth: 0.75,
    borderRightColor: '#CBD5E1',
  },
  signatureBoxLast: {
    flex: 1,
    padding: 8,
    justifyContent: 'space-between',
  },
  signatureLabel: {
    fontSize: 7,
    fontFamily: 'Helvetica-Bold',
    color: '#475569',
    textTransform: 'uppercase',
  },
  signatureLine: {
    borderTopWidth: 0.8,
    borderTopColor: '#334155',
    paddingTop: 3,
    alignItems: 'center',
  },
  signatureName: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    color: '#0F172A',
  },
  signatureRole: {
    fontSize: 7,
    color: '#475569',
  },
  footer: {
    position: 'absolute',
    bottom: 10,
    left: 26,
    right: 26,
    flexDirection: 'row',
    justifyContent: 'space-between',
    fontSize: 6.8,
    color: '#64748B',
    borderTopWidth: 0.5,
    borderTopColor: '#E2E8F0',
    paddingTop: 4,
  },
  memoryTitleBox: {
    borderWidth: 1,
    borderColor: '#1E293B',
    backgroundColor: '#F1F5F6',
    paddingVertical: 7,
    paddingHorizontal: 10,
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  memoryGroupCard: {
    marginBottom: 9,
    borderWidth: 0.8,
    borderColor: '#334155',
  },
  memoryGroupHead: {
    flexDirection: 'row',
    backgroundColor: '#1F6E7A',
    color: '#FFFFFF',
    fontFamily: 'Helvetica-Bold',
    fontSize: 8,
    paddingVertical: 4,
    paddingHorizontal: 7,
  },
  memoryTotalRow: {
    flexDirection: 'row',
    backgroundColor: '#EDF2F4',
    fontFamily: 'Helvetica-Bold',
    fontSize: 8,
    borderTopWidth: 0.7,
    borderTopColor: '#334155',
  },
});

function TerraSolMark() {
  return (
    <View style={{ alignItems: 'center' }}>
      <Svg width="108" height="30" viewBox="0 0 220 56">
        <Polygon points="22,2 40,20 33,27 22,16 11,27 4,20" fill="#E6B800" />
        <Polygon points="22,46 40,28 33,21 22,32 11,21 4,28" fill="#1E7B8C" />
      </Svg>
      <Text style={{ fontSize: 12, fontFamily: 'Helvetica-Bold', color: '#1F6E7A', marginTop: -22, marginLeft: 32 }}>
        Terra<Text style={{ color: '#C48829' }}>Sol</Text>
      </Text>
      <Text style={{ fontSize: 6.2, color: '#475569', marginLeft: 32, marginTop: 1 }}>
        engenharia geotécnica
      </Text>
    </View>
  );
}

function CatherineSignatureStroke() {
  return (
    <Svg width="136" height="26" viewBox="0 0 180 34" style={{ alignSelf: 'center', marginBottom: 2 }}>
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
  );
}

export interface BoletimMedicaoPdfProps {
  calculation: MeasurementCalculation;
  signatory: SignatoryConfig;
  generatedAt?: Date;
}

export function BoletimMedicaoPdf({
  calculation,
  signatory,
  generatedAt = new Date(),
}: BoletimMedicaoPdfProps) {
  const monthLabel = formatMonthYearPT(calculation.referenceMonth);
  const monthShort = formatMonthShortPT(calculation.referenceMonth);
  const timestamp = formatTimestampBR(generatedAt);

  const groupedItems = new Map<string, typeof calculation.lineItems>();
  for (const item of calculation.lineItems) {
    const key = `${item.groupCode} ${item.groupTitle}`;
    const list = groupedItems.get(key) ?? [];
    list.push(item);
    groupedItems.set(key, list);
  }

  return (
    <Document
      title={`Boletim de Medição - ${monthLabel} (${calculation.team.name})`}
      author={signatory.engineerName}
      subject={`Boletim de Medição Geotécnica - ${calculation.team.name}`}
      creator="Teneur — Okapi Code Forge"
    >
      <Page size="A4" orientation="landscape" style={styles.pageLandscape}>
        <View style={styles.headerBox}>
          <View style={styles.headerLeft}>
            <View style={styles.titleBanner}>
              <Text style={styles.titleMain}>Boletim de Medição - {monthLabel}</Text>
              <Text style={styles.titleSide}>MEDIÇÃO · {calculation.status.toUpperCase()}</Text>
            </View>
            <View style={styles.metaRow}>
              <View style={[styles.metaCell, { flex: 0.9 }]}>
                <Text style={styles.metaLabel}>Serviço</Text>
                <Text style={styles.metaValue}>SONDAGEM</Text>
              </View>
              <View style={[styles.metaCell, { flex: 1.1 }]}>
                <Text style={styles.metaLabel}>Equipe</Text>
                <Text style={styles.metaValue}>{calculation.team.name}</Text>
              </View>
              <View style={[styles.metaCell, { flex: 2 }]}>
                <Text style={styles.metaLabel}>Escopo do Serviço</Text>
                <Text style={styles.metaValue}>{calculation.team.serviceLabel}</Text>
              </View>
              <View style={[styles.metaCell, { flex: 0.9, borderRightWidth: 0 }]}>
                <Text style={styles.metaLabel}>Mês de Referência</Text>
                <Text style={styles.metaValue}>{monthShort}</Text>
              </View>
            </View>
            <View style={[styles.metaRow, { borderBottomWidth: 0 }]}>
              <View style={[styles.metaCell, { flex: 1.4 }]}>
                <Text style={styles.metaLabel}>Local</Text>
                <Text style={styles.metaValue}>{calculation.locationsSummary}</Text>
              </View>
              <View style={[styles.metaCell, { flex: 1.1 }]}>
                <Text style={styles.metaLabel}>Valor Medido no Mês (R$)</Text>
                <Text style={styles.metaValue}>
                  {formatCurrencyBRL(calculation.totals.grossSubtotal)}
                </Text>
              </View>
              <View style={[styles.metaCell, { flex: 1.2 }]}>
                <Text style={styles.metaLabel}>Período</Text>
                <Text style={styles.metaValue}>
                  {calculation.periodStart} a {calculation.periodEnd}
                </Text>
              </View>
              <View style={[styles.metaCell, { flex: 1.2, borderRightWidth: 0 }]}>
                <Text style={styles.metaLabel}>Código de Controle</Text>
                <Text style={styles.metaValue}>{calculation.authenticityCode}</Text>
              </View>
            </View>
          </View>
          <View style={styles.headerRight}>
            <TerraSolMark />
          </View>
        </View>

        <View style={styles.table}>
          <View style={styles.tHeadRow}>
            <Text style={[styles.cell, { flex: 0.45 }, styles.center]}>ITEM</Text>
            <Text style={[styles.cell, { flex: 2.7 }]}>DESCRIÇÃO DOS SERVIÇOS</Text>
            <Text style={[styles.cell, { flex: 0.55 }, styles.center]}>UN.</Text>
            <Text style={[styles.cell, { flex: 0.9 }, styles.right]}>VALOR UNIT.</Text>
            <Text style={[styles.cell, { flex: 0.85 }, styles.right]}>QUANT. MÊS</Text>
            <Text style={[styles.cell, { flex: 1.05 }, styles.right]}>TOTAL MÊS</Text>
            <Text style={[styles.cell, { flex: 0.85 }, styles.right]}>ACUM. QUANT.</Text>
            <Text style={[styles.cellLast, { flex: 1.05 }, styles.right]}>TOTAL ACUM.</Text>
          </View>

          {Array.from(groupedItems.entries()).map(([groupHeading, items]) => (
            <React.Fragment key={groupHeading}>
              <View style={styles.tGroupRow}>
                <Text style={[styles.cellLast, { flex: 1 }]}>{groupHeading}</Text>
              </View>
              {items.map((item) => (
                <View style={styles.tRow} key={item.itemCode}>
                  <Text style={[styles.cell, { flex: 0.45 }, styles.center]}>{item.itemCode}</Text>
                  <Text style={[styles.cell, { flex: 2.7 }]}>{item.description}</Text>
                  <Text style={[styles.cell, { flex: 0.55 }, styles.center]}>{item.unit}</Text>
                  <Text style={[styles.cell, { flex: 0.9 }, styles.right]}>
                    {formatCurrencyBRL(item.unitPrice)}
                  </Text>
                  <Text style={[styles.cell, { flex: 0.85 }, styles.right]}>
                    {formatDecimalBR(item.quantity)}
                  </Text>
                  <Text style={[styles.cell, { flex: 1.05 }, styles.right]}>
                    {formatCurrencyBRL(item.totalValue)}
                  </Text>
                  <Text style={[styles.cell, { flex: 0.85 }, styles.right]}>
                    {formatDecimalBR(item.quantity)}
                  </Text>
                  <Text style={[styles.cellLast, { flex: 1.05 }, styles.right]}>
                    {formatCurrencyBRL(item.totalValue)}
                  </Text>
                </View>
              ))}
            </React.Fragment>
          ))}

          <View style={styles.tSubtotalRow}>
            <Text style={[styles.cell, { flex: 4.6 }]}>SUBTOTAL DOS SERVIÇOS EXECUTADOS</Text>
            <Text style={[styles.cell, { flex: 1.9 }, styles.right]}>
              {formatCurrencyBRL(calculation.totals.grossSubtotal)}
            </Text>
            <Text style={[styles.cellLast, { flex: 1.9 }, styles.right]}>
              {formatCurrencyBRL(calculation.totals.grossSubtotal)}
            </Text>
          </View>
        </View>

        <View style={styles.table}>
          <View style={styles.tGroupRow}>
            <Text style={[styles.cell, { flex: 0.45 }, styles.center]}>4</Text>
            <Text style={[styles.cell, { flex: 2.7 }]}>PAGAMENTOS, DESCONTOS E REEMBOLSOS</Text>
            <Text style={[styles.cell, { flex: 0.85 }, styles.center]}>DATA</Text>
            <Text style={[styles.cell, { flex: 1.1 }, styles.right]}>VALOR (R$)</Text>
            <Text style={[styles.cellLast, { flex: 3.3 }]}>OBSERVAÇÃO / REFERÊNCIA</Text>
          </View>

          {calculation.paymentItems.length === 0 ? (
            <View style={styles.tRow}>
              <Text style={[styles.cellLast, { flex: 1, color: '#64748B' }]}>
                Sem descontos ou reembolsos lançados neste período.
              </Text>
            </View>
          ) : (
            calculation.paymentItems.map((pay, idx) => (
              <View style={styles.tRow} key={`${pay.code}-${idx}`}>
                <Text style={[styles.cell, { flex: 0.45 }, styles.center]}>{pay.code}</Text>
                <Text style={[styles.cell, { flex: 2.7 }]}>{pay.description}</Text>
                <Text style={[styles.cell, { flex: 0.85 }, styles.center]}>
                  {formatDateBR(pay.date)}
                </Text>
                <Text
                  style={[
                    styles.cell,
                    {
                      flex: 1.1,
                      color: pay.direction === 'reembolso' ? '#1E7A56' : '#0F172A',
                      fontFamily: pay.direction === 'reembolso' ? 'Helvetica-Bold' : 'Helvetica',
                    },
                    styles.right,
                  ]}
                >
                  {pay.direction === 'reembolso'
                    ? `-${formatCurrencyBRL(pay.amount)}`
                    : formatCurrencyBRL(pay.amount)}
                </Text>
                <Text style={[styles.cellLast, { flex: 3.3, color: '#475569' }]}>
                  {pay.details || '-'}
                </Text>
              </View>
            ))
          )}

          <View style={styles.tSubtotalRow}>
            <Text style={[styles.cell, { flex: 4 }]}>SUBTOTAL DE PAGAMENTOS / DESCONTOS</Text>
            <Text style={[styles.cell, { flex: 1.1 }, styles.right]}>
              {formatCurrencyBRL(calculation.totals.netPaymentsSubtotal)}
            </Text>
            <Text style={[styles.cellLast, { flex: 3.3 }]} />
          </View>
        </View>

        {calculation.financingSnapshot && (
          <View style={styles.amortBox}>
            <View style={styles.amortHeader}>
              <Text>
                COMPRA DO VEÍCULO — {calculation.financingSnapshot.financing.assetName.toUpperCase()} ({calculation.financingSnapshot.financing.monthlyDeductionPercent}% s/ medição)
              </Text>
              <Text>
                Valor Total: {formatCurrencyBRL(calculation.financingSnapshot.financing.totalValue)} · Saldo Atual: {formatCurrencyBRL(calculation.financingSnapshot.remainingBalance)}
              </Text>
            </View>
            <View style={styles.amortHeadRow}>
              <Text style={[styles.cell, { flex: 2.2 }]}>Boletim de Medição</Text>
              <Text style={[styles.cell, { flex: 1 }, styles.right]}>Desconto</Text>
              <Text style={[styles.cell, { flex: 1.1 }, styles.right]}>Valor Pago Acumulado</Text>
              <Text style={[styles.cellLast, { flex: 1.1 }, styles.right]}>Saldo a Pagar Acumulado</Text>
            </View>
            {calculation.financingSnapshot.rows.map((row, idx, arr) => {
              const isCurrent = idx === arr.length - 1;
              return (
                <View style={isCurrent ? styles.amortRowCurrent : styles.amortRow} key={row.id}>
                  <Text style={[styles.cell, { flex: 2.2 }]}>{row.label}</Text>
                  <Text style={[styles.cell, { flex: 1 }, styles.right]}>
                    {formatCurrencyBRL(row.discountAmount)}
                  </Text>
                  <Text style={[styles.cell, { flex: 1.1 }, styles.right]}>
                    {formatCurrencyBRL(row.accumulatedPaid)}
                  </Text>
                  <Text style={[styles.cellLast, { flex: 1.1 }, styles.right]}>
                    {formatCurrencyBRL(row.remainingBalance)}
                  </Text>
                </View>
              );
            })}
          </View>
        )}

        <View style={styles.tNetPayableRow}>
          <Text style={[styles.cell, { flex: 6.2 }]}>SALDO LÍQUIDO A PAGAR À EQUIPE</Text>
          <Text style={[styles.cellLast, { flex: 2.2 }, styles.right]}>
            {formatCurrencyBRL(calculation.totals.netPayable)}
          </Text>
        </View>

        <View style={styles.signatureSection}>
          <View style={styles.signatureBox}>
            <Text style={styles.signatureLabel}>Contratado / Equipe de Campo</Text>
            <View style={styles.signatureLine}>
              <Text style={styles.signatureName}>{calculation.team.leaderName}</Text>
              <Text style={styles.signatureRole}>Equipe {calculation.team.name} — Sondagem</Text>
            </View>
          </View>

          <View
            style={
              signatory.includeLegalRepresentative
                ? styles.signatureBox
                : styles.signatureBoxLast
            }
          >
            <Text style={styles.signatureLabel}>Coordenação Técnica / Conferência</Text>
            <View>
              <CatherineSignatureStroke />
              <View style={styles.signatureLine}>
                <Text style={styles.signatureName}>{signatory.engineerName}</Text>
                <Text style={styles.signatureRole}>
                  {signatory.engineerTitle}
                  {signatory.engineerCrea ? ` · ${signatory.engineerCrea}` : ''}
                </Text>
                <Text style={{ fontSize: 6.4, color: '#64748B', marginTop: 1 }}>
                  Emitido eletronicamente em {timestamp}
                </Text>
              </View>
            </View>
          </View>

          {signatory.includeLegalRepresentative && (
            <View style={styles.signatureBoxLast}>
              <Text style={styles.signatureLabel}>Contratante / Representante Legal</Text>
              <View style={styles.signatureLine}>
                <Text style={styles.signatureName}>
                  {signatory.legalRepName} ({signatory.legalRepRole})
                </Text>
                <Text style={styles.signatureRole}>CPF: {signatory.legalRepCpf}</Text>
              </View>
            </View>
          )}
        </View>

        <View style={styles.footer} fixed>
          <Text>
            Terra Sol Engenharia Geotécnica · Boletim {monthLabel} · {calculation.team.name}
          </Text>
          <Text>
            Gerado em {timestamp} · Cód. {calculation.authenticityCode} · Desenvolvido por Okapi Code Forge
          </Text>
        </View>
      </Page>

      <Page size="A4" orientation="portrait" style={styles.pagePortrait}>
        <View style={styles.memoryTitleBox}>
          <View>
            <Text style={{ fontSize: 11, fontFamily: 'Helvetica-Bold', color: '#0F172A' }}>
              Memória de Cálculo dos Serviços Executados
            </Text>
            <Text style={{ fontSize: 8, color: '#475569', marginTop: 2 }}>
              Equipe {calculation.team.name} · Referência {monthLabel} ({calculation.periodStart} a {calculation.periodEnd})
            </Text>
          </View>
          <Text style={{ fontSize: 8, fontFamily: 'Helvetica-Bold', color: '#1F6E7A' }}>
            {calculation.authenticityCode}
          </Text>
        </View>

        {calculation.memoryGroups.map((group) => (
          <View style={styles.memoryGroupCard} key={group.itemCode} wrap={false}>
            <View style={styles.memoryGroupHead}>
              <Text style={{ width: 32 }}>{group.itemCode}</Text>
              <Text style={{ flex: 1 }}>{group.title}</Text>
              <Text style={{ width: 72, textAlign: 'right' }}>
                {group.unit === 'R$' ? 'Valor (R$)' : 'Quant.'}
              </Text>
              <Text style={{ width: 48, textAlign: 'center' }}>
                {group.unit === 'R$' ? 'Data' : 'Unidade'}
              </Text>
            </View>

            {group.rows.map((row, idx) => (
              <View style={styles.tRow} key={`${group.itemCode}-${idx}`}>
                <Text style={[styles.cell, { width: 32 }, styles.center]}>{idx + 1}</Text>
                <Text style={[styles.cell, { flex: 1 }]}>{row.description}</Text>
                <Text style={[styles.cell, { width: 72 }, styles.right]}>
                  {row.amount !== undefined
                    ? formatCurrencyBRL(row.amount)
                    : formatDecimalBR(row.quantity ?? 0)}
                </Text>
                <Text style={[styles.cellLast, { width: 48 }, styles.center]}>
                  {row.amount !== undefined ? formatDateBR(row.date) : row.unit || group.unit}
                </Text>
              </View>
            ))}

            <View style={styles.memoryTotalRow}>
              <Text style={[styles.cell, { flex: 1, textAlign: 'right' }]}>Total Geral</Text>
              <Text style={[styles.cell, { width: 72 }, styles.right]}>
                {group.totalQuantity !== undefined
                  ? formatDecimalBR(group.totalQuantity)
                  : formatCurrencyBRL(group.totalAmount ?? 0)}
              </Text>
              <Text style={[styles.cellLast, { width: 48 }, styles.center]}>
                {group.unit === 'R$' ? 'R$' : group.unit}
              </Text>
            </View>
          </View>
        ))}

        <View style={[styles.signatureSection, { marginTop: 14 }]} wrap={false}>
          <View style={styles.signatureBoxLast}>
            <Text style={styles.signatureLabel}>Responsável Técnica pela Memória de Cálculo</Text>
            <View>
              <CatherineSignatureStroke />
              <View style={styles.signatureLine}>
                <Text style={styles.signatureName}>{signatory.engineerName}</Text>
                <Text style={styles.signatureRole}>
                  {signatory.engineerTitle}
                  {signatory.engineerCrea ? ` · ${signatory.engineerCrea}` : ''} — Gerado em {timestamp}
                </Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.footer} fixed>
          <Text>
            Memória de Cálculo · {calculation.team.name} · {monthLabel}
          </Text>
          <Text
            render={({ pageNumber, totalPages }) =>
              `Página ${pageNumber} de ${totalPages} · Desenvolvido por Okapi Code Forge`
            }
          />
        </View>
      </Page>
    </Document>
  );
}
