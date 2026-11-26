# Teneur — Terra Sol Engenharia Geotécnica

Plataforma web responsiva (PWA Mobile + Desktop) para gestão diária de equipes de sondagem, apuração automática de medições (Metro vs. Diária Mínima), controle de amortização de bens, inteligência operacional com ApexCharts e geração vetorial de PDFs (Boletim de Medição + Memória de Cálculo e Relatório Técnico-Gerencial conforme ABNT NBR 10719 / NBR 6024 / NBR 6484).

## Arquitetura

- `src/domain/`: núcleo puro de regras de negócio (`billing-engine.ts`, `analytics.ts`, `schemas.ts`, `formatters.ts`), 100% independente de UI e banco de dados.
- `src/services/`: camada de persistência desacoplada com suporte nativo a **Supabase (PostgreSQL + RLS + Realtime)** e fallback local determinístico.
- `src/pdf/`: geradores vetoriais em `@react-pdf/renderer` (`boletim-medicao-pdf.tsx` e `relatorio-executivo-nbr-pdf.tsx`) com assinatura técnica de **Catherine Irina Pascoal Gouveia — Engenheira de Minas**, carimbo de data/hora, código de autenticidade e assinatura opcional da Representante Legal (**Eng. Damiana Tavares**).
- `src/components/`: interface *Mineral Milkgray & Modern iOS Thin* com **ApexCharts**.
- `supabase/migrations/001_initial_schema.sql`: schema relacional completo, triggers, políticas RLS e publicação `supabase_realtime`.
- `scripts/seed-supabase.ts`: carga inicial das 6 equipes reais, obras/pastas e histórico de amortização da S10 Prata.

## Comandos

```bash
npm install
npm run dev
npm run typecheck
npm test
npm run test:e2e
npm run build
npm run db:seed
```

## Configuração Supabase

1. Crie um projeto no Supabase e execute `supabase/migrations/001_initial_schema.sql` no SQL Editor.
2. Copie `.env.example` para `.env.local` e preencha `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` e `SUPABASE_SERVICE_ROLE_KEY`.
3. Execute `npm run db:seed` para popular as equipes, obras e histórico inicial.

---

Desenvolvido por **Okapi Code Forge**.
