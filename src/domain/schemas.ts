import { z } from 'zod';

export const boreholeSchema = z.object({
  id: z.string().min(1),
  code: z.string().trim().min(1, 'Informe o código do furo (ex: SP-01)'),
  type: z.enum(['spt', 'trado', 'rotativa']),
  depthMeters: z
    .number()
    .finite()
    .positive('A profundidade deve ser maior que zero')
    .max(500, 'Profundidade fora do limite operacional'),
  notes: z.string().max(240).optional(),
});

export const dailyEntryInputSchema = z.object({
  id: z.string().optional(),
  teamId: z.string().min(1, 'Selecione a equipe'),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data inválida (YYYY-MM-DD)'),
  projectId: z.string().nullable(),
  status: z.enum(['em_obra', 'mobilizacao', 'parado_diaria', 'em_casa', 'folga', 'manutencao']),
  activityType: z.enum([
    'spt',
    'trado',
    'rotativa',
    'ensaio',
    'coleta',
    'misto',
    'viagem',
    'parado',
    'ocioso',
  ]),
  holes: z.array(boreholeSchema).default([]),
  testDescription: z.string().trim().max(280).nullable().default(null),
  usesSptEquipment: z.boolean().default(false),
  billingOverride: z.enum(['auto', 'metro', 'diaria', 'meia_diaria', 'sem_cobranca']).default('auto'),
  overrideReason: z.string().trim().max(240).nullable().default(null),
  notes: z.string().trim().max(400).nullable().default(null),
});

export const mobilizationInputSchema = z.object({
  id: z.string().optional(),
  teamId: z.string().min(1, 'Selecione a equipe'),
  referenceMonth: z.string().regex(/^\d{4}-\d{2}$/, 'Mês de referência inválido (YYYY-MM)'),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data inválida'),
  origin: z.string().trim().min(2, 'Informe a origem'),
  destination: z.string().trim().min(2, 'Informe o destino'),
  distanceKm: z.number().finite().positive('Distância deve ser maior que zero'),
  kind: z.enum(['mobilizacao', 'desmobilizacao', 'deslocamento']),
  paidInAdvance: z.boolean().default(false),
  advanceAmount: z.number().finite().min(0).default(0),
  advanceDate: z.string().nullable().default(null),
  advanceNotes: z.string().trim().max(240).nullable().default(null),
});

export const financialAdjustmentInputSchema = z.object({
  id: z.string().optional(),
  teamId: z.string().min(1, 'Selecione a equipe'),
  referenceMonth: z.string().regex(/^\d{4}-\d{2}$/, 'Mês de referência inválido'),
  code: z.string().trim().min(1).max(10),
  category: z.enum([
    'mobilizacao_paga',
    'compra_veiculo',
    'equipamento_spt',
    'rastreador',
    'folha_clt',
    'reembolso',
    'outro_desconto',
  ]),
  direction: z.enum(['desconto', 'reembolso']),
  description: z.string().trim().min(2, 'Informe a descrição do lançamento'),
  details: z.string().trim().max(280).nullable().default(null),
  date: z.string().nullable().default(null),
  amount: z.number().finite().positive('Informe um valor positivo'),
  receiptRef: z.string().trim().max(180).nullable().default(null),
  receiptUrl: z.string().trim().max(500).nullable().default(null),
});

export const teamInputSchema = z.object({
  id: z.string().optional(),
  name: z.string().trim().min(2, 'Nome da equipe é obrigatório'),
  leaderName: z.string().trim().min(2, 'Nome do sondador responsável é obrigatório'),
  membersCount: z.number().int().min(1).max(20).default(3),
  serviceLabel: z.string().trim().min(2).default('EXECUÇÃO DE SONDAGEM SPT E ENSAIOS'),
  defaultLocation: z.string().trim().min(2).default('VARIADOS'),
  valorMetroSpt: z.number().finite().min(0),
  valorMetroTrado: z.number().finite().min(0),
  valorMetroRotativa: z.number().finite().min(0).default(120),
  valorDiaria: z.number().finite().positive('Valor da diária deve ser positivo'),
  valorKmMobilizacao: z.number().finite().min(0),
  percentualDescontoEquipSpt: z.number().finite().min(0).max(100).default(0),
  taxaRastreadorMensal: z.number().finite().min(0).default(0),
  folhaCltPadraoMensal: z.number().finite().min(0).default(0),
  active: z.boolean().default(true),
});

export const projectInputSchema = z.object({
  id: z.string().optional(),
  pastaCode: z.string().trim().min(1, 'Código da pasta é obrigatório'),
  clientName: z.string().trim().min(2, 'Nome do cliente é obrigatório'),
  osCode: z.string().trim().max(40).nullable().default(null),
  city: z.string().trim().min(2, 'Cidade é obrigatória'),
  state: z.string().trim().length(2, 'Informe a UF com 2 letras').transform((v) => v.toUpperCase()),
  serviceType: z.string().trim().min(2).default('Sondagem SPT e Ensaios'),
  active: z.boolean().default(true),
});

export const signatoryConfigSchema = z.object({
  companyName: z.string().trim().min(2),
  companySubtitle: z.string().trim().min(2),
  engineerName: z.string().trim().min(3),
  engineerTitle: z.string().trim().min(3),
  engineerCrea: z.string().trim().max(40),
  includeLegalRepresentative: z.boolean(),
  legalRepName: z.string().trim().min(2),
  legalRepRole: z.string().trim().min(2),
  legalRepCpf: z.string().trim().max(24),
});
