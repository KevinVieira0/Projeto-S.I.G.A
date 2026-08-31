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
- Endpoint para criação de solicitações de empresa.

## Fluxo de dados dos alunos

```text
Google Forms → Google Sheets → API Next.js → Prisma → PostgreSQL → Dashboard
```

## Configuração

1. Instale as dependências:

```bash
npm install
```

2. Crie o `.env` com base no `.env.example` e configure as credenciais do PostgreSQL, administrador inicial, senha das empresas de teste e Google Sheets.

3. Prepare o Prisma:

```bash
npx prisma validate
npx prisma generate
npx prisma migrate deploy
npx prisma db seed
```

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
- `ADMIN_INITIAL_NAME`, `ADMIN_INITIAL_EMAIL`, `ADMIN_INITIAL_PASSWORD`: administrador criado pelo seed.
- `EMPRESA_TEST_PASSWORD`: senha das empresas de teste criadas pelo seed.
- `GOOGLE_APPLICATION_CREDENTIALS`: caminho do JSON da conta de serviço.
- `GOOGLE_SHEETS_ID`: ID da planilha.
- `GOOGLE_SHEETS_ALUNOS_RANGE`: intervalo da aba de alunos, por exemplo `Alunos!A:Q`.

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
npm run build
```

A rota de teste da planilha e a sincronização estão atualmente limitadas ao ambiente de desenvolvimento pelo próprio backend.
