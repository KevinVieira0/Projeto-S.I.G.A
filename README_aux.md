# SIGA — Sistema de Indicação e Gerenciamento do Aprendiz

O SIGA é uma aplicação acadêmica desenvolvida para auxiliar a coordenação de estágios do SENAI no gerenciamento de alunos, empresas beneficiárias e solicitações de aprendizagem.

O sistema reúne autenticação, banco de dados e sincronização de alunos cadastrados pelo Google Forms.

## Fluxo dos alunos

```text
Google Forms → Google Sheets → botão "Atualizar alunos" → API Next.js → Prisma → PostgreSQL
```

O CPF é usado como identificador único:

- CPF novo: o aluno é criado.
- CPF existente: o aluno é atualizado.
- A sincronização não duplica alunos com o mesmo CPF.
- Quando o aluno está empregado, ele é relacionado a uma empresa cadastrada no banco.

## Tecnologias

| Camada | Tecnologia |
| --- | --- |
| Aplicação e API | Next.js 14 e React 18 |
| Interface | Tailwind CSS |
| Formulários | React Hook Form e Zod |
| Banco de dados | PostgreSQL 18 |
| ORM e migrations | Prisma 7 |
| Autenticação de senhas | bcryptjs |
| Integração externa | Google Sheets API |

## Funcionalidades atuais

- Login de administrador por e-mail e senha.
- Login e validação de empresa por CNPJ.
- Dashboard administrativo em `/admin/dashboard`.
- Modelos de administrador, empresa, aluno e solicitação.
- Senhas armazenadas como hash bcrypt.
- Sincronização da planilha de alunos com o PostgreSQL.
- Criação e atualização de alunos pelo CPF.
- Relação entre aluno e empresa.
- Exibição do resultado da sincronização no dashboard.

## Pré-requisitos

Instale no computador:

- Windows 10 ou 11.
- Node.js 24, versão utilizada durante o desenvolvimento.
- PostgreSQL 18, incluindo as ferramentas de linha de comando.
- Git.
- Visual Studio Code.
- Arquivo JSON de uma conta de serviço do Google com acesso à planilha.

Confira as instalações no PowerShell:

```powershell
node --version
npm.cmd --version
git --version
& "C:\Program Files\PostgreSQL\18\bin\psql.exe" --version
```

## Estrutura obrigatória no computador

Utilize esta organização:

```text
C:\SIGA\
├── CredenciaisSIGA\
│   └── google-sheets-service-account.json
└── Projeto-S.I.G.A\
    ├── prisma\
    ├── src\
    ├── .env
    ├── .env.example
    ├── package.json
    └── README.md
```

A pasta `CredenciaisSIGA` fica fora do repositório `Projeto-S.I.G.A`. O arquivo JSON contém uma chave privada e nunca deve ser enviado ao GitHub.

## Pré-configuração da Google Sheets API

Para a sincronização funcionar:

1. Ative a **Google Sheets API** no projeto do Google Cloud.
2. Crie uma conta de serviço.
3. Gere e baixe uma chave no formato JSON.
4. Salve o arquivo como:

```text
C:\SIGA\CredenciaisSIGA\google-sheets-service-account.json
```

5. Abra o JSON e localize o campo `client_email`.
6. Compartilhe a planilha do Google Sheets com esse e-mail, no mínimo como leitor.
7. Confirme que a planilha possui a aba `Alunos` e as colunas esperadas entre `A` e `Q`.

Teste se o arquivo está no local correto:

```powershell
Test-Path "C:\SIGA\CredenciaisSIGA\google-sheets-service-account.json"
```

O resultado deve ser `True`.

## 1. Abrir o projeto

Clone o repositório ou copie a pasta para:

```text
C:\SIGA\Projeto-S.I.G.A
```

Entre na pasta:

```powershell
cd C:\SIGA\Projeto-S.I.G.A
```

Se estiver usando Git, selecione a branch definida pela equipe e atualize-a antes de continuar.

## 2. Configurar o `.env`

Crie o arquivo a partir do exemplo, caso ainda não exista:

```powershell
if (-not (Test-Path ".env")) { Copy-Item ".env.example" ".env" }
notepad .env
```

Use esta estrutura:

