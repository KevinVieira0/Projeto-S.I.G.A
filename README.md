# S.I.G.A. — Sistema de Indicação e Gerenciamento do Aprendiz

O S.I.G.A. apoia a coordenação do SENAI e as empresas que oferecem vagas de aprendizagem. A coordenação administra alunos, empresas, matrículas, indicadores e indicações. A empresa acessa o portal por CNPJ para abrir solicitações, acompanhar aprendizes e enviar comprovantes de contratação.

O PostgreSQL é a fonte oficial do sistema. O Google Forms pode receber cadastros, e a integração com Google Sheets processa recebimentos por CPF ou CNPJ e mantém o espelho acadêmico.

[Arquitetura do projeto e relatório da reorganização (PDF)](docs/arquitetura-do-projeto.pdf)

## Preparação local

Use Git, npm, Node.js 22 a partir de 22.12 ou Node.js 24, e um PostgreSQL local com um banco vazio para desenvolvimento. O projeto usa Next.js com App Router, React 18, JavaScript com JSX, Tailwind CSS, Prisma 7 e Zod. O alias `@/` resolve caminhos sob `src/`.

Os comandos abaixo usam PowerShell. Em outros terminais, use `npm` e `npx` no lugar de `npm.cmd` e `npx.cmd`.

### Dependências

Na raiz do checkout indicado pela equipe, confira o ambiente e tente a instalação pelo lockfile.

```powershell
git status --short --branch
node --version
npm.cmd --version
npm.cmd ci
```

A instalação limpa tem uma incompatibilidade já presente no lockfile. Ele fixa Next.js 16.4.6 e `eslint-config-next` 16.4.6, que pede ESLint 9 ou posterior, enquanto o projeto fixa ESLint 8.57.1. O ambiente disponível para validar esta revisão usa Next.js 14.2.35. Se `npm ci` falhar por resolução de dependências, a preparação de um checkout limpo depende de alinhar a configuração de dependências com a equipe.

### Banco e variáveis de ambiente

Crie o banco `siga_local` no PostgreSQL. Copie o modelo apenas se ainda não houver um `.env`.

```powershell
if (-not (Test-Path .env)) { Copy-Item .env.example .env }
node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"
```

Preencha o `.env` local com os valores do banco e com o segredo gerado. Os valores abaixo servem como exemplo e precisam ser substituídos.

```dotenv
DATABASE_URL="postgresql://siga_dev:SENHA_LOCAL@localhost:5432/siga_local?schema=public"
DIRECT_URL="postgresql://siga_dev:SENHA_LOCAL@localhost:5432/siga_local?schema=public"
AUTH_SECRET="SUBSTITUA_PELO_SEGREDO_GERADO"
ADMIN_INITIAL_NAME="Coordenação de teste"
ADMIN_INITIAL_EMAIL="coordenacao@example.test"
ADMIN_INITIAL_PASSWORD="SUBSTITUA_POR_UMA_SENHA"
EMPRESA_TEST_PASSWORD="SUBSTITUA_POR_OUTRA_SENHA"
GOOGLE_SHEETS_RECEBIMENTOS_AUTO="false"
GOOGLE_SHEETS_ESPELHO_AUTO="false"
NEXT_PUBLIC_MODO_TESTE="false"
VALIDAR_CPF="true"
```

| Variável | Uso |
| --- | --- |
| `DATABASE_URL` | Conexão da aplicação e do seed. |
| `DIRECT_URL` | Conexão do Prisma CLI para migrations. Aponte para o mesmo banco da aplicação. |
| `AUTH_SECRET` | Segredo com pelo menos 32 caracteres para assinar as sessões. |
| `ADMIN_INITIAL_NAME`, `ADMIN_INITIAL_EMAIL`, `ADMIN_INITIAL_PASSWORD` | Credenciais e nome do administrador inicial criado pelo seed. |
| `EMPRESA_TEST_PASSWORD` | Senha atribuída pelo seed às empresas que ele prepara. |
| `NEXT_PUBLIC_API_URL` | Base do cliente HTTP. O padrão é `/api` na mesma origem. |
| `APP_ORIGIN` | Origem pública exata para a verificação de origem, como `https://siga.example.test`. Configure quando uma origem explícita for necessária. |
| `GOOGLE_APPLICATION_CREDENTIALS`, `GOOGLE_SHEETS_ACADEMICO_ID` | Caminho do JSON da conta de serviço e ID da planilha acadêmica. Opcionais para trabalhar sem a integração. |
| `GOOGLE_SHEETS_RECEBIMENTOS_AUTO`, `GOOGLE_SHEETS_ESPELHO_AUTO` | Ativam o processamento automático no painel e o espelhamento da base na planilha. |
| `NEXT_PUBLIC_MODO_TESTE`, `VALIDAR_CPF` | Opções de desenvolvimento para preencher dados fictícios no cadastro administrativo de alunos e controlar a validação do dígito verificador do CPF. |
| `SIGA_HOMOLOGACAO` | Com `true`, usa `.next-homologacao` como diretório de build do Next. |

