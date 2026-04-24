# Projeto RC CASTUS

Projeto baseado no Web Design for Employee Profile (Figma). Inclui app principal na raiz, WebDesign (Figma), TESTE-NOVO e integração com Supabase.

## O que tem no repositório

- **Raiz** – App principal (React + Vite + Supabase)
- **TESTE-NOVO/** – App alternativo (mesmo design, estrutura em features)
- **WebDesign(RCCASTUS)/** – Código de referência do Figma (sem backend)
- **scripts/** – SQL para criar tabelas no Supabase (employees, time_entries, RLS, tipos de usuário)
- **.cursor/mcp.json** – Configuração do MCP do Supabase para o Cursor (Supabase **self-hosted**; ver [docs/MCP-SUPABASE.md](docs/MCP-SUPABASE.md))

## Rodar 100% – passo a passo

### 1. Dependências

**App na raiz:**
```bash
npm install
```

**App TESTE-NOVO:**
```bash
cd TESTE-NOVO
npm install --legacy-peer-deps
```

### 2. Variáveis de ambiente (Supabase)

O `.env` **não** vai no Git (segurança). Use o exemplo e preencha com seus dados:

1. Copie o arquivo de exemplo:
   - Raiz: `cp .env.example .env`
   - TESTE-NOVO: `cd TESTE-NOVO` e `cp .env.example .env`

2. Abra o `.env` e preencha:
   - **VITE_SUPABASE_URL** – URL do projeto no Supabase (Dashboard > Project Settings > API)
   - **VITE_SUPABASE_ANON_KEY** – Chave "anon" pública do mesmo lugar

Exemplo (substitua pelos seus valores):
```
VITE_SUPABASE_URL=https://xxxxxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 3. Banco de dados no Supabase

No Supabase (SQL Editor), rode na ordem:

1. `scripts/001_create_employees.sql`
2. `scripts/002_create_time_entries.sql`
3. `scripts/003_seed_employees.sql` (opcional – dados de exemplo)
4. `scripts/004_enable_rls.sql`
5. `scripts/005_create_user_roles.sql` – tipos de usuário: **Admin**, **Gerente**, **Funcionário** (tabela `profiles` com coluna `role`, RLS, trigger ao criar usuário no Auth)
6. `scripts/006_rls_by_role_optional.sql` (opcional) – RLS por role em `employees` e `time_entries`; rode só quando a autenticação estiver ativa (veja comentários no arquivo)
7. `scripts/007_ensure_user_type_column.sql` (opcional) – garante a coluna **tipo de usuário** (`profiles.role`) no banco; use se ainda não tiver ou se criou `profiles` sem essa coluna. A verificação no login é feita no Supabase via a função `get_my_role()`.
8. **`scripts/008_employee_password_login.sql`** – necessário para **login por e-mail e senha** usando a tabela `employees`. Cria a coluna `password_hash`, a função `get_employee_by_login` e a função `set_employee_password`. Sem este script, usuários cadastrados não conseguem logar (erro "E-mail ou senha incorretos").
9. **`scripts/009_add_extra_documents_to_employees.sql`** – adiciona a coluna `employees.extra_documents` (JSONB) para salvar documentos extras do funcionário (título + imagem) na aba **Documentos**.
10. **`scripts/010_add_receives_commute_allowance_to_employees.sql`** – adiciona a coluna `employees.receives_commute_allowance` (boolean) para o checkbox **Recebe auxílio de deslocamento?** na aba **Pagamento**.
11. **`scripts/011_create_employee_hourly_rate_history.sql`** – cria a tabela `employee_hourly_rate_history` para o histórico de **valor por hora** na aba **Pagamento**.
12. **`scripts/012_harden_auth_and_rls.sql`** – hardening de autenticação (bcrypt-only) e políticas RLS por papel/usuário para tabelas críticas.
13. **`scripts/013_create_payroll_domain.sql`** – cria domínio transacional de folha (`payroll_runs`, `payroll_entries`) com RLS.
14. **`scripts/014_timetracking_integrity_rules.sql`** – aplica regras de integridade do ponto (status permitido, anti-duplicidade).
15. **`scripts/015_create_employee_documents_bucket.sql`** – cria bucket seguro `employee-documents` com políticas de acesso por papel/usuário.

**Tipo de usuário:** o tipo (Admin, Gerente, Funcionário) fica na coluna `public.profiles.role` (Auth) ou em `employees.system_role` (login por employees). O app verifica no Supabase com a função `get_my_role()` ou via `get_employee_by_login()`.

**Definir o primeiro Admin:** após criar o primeiro usuário no Supabase Auth, no SQL Editor rode:
```sql
UPDATE public.profiles SET role = 'Admin' WHERE id = (SELECT id FROM auth.users WHERE email = 'seu-email@exemplo.com' LIMIT 1);
```

### 4. Subir o app

**App na raiz:**
```bash
npm run dev
```

**App TESTE-NOVO:**
```bash
cd TESTE-NOVO
npm run dev
```

Abra o endereço que aparecer no terminal (ex.: http://localhost:5173).

## Deploy (Vercel etc.)

- **Build:** `npm run build`
- **Pasta de saída:** `dist`
- **Variáveis de ambiente:** configure no painel da plataforma:
  - `VITE_SUPABASE_URL`
  - `VITE_SUPABASE_ANON_KEY`

Para o app TESTE-NOVO, use **Root Directory** = `TESTE-NOVO` no projeto de deploy.

## Operacao com time de agentes de IA

Foi adicionada uma base operacional para trabalhar com agentes especializados:

- `docs/ai-agents/TEAM_CHARTER.md` - papeis, RACI, limites e permissoes.
- `docs/ai-agents/SKILLS.md` - skills obrigatorias (GSD + UI UX Pro Max) por agente.
- `docs/ai-agents/HR_COORDINATOR_AGENT.md` - persona Coordenador(a) Senior de RH (feedback e requisitos de processo).
- `docs/ai-agents/PROMPT_TEMPLATES.md` - templates de prompt e contrato de saida.
- `docs/ai-agents/METRICS_AND_REVIEW.md` - KPIs, rotina de revisao e playbook de melhoria.
- `.github/workflows/agent-quality-gates.yml` - gates de lint, teste, build e audit de seguranca.
- `.github/workflows/agent-metrics-weekly.yml` - geracao semanal de scorecard para melhoria continua.
- `.github/ISSUE_TEMPLATE/agent-weekly-retro.yml` - template de retro semanal dos agentes.

Comandos uteis:

```bash
npm run lint
npm run test
npm run build
npm run security:audit
npm run quality:gate
npm run agents:metrics
```

## Design original

Figma: [Web Design for Employee Profile (Copy)](https://www.figma.com/design/orSPcZuDqn9CK8Vd6uA01u/Web-Design-for-Employee-Profile--Copy-)
