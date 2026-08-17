# SIGA — Sistema de Indicação e Gerenciamento do Aprendiz

O **SIGA** é um sistema desenvolvido para auxiliar o setor de coordenação de estágios do SENAI no gerenciamento de empresas, alunos e oportunidades de aprendizagem.

A proposta é substituir processos realizados separadamente por formulários, planilhas, relatórios e e-mails, reunindo as principais informações em uma única aplicação.

## Objetivo

O sistema tem como objetivo facilitar:

* autenticação de coordenadores e empresas;
* validação de empresas beneficiárias por CNPJ;
* controle das empresas autorizadas;
* encaminhamento de alunos para vagas de estágio e aprendizagem;
* organização das informações utilizadas pela coordenação;
* redução de dados duplicados e excesso de planilhas;
* consulta rápida de alunos, empresas e oportunidades.

## Tecnologias utilizadas

### Frontend e backend

* Next.js 14;
* React 18;
* JavaScript;
* Tailwind CSS;
* Axios;
* React Hook Form;
* Zod;
* Lucide React.

### Banco de dados

* PostgreSQL 18;
* Prisma ORM 7;
* Prisma Client;
* Prisma Adapter PG;
* bcryptjs;
* dotenv;
* pg.

## Funcionalidades implementadas

* tela de login responsiva;
* seleção entre acesso administrativo e acesso empresarial;
* autenticação do administrador por e-mail e senha;
* validação de empresa beneficiária por CNPJ;
* autenticação da empresa por CNPJ e senha;
* armazenamento seguro de senhas utilizando hash com bcrypt;
* bloqueio de empresas inativas ou não autorizadas;
* conexão do Next.js com PostgreSQL utilizando Prisma;
* migrations para criação e atualização das tabelas;
* seed para criação dos dados iniciais;
* backup local do PostgreSQL.

## Estrutura principal

```text
Projeto-S.I.G.A/
├── backups/
│   └── siga_local_backup.sql
├── prisma/
│   ├── migrations/
│   ├── schema.prisma
│   └── seed.js
├── public/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── auth/
│   │   │   │   ├── admin/login/
│   │   │   │   └── empresa/login/
│   │   │   └── empresas/cnpj/[cnpj]/validar/
│   │   └── (public)/login/
│   ├── components/
│   ├── context/
│   ├── hooks/
│   ├── lib/
│   └── generated/
├── .env
├── .env.example
├── .gitignore
├── package.json
├── package-lock.json
├── prisma.config.ts
└── README.md
```

## Modelos do banco

### Administrador

A tabela `administradores` armazena:

* identificador;
* nome;
* e-mail;
* hash da senha;
* situação ativa ou inativa;
* data de criação;
* data de atualização.

### Empresa

A tabela `empresas` armazena:

* identificador;
* CNPJ;
* razão social;
* nome fantasia;
* e-mail;
* telefone;
* hash da senha;
* situação autorizada ou não autorizada;
* situação ativa ou inativa;
* data de criação;
* data de atualização.

## Pré-requisitos

Antes de executar o projeto, instale:

* Node.js;
* npm;
* PostgreSQL 18;
* Git;
* Visual Studio Code.

Confira as instalações:

```powershell
node --version
npm --version
git --version
```

## Configuração do PostgreSQL

O projeto utiliza o banco local:

```text
Nome: siga_local
Porta: 5432
Schema: public
```

Confira se o PostgreSQL está funcionando:

```powershell
Get-Service *postgres*
```

Se o serviço estiver parado:

```powershell
Start-Service postgresql-x64-18
```

Esse comando pode exigir que o PowerShell seja aberto como administrador.

## Configuração do ambiente

O projeto utiliza um arquivo `.env` na raiz.

Exemplo:

```env
DATABASE_URL="postgresql://postgres:SENHA@localhost:5432/siga_local?schema=public"
DIRECT_URL="postgresql://postgres:SENHA@localhost:5432/siga_local?schema=public"

ADMIN_INITIAL_NAME="Nome do administrador"
ADMIN_INITIAL_EMAIL="email@exemplo.com"
ADMIN_INITIAL_PASSWORD="senha-administrativa"

EMPRESA_TEST_PASSWORD="senha-da-empresa"
```