Codifique caracteres especiais das senhas nas URLs do PostgreSQL. Se usar Neon em um ambiente autorizado pela equipe, use a URL da aplicação com pooler quando apropriado e a URL direta para as migrations, com SSL conforme a configuração do banco. Guarde `.env` e a chave da conta Google fora do Git.

### Preparar e iniciar

Com as dependências disponíveis e um banco local vazio, execute os comandos a seguir.

```powershell
npx.cmd prisma validate
npx.cmd prisma generate
npx.cmd prisma migrate deploy
npx.cmd prisma db seed
npm.cmd run dev
```

O cliente gerado fica em `src/generated/prisma`. Use `npx.cmd prisma migrate status` para consultar o estado de um banco existente e `npx.cmd prisma studio` para inspeção local. O seed exige senhas de pelo menos oito caracteres e atualiza as credenciais dos registros que prepara. Execute-o em um banco de desenvolvimento destinado a esse fim.

Abra `http://localhost:3000/login`. O administrador entra com `ADMIN_INITIAL_EMAIL` e `ADMIN_INITIAL_PASSWORD` e segue para `/admin/dashboard`. A empresa de teste usa o CNPJ `11222333000181` e `EMPRESA_TEST_PASSWORD` e segue para `/empresa/homepage`. Para testar uma nova solicitação, tenha pelo menos um curso no catálogo do PostgreSQL do ambiente de teste. O seed de acesso prepara contas, e o seletor de cursos lê a tabela `Curso`.

## Comandos de trabalho

| Comando | Para que usar |
| --- | --- |
| `npm.cmd run dev` | Desenvolver com recarregamento local. Há também `npm.cmd run dev:turbo`. |
| `npm.cmd run lint` | Executar `next lint` com o Next instalado. |
| `npm.cmd run format:check` | Conferir formatação. `npm.cmd run format` reescreve os arquivos cobertos pelos globs. Os dois comandos incluem caminhos de `tests/`. |
| `npm.cmd test` | Executar a suíte geral quando os arquivos de teste estiverem disponíveis. `test:detalhes`, `test:empresa` e `test:sessoes` selecionam arquivos específicos. Nesta revisão, `npm test` terminou com código 0 e registrou zero testes e zero suítes porque o checkout está sem `tests/`. |
| `npm.cmd run build` e `npm.cmd start` | Gerar e servir o build de produção localmente. |
| `npm.cmd run db:previa-academica` | Analisar catálogo e cadastros. Lê a planilha configurada ou aceita `-- --arquivo caminho.json`. |
| `npm.cmd run db:recebimentos` | Processar recebimentos da planilha. Escreve na base configurada. |
| `npm.cmd run db:encerrar-solicitacoes` | Processar vencimentos de indicações sem retorno ou contratação. Escreve na base configurada. |
| `npm.cmd run db:demonstracao:previa` | Conferir contagens e catálogo para demonstração. A rotina exige o banco local `siga_local` e as duas URLs de banco iguais. |

Use um banco fictício para verificar fluxos que gravam dados. Para conferir uma solicitação, entre como empresa, abra **Nova solicitação**, escolha um curso existente, preencha as datas e envie. Verifique a entrada em **Minhas solicitações**, depois abra o pedido em `/admin/solicitacoes` como administrador. Para conferir o login, valide o CNPJ de teste e confirme o redirecionamento de cada perfil.

## Integração opcional com Google

