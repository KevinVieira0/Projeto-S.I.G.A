# SIGA — Sistema Integrado de Gestão e Acesso

Projeto web unificado do SIGA, com frontend em Next.js e integração com PostgreSQL por meio do Prisma ORM.

## Tecnologias

- Next.js 14 (App Router)
- React 18
- Tailwind CSS
- React Hook Form e Zod
- PostgreSQL 18
- Prisma ORM 7
- Axios
- bcryptjs

## Funcionalidades disponíveis

- Tela de acesso para administrador e empresa;
- Login administrativo consultando o PostgreSQL;
- Validação de CNPJ de empresa beneficiária;
- Máscara e validação estrutural de CNPJ;
- Banco com administradores, empresas e histórico de migrations;
- Seed para preparar um administrador inicial e uma empresa de teste;
- Prisma Studio para consultar e editar dados visualmente.

## Pré-requisitos

Instale antes de começar:

- Node.js 20.19 ou superior, 22.12 ou superior, ou 24+;
- npm;
- PostgreSQL 18, incluindo Command Line Tools;
- Opcional: pgAdmin 4;
- VS Code ou outro editor.

Confirme as instalações no PowerShell:

```powershell
node --version
npm --version
& "C:\Program Files\PostgreSQL\18\bin\psql.exe" --version
```

## Estrutura principal

```text
Projeto-SIGA-Unificado/
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
│   │   │   ├── auth/admin/login/route.js
│   │   │   └── empresas/cnpj/[cnpj]/validar/route.js
│   │   ├── login/
│   │   ├── globals.css
│   │   ├── layout.js
│   │   └── page.js
│   ├── components/
│   ├── context/
│   ├── hooks/
│   └── lib/
│       ├── api/
│       ├── validations/
│       └── prisma.js
├── .env
├── .env.example
├── package.json
├── package-lock.json
└── prisma.config.ts
```

## 1. Abrir o projeto

Extraia o ZIP e abra no VS Code a pasta que contém o `package.json`.

Exemplo:

```powershell
cd "D:\Projeto-S.I.G.A"
code .
```

Abra o terminal integrado do VS Code com o atalho `Ctrl` + acento grave.

## 2. Política de execução do PowerShell

Se o PowerShell bloquear `npm.ps1`, configure somente o usuário atual:

```powershell
Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned
```

Como alternativa, não altere a política e use `npm.cmd` e `npx.cmd` nos comandos.

## 3. Instalar as dependências

Na raiz do projeto:

```powershell
npm install
```

Ou:

```powershell
npm.cmd install
```

Avisos `deprecated` não significam que a instalação falhou. O processo foi concluído quando aparecer uma mensagem semelhante a `added ... packages` ou `up to date` sem `npm error`.

Não execute `npm audit fix --force` sem revisar as alterações, pois ele pode instalar versões incompatíveis.

## 4. Configurar o PostgreSQL

### Verificar o serviço

```powershell
Get-Service postgresql-x64-18
```

O status esperado é `Running`.

Confirme que o servidor aceita conexões:

```powershell
& "C:\Program Files\PostgreSQL\18\bin\pg_isready.exe" `
  -h localhost `
  -p 5432
```

Resultado esperado:

```text
localhost:5432 - accepting connections
```

Para iniciar ou reiniciar o serviço, abra o PowerShell como administrador:

```powershell
Start-Service postgresql-x64-18
Restart-Service postgresql-x64-18
```

Também é possível usar `Win + R`, executar `services.msc` e controlar o serviço `postgresql-x64-18`.

### Criar o banco

```powershell
& "C:\Program Files\PostgreSQL\18\bin\createdb.exe" `
  -U postgres `
  -h localhost `
  -p 5432 `
  -E UTF8 `
  siga_local
```

Digite a senha do usuário `postgres` quando solicitada. O terminal não mostra caracteres durante a digitação da senha; isso é normal.

Se o comando informar que o banco já existe, prossiga sem recriá-lo.

## 5. Configurar o `.env`

O projeto utiliza um arquivo `.env` privado na raiz. Nunca publique esse arquivo nem envie suas credenciais em mensagens.

Use este formato, substituindo apenas os valores locais:

```dotenv
DATABASE_URL="postgresql://USUARIO:SENHA@localhost:5432/siga_local?schema=public"
DIRECT_URL="postgresql://USUARIO:SENHA@localhost:5432/siga_local?schema=public"