Substitua `SENHA` pela senha configurada no PostgreSQL desse computador.

As senhas iniciais devem possuir pelo menos oito caracteres.

O arquivo `.env` contém informações privadas e não deve ser enviado para repositórios públicos.

## Instalação

Abra o PowerShell dentro da pasta do projeto.

Exemplo:

```powershell
cd "C:\caminho\Projeto-S.I.G.A"
```

Instale as dependências:

```powershell
npm.cmd install
```

Valide o schema:

```powershell
npx.cmd prisma validate
```

Gere o Prisma Client:

```powershell
npx.cmd prisma generate
```

## Opção 1 — Preparar um banco novo pelas migrations

Crie o banco:

```powershell
& "C:\Program Files\PostgreSQL\18\bin\createdb.exe" -U postgres -h localhost -p 5432 siga_local
```

Aplique as migrations existentes:

```powershell
npx.cmd prisma migrate deploy
```

Crie os dados iniciais:

```powershell
npx.cmd prisma db seed
```

Confira a situação:

```powershell
npx.cmd prisma migrate status
```

O resultado esperado é:

```text
Database schema is up to date!
```

## Opção 2 — Restaurar o backup

Utilize esta opção somente durante a preparação de um computador novo ou quando for necessário recuperar os dados do projeto.

Crie o banco:

```powershell
& "C:\Program Files\PostgreSQL\18\bin\createdb.exe" -U postgres -h localhost -p 5432 siga_local
```

Restaure o backup:

```powershell
& "C:\Program Files\PostgreSQL\18\bin\psql.exe" -U postgres -h localhost -p 5432 -d siga_local -f ".\backups\siga_local_backup.sql"
```

Depois da restauração, aplique qualquer migration criada após o backup:

```powershell
npx.cmd prisma migrate deploy
```

Gere o Prisma Client:

```powershell
npx.cmd prisma generate
```

Atualize os dados iniciais e os hashes das senhas:

```powershell
npx.cmd prisma db seed
```

Confira:

```powershell
npx.cmd prisma migrate status
```

Não restaure o backup diariamente. Depois que o banco estiver configurado, basta iniciar o projeto normalmente.

## Executando o sistema

Inicie o ambiente de desenvolvimento:

```powershell
npm.cmd run dev
```

Acesse:

```text
http://localhost:3000/login
```

Para encerrar:

```text
Ctrl + C
```

## Testando o build

Execute:

```powershell
npm.cmd run build
```

O build deve incluir as rotas:

```text
/api/auth/admin/login
/api/auth/empresa/login
/api/empresas/cnpj/[cnpj]/validar
/login
```

Depois do build, o projeto pode ser iniciado no modo de produção com:

```powershell
npm.cmd start
```

## Prisma Studio

Para visualizar os registros:

```powershell
npx.cmd prisma studio
```

O Prisma Studio será aberto em:

```text
http://localhost:5555
```

Para encerrar:

```text
Ctrl + C
```

## Dados de teste

### Administrador

Utilize:

```text
E-mail: valor de ADMIN_INITIAL_EMAIL
Senha: valor de ADMIN_INITIAL_PASSWORD
```

### Empresa

Utilize:

```text
CNPJ: 11222333000181
Senha: valor de EMPRESA_TEST_PASSWORD
```

Nunca utilize o valor de `senhaHash` como senha de login. O hash iniciado por `$2b$12$` é apenas a versão protegida da senha.

## Alteração das senhas

Para mudar as senhas iniciais, altere no `.env`:

```env
ADMIN_INITIAL_PASSWORD="nova-senha-administrativa"
EMPRESA_TEST_PASSWORD="nova-senha-da-empresa"
```

Depois execute:

```powershell
npx.cmd prisma db seed
```

O seed gera novos hashes e atualiza os registros no PostgreSQL.

Não altere manualmente os campos `senhaHash` pelo Prisma Studio ou pelo pgAdmin.

## Rotas da API

### Login administrativo

```http
POST /api/auth/admin/login
```

Corpo:

```json
{
  "email": "email@exemplo.com",
  "senha": "senha-do-administrador"
}
```

### Login da empresa