1. Use uma planilha acadêmica de desenvolvimento com as abas `Cursos`, `Turmas`, `Alunos`, `Empresas`, `Matriculas` e `Historico`, com cabeçalhos na linha 4. Os scripts dos formulários preparam `Recebimentos Alunos` e `Recebimentos Empresas`.
2. Habilite a Google Sheets API. Guarde o JSON da conta de serviço fora do repositório, por exemplo em `C:/SIGA/credenciais/conta-de-servico.json`. Configure o caminho em `GOOGLE_APPLICATION_CREDENTIALS` e o ID da planilha em `GOOGLE_SHEETS_ACADEMICO_ID`. Compartilhe a planilha de desenvolvimento com o `client_email` da conta. Use permissão de leitura para a prévia e de edição para rotinas que gravam na planilha.
3. No Google Apps Script, use [FormularioAlunosV2.gs](scripts/google-apps-script/FormularioAlunosV2.gs) e [FormularioEmpresasV2.gs](scripts/google-apps-script/FormularioEmpresasV2.gs) no mesmo projeto. Configure `SIGA_V2.PLANILHA` para a planilha atual e execute `instalarFormularioAlunosV2` e `instalarFormularioEmpresasV2` uma vez nesse projeto. Quando o catálogo mudar, use `atualizarCatalogoFormularioAlunosV2`.
4. Rode a prévia acadêmica antes de habilitar a automação. No painel administrativo aberto e visível, a sincronização automática de recebimentos é verificada a cada cinco minutos quando ativada. O comando `db:recebimentos` permite executar esse processamento pelo terminal.

Para conferir a integração em homologação, envie um cadastro fictício pelo Forms, verifique a aba de recebimento, processe o registro e confira o resultado no PostgreSQL. Reenvie o mesmo CPF ou CNPJ com uma alteração para verificar a atualização do registro.

## Estrutura do repositório

```text
.
├── docs/                        PDF técnico de arquitetura
├── prisma/                      schema, migrations e seed
├── public/                      recursos estáticos servidos pela aplicação
├── scripts/                     rotinas de terminal e Google Apps Script
└── src/
    ├── app/                     páginas, layouts e handlers de API
    │   ├── (public)/            rota de entrada
    │   ├── (private)/           telas administrativas e da empresa
    │   └── api/                 contratos HTTP
    ├── components/              interfaces agrupadas por funcionalidade
    │   ├── login/               formulário, estilos e hooks do login
    │   ├── empresa/
    │   │   ├── acompanhamento/  consulta de pedidos e aprendizes
    │   │   └── solicitacao/      formulário, campos e hooks do pedido
    │   ├── alunos/              cadastro, tabela e detalhes de alunos
    │   ├── dashboard/           indicadores e gestão de solicitações
    │   └── ui/                  controles de interface compartilhados
    ├── context/                 estado compartilhado por contexto React
    ├── constants/               constantes de rotas e tema
    ├── hooks/                   atualização e sincronização do painel
    └── lib/                     domínio, validações e integrações
```

Os grupos `(public)` e `(private)` organizam o App Router e ficam fora da URL. Use `app/` para localizar entradas HTTP e páginas. As validações compartilhadas entre telas e servidor ficam em `lib/validations/`. A lógica de banco e integração fica em `lib/`, e as migrations versionadas ficam em `prisma/migrations/`.

## Onde mexer quando...

| Tarefa | Ponto de partida | Como conferir |
| --- | --- | --- |
| Ajustar a tela de login | `src/app/(public)/login/page.js` e `src/components/login/LoginCard.jsx`. Para visual, `Login.module.css` está na mesma pasta. | Troque os perfis e confirme login e redirecionamento com contas fictícias. |
| Alterar campos da solicitação | `src/components/empresa/solicitacao/FormularioSolicitacao.js` para o portal. A página em `src/app/(private)/empresa/solicitacao/page.js` usa os mesmos controles de campo. | Teste novo pedido na aba **Nova solicitação** e na rota `/empresa/solicitacao`. |
| Ajustar a validação do pedido | `src/lib/validations/solicitacaoSchema.js`. Confira seu consumo em `src/app/api/empresas/solicitacao/route.js`. | Envie um pedido válido e confira a rejeição de datas invertidas ou período de prática obrigatório ausente. |
| Investigar aluno recebido pela planilha | `src/lib/importacao/sincronizarRecebimentos.js`. O comando de terminal parte de `scripts/buscar-recebimentos.js`. | Processe um registro fictício e confira a atualização pelo mesmo CPF. |
| Entender o fechamento de pedidos | `src/lib/solicitacoes/encerramento.js` e `scripts/encerrar-solicitacoes.js`. | Em um banco de teste, confira a regra de cinco dias contados da primeira indicação e o histórico do pedido encerrado. |
