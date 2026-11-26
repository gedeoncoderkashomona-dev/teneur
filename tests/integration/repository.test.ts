import { beforeEach, describe, expect, it } from 'vitest';
import {
  deleteDailyEntry,
  getDataset,
  resetMemoryDataset,
  updateMeasurementStatus,
  updateSignatorySettings,
  upsertDailyEntry,
  upsertFinancialAdjustment,
  upsertMobilization,
  upsertProject,
  upsertTeam,
} from '@/services/teneur-repository';

describe('Teneur Repository Integration', () => {
  beforeEach(() => {
    resetMemoryDataset();
  });

  it('carrega o seed completo com as 6 equipes e assinatura da Catherine Irina', async () => {
    const { dataset } = await getDataset();
    expect(dataset.teams).toHaveLength(6);
    expect(dataset.signatory.engineerName).toBe('Catherine Irina Pascoal Gouveia');
    expect(dataset.signatory.engineerTitle).toBe('Engenheira de Minas');
    expect(dataset.signatory.includeLegalRepresentative).toBe(false);
  });

  it('persiste e atualiza apontamentos diários, mobilizações, ajustes, equipes e obras', async () => {
    const entry = await upsertDailyEntry({
      teamId: 'team-ramon',
      date: '2026-11-15',
      projectId: 'proj-caern-os20',
      status: 'em_obra',
      activityType: 'spt',
      holes: [{ id: 'h-int-1', code: 'SP-10', type: 'spt', depthMeters: 22.4 }],
      testDescription: null,
      usesSptEquipment: false,
      billingOverride: 'auto',
      overrideReason: null,
      notes: 'Teste integração',
    });

    const mob = await upsertMobilization({
      teamId: 'team-ramon',
      referenceMonth: '2026-11',
      date: '2026-11-14',
      origin: 'Pombal/PB',
      destination: 'Natal/RN',
      distanceKm: 390,
      kind: 'mobilizacao',
      paidInAdvance: false,
      advanceAmount: 0,
      advanceDate: null,
      advanceNotes: null,
    });

    const adj = await upsertFinancialAdjustment({
      teamId: 'team-ramon',
      referenceMonth: '2026-11',
      code: '4.7',
      category: 'reembolso',
      direction: 'reembolso',
      description: 'Compra de lona',
      details: null,
      date: '2026-11-15',
      amount: 88.5,
      receiptRef: 'NF 901',
      receiptUrl: null,
    });

    await upsertTeam({
      name: 'Equipe Teste',
      leaderName: 'José',
      membersCount: 3,
      serviceLabel: 'SONDAGEM SPT',
      defaultLocation: 'PB',
      valorMetroSpt: 60,
      valorMetroTrado: 50,
      valorMetroRotativa: 120,
      valorDiaria: 1050,
      valorKmMobilizacao: 2.8,
      percentualDescontoEquipSpt: 0,
      taxaRastreadorMensal: 0,
      folhaCltPadraoMensal: 0,
      active: true,
    });

    await upsertProject({
      pastaCode: 'Pasta 99',
      clientName: 'Mineradora Exemplo',
      osCode: 'OS 99',
      city: 'Campina Grande',
      state: 'PB',
      serviceType: 'Sondagem SPT',
      active: true,
    });

    await updateMeasurementStatus({
      teamId: 'team-ramon',
      referenceMonth: '2026-11',
      status: 'revisao',
    });

    await updateSignatorySettings({
      companyName: 'Terra Sol',
      companySubtitle: 'engenharia geotécnica',
      engineerName: 'Catherine Irina Pascoal Gouveia',
      engineerTitle: 'Engenheira de Minas',
      engineerCrea: 'CREA-PB 162000000-0',
      includeLegalRepresentative: true,
      legalRepName: 'Eng. Damiana Tavares',
      legalRepRole: 'Representante Legal',
      legalRepCpf: '121.647.064-20',
    });

    const { dataset } = await getDataset();
    expect(dataset.dailyEntries.some((d) => d.id === entry.id)).toBe(true);
    expect(dataset.mobilizations.some((m) => m.id === mob.id)).toBe(true);
    expect(dataset.adjustments.some((a) => a.id === adj.id)).toBe(true);
    expect(dataset.teams).toHaveLength(7);
    expect(dataset.projects.some((p) => p.pastaCode === 'Pasta 99')).toBe(true);
    expect(dataset.signatory.includeLegalRepresentative).toBe(true);

    await deleteDailyEntry(entry.id);
    const afterDelete = await getDataset();
    expect(afterDelete.dataset.dailyEntries.some((d) => d.id === entry.id)).toBe(false);
  });
});