```http
POST /api/auth/empresa/login
```

Corpo:

```json
{
  "cnpj": "11222333000181",
  "senha": "senha-da-empresa"
}
```

### Validação de CNPJ

```http
GET /api/empresas/cnpj/11222333000181/validar
```

A empresa é considerada beneficiária somente quando:

* o CNPJ existe;
* a empresa está ativa;
* a empresa está autorizada.

## Migrations

A pasta `prisma/migrations` não deve ser apagada.

Ela contém o histórico de criação e atualização do banco, incluindo:

* criação das tabelas `administradores` e `empresas`;
* adição do campo `senha_hash` à tabela `empresas`.

O backup SQL e as migrations possuem funções diferentes:

* o backup guarda a estrutura e os dados atuais;
* as migrations registram como a estrutura evoluiu;
* a tabela `_prisma_migrations` registra quais alterações foram aplicadas.

Para criar uma migration durante o desenvolvimento:

```powershell
npx.cmd prisma migrate dev --name nome_da_alteracao
```

Para aplicar migrations já existentes em outro computador:

```powershell
npx.cmd prisma migrate deploy
```

## Criando um backup atualizado

Antes do backup, confira as migrations e execute o seed:

```powershell
npx.cmd prisma migrate status
npx.cmd prisma db seed
```

Crie o backup:

```powershell
& "C:\Program Files\PostgreSQL\18\bin\pg_dump.exe" -U postgres -h localhost -p 5432 -d siga_local --clean --if-exists --no-owner --no-privileges -f ".\backups\siga_local_backup.sql"
```

O backup pode conter dados privados e hashes de senha. Compartilhe-o somente com integrantes autorizados.

## Arquivos que não devem ser incluídos no ZIP

Para reduzir o tamanho, não inclua:

```text
node_modules
.next
out
src/generated/prisma
.git
.claude
.agents
.windsurf
```

Esses arquivos podem ser recriados com:

```powershell
npm.cmd install
npx.cmd prisma generate
```

## Arquivos privados

Os seguintes arquivos não devem ser publicados no GitHub:

```text
.env
backups/
```

Eles devem continuar no `.gitignore`.

## Erro da pasta `.next` no OneDrive

Se aparecer um erro semelhante a:

```text
EINVAL: invalid argument, readlink
```

apague somente o cache do Next.js:

```powershell
Remove-Item -LiteralPath ".\.next" -Recurse -Force
```

Depois:

```powershell
npm.cmd run dev
```

É recomendado manter o projeto fora de pastas sincronizadas pelo OneDrive.

Exemplo:

```text
C:\Projetos\Projeto-S.I.G.A
```

## Segurança

As senhas não são armazenadas em texto puro. O sistema utiliza bcrypt para gerar hashes com custo 12.

O projeto também:

* não devolve hashes nas respostas das APIs;
* recusa empresas inativas;
* recusa empresas não autorizadas;
* utiliza mensagens genéricas para credenciais inválidas;
* mantém credenciais privadas fora do Git.

## Estado atual

Atualmente estão implementados:

* conexão com PostgreSQL;
* modelos e migrations do Prisma;
* seed;
* login administrativo;
* validação de CNPJ;
* autenticação da empresa;
* hash de senhas;
* interface de login;
* integração entre frontend, APIs e banco.

Ainda podem ser desenvolvidos:

* sessão persistente no servidor;
* tokens ou cookies seguros;
* redirecionamento após o login;
* dashboard administrativo;
* dashboard empresarial;
* CRUD de empresas;
* gerenciamento de alunos;
* gerenciamento de vagas;
* recuperação e redefinição de senha;
* migração do PostgreSQL local para o Neon.

## Equipe

Projeto Integrador do curso Técnico em Desenvolvimento de Sistemas — SENAI Mariano Ferraz.

Adicione abaixo os integrantes do grupo:

```text
- Nome do integrante 1
- Nome do integrante 2
- Nome do integrante 3
- Nome do integrante 4
```

## Finalidade

Este projeto foi desenvolvido para fins acadêmicos e de aprendizagem, envolvendo desenvolvimento web, banco de dados, autenticação, validação de dados e integração entre frontend e backend.