```env
DATABASE_URL="postgresql://postgres:SUA_SENHA_POSTGRES@localhost:5432/siga_local?schema=public"
DIRECT_URL="postgresql://postgres:SUA_SENHA_POSTGRES@localhost:5432/siga_local?schema=public"

NEXT_PUBLIC_API_URL="http://localhost:3000/api"

ADMIN_INITIAL_NAME="Nome do administrador"
ADMIN_INITIAL_EMAIL="administrador@exemplo.com"
ADMIN_INITIAL_PASSWORD="senha-com-8-ou-mais-caracteres"

EMPRESA_TEST_PASSWORD="senha-com-8-ou-mais-caracteres"

GOOGLE_APPLICATION_CREDENTIALS="C:/SIGA/CredenciaisSIGA/google-sheets-service-account.json"
GOOGLE_SHEETS_ID="ID_DA_PLANILHA"
GOOGLE_SHEETS_ALUNOS_RANGE="Alunos!A:Q"
```

Observações:

- Troque `SUA_SENHA_POSTGRES` pela senha definida durante a instalação do PostgreSQL.
- `DATABASE_URL` e `DIRECT_URL` devem apontar para o mesmo banco local.
- O ID da planilha é o texto localizado entre `/d/` e `/edit` na URL do Google Sheets.
- Senhas com caracteres especiais de URL precisam ser codificadas na string de conexão.
- Não faça commit do `.env`.

## 3. Preparar o PostgreSQL

Confirme que o serviço está em execução:

```powershell
Get-Service *postgres*
```

Se estiver parado, abra o PowerShell como administrador e execute:

```powershell
Start-Service postgresql-x64-18
```

Crie o banco local:

```powershell
& "C:\Program Files\PostgreSQL\18\bin\createdb.exe" -U postgres -h localhost -p 5432 siga_local
```

Digite a senha do PostgreSQL quando solicitado. Se o comando informar que o banco já existe, continue para a próxima etapa.

## 4. Instalar e preparar o Prisma

Na raiz do projeto, execute na ordem:

```powershell
npm.cmd install
npx.cmd prisma validate
npx.cmd prisma generate
npx.cmd prisma migrate deploy
npx.cmd prisma db seed
npx.cmd prisma migrate status
```

Esses comandos fazem o seguinte:

| Comando | Função |
| --- | --- |
| `npm.cmd install` | Instala as dependências do projeto. |
| `prisma validate` | Verifica o arquivo `schema.prisma`. |
| `prisma generate` | Gera o Prisma Client em `src/generated/prisma`. |
| `prisma migrate deploy` | Aplica no banco todas as migrations já versionadas. |
| `prisma db seed` | Cria ou atualiza o administrador e as empresas iniciais. |
| `prisma migrate status` | Confirma se o banco está atualizado. |

O resultado final esperado é:

```text
Database schema is up to date!
```

Em computadores novos, utilize `prisma migrate deploy`. O comando `prisma migrate dev` deve ser usado somente quando um desenvolvedor alterar o schema e precisar criar uma nova migration.

## 5. Validar e iniciar o sistema

Valide o projeto:

```powershell
npm.cmd run build
```

Depois inicie o ambiente de desenvolvimento:

```powershell
npm.cmd run dev
```

Acesse:

```text
http://localhost:3000/login
```

Use o e-mail e a senha configurados em `ADMIN_INITIAL_EMAIL` e `ADMIN_INITIAL_PASSWORD`.

## 6. Importar os alunos da planilha

As migrations criam a tabela `Aluno`, mas os registros dos alunos não ficam no Git e não são criados pelo seed.

Para importar os alunos:

1. Entre como administrador.
2. Acesse `http://localhost:3000/admin/dashboard`.
3. Clique em **Atualizar alunos**.
4. Confira as quantidades de recebidos, criados, atualizados, ignorados e erros.

Em um banco novo, todos os alunos existentes na planilha devem aparecer inicialmente como criados. Nas sincronizações seguintes, eles aparecem como atualizados.

## 7. Conferir o banco no Prisma Studio

Mantenha o Next.js aberto e use outro terminal:

```powershell
cd C:\SIGA\Projeto-S.I.G.A
npx.cmd prisma studio
```

O endereço padrão é:

```text
http://localhost:5555
```

Confira as tabelas:

- `Administrador`
- `Empresa`
- `Aluno`
- `Solicitacao`

O Prisma Studio é apenas uma ferramenta visual. O sistema funciona sem ele.

