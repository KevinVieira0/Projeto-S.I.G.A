# S.I.G.A. — Sistema de Indicação e Gerenciamento do Aprendiz

Aplicação web para gerenciar alunos, empresas, matrículas, solicitações e o acompanhamento profissional dos aprendizes.

O sistema possui dois perfis:

- **Administrador/coordenador:** consulta e atualiza alunos e empresas, acompanha indicadores e processa os cadastros recebidos pelos formulários.
- **Empresa:** entra com CNPJ e senha para enviar solicitações.

O PostgreSQL é a fonte oficial dos dados. O Google Forms recebe os cadastros e o Google Sheets funciona como catálogo, fila de recebimentos e espelho do banco.

## Tecnologias

- Next.js 14 e React 18
- Tailwind CSS
- Prisma ORM 7
- PostgreSQL local ou Neon
- Google Sheets API e Google Apps Script
- React Hook Form, Zod e Axios
- Sessão assinada em cookie HttpOnly

## Funcionalidades atuais

- Login protegido de administrador e empresa.
- Dashboard administrativo com visão de alunos e empresas.
- Cadastro e atualização automática de alunos pelo CPF.
- Cadastro e atualização automática de empresas pelo CNPJ.
- Cursos, turmas, matrículas e histórico de acompanhamento.
- Busca, filtros, ordenação e exportação dos alunos.
- Card de detalhes do aluno com matrículas, empresa, solicitações vinculadas e histórico.
- Confirmação de contrato enviado e assinado (Sim/Não) para alunos empregados.
- Solicitações enviadas por empresas autenticadas.
- Sincronização automática a cada cinco minutos enquanto o painel administrativo estiver aberto e visível.
- Sincronização manual pelo sistema ou pelo terminal.
- Espelhamento do PostgreSQL para as abas da planilha.

## Fluxo dos dados

```text
Google Forms
    ↓
Abas Recebimentos Alunos/Empresas
    ↓
API do S.I.G.A. valida e processa
    ↓
PostgreSQL (fonte oficial)
    ↓
Abas Alunos, Empresas, Matriculas e Historico
```

CPF novo cria um aluno e CPF já existente atualiza seus dados. Para empresas, a mesma regra utiliza o CNPJ. Status profissionais e vínculos administrativos existentes são preservados durante a atualização.

---

## 1. Pré-requisitos

Instale antes de começar:

- [Git](https://git-scm.com/)
- Node.js compatível com o Prisma atual: `20.19+`, `22.12+` ou `24+`. Recomenda-se Node.js 22 LTS.
- PostgreSQL para o ambiente local, ou uma conta e um banco no Neon.
- Uma conta Google, caso a integração com Forms e Sheets seja utilizada.

Confira as instalações:

```powershell
git --version
node --version
npm --version
```

## 2. Baixar o projeto

No PowerShell:

```powershell
cd C:\SIGA
git clone https://github.com/KevinVieira0/Projeto-S.I.G.A.git
cd Projeto-S.I.G.A
git switch dev
git pull origin dev
```

Se o projeto já estiver no computador, não faça outro clone. Abra a pasta existente e execute:

```powershell
git switch dev
git pull origin dev
```

No GitHub Desktop, a alternativa é usar **File > Clone repository**, selecionar o repositório, escolher a pasta local e depois mudar a branch atual para `dev`.

## 3. Instalar as dependências

Na raiz do projeto, onde está o `package.json`:

```powershell
npm.cmd ci
```

Use `npm.cmd install` apenas quando precisar adicionar ou atualizar dependências. Para uma instalação limpa baseada no `package-lock.json`, prefira `npm.cmd ci`.

## 4. Criar o banco local

Crie no PostgreSQL um banco vazio chamado `siga_local`.

Pelo pgAdmin:

1. Conecte-se ao servidor PostgreSQL.
2. Clique com o botão direito em **Databases**.
3. Selecione **Create > Database**.
4. Informe `siga_local` e salve.

Ou pelo terminal, caso `psql` esteja configurado:

```powershell
psql -U postgres -c "CREATE DATABASE siga_local;"
```

Se o banco já existir, não execute o comando novamente.

### Usando Neon

O sistema também aceita PostgreSQL no Neon:

- `DATABASE_URL`: conexão usada pela aplicação; pode ser a URL com pooler.
- `DIRECT_URL`: conexão direta, sem pooler, usada pelo Prisma para migrations.
- As duas URLs devem apontar para o mesmo banco e usar SSL conforme informado pelo Neon.

Não execute migrations em um banco compartilhado ou de produção sem backup e autorização da equipe.

## 5. Configurar o arquivo `.env`

Crie o `.env` a partir do modelo:

```powershell
Copy-Item .env.example .env
```

Gere um segredo para as sessões:

```powershell
node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"
```

Copie o resultado para `AUTH_SECRET` e complete o arquivo:

```env
# PostgreSQL local
DATABASE_URL="postgresql://postgres:SUA_SENHA@localhost:5432/siga_local?schema=public"
DIRECT_URL="postgresql://postgres:SUA_SENHA@localhost:5432/siga_local?schema=public"

# A aplicação e a API usam a mesma origem
NEXT_PUBLIC_API_URL="/api"

# Use o valor aleatório gerado pelo comando anterior
AUTH_SECRET="COLE_AQUI_UM_SEGREDO_COM_PELO_MENOS_32_CARACTERES"

# Opcional no ambiente local. Em produção, use a URL pública exata, sem barra final.
# APP_ORIGIN="https://siga.exemplo.com"

# Usuário administrador criado pelo seed
ADMIN_INITIAL_NAME="Nome do coordenador"
ADMIN_INITIAL_EMAIL="coordenador@exemplo.com"
ADMIN_INITIAL_PASSWORD="UMA_SENHA_SEGURA"

# Senha das empresas locais criadas pelo seed
EMPRESA_TEST_PASSWORD="OUTRA_SENHA_SEGURA"

# Integração Google — pode permanecer vazia/desativada na instalação mínima
GOOGLE_APPLICATION_CREDENTIALS="C:/SIGA/CredenciaisSIGA/google-sheets-service-account.json"
GOOGLE_SHEETS_ACADEMICO_ID="ID_DA_PLANILHA"
GOOGLE_SHEETS_RECEBIMENTOS_AUTO="false"
GOOGLE_SHEETS_ESPELHO_AUTO="false"
```

Observações importantes:

- Troque todos os valores de exemplo.
- Senhas do seed devem possuir pelo menos oito caracteres.
- Se a senha do PostgreSQL tiver `@`, `:`, `/`, `#` ou outro caractere especial, codifique-a para uso em URL.
- No Windows, use `/` no caminho da credencial para evitar erros de barras invertidas.
- Não deixe espaço depois de `C:` e não coloque aspas duplicadas no final do caminho.
- As variáveis antigas `GOOGLE_SHEETS_ID`, `GOOGLE_SHEETS_ALUNOS_RANGE` e `GOOGLE_SHEETS_LISTAS_RANGE` não pertencem mais à integração atual.
- Nunca envie `.env` ou o JSON da conta de serviço ao GitHub.

## 6. Preparar o Prisma e o banco

Execute na seguinte ordem:

```powershell
npx.cmd prisma validate
npx.cmd prisma generate
npx.cmd prisma migrate status
npx.cmd prisma migrate deploy
npx.cmd prisma db seed
```

O que cada comando faz:

- `prisma validate`: verifica a estrutura do schema.
- `prisma generate`: gera o Prisma Client usado pelo projeto.
- `prisma migrate status`: mostra as migrations pendentes.
- `prisma migrate deploy`: aplica as migrations existentes sem apagar os dados.
- `prisma db seed`: cria ou atualiza o administrador inicial e as empresas de teste.

O seed cria uma empresa de acesso local com o CNPJ `11222333000181`. A senha será o valor de `EMPRESA_TEST_PASSWORD`.

> Execute o seed apenas quando precisar preparar ou atualizar os usuários iniciais. Repeti-lo redefine as senhas desses registros com os valores atuais do `.env`.

Nunca use `prisma migrate reset` em um banco com dados importantes.

## 7. Iniciar e entrar no sistema

Inicie o servidor:

```powershell
npm.cmd run dev
```

Acesse:

```text
http://localhost:3000/login
```

### Login do administrador

- Selecione a opção de administrador.
- E-mail: valor de `ADMIN_INITIAL_EMAIL`.
- Senha: valor de `ADMIN_INITIAL_PASSWORD`.
- Após o login, o sistema abre `/admin/dashboard`.

### Login da empresa de teste

- Selecione a opção de empresa.
- CNPJ: `11222333000181`.
- Senha: valor de `EMPRESA_TEST_PASSWORD`.
- Após o login, o sistema abre `/empresa/solicitacao`.

O Prisma Studio é opcional. Para inspecionar o banco visualmente, abra outro terminal e execute:

```powershell
npx.cmd prisma studio
```

---

## 8. Integrar Google Sheets e Google Forms

Pule esta seção se desejar apenas abrir o sistema com o banco local. Nesse caso, mantenha as duas variáveis `GOOGLE_SHEETS_*_AUTO` como `false`.

### 8.1 Preparar a planilha acadêmica

Use a planilha-modelo oficial do projeto. Ela precisa conter, no mínimo, as abas abaixo, com os cabeçalhos na linha 4:

- `Cursos`
- `Turmas`
- `Alunos`
- `Empresas`
- `Matriculas`
- `Historico`

As abas `Recebimentos Alunos` e `Recebimentos Empresas` são preparadas pelos scripts dos formulários.

Não altere os nomes das abas nem dos cabeçalhos. O sistema preserva os IDs de cursos e turmas para relacionar as respostas dos formulários ao banco.

Copie o ID da planilha, localizado entre `/d/` e `/edit` na URL:

```text
https://docs.google.com/spreadsheets/d/ID_DA_PLANILHA/edit
```

Coloque o valor em `GOOGLE_SHEETS_ACADEMICO_ID`.

### 8.2 Criar a credencial do Google

No Google Cloud:

1. Crie ou selecione um projeto.
2. Ative a **Google Sheets API**.
3. Crie uma conta de serviço.
4. Gere uma chave no formato JSON.
5. Guarde o arquivo fora do repositório.

Estrutura recomendada no computador:

```text
C:\SIGA\
├── Projeto-S.I.G.A\
└── CredenciaisSIGA\
    └── google-sheets-service-account.json
```

No `.env`, use:

```env
GOOGLE_APPLICATION_CREDENTIALS="C:/SIGA/CredenciaisSIGA/google-sheets-service-account.json"
```

Abra o JSON, copie apenas o valor de `client_email` e compartilhe a planilha com esse e-mail:

- Permissão de **Leitor**: suficiente para buscar catálogo e recebimentos.
- Permissão de **Editor**: necessária para o espelhamento completo e para atualizar o estado das respostas. Para o funcionamento total, use Editor.

Não envie o JSON para outras pessoas e não o adicione ao Git.

### 8.3 Instalar os formulários

Os códigos estão em:

```text
scripts/google-apps-script/FormularioAlunosV2.gs
scripts/google-apps-script/FormularioEmpresasV2.gs
```

Passos:

1. Crie um projeto novo no Google Apps Script.
2. Crie dois arquivos no mesmo projeto e copie os respectivos códigos `.gs`.
3. Em `FormularioAlunosV2.gs`, troque o valor de `SIGA_V2.PLANILHA` pelo ID da planilha acadêmica atual.
4. Confirme que esse ID não é igual ao valor de `SIGA_V2.PLANILHA_ANTIGA`.
5. Execute `instalarFormularioAlunosV2` e autorize as permissões solicitadas.
6. Execute `instalarFormularioEmpresasV2` e autorize as permissões.
7. Abra os links registrados na execução, confira os formulários e publique-os quando estiverem prontos.

Não execute os instaladores repetidamente em projetos diferentes, pois isso cria formulários duplicados. O próprio script reutiliza a instalação registrada no mesmo projeto.

Quando o catálogo de cursos ou turmas mudar, execute no Apps Script:

```text
atualizarCatalogoFormularioAlunosV2
```

### 8.4 Ativar a integração no projeto

Depois que credencial, planilha e formulários estiverem corretos, altere o `.env`:

```env
GOOGLE_SHEETS_RECEBIMENTOS_AUTO="true"
GOOGLE_SHEETS_ESPELHO_AUTO="true"
```

Reinicie `npm.cmd run dev` sempre que modificar o `.env`.

Para testar a leitura da estrutura sem gravar dados:

```powershell
npm.cmd run db:previa-academica
```

Para executar uma sincronização completa pelo terminal:

```powershell
npm.cmd run db:recebimentos
```

Também é possível entrar como administrador e usar **Sincronizar cadastros**. Com o painel aberto e visível, a primeira sincronização ocorre automaticamente e as seguintes são executadas a cada cinco minutos.

> O temporizador atual roda no navegador do administrador. Se ninguém estiver com o painel aberto, ele não funciona como tarefa permanente em segundo plano. Para uma hospedagem definitiva, será necessário configurar um agendador/cron seguro no provedor.

## 9. Testar o fluxo completo

1. Entre como administrador e mantenha o painel aberto.
2. Envie uma resposta válida pelo formulário de alunos.
3. Confirme a nova linha em `Recebimentos Alunos`.
4. Aguarde a sincronização automática ou acione a sincronização manual.
5. Confira o aluno no dashboard e, opcionalmente, no Prisma Studio.
6. Envie novamente o mesmo CPF com um dado alterado.
7. Sincronize e confirme que o registro foi atualizado, sem duplicação.
8. Repita o teste com o formulário de empresas e um CNPJ válido.
9. Verifique as abas de espelho e os estados de processamento da planilha.

Dados inválidos não são cadastrados. Corrija as informações e faça um novo envio do formulário.

## 10. Validação antes do commit

```powershell
npx.cmd prisma validate
npx.cmd prisma generate
npm.cmd run lint
npm.cmd run build
git status --short
git check-ignore -v .env
```

`npm.cmd test` executa os testes de detalhes e contratos. Eles precisam de um banco isolado chamado `siga_test` em `localhost` ou `127.0.0.1`, com as migrations aplicadas. Configure `TEST_DATABASE_URL`, `DATABASE_URL` e `DIRECT_URL` com a mesma conexão de teste somente no terminal dessa execução; mantenha o `.env` da aplicação apontando para a base habitual. Sem essa configuração, a suíte informa que os testes foram ignorados. Os registros fictícios criados pela suíte são removidos ao terminar.

Na tela Alunos, clique no nome ou em uma célula da linha para abrir os detalhes. A confirmação de contrato é salva no PostgreSQL por matrícula e empresa; não há envio de arquivos. Ao mudar a empresa ou retirar o status de empregado, a confirmação é limpa. As solicitações exibidas dependem de vínculos explícitos registrados em `HistoricoAcompanhamento.solicitacaoId`, sem inferir indicações por curso ou empresa. O card mostra até 50 solicitações e 100 eventos recentes, informando o total quando houver mais.

## 11. Comandos do dia a dia

```powershell
# Abrir o projeto
git pull origin dev
npm.cmd run dev

# Inspecionar o banco
npx.cmd prisma studio

# Ver migrations pendentes
npx.cmd prisma migrate status

# Aplicar migrations já versionadas
npx.cmd prisma migrate deploy

# Gerar novamente o Prisma Client
npx.cmd prisma generate

# Sincronizar recebimentos sem abrir o navegador
npm.cmd run db:recebimentos

# Gerar build de produção
npm.cmd run build

# Executar o build gerado
npm.cmd start
```

Não é necessário executar `npm ci`, migrations ou seed toda vez que o projeto for iniciado.

## 12. Estrutura principal

```text
Projeto-S.I.G.A/
├── prisma/
│   ├── migrations/          # Histórico de alterações do banco
│   ├── schema.prisma        # Modelos e relacionamentos
│   └── seed.js              # Administrador e empresas iniciais
├── scripts/
│   ├── google-apps-script/  # Criação e tratamento dos formulários
│   └── buscar-recebimentos.js
├── src/
│   ├── app/
│   │   ├── (public)/        # Login
│   │   ├── (private)/       # Áreas protegidas de admin e empresa
│   │   └── api/             # Rotas do servidor
│   ├── components/          # Componentes visuais
│   ├── hooks/               # Regras usadas pelas telas
│   └── lib/                 # Banco, autenticação e importação
├── .env.example
├── package.json
└── README.md
```

Principais entidades do banco: `Administrador`, `Empresa`, `Aluno`, `Curso`, `Turma`, `Matricula`, `Solicitacao`, `HistoricoAcompanhamento`, `RecebimentoCadastro`, `AuditoriaAluno` e `PendenciaMigracao`.

## 13. Problemas frequentes

### Arquivo de credencial não encontrado (`ENOENT`)

Confira o caminho real:

```powershell
Get-ChildItem "C:\SIGA\CredenciaisSIGA" -Recurse -Filter "google-sheets-service-account.json"
```

Copie o caminho retornado para o `.env`, usando `/`, sem espaços extras e com apenas um par de aspas.

### Falha de conexão com o PostgreSQL

- Confira se o serviço do PostgreSQL está iniciado.
- Revise usuário, senha, porta `5432` e nome do banco.
- Confirme que `DATABASE_URL` e `DIRECT_URL` apontam para o ambiente correto.

### Prisma Client ausente ou desatualizado

```powershell
npx.cmd prisma generate
```

Depois reinicie a aplicação.

### A planilha não sincroniza

- Confirme `GOOGLE_SHEETS_ACADEMICO_ID`.
- Confirme o caminho do JSON.
- Verifique se a Google Sheets API está ativa.
- Compartilhe a planilha com o `client_email` da conta de serviço.
- Confira nomes de abas e cabeçalhos na linha 4.
- Confirme que `GOOGLE_SHEETS_RECEBIMENTOS_AUTO` está como `true`.
- Para espelhar a base, confirme a permissão de Editor e `GOOGLE_SHEETS_ESPELHO_AUTO="true"`.
- Reinicie o servidor após alterar o `.env`.

### Login não funciona

- Confirme que o seed terminou sem erros.
- Use os mesmos valores configurados no `.env`.
- Se o seed foi executado novamente, use as senhas atuais do `.env`.
- Limpe a sessão antiga ou saia e entre novamente.

## Segurança

- `.env`, chaves JSON, backups e dados pessoais nunca devem ser versionados.
- A pasta `src/generated/prisma` é gerada localmente e não deve ir para o Git.
- As áreas `/admin` e `/empresa` são protegidas no servidor pelo perfil da sessão.
- Em produção, use HTTPS, senhas fortes e um `AUTH_SECRET` exclusivo.
- Não use dados reais em bancos ou planilhas de teste.
- Faça backup antes de migrations em bancos existentes.

Para confirmar que os arquivos sensíveis estão ignorados:

```powershell
git check-ignore -v .env
git check-ignore -v google-sheets-service-account.json
```
