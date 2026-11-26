import {
  formatDateBR,
  formatMonthYearPT,
  formatShortDayMonth,
  generateAuthenticityCode,
  getMonthDateBounds,
  roundCurrency,
  roundMeters,
} from './formatters';
import type {
  AssetAmortizationEntry,
  AssetFinancing,
  DailyEntry,
  EvaluatedDailyEntry,
  FinancialAdjustment,
  MeasurementCalculation,
  MeasurementLineItem,
  MeasurementStatus,
  MemoryGroup,
  MobilizationRecord,
  PaymentLineItem,
  Project,
  Team,
} from './types';

export function evaluateDailyEntry(entry: DailyEntry, team: Team): EvaluatedDailyEntry {
  const sptMeters = roundMeters(
    entry.holes
      .filter((hole) => hole.type === 'spt')
      .reduce((acc, hole) => acc + hole.depthMeters, 0)
  );
  const tradoMeters = roundMeters(
    entry.holes
      .filter((hole) => hole.type === 'trado')
      .reduce((acc, hole) => acc + hole.depthMeters, 0)
  );
  const rotativaMeters = roundMeters(
    entry.holes
      .filter((hole) => hole.type === 'rotativa')
      .reduce((acc, hole) => acc + hole.depthMeters, 0)
  );
  const totalMeters = roundMeters(sptMeters + tradoMeters + rotativaMeters);

  const rawMeterValue = roundCurrency(
    sptMeters * team.valorMetroSpt +
      tradoMeters * team.valorMetroTrado +
      rotativaMeters * team.valorMetroRotativa
  );

  if (entry.billingOverride !== 'auto') {
    switch (entry.billingOverride) {
      case 'sem_cobranca':
        return {
          entry,
          resolvedMode: 'sem_cobranca',
          dailyUnits: 0,
          sptMeters,
          tradoMeters,
          rotativaMeters,
          totalMeters,
          rawMeterValue,
          billedValue: 0,
          triggeredMinimumDaily: false,
          explanation: entry.overrideReason || 'Definido manualmente sem cobrança',
        };
      case 'diaria':
        return {
          entry,
          resolvedMode: 'diaria',
          dailyUnits: 1,
          sptMeters,
          tradoMeters,
          rotativaMeters,
          totalMeters,
          rawMeterValue,
          billedValue: roundCurrency(team.valorDiaria),
          triggeredMinimumDaily: totalMeters > 0 && rawMeterValue < team.valorDiaria,
          explanation: entry.overrideReason || 'Diária integral definida manualmente',
        };
      case 'meia_diaria':
        return {
          entry,
          resolvedMode: 'meia_diaria',
          dailyUnits: 0.5,
          sptMeters,
          tradoMeters,
          rotativaMeters,
          totalMeters,
          rawMeterValue,
          billedValue: roundCurrency(team.valorDiaria * 0.5),
          triggeredMinimumDaily: false,
          explanation: entry.overrideReason || 'Meia diária definida manualmente',
        };
      case 'metro':
        return {
          entry,
          resolvedMode: 'metro',
          dailyUnits: 0,
          sptMeters,
          tradoMeters,
          rotativaMeters,
          totalMeters,
          rawMeterValue,
          billedValue: rawMeterValue,
          triggeredMinimumDaily: false,
          explanation: entry.overrideReason || 'Faturamento por metro definido manualmente',
        };
    }
  }

  if (
    entry.status === 'em_casa' ||
    entry.status === 'folga' ||
    entry.status === 'manutencao'
  ) {
    return {
      entry,
      resolvedMode: 'sem_cobranca',
      dailyUnits: 0,
      sptMeters,
      tradoMeters,
      rotativaMeters,
      totalMeters,
      rawMeterValue,
      billedValue: 0,
      triggeredMinimumDaily: false,
      explanation: 'Dia sem faturamento operacional',
    };
  }

  if (entry.status === 'mobilizacao') {
    return {
      entry,
      resolvedMode: 'sem_cobranca',
      dailyUnits: 0,
      sptMeters,
      tradoMeters,
      rotativaMeters,
      totalMeters,
      rawMeterValue,
      billedValue: 0,
      triggeredMinimumDaily: false,
      explanation: 'Deslocamento contabilizado em mobilização (km)',
    };
  }

  if (entry.status === 'parado_diaria') {
    return {
      entry,
      resolvedMode: 'diaria',
      dailyUnits: 1,
      sptMeters,
      tradoMeters,
      rotativaMeters,
      totalMeters,
      rawMeterValue,
      billedValue: roundCurrency(team.valorDiaria),
      triggeredMinimumDaily: false,
      explanation: 'Parada técnica/aguardando liberação faturada como diária',
    };
  }

  if (totalMeters > 0) {
    if (rawMeterValue < team.valorDiaria) {
      return {
        entry,
        resolvedMode: 'diaria',
        dailyUnits: 1,
        sptMeters,
        tradoMeters,
        rotativaMeters,
        totalMeters,
        rawMeterValue,
        billedValue: roundCurrency(team.valorDiaria),
        triggeredMinimumDaily: true,
        explanation: 'Produção em metros inferior à diária mínima — convertido automaticamente para diária',
      };
    }

    return {
      entry,
      resolvedMode: 'metro',
      dailyUnits: 0,
      sptMeters,
      tradoMeters,
      rotativaMeters,
      totalMeters,
      rawMeterValue,
      billedValue: rawMeterValue,
      triggeredMinimumDaily: false,
      explanation: 'Produção em metros atingiu ou superou a diária mínima',
    };
  }

  return {
    entry,
    resolvedMode: 'diaria',
    dailyUnits: 1,
    sptMeters,
    tradoMeters,
    rotativaMeters,
    totalMeters,
    rawMeterValue,
    billedValue: roundCurrency(team.valorDiaria),
    triggeredMinimumDaily: false,
    explanation: 'Ensaio/atividade técnica de campo contabilizada como diária',
  };
}