## Comandos usados no dia a dia

Depois da primeira configuração, normalmente basta:

```powershell
cd C:\SIGA\Projeto-S.I.G.A
Get-Service *postgres*
npm.cmd run dev
```

Não é necessário repetir `npm install`, migrations ou seed toda vez que abrir o projeto.

## De onde vêm os dados

| Recurso | Responsabilidade |
| --- | --- |
| Migrations | Criam e atualizam a estrutura das tabelas. |
| Seed | Prepara administrador e empresas iniciais. |
| Google Sheets | Fornece os alunos para sincronização. |
| PostgreSQL | Armazena os dados locais do sistema. |
| GitHub | Armazena o código, nunca os dados do banco ou credenciais. |

## Alterar senhas iniciais

1. Altere no `.env`:

```env
ADMIN_INITIAL_PASSWORD="nova-senha-administrativa"
EMPRESA_TEST_PASSWORD="nova-senha-da-empresa"
```

2. Execute novamente:

```powershell
npx.cmd prisma db seed
```

Alterar somente o `.env` não modifica os hashes que já estão no banco. O seed precisa ser executado novamente.

## Alterações futuras no banco

Quando um desenvolvedor alterar `prisma/schema.prisma`, deve criar uma nova migration:

```powershell
npx.cmd prisma migrate dev --name descricao_da_alteracao
```

Devem ser enviados ao Git:

- `prisma/schema.prisma`
- A nova pasta dentro de `prisma/migrations`

Nos outros computadores, aplique a migration com:

```powershell
npx.cmd prisma migrate deploy
npx.cmd prisma generate
```

Não apague migrations já compartilhadas.

## Solução de problemas

### PostgreSQL não encontrado

Use o caminho completo dos executáveis ou adicione temporariamente ao PowerShell:

```powershell
$env:Path += ";C:\Program Files\PostgreSQL\18\bin"
```

### Erro de conexão com o banco

Confira usuário, senha, porta e nome do banco em `DATABASE_URL` e `DIRECT_URL`:

```powershell
& "C:\Program Files\PostgreSQL\18\bin\psql.exe" -U postgres -h localhost -p 5432 -d siga_local
```

### Prisma Client ausente ou desatualizado

```powershell
npx.cmd prisma generate
```

### Existem migrations pendentes

```powershell
npx.cmd prisma migrate deploy
npx.cmd prisma migrate status
```

### A tabela `Aluno` está vazia

Isso é esperado em um banco novo. Inicie o sistema, entre como administrador e clique em **Atualizar alunos**.

### Erro ao acessar o Google Sheets

Confira:

- Se o JSON está no caminho configurado.
- Se `GOOGLE_SHEETS_ID` contém o ID correto.
- Se o intervalo é `Alunos!A:Q`.
- Se a planilha foi compartilhada com o `client_email` da conta de serviço.
- Se a Google Sheets API está habilitada no Google Cloud.

### Erro na pasta `.next`

Pare o servidor e remova somente o cache:

```powershell
Remove-Item -Recurse -Force ".\.next"
npm.cmd run dev
```

Evite manter o projeto dentro de uma pasta sincronizada pelo OneDrive.

## Segurança

Nunca envie ao GitHub:

```text
.env
google-sheets-service-account.json
CredenciaisSIGA/
node_modules/
.next/
backups/
src/generated/prisma/
```

Antes de um commit, confira:

```powershell
git status --short
git check-ignore -v .env
```

A pasta `CredenciaisSIGA` não aparece no status porque fica fora do repositório.

## Limitação atual

A sincronização de alunos está habilitada somente em desenvolvimento. Para utilizar o sistema com todas as funções atuais, execute:

```powershell
npm.cmd run dev
```

Antes de publicar o sistema, ainda será necessário implementar uma sessão segura no servidor, preferencialmente com cookie `httpOnly`, e proteger as rotas administrativas no backend.

## Resumo da instalação

```powershell
cd C:\SIGA\Projeto-S.I.G.A
npm.cmd install
npx.cmd prisma validate
npx.cmd prisma generate
npx.cmd prisma migrate deploy
npx.cmd prisma db seed
npx.cmd prisma migrate status
npm.cmd run build
npm.cmd run dev
```

Depois, acesse `http://localhost:3000/login` e clique em **Atualizar alunos** no dashboard administrativo.