ADMIN_INITIAL_NAME="Nome do administrador"
ADMIN_INITIAL_EMAIL="email@exemplo.com"
ADMIN_INITIAL_PASSWORD="senha-local-com-8-ou-mais-caracteres"

NEXT_PUBLIC_API_URL="http://localhost:3000/api"
NEXT_PUBLIC_USE_CNPJ_MOCK="false"
```

Observações:

- `DATABASE_URL` é usada pela aplicação e pelas APIs;
- `DIRECT_URL` é usada pelos comandos do Prisma;
- As duas URLs devem apontar para o banco `siga_local`;
- A senha deve ser a mesma usada ao conectar com `psql` ou pgAdmin;
- Senhas com `@`, `#`, `%`, `/` ou `:` precisam de codificação de URL;
- `NEXT_PUBLIC_API_URL` precisa terminar em `/api` porque as rotas estão no próprio Next.js;
- Reinicie `npm run dev` após alterar qualquer variável `NEXT_PUBLIC_*`.

O `.gitignore` protege `.env`, `.env.local`, backups e o Prisma Client gerado.

## 6. Restaurar o backup SQL

O método recomendado para este pacote é restaurar o backup incluído. O arquivo é um dump textual feito pelo PostgreSQL 18 e deve ser executado com `psql`.

Na raiz do projeto:

```powershell
& "C:\Program Files\PostgreSQL\18\bin\psql.exe" `
  -U postgres `
  -h localhost `
  -p 5432 `
  -d siga_local `
  -v ON_ERROR_STOP=1 `
  -f ".\backups\siga_local_backup.sql"
```

Não use a opção **Restore** do pgAdmin para esse arquivo `.sql`. Pelo pgAdmin, use o **PSQL Tool** e execute:

```sql
\i 'D:/Projeto-SIGA-Unificado/backups/siga_local_backup.sql'
```

Se aparecer `relation already exists`, as tabelas já existem. Não restaure repetidamente. Confira o conteúdo antes de qualquer operação destrutiva.

### Conferir as tabelas

```powershell
& "C:\Program Files\PostgreSQL\18\bin\psql.exe" `
  -U postgres `
  -h localhost `
  -p 5432 `
  -d siga_local `
  -c "\dt"
```

Tabelas esperadas:

```text
_prisma_migrations
administradores
empresas
```

No pgAdmin, abra:

```text
Servers
└── PostgreSQL 18
    └── Databases
        └── siga_local
            └── Schemas
                └── public
                    └── Tables
```

Se as tabelas não aparecerem, clique com o botão direito em `Tables` e selecione **Refresh**. Não confunda o banco `siga_local` com o banco administrativo padrão chamado `postgres`.

### Conferir os registros

```powershell
& "C:\Program Files\PostgreSQL\18\bin\psql.exe" `
  -U postgres `
  -h localhost `
  -p 5432 `
  -d siga_local `
  -c 'SELECT
        (SELECT COUNT(*) FROM public._prisma_migrations) AS migrations,
        (SELECT COUNT(*) FROM public.administradores) AS administradores,
        (SELECT COUNT(*) FROM public.empresas) AS empresas;'
```

Se as tabelas estiverem vazias, execute o seed:

```powershell
npx prisma db seed
```

O seed utiliza `ADMIN_INITIAL_NAME`, `ADMIN_INITIAL_EMAIL` e `ADMIN_INITIAL_PASSWORD` do `.env`. Ele também prepara a empresa de teste com CNPJ `11.222.333/0001-81`.

> Depois de restaurar o backup, não execute `prisma migrate deploy`: o dump já contém as tabelas e o histórico em `_prisma_migrations`.

## 7. Validar e gerar o Prisma Client

```powershell
npx prisma validate
npx prisma generate
```

Resultados esperados:

```text
The schema at prisma\schema.prisma is valid
Generated Prisma Client
```

Teste a conexão real:

```powershell
"SELECT 1;" | npx prisma db execute --stdin
```

## 8. Executar em desenvolvimento

```powershell
npm run dev
```

Acesse:

- Aplicação: http://localhost:3000
- Login: http://localhost:3000/login

Interrompa o servidor com `Ctrl + C`.

Se a porta 3000 estiver ocupada, o Next.js poderá iniciar em outra porta. Nesse caso, atualize `NEXT_PUBLIC_API_URL` para a porta exibida e reinicie o servidor.

## 9. Testar as APIs

