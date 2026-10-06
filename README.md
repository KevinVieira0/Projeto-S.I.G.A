# SIGA — Sistema de Indicação e Gerenciamento do Aprendiz

Aplicação acadêmica em Next.js para autenticação de administradores e empresas, sincronização de alunos a partir do Google Sheets e consulta dos registros no dashboard administrativo.

## Stack

- Next.js 14 + React 18
- Tailwind CSS
- React Hook Form + Zod
- Axios
- Prisma 7 + PostgreSQL
- bcryptjs
- Google Sheets API

## Funcionalidades atuais

- Login de administrador por e-mail e senha.
- Login e validação de empresa por CNPJ e senha.
- Dashboard administrativo em `/admin/dashboard`.
- Processamento automático de alunos e empresas recebidos pelos formulários.
- Criação/atualização de alunos pelo CPF, sem duplicação.
- Associação de alunos empregados às empresas cadastradas.
- Tabela de alunos com busca, filtro, ordenação, paginação e seleção de colunas.
- Exportação dos registros filtrados em CSV, Excel (`.xls`) e JSON.
- Formulário de solicitação conectado à API e ao PostgreSQL, com validação compartilhada.
- Sessão assinada em cookie HttpOnly, verificação de perfil no servidor e logout.

## Fluxo de dados dos alunos

```text
Google Forms → Recebimentos no Google Sheets → API Next.js → PostgreSQL
                                                           ↓
                                   Visão Geral e abas de consulta da planilha
```

O PostgreSQL é a fonte oficial. A sincronização cadastra os cursos e as turmas válidos do catálogo mesmo sem alunos, processa os recebimentos e espelha Alunos, Empresas, Matriculas e Historico. Os IDs CUR/TUR da planilha são preservados para manter as respostas dos formulários compatíveis.

CPF novo cria aluno; CPF existente atualiza os dados pessoais e acadêmicos, preservando status e vínculos administrativos. Empresas seguem a mesma lógica pelo CNPJ, preservando situação cadastral e acesso. Dados inválidos são bloqueados automaticamente e precisam de correção e novo envio. Não há aprovação manual de cadastros. Um cadastro de empresa não cria senha nem concede login.

A sincronização ocorre a cada cinco minutos enquanto o portal administrativo está aberto e visível. Edições internas de alunos também atualizam o espelho. Se o Google estiver indisponível, o cadastro permanece salvo no banco e a próxima sincronização tenta atualizar a planilha novamente. Não edite os espelhos para alterar cadastros; use o sistema. Cursos e Turmas continuam sendo o catálogo de entrada.

## Configuração

1. Instale as dependências:

```bash
npm install
```

2. Crie o `.env` com base no `.env.example` e configure as credenciais do PostgreSQL, administrador inicial, senha das empresas de teste e Google Sheets. Configure também `AUTH_SECRET` com pelo menos 32 caracteres aleatórios. Essa variável é obrigatória para os dois logins.

Gere o segredo localmente e copie o resultado para `AUTH_SECRET` no seu `.env`:

```bash
node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"
```

Use `NEXT_PUBLIC_API_URL="/api"` para manter a API e os cookies na mesma origem. Após atualizar esta versão, entre novamente: a sessão antiga do `localStorage` não é aceita pelo servidor.

3. Prepare o Prisma:

```bash
npx prisma validate
npx prisma generate
```

Em um banco existente, faça uma cópia de segurança e confira `npx prisma migrate status` antes de aplicar `npx prisma migrate deploy`. A migration `20261006140000_processamento_automatico` converte os estados antigos dos recebimentos e retira a relação com o revisor, preservando a auditoria. Execute `npx prisma db seed` somente quando precisar criar/atualizar os usuários iniciais; o seed pode alterar senhas.

4. Inicie a aplicação:

```bash
npm run dev
```

Acesse `http://localhost:3000/login`.

## Variáveis de ambiente

Consulte `.env.example`. As principais são:

- `DATABASE_URL`: conexão usada pela aplicação.
- `DIRECT_URL`: conexão usada pelo Prisma CLI/migrations.
- `NEXT_PUBLIC_API_URL`: opcional; por padrão os serviços usam `/api` na mesma origem.
- `AUTH_SECRET`: segredo aleatório com pelo menos 32 caracteres para assinar as sessões.
- `APP_ORIGIN`: origem pública exata, sem barra final, quando houver proxy reverso, por exemplo `https://siga.exemplo.com`.
- `ADMIN_INITIAL_NAME`, `ADMIN_INITIAL_EMAIL`, `ADMIN_INITIAL_PASSWORD`: administrador criado pelo seed.
- `EMPRESA_TEST_PASSWORD`: senha das empresas de teste criadas pelo seed.
- `GOOGLE_APPLICATION_CREDENTIALS`: caminho do JSON da conta de serviço.
- `GOOGLE_SHEETS_ACADEMICO_ID`: ID da nova planilha, com cabeçalhos na linha 4.
- `GOOGLE_SHEETS_RECEBIMENTOS_AUTO`: habilita o processamento dos formulários pelo portal.
- `GOOGLE_SHEETS_ESPELHO_AUTO`: habilita o espelho do banco; requer acesso de Editor da conta de serviço à nova planilha.

`GOOGLE_SHEETS_ID`, `GOOGLE_SHEETS_ALUNOS_RANGE` e `GOOGLE_SHEETS_LISTAS_RANGE` pertencem à integração antiga. A nova base não depende delas.

Nunca versione o `.env` nem o JSON da conta de serviço.

## Estrutura principal

```text
prisma/
  migrations/
  schema.prisma
  seed.js
src/
  app/
    (public)/login/
    (private)/admin/dashboard/
    api/
  components/
    dashboard/
    login/
    ui/
  constants/
  context/
  hooks/
  lib/
    api/
    validations/
```

`src/generated/prisma` é gerado pelo comando `npx prisma generate` e permanece ignorado pelo Git.

## Validação antes de subir alterações

```bash
npx prisma validate
npx prisma generate
npm run test:cadastros
npm run lint
npm run build
```

Os testes dos formulários rodam sem banco. Para executar também a integração, defina `TEST_DATABASE_URL` e `DATABASE_URL` com a mesma conexão ao banco local isolado `siga_test`, já migrado. Sem essa configuração, a integração é ignorada. Esses testes criam e removem seus próprios dados fictícios; nunca use o banco principal.

O comando `npm run db:recebimentos` executa uma sincronização completa fora do navegador. Use-o com o `.env` do ambiente desejado. Os testes disponíveis estão em `tests/`; `npm test` executa a mesma suíte de `npm run test:cadastros`.

Em produção, o cookie usa `Secure` e exige HTTPS. O logout remove o cookie do navegador; a sessão expira em oito horas e também é invalidada por troca de senha ou bloqueio do usuário no banco. Rate limiting, auditoria e revogação individual de tokens ainda precisam de uma etapa dedicada antes da publicação.
