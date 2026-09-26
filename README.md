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
- Sincronização de alunos do Google Sheets para o PostgreSQL.
- Criação/atualização de alunos pelo CPF, sem duplicação.
- Associação de alunos empregados às empresas cadastradas.
- Tabela de alunos com busca, filtro, ordenação, paginação e seleção de colunas.
- Exportação dos registros filtrados em CSV, Excel (`.xls`) e JSON.
- Formulário de solicitação conectado à API e ao PostgreSQL, com validação compartilhada.
- Sessão assinada em cookie HttpOnly, verificação de perfil no servidor e logout.

Veja [CONTINUIDADE_SOLICITACOES.md](CONTINUIDADE_SOLICITACOES.md) para o resumo desta entrega, configuração e limites dos testes.

## Fluxo de dados dos alunos

```text
Google Forms → Google Sheets → API Next.js → Prisma → PostgreSQL → Dashboard
```

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

Não há novas migrations nesta entrega. Em um banco novo, aplique as migrations existentes com `npx prisma migrate deploy` e execute `npx prisma db seed` somente quando precisar criar/atualizar os usuários iniciais. Em um banco existente, verifique primeiro `npx prisma migrate status`; o seed pode alterar senhas e não deve ser repetido apenas para iniciar o projeto.

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
- `GOOGLE_SHEETS_ID`: ID da planilha.
- `GOOGLE_SHEETS_ALUNOS_RANGE`: intervalo da aba de alunos, por exemplo `Alunos!A:Q`.
- `GOOGLE_SHEETS_LISTAS_RANGE`: intervalo da lista de cursos, por padrão `Listas!A:Z`.

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
npm test
npm run lint
npm run build
```

A rota de teste da planilha e a sincronização estão limitadas ao ambiente de desenvolvimento e exigem sessão de administrador. Essa limitação foi preservada.

Em produção, o cookie usa `Secure` e exige HTTPS. O logout remove o cookie do navegador; a sessão expira em oito horas e também é invalidada por troca de senha ou bloqueio do usuário no banco. Rate limiting, auditoria e revogação individual de tokens ainda precisam de uma etapa dedicada antes da publicação.
