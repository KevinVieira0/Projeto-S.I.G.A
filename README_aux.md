# SIGA no Windows

O [README principal](README.md) descreve o fluxo atual, as variáveis de ambiente e os testes. Este guia reúne os comandos para preparar outra instalação local.

## Preparação

Instale Node.js, PostgreSQL e Git. Mantenha o JSON da conta de serviço fora do repositório e compartilhe **somente a nova planilha** com essa conta como Editor para habilitar o espelho.

Abra o PowerShell na pasta do projeto e crie o `.env` a partir de `.env.example`, se ele ainda não existir:

```powershell
if (-not (Test-Path '.env')) { Copy-Item '.env.example' '.env' }
Get-Service *postgres*
npm.cmd install
```

Configure `DATABASE_URL` e `DIRECT_URL` para o mesmo banco local. Configure também `AUTH_SECRET`, `GOOGLE_APPLICATION_CREDENTIALS`, `GOOGLE_SHEETS_ACADEMICO_ID`, `GOOGLE_SHEETS_RECEBIMENTOS_AUTO` e `GOOGLE_SHEETS_ESPELHO_AUTO`. Não copie as credenciais de outro desenvolvedor nem versione esses arquivos.

## Banco e aplicação

Em uma instalação existente, faça uma cópia de segurança antes de aplicar migrations:

```powershell
npx.cmd prisma validate
npx.cmd prisma migrate status
npx.cmd prisma migrate deploy
npx.cmd prisma generate
npm.cmd run build
npm.cmd run dev
```

Em um banco novo, execute `npx.cmd prisma db seed` somente após configurar os usuários iniciais. Repetir o seed pode alterar senhas existentes. Não é necessário executar seed, migrations ou instalar dependências toda vez que iniciar o sistema.

Acesse `http://localhost:3000/login`. Com o portal administrativo aberto e visível, a integração processa os formulários a cada cinco minutos. Também é possível usar **Sincronizar cadastros** ou `npm.cmd run db:recebimentos`. As abas Alunos, Empresas, Matriculas e Historico são espelhos do PostgreSQL; os cadastros devem ser editados pelo sistema.

Para inspecionar o banco:

```powershell
npx.cmd prisma studio
```

## Problemas frequentes

- **Conexão PostgreSQL:** confira o serviço, usuário, senha, porta e nome do banco no `.env`. Caracteres especiais da senha devem ser codificados na URL.
- **Prisma Client desatualizado:** execute `npx.cmd prisma generate` e reinicie `npm.cmd run dev`.
- **Google Sheets:** confira o caminho do JSON, o ID da nova planilha, os cabeçalhos na linha 4, a API habilitada e o acesso de Editor da conta de serviço.
- **Dados não aparecem imediatamente:** confira a notificação de sincronização. O processamento não é um serviço de fundo quando o portal está fechado. Dados inválidos exigem correção e um novo envio do formulário.

Antes do commit, confira `git status --short` e `git check-ignore -v .env`. Não envie credenciais, backups locais, `node_modules`, `.next` ou `src/generated/prisma` ao Git.