export interface CalculateMeasurementInput {
  team: Team;
  referenceMonth: string;
  entries: DailyEntry[];
  mobilizations: MobilizationRecord[];
  adjustments: FinancialAdjustment[];
  projects: Project[];
  financing?: AssetFinancing | null;
  status?: MeasurementStatus;
  locationOverride?: string | null;
}

export function calculateMeasurement({
  team,
  referenceMonth,
  entries,
  mobilizations,
  adjustments,
  projects,
  financing = null,
  status = 'aberta',
  locationOverride = null,
}: CalculateMeasurementInput): MeasurementCalculation {
  const { periodStart, periodEnd, daysInMonth } = getMonthDateBounds(referenceMonth);
  const projectMap = new Map(projects.map((p) => [p.id, p]));

  const monthEntries = entries
    .filter((entry) => entry.teamId === team.id && entry.date.startsWith(referenceMonth))
    .sort((a, b) => a.date.localeCompare(b.date));

  const evaluatedDays = monthEntries.map((entry) => evaluateDailyEntry(entry, team));

  const monthMobilizations = mobilizations
    .filter((m) => m.teamId === team.id && m.referenceMonth === referenceMonth)
    .sort((a, b) => a.date.localeCompare(b.date));

  const monthAdjustments = adjustments
    .filter((a) => a.teamId === team.id && a.referenceMonth === referenceMonth)
    .sort((a, b) => a.code.localeCompare(b.code, undefined, { numeric: true }));

  const mobilizationKm = roundMeters(
    monthMobilizations.reduce((acc, m) => acc + m.distanceKm, 0)
  );
  const mobilizationValue = roundCurrency(mobilizationKm * team.valorKmMobilizacao);

  const sptBilledDays = evaluatedDays.filter((d) => d.resolvedMode === 'metro' && d.sptMeters > 0);
  const tradoBilledDays = evaluatedDays.filter(
    (d) => d.resolvedMode === 'metro' && d.tradoMeters > 0
  );
  const rotativaBilledDays = evaluatedDays.filter(
    (d) => d.resolvedMode === 'metro' && d.rotativaMeters > 0
  );

  const sptMeters = roundMeters(sptBilledDays.reduce((acc, d) => acc + d.sptMeters, 0));
  const tradoMeters = roundMeters(tradoBilledDays.reduce((acc, d) => acc + d.tradoMeters, 0));
  const rotativaMeters = roundMeters(
    rotativaBilledDays.reduce((acc, d) => acc + d.rotativaMeters, 0)
  );

  const sptValue = roundCurrency(sptMeters * team.valorMetroSpt);
  const tradoValue = roundCurrency(tradoMeters * team.valorMetroTrado);
  const rotativaValue = roundCurrency(rotativaMeters * team.valorMetroRotativa);

  const dailyBilledDays = evaluatedDays.filter(
    (d) => d.resolvedMode === 'diaria' || d.resolvedMode === 'meia_diaria'
  );
  const dailyUnits = roundMeters(dailyBilledDays.reduce((acc, d) => acc + d.dailyUnits, 0));
  const dailyValue = roundCurrency(dailyUnits * team.valorDiaria);

  const lineItems: MeasurementLineItem[] = [];

  if (mobilizationKm > 0) {
    lineItems.push({
      itemCode: '1.1',
      groupCode: '1.',
      groupTitle: 'Serviços auxiliares',
      description: 'Mobilização de equipe e equipamento',
      unit: 'km',
      unitPrice: team.valorKmMobilizacao,
      quantity: mobilizationKm,
      totalValue: mobilizationValue,
    });
  }

  if (sptMeters > 0) {
    lineItems.push({
      itemCode: '2.1',
      groupCode: '2.',
      groupTitle: 'Sondagem',
      description: 'Execução de Sondagem SPT',
      unit: 'm',
      unitPrice: team.valorMetroSpt,
      quantity: sptMeters,
      totalValue: sptValue,
    });
  }

  if (tradoMeters > 0) {
    lineItems.push({
      itemCode: '2.2',
      groupCode: '2.',
      groupTitle: 'Sondagem',
      description: 'Execução de Sondagem a Trado',
      unit: 'm',
      unitPrice: team.valorMetroTrado,
      quantity: tradoMeters,
      totalValue: tradoValue,
    });
  }

  if (rotativaMeters > 0) {
    lineItems.push({
      itemCode: '2.3',
      groupCode: '2.',
      groupTitle: 'Sondagem',
      description: 'Execução de Sondagem Rotativa / Mista',
      unit: 'm',
      unitPrice: team.valorMetroRotativa,
      quantity: rotativaMeters,
      totalValue: rotativaValue,
    });
  }

  if (dailyUnits > 0) {
    lineItems.push({
      itemCode: '3.1',
      groupCode: '3.',
      groupTitle: 'Pagamentos Extras',
      description: 'Diária para execução de serviço',
      unit: 'Unid',
      unitPrice: team.valorDiaria,
      quantity: dailyUnits,
      totalValue: dailyValue,
    });
  }

  const grossSubtotal = roundCurrency(
    mobilizationValue + sptValue + tradoValue + rotativaValue + dailyValue
  );

  const paymentItems: PaymentLineItem[] = [];

  const manualAdvanceAdjustments = monthAdjustments.filter(
    (a) => a.category === 'mobilizacao_paga'
  );
  const autoAdvanceMobilizations = monthMobilizations.filter(
    (m) => m.paidInAdvance && m.advanceAmount > 0
  );

  if (manualAdvanceAdjustments.length > 0) {
    for (const adj of manualAdvanceAdjustments) {
      paymentItems.push({
        code: adj.code || '4.1',
        category: 'mobilizacao_paga',
        direction: 'desconto',
        description: adj.description,
        date: adj.date,
        amount: roundCurrency(adj.amount),
        signedDeduction: roundCurrency(adj.amount),
        details: adj.details,
        receiptRef: adj.receiptRef,
        autoGenerated: false,
      });
    }
  } else if (autoAdvanceMobilizations.length > 0) {
    const totalAdvance = roundCurrency(
      autoAdvanceMobilizations.reduce((acc, m) => acc + m.advanceAmount, 0)
    );
    const first = autoAdvanceMobilizations[0];
    paymentItems.push({
      code: '4.1',
      category: 'mobilizacao_paga',
      direction: 'desconto',
      description: 'Mobilizações pagas',
      date: first?.advanceDate ?? first?.date ?? null,
      amount: totalAdvance,
      signedDeduction: totalAdvance,
      details:
        first?.advanceNotes ||
        (autoAdvanceMobilizations.length === 1
          ? `Mobilização paga antecipadamente (${first?.origin} → ${first?.destination})`
          : 'Mobilizações pagas adiantadamente'),
      receiptRef: first?.advanceNotes ?? null,
      autoGenerated: true,
    });
  }

  let financingSnapshot: MeasurementCalculation['financingSnapshot'] = null;
  const manualVehicleAdjustment = monthAdjustments.find((a) => a.category === 'compra_veiculo');

  if (financing && financing.active && grossSubtotal > 0) {
    const priorHistory = financing.history
      .filter((h) => h.referenceMonth < referenceMonth)
      .sort((a, b) => a.sortOrder - b.sortOrder);

    const existingMonthRow = financing.history.find((h) => h.referenceMonth === referenceMonth);
    const computedVehicleDiscount = manualVehicleAdjustment
      ? roundCurrency(manualVehicleAdjustment.amount)
      : roundCurrency((grossSubtotal * financing.monthlyDeductionPercent) / 100);

    const previousMeasurementPaid = priorHistory
      .filter((h) => h.referenceMonth !== '0000-00')
      .reduce((acc, h) => acc + h.discountAmount, 0);

    const lastPriorRow = priorHistory[priorHistory.length - 1];
    const previousBalance = lastPriorRow
      ? lastPriorRow.remainingBalance
      : roundCurrency(financing.totalValue - financing.downPayment);

    const newAccumulatedMeasurementPaid = roundCurrency(
      previousMeasurementPaid + computedVehicleDiscount
    );
    const newRemainingBalance = roundCurrency(Math.max(0, previousBalance - computedVehicleDiscount));

    const measurementIndex = priorHistory.filter((h) => h.referenceMonth !== '0000-00').length + 1;
    const currentRow: AssetAmortizationEntry = existingMonthRow
      ? {
          ...existingMonthRow,
          discountAmount: computedVehicleDiscount,
          accumulatedPaid: newAccumulatedMeasurementPaid,
          remainingBalance: newRemainingBalance,
        }
      : {
          id: `auto-${financing.id}-${referenceMonth}`,
          financingId: financing.id,
          referenceMonth,
          label: `Medição ${String(measurementIndex).padStart(2, '0')} - ${formatMonthYearPT(referenceMonth)}`,
          discountAmount: computedVehicleDiscount,
          accumulatedPaid: newAccumulatedMeasurementPaid,
          remainingBalance: newRemainingBalance,
          sortOrder: priorHistory.length + 1,
        };

    const fullRows = [...priorHistory, currentRow];

    financingSnapshot = {
      financing,
      currentDiscount: computedVehicleDiscount,
      rows: fullRows,
      remainingBalance: newRemainingBalance,
    };

    paymentItems.push({
      code: manualVehicleAdjustment?.code || '4.2',
      category: 'compra_veiculo',
      direction: 'desconto',
      description: manualVehicleAdjustment?.description || 'Desconto referente a compra do carro',
      date: manualVehicleAdjustment?.date ?? null,
      amount: computedVehicleDiscount,
      signedDeduction: computedVehicleDiscount,
      details:
        manualVehicleAdjustment?.details ||
        `Desconto da compra do carro ${financing.assetName} - ${financing.monthlyDeductionPercent}% sobre o valor total da medição`,
      receiptRef: null,
      referenceBase: grossSubtotal,
      ratePercent: financing.monthlyDeductionPercent,
      autoGenerated: !manualVehicleAdjustment,
    });
  } else if (manualVehicleAdjustment) {
    paymentItems.push({
      code: manualVehicleAdjustment.code || '4.2',
      category: 'compra_veiculo',
      direction: 'desconto',
      description: manualVehicleAdjustment.description,
      date: manualVehicleAdjustment.date,
      amount: roundCurrency(manualVehicleAdjustment.amount),
      signedDeduction: roundCurrency(manualVehicleAdjustment.amount),
      details: manualVehicleAdjustment.details,
      receiptRef: manualVehicleAdjustment.receiptRef,
      autoGenerated: false,
    });
  }

  const manualSptEquipAdjustment = monthAdjustments.find((a) => a.category === 'equipamento_spt');
  const sptEquipmentDays = evaluatedDays.filter(
    (d) => d.entry.usesSptEquipment && d.billedValue > 0
  );
  const sptEquipmentReferenceValue = roundCurrency(
    sptEquipmentDays.reduce((acc, d) => acc + d.billedValue, 0)
  );

  if (manualSptEquipAdjustment) {
    paymentItems.push({
      code: manualSptEquipAdjustment.code || '4.3',
      category: 'equipamento_spt',
      direction: 'desconto',
      description: manualSptEquipAdjustment.description,
      date: manualSptEquipAdjustment.date,
      amount: roundCurrency(manualSptEquipAdjustment.amount),
      signedDeduction: roundCurrency(manualSptEquipAdjustment.amount),
      details: manualSptEquipAdjustment.details,
      receiptRef: manualSptEquipAdjustment.receiptRef,
      referenceBase: sptEquipmentReferenceValue,
      ratePercent: team.percentualDescontoEquipSpt,
      autoGenerated: false,
    });
  } else if (team.percentualDescontoEquipSpt > 0 && sptEquipmentReferenceValue > 0) {
    const discountAmount = roundCurrency(
      (sptEquipmentReferenceValue * team.percentualDescontoEquipSpt) / 100
    );
    const datesLabel = sptEquipmentDays
      .map((d) => formatShortDayMonth(d.entry.date))
      .join(', ');
    paymentItems.push({
      code: '4.3',
      category: 'equipamento_spt',
      direction: 'desconto',
      description: 'Desconto referente ao equipamento de sondagem',
      date: null,
      amount: discountAmount,
      signedDeduction: discountAmount,
      details: `Desconto referente ao equipamento de sondagem SPT - ${team.percentualDescontoEquipSpt}% sobre as diárias com SPT (${datesLabel})`,
      receiptRef: null,
      referenceBase: sptEquipmentReferenceValue,
      ratePercent: team.percentualDescontoEquipSpt,
      autoGenerated: true,
    });
  }

  const remainingAdjustments = monthAdjustments.filter(
    (a) =>
      a.category !== 'mobilizacao_paga' &&
      a.category !== 'compra_veiculo' &&
      a.category !== 'equipamento_spt'
  );

  const hasTrackerManual = remainingAdjustments.some((a) => a.category === 'rastreador');
  if (!hasTrackerManual && team.taxaRastreadorMensal > 0 && grossSubtotal > 0) {
    paymentItems.push({
      code: '4.5',
      category: 'rastreador',
      direction: 'desconto',
      description: 'Rastreador do veículo',
      date: null,
      amount: roundCurrency(team.taxaRastreadorMensal),
      signedDeduction: roundCurrency(team.taxaRastreadorMensal),
      details: `Rateio mensal de rastreamento — ${formatMonthYearPT(referenceMonth)}`,
      receiptRef: null,
      autoGenerated: true,
    });
  }

  const reimbursementItems = remainingAdjustments.filter((a) => a.direction === 'reembolso');
  const otherDeductionItems = remainingAdjustments.filter((a) => a.direction === 'desconto');

  for (const adj of otherDeductionItems) {
    paymentItems.push({
      code: adj.code,
      category: adj.category,
      direction: 'desconto',
      description: adj.description,
      date: adj.date,
      amount: roundCurrency(adj.amount),
      signedDeduction: roundCurrency(adj.amount),
      details: adj.details,
      receiptRef: adj.receiptRef,
      autoGenerated: false,
    });
  }

  if (reimbursementItems.length > 0) {
    const totalReimbursements = roundCurrency(
      reimbursementItems.reduce((acc, item) => acc + item.amount, 0)
    );
    const summaryLabel = reimbursementItems.map((item) => item.description).join(' e ');
    paymentItems.push({
      code: reimbursementItems[0]?.code || '4.7',
      category: 'reembolso',
      direction: 'reembolso',
      description: `Reembolso de compras — ${team.name}`,
      date: null,
      amount: totalReimbursements,
      signedDeduction: roundCurrency(-totalReimbursements),
      details: `${summaryLabel} (soma ao saldo)`,
      receiptRef: null,
      autoGenerated: false,
    });
  }

  paymentItems.sort((a, b) => a.code.localeCompare(b.code, undefined, { numeric: true }));

  const deductionsTotal = roundCurrency(
    paymentItems
      .filter((p) => p.direction === 'desconto')
      .reduce((acc, p) => acc + p.amount, 0)
  );
  const reimbursementsTotal = roundCurrency(
    paymentItems
      .filter((p) => p.direction === 'reembolso')
      .reduce((acc, p) => acc + p.amount, 0)
  );
  const netPaymentsSubtotal = roundCurrency(deductionsTotal - reimbursementsTotal);
  const netPayable = roundCurrency(grossSubtotal - netPaymentsSubtotal);

  const memoryGroups: MemoryGroup[] = [];

  if (monthMobilizations.length > 0) {
    memoryGroups.push({
      itemCode: '1.1',
      title: 'Mobilização de equipe e equipamento',
      unit: 'km',
      rows: monthMobilizations.map((m) => {
        const prefix =
          m.kind === 'desmobilizacao'
            ? 'Desmobilização'
            : m.kind === 'deslocamento'
              ? 'Deslocamento'
              : 'Mobilização';
        return {
          description: `${prefix} de ${m.origin} para ${m.destination}`,
          date: m.date,
          quantity: m.distanceKm,
          unit: 'km',
        };
      }),
      totalQuantity: mobilizationKm,
      totalAmount: mobilizationValue,
    });
  }

  if (sptMeters > 0) {
    const sptRows = sptBilledDays.flatMap((d) => {
      const project = d.entry.projectId ? projectMap.get(d.entry.projectId) : null;
      const suffix = project?.osCode ? ` (${project.osCode})` : project ? ` (${project.pastaCode})` : '';
      return d.entry.holes
        .filter((h) => h.type === 'spt')
        .map((h) => ({
          description: `${h.code}${suffix}`,
          date: d.entry.date,
          quantity: h.depthMeters,
          unit: 'm',
        }));
    });
    memoryGroups.push({
      itemCode: '2.1',
      title: 'Execução de Sondagem SPT',
      unit: 'm',
      rows: sptRows,
      totalQuantity: sptMeters,
      totalAmount: sptValue,
    });
  }

  if (tradoMeters > 0) {
    const tradoRows = tradoBilledDays.flatMap((d) => {
      const project = d.entry.projectId ? projectMap.get(d.entry.projectId) : null;
      const suffix = project?.osCode ? ` (${project.osCode})` : project ? ` (${project.pastaCode})` : '';
      return d.entry.holes
        .filter((h) => h.type === 'trado')
        .map((h) => ({
          description: h.notes
            ? `${h.code} (${formatShortDayMonth(d.entry.date)}) - ${h.notes}`
            : `${h.code}${suffix} (${formatShortDayMonth(d.entry.date)})`,
          date: d.entry.date,
          quantity: h.depthMeters,
          unit: 'm',
        }));
    });
    memoryGroups.push({
      itemCode: '2.2',
      title: 'Execução de Sondagem a Trado',
      unit: 'm',
      rows: tradoRows,
      totalQuantity: tradoMeters,
      totalAmount: tradoValue,
    });
  }

  if (rotativaMeters > 0) {
    const rotRows = rotativaBilledDays.flatMap((d) =>
      d.entry.holes
        .filter((h) => h.type === 'rotativa')
        .map((h) => ({
          description: `${h.code} (${formatShortDayMonth(d.entry.date)})`,
          date: d.entry.date,
          quantity: h.depthMeters,
          unit: 'm',
        }))
    );
    memoryGroups.push({
      itemCode: '2.3',
      title: 'Execução de Sondagem Rotativa / Mista',
      unit: 'm',
      rows: rotRows,
      totalQuantity: rotativaMeters,
      totalAmount: rotativaValue,
    });
  }

  if (dailyBilledDays.length > 0) {
    memoryGroups.push({
      itemCode: '3.1',
      title: 'Diária para execução de serviço',
      unit: 'Unid',
      rows: dailyBilledDays.map((d) => {
        const project = d.entry.projectId ? projectMap.get(d.entry.projectId) : null;
        const projectLabel = project
          ? `${project.pastaCode} ${project.clientName} (${project.city}/${project.state})`
          : '';
        const holesLabel = d.entry.holes.map((h) => h.code).join(', ');
        const detail =
          d.entry.testDescription ||
          (holesLabel ? `Sondagem ${holesLabel}` : d.entry.notes || 'Diária operacional');
        const fullDesc = projectLabel
          ? `${detail} — ${projectLabel} (dia ${formatShortDayMonth(d.entry.date)})`
          : `${detail} (dia ${formatShortDayMonth(d.entry.date)})`;
        return {
          description: fullDesc,
          date: d.entry.date,
          quantity: d.dailyUnits,
          unit: 'Unid',
        };
      }),
      totalQuantity: dailyUnits,
      totalAmount: dailyValue,
    });
  }

  if (reimbursementItems.length > 0) {
    memoryGroups.push({
      itemCode: '4.7',
      title: `Reembolso de compras — ${team.name}`,
      unit: 'R$',
      rows: reimbursementItems.map((item) => ({
        description: item.receiptRef
          ? `${item.description} (${item.receiptRef})`
          : item.description,
        date: item.date,
        amount: roundCurrency(item.amount),
      })),
      totalAmount: reimbursementsTotal,
    });
  }

  const uniqueDates = new Set(monthEntries.map((e) => e.date));
  const citiesSet = new Set<string>();
  for (const d of evaluatedDays) {
    if (d.entry.projectId) {
      const p = projectMap.get(d.entry.projectId);
      if (p) citiesSet.add(`${p.city.toUpperCase()}/${p.state.toUpperCase()}`);
    }
  }
  const locationsSummary =
    locationOverride ||
    (citiesSet.size === 0
      ? team.defaultLocation
      : citiesSet.size <= 2
        ? Array.from(citiesSet).join(' · ')
        : 'VARIADOS');

  return {
    team,
    referenceMonth,
    periodStart: formatDateBR(periodStart),
    periodEnd: formatDateBR(periodEnd),
    status,
    locationsSummary,
    evaluatedDays,
    lineItems,
    paymentItems,
    memoryGroups,
    financingSnapshot,
    totals: {
      mobilizationKm,
      mobilizationValue,
      sptMeters,
      sptValue,
      tradoMeters,
      tradoValue,
      rotativaMeters,
      rotativaValue,
      dailyUnits,
      dailyValue,
      grossSubtotal,
      deductionsTotal,
      reimbursementsTotal,
      netPaymentsSubtotal,
      netPayable,
      daysWithEntries: uniqueDates.size,
      missingDaysCount: Math.max(0, daysInMonth - uniqueDates.size),
    },
    authenticityCode: generateAuthenticityCode(team.name, referenceMonth, netPayable),
  };
}