Com `npm run dev` ativo, abra outro terminal.

### Validação de CNPJ

```powershell
Invoke-RestMethod `
  -Method Get `
  -Uri "http://localhost:3000/api/empresas/cnpj/11222333000181/validar"
```

Resposta esperada quando a empresa está autorizada e ativa:

```json
{
  "beneficiaria": true,
  "razaoSocial": "Empresa Teste SIGA LTDA",
  "message": "Empresa autorizada."
}
```

### Login administrativo

Não coloque a senha diretamente no histórico do terminal. Uma forma interativa é:

```powershell
$email = Read-Host "E-mail do administrador"
$senhaSegura = Read-Host "Senha" -AsSecureString
$senha = [System.Net.NetworkCredential]::new("", $senhaSegura).Password
$body = @{ email = $email; senha = $senha } | ConvertTo-Json
Invoke-RestMethod `
  -Method Post `
  -Uri "http://localhost:3000/api/auth/admin/login" `
  -ContentType "application/json" `
  -Body $body
Remove-Variable senha, body
```

## 10. Abrir o Prisma Studio

```powershell
npx prisma studio
```

Acesse http://localhost:5555 para visualizar e editar `Administrador` e `Empresa`. Encerre com `Ctrl + C`.

## 11. Build de produção

```powershell
npm run build
npm start
```

O build gera `.next`, que não deve ser enviado ao Git. Para uma nova máquina, use sempre `npm install` e gere novamente os artefatos.

## Scripts npm

| Comando | Finalidade |
|---|---|
| `npm run dev` | Inicia o Next.js em desenvolvimento |
| `npm run build` | Gera o build otimizado |
| `npm start` | Executa o build de produção |
| `npm run lint` | Executa a verificação configurada no projeto |

## Rotas disponíveis

| Método | Rota | Finalidade |
|---|---|---|
| `POST` | `/api/auth/admin/login` | Autentica administrador por e-mail e senha |
| `GET` | `/api/empresas/cnpj/[cnpj]/validar` | Verifica se a empresa está ativa e autorizada |

## Solução de problemas

### `psql: command not found`

O executável não está no `PATH`. Use o caminho completo:

```powershell
& "C:\Program Files\PostgreSQL\18\bin\psql.exe" --version
```

### Prisma `P1000`

Usuário ou senha incorretos. Corrija `DATABASE_URL` e `DIRECT_URL` no `.env`.

### Prisma `P1001`

O PostgreSQL não está acessível. Confira serviço, host e porta com `pg_isready`.

### Prisma `P1003`

O banco configurado não existe. Crie `siga_local` ou corrija o nome nas URLs.

### Prisma `P2021`

A conexão funciona, mas a tabela não existe. Restaure o backup no banco correto.

### Tabelas não aparecem no pgAdmin

Expanda o banco `siga_local`, não o banco `postgres`, e atualize `Schemas → public → Tables`.

### Tela informa “Não foi possível validar agora”

Confirme no `.env`:

```dotenv
NEXT_PUBLIC_API_URL="http://localhost:3000/api"
```

Depois reinicie o Next.js. Teste também a rota de CNPJ diretamente para diferenciar erro de frontend de erro no banco.

### `npm.ps1 não pode ser carregado`

Use `npm.cmd`/`npx.cmd` ou configure `RemoteSigned` para o usuário atual.

### `relation already exists` ao importar o backup

O banco já contém tabelas. Não continue importando repetidamente. Use `\dt` e a consulta de contagem para verificar se os dados já existem.

## Segurança

- O `.env` contém credenciais privadas;
- O backup SQL pode conter dados privados e hashes de senha;
- Compartilhe o pacote somente com integrantes autorizados;
- Nunca envie `.env` ou `backups/` ao GitHub;
- Cada integrante pode precisar alterar a senha em `DATABASE_URL` e `DIRECT_URL`;
- Use senhas fortes fora do ambiente local;
- Não publique capturas de tela que mostrem URLs de conexão ou credenciais.

## Estado atual e limitações

- Login administrativo e validação de CNPJ possuem APIs integradas;
- A interface de empresa valida o CNPJ no banco;
- A criação de sessão/token e o endpoint separado de login da empresa ainda constam como evolução futura no frontend;
- O `AuthContext` ainda é uma base para a futura persistência de sessão e proteção de rotas;
- A rota de desenvolvimento `api/teste-banco` não faz parte do projeto.