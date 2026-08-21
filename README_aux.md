# Projeto S.I.G.A

Portal de acesso do S.I.G.A desenvolvido com Next.js, Prisma e PostgreSQL.
Atualmente o projeto possui login de administrador e login de empresa
beneficiária usando CNPJ e senha.

Este README descreve a instalação completa em um computador novo no qual o
PostgreSQL já está instalado, mas o banco `siga_local` ainda não possui tabelas
nem dados.

## Tecnologias utilizadas

| Camada | Tecnologia |
|---|---|
| Aplicação web e API | Next.js 14 e React 18 |
| Estilos | Tailwind CSS |
| Formulários e validação | React Hook Form e Zod |
| Banco de dados | PostgreSQL |
| ORM e migrations | Prisma 7 |
| Proteção das senhas | bcryptjs |

## O que já está funcionando

- Login de administrador por e-mail e senha.
- Consulta de empresa pelo CNPJ.
- Login de empresa autorizada por CNPJ e senha.
- Senhas armazenadas como hash bcrypt, nunca em texto puro.
- Tabelas `administradores` e `empresas` criadas por migrations.
- Administrador inicial e empresa de teste criados pelo seed.

## 1. Programas necessários

Antes de abrir o projeto, instale:

- PostgreSQL, incluindo as ferramentas de linha de comando.
- Node.js. Recomenda-se usar uma versão LTS atual.
- Visual Studio Code.
- Git, caso o projeto seja obtido por `git clone`.

Abra o PowerShell e confirme as instalações:

```powershell
node --version
npm.cmd --version
psql --version
```

Se `psql` não for reconhecido e o PostgreSQL 18 estiver instalado, execute:

```powershell
$env:Path += ";C:\Program Files\PostgreSQL\18\bin"
psql --version
```

Se outra versão estiver instalada, substitua `18` pelo número correspondente.

## 2. Abrir a pasta do projeto

Extraia o ZIP ou faça o clone para uma pasta local. No PowerShell, entre na
pasta que contém o arquivo `package.json`. Exemplo:

```powershell
cd "C:\Users\Pichau\OneDrive\Documentos\Projeto-S.I.G.A"
Get-ChildItem
code .
```

O resultado de `Get-ChildItem` deve mostrar, entre outros itens,
`package.json`, `prisma.config.ts`, `README.md`, `prisma` e `src`.

## 3. Confirmar que o PostgreSQL está em execução

```powershell
Get-Service *postgres*
```

O serviço deve aparecer como `Running`. Se estiver parado, abra o PowerShell
como administrador e inicie o serviço. Para uma instalação padrão do
PostgreSQL 18, o comando normalmente é:

```powershell
Start-Service postgresql-x64-18
```

Se o nome for diferente, use exatamente o nome exibido por
`Get-Service *postgres*`.

## 4. Criar o banco local vazio

Conecte-se ao PostgreSQL usando o usuário definido durante a instalação. Na
instalação padrão, esse usuário é `postgres`:

```powershell
psql -U postgres -h localhost -p 5432 -d postgres
```

Digite a senha do PostgreSQL quando ela for solicitada. Dentro do `psql`, rode:

```sql
CREATE DATABASE siga_local;
```

Depois saia:

```sql
\q
```

Se aparecer a mensagem de que o banco já existe, não o crie novamente. Apenas
continue para a próxima etapa.

## 5. Criar e configurar o arquivo `.env`

Na raiz do projeto, crie o `.env` a partir do exemplo somente se ele ainda não
existir:

```powershell
if (-not (Test-Path ".env")) { Copy-Item ".env.example" ".env" }
notepad .env
```

Confirme que o arquivo possui todas as variáveis abaixo e preencha os valores:

```dotenv
DATABASE_URL="postgresql://postgres:SUA_SENHA_POSTGRES@localhost:5432/siga_local?schema=public"
DIRECT_URL="postgresql://postgres:SUA_SENHA_POSTGRES@localhost:5432/siga_local?schema=public"

ADMIN_INITIAL_NAME="Nome do administrador"
ADMIN_INITIAL_EMAIL="administrador@exemplo.com"
ADMIN_INITIAL_PASSWORD="SENHA_ADMIN_COM_8_OU_MAIS_CARACTERES"

EMPRESA_TEST_PASSWORD="SENHA_EMPRESA_COM_8_OU_MAIS_CARACTERES"
```

Observações importantes:

- Troque todos os valores de exemplo.
- `DATABASE_URL` e `DIRECT_URL` devem apontar para o mesmo banco local.
- A porta padrão do PostgreSQL é `5432`.
- As senhas do administrador e da empresa precisam ter pelo menos 8 caracteres.
- Se `EMPRESA_TEST_PASSWORD` não estiver no `.env.example`, adicione-a
  manualmente ao `.env`, conforme mostrado acima.
- Se a senha do PostgreSQL tiver caracteres especiais de URL, eles precisam ser
  codificados na conexão.
- Nunca envie ou faça commit do arquivo `.env`. Ele contém informações privadas.

## 6. Instalar as dependências

Ainda na raiz do projeto:

```powershell
npm.cmd install
```

Esse comando cria a pasta `node_modules`. Ele precisa ser executado na primeira
instalação ou quando as dependências forem alteradas.

## 7. Preparar o Prisma e criar as tabelas

Execute os comandos abaixo na ordem indicada:

```powershell
npx.cmd prisma validate
npx.cmd prisma generate
npx.cmd prisma migrate deploy
npx.cmd prisma migrate status
```

O projeto possui atualmente duas migrations:

1. `20260807020159_criar_administrador_empresa` cria as tabelas
   `administradores` e `empresas`.
2. `20260813040509_adicionar_senha_empresa` adiciona `senha_hash` à tabela
   `empresas`.

Ao final, `prisma migrate status` deve informar que o schema do banco está
atualizado. Não apague nenhuma dessas pastas de migration: elas são necessárias
para montar corretamente um banco vazio em outro computador.

## 8. Inserir os dados iniciais

Com o `.env` preenchido e as migrations aplicadas, execute:

```powershell
npx.cmd prisma db seed
```

O seed cria ou atualiza:

- O administrador definido nas variáveis `ADMIN_INITIAL_*`.
- A empresa de teste com CNPJ `11222333000181`.
- A senha da empresa definida em `EMPRESA_TEST_PASSWORD`.

O resultado esperado inclui mensagens semelhantes a:

```text
Administrador preparado: administrador@exemplo.com
Empresa preparada: Empresa Teste SIGA LTDA
```

As senhas gravadas no banco aparecem como hashes iniciados normalmente por
`$2b$12$`. Isso está correto; a senha original não deve aparecer no banco.

## 9. Conferir as tabelas no Prisma Studio

```powershell
npx.cmd prisma studio
```

Abra o endereço exibido no terminal, normalmente `http://localhost:5555`, e
confira:

- `Administrador`: deve existir o administrador configurado no `.env`.
- `Empresa`: deve existir o CNPJ `11222333000181`.
- O campo `senhaHash` deve estar preenchido nos dois registros.
- A empresa de teste deve estar com `autorizada = true` e `ativa = true`.

Encerre o Prisma Studio com `Ctrl + C` quando terminar.

## 10. Validar e executar o projeto

Primeiro valide a compilação:

```powershell
npm.cmd run build
```

Depois inicie o ambiente de desenvolvimento:

```powershell
npm.cmd run dev
```

Abra:

```text
http://localhost:3000/login
```

Teste os dois acessos:

- Administrador: e-mail e senha definidos no `.env`.
- Empresa: CNPJ `11222333000181` e a senha definida em
  `EMPRESA_TEST_PASSWORD`.

## 11. Comandos usados no dia a dia

Depois que a instalação completa tiver sido feita uma vez, normalmente basta:

```powershell
cd "CAMINHO\PARA\Projeto-S.I.G.A"
Get-Service *postgres*
npm.cmd run dev
```

Não é necessário repetir `npm install`, migrations ou seed toda vez que o
projeto for aberto.

## 12. Alterar as senhas iniciais

Para trocar a senha do administrador ou da empresa de teste:

1. Pare o servidor com `Ctrl + C`.
2. Altere `ADMIN_INITIAL_PASSWORD` ou `EMPRESA_TEST_PASSWORD` no `.env`.
3. Mantenha o mesmo e-mail do administrador caso queira atualizar o mesmo
   registro.
4. Execute novamente:

```powershell
npx.cmd prisma db seed
```

5. Reinicie o projeto:

```powershell
npm.cmd run dev
```

Alterar apenas o `.env` não modifica um hash que já está salvo no banco. O seed
é o comando que recalcula e grava o novo hash.

## 13. Criar backup do banco local

Crie a pasta de backups e gere um arquivo no formato próprio do PostgreSQL:

```powershell
New-Item -ItemType Directory -Force ".\backups"
$dataBackup = Get-Date -Format "yyyy-MM-dd_HH-mm"
pg_dump -U postgres -h localhost -p 5432 -d siga_local -F c -f ".\backups\siga_local_$dataBackup.backup"
```

A pasta `backups` está ignorada pelo Git porque pode conter dados pessoais e
credenciais. Guarde o arquivo em local seguro.

Migrations e backup têm funções diferentes:

- As migrations versionam a estrutura do banco.
- O backup preserva os dados que estavam no banco no momento da cópia.

## 14. Solução de problemas

### `psql`, `pg_dump` ou `pg_restore` não é reconhecido

Adicione temporariamente a pasta `bin` do PostgreSQL ao PowerShell:

```powershell
$env:Path += ";C:\Program Files\PostgreSQL\18\bin"
```

### Erro de autenticação do PostgreSQL

Confirme usuário, senha, porta e banco nas duas URLs do `.env`. Teste a conexão:

```powershell
psql -U postgres -h localhost -p 5432 -d siga_local
```

### Prisma informa que existe migration pendente

```powershell
npx.cmd prisma migrate deploy
npx.cmd prisma migrate status
```

### O campo `senhaHash` não aparece no Prisma Studio

```powershell
npx.cmd prisma migrate deploy
npx.cmd prisma generate
npx.cmd prisma studio
```

Feche uma aba antiga do Studio e abra novamente o endereço exibido pelo comando.

### Erro em `src/generated/prisma`

```powershell
npx.cmd prisma generate
```

### Erro `EINVAL readlink` dentro da pasta `.next`

Esse problema pode acontecer quando a pasta do projeto está sincronizada pelo
OneDrive. Pare o servidor, apague apenas o cache de compilação e execute de novo:

```powershell
Remove-Item -Recurse -Force ".\.next"
npm.cmd run dev
```

Se o erro continuar, mova o projeto para uma pasta local que não seja
sincronizada, por exemplo `C:\Projetos\Projeto-S.I.G.A`.

### A porta 3000 já está em uso

O Next.js pode escolher automaticamente a porta 3001. Use o endereço indicado
no terminal ou encerre o outro processo que está usando a porta 3000.

## 15. Regras para futuras mudanças no banco

- Não apague migrations que já fazem parte do projeto.
- Depois de alterar `prisma/schema.prisma` em desenvolvimento, crie uma nova
  migration com um nome descritivo:

```powershell
npx.cmd prisma migrate dev --name nome_da_alteracao
```

- Envie ao Git tanto o `schema.prisma` quanto a nova pasta criada em
  `prisma/migrations`.
- Em outro computador, aplique migrations existentes com
  `npx.cmd prisma migrate deploy`.
- Não substitua migrations por um backup. O projeto precisa das migrations para
  reproduzir sua estrutura em qualquer banco novo.

## 16. Planilha de alunos: próxima etapa

A planilha atualizada foi conferida e contém as abas `Respostas ao formulário
4`, `Alunos`, `Empresas`, `Listas` e `Estrutura Forms`.

A aba `Alunos` possui 16 colunas:

```text
ID, Nome, CPF, Número para contato, E-mail para contato, Idade,
Modalidade, Curso, Turma, Período, Termo, Empregado, Empresa,
Status da indicação, Data de cadastro, Última atualização
```

A importação ainda não faz parte desta versão do projeto. Na próxima etapa será
necessário criar o modelo `Aluno`, sua migration e a rotina de sincronização.
A regra planejada é:

- Normalizar o CPF e usá-lo como identificador único do aluno.
- Criar o aluno quando o CPF ainda não existir.
- Atualizar o aluno quando o CPF já existir.
- Não excluir alunos antigos apenas porque não aparecem em uma atualização.
- Relacionar o aluno à tabela `empresas` por uma chave estrangeira opcional,
  localizando a empresa pelo CNPJ; não armazenar a empresa apenas como texto.
- Preservar de forma controlada campos administrativos, como o status da
  indicação.

Nenhum comando de sincronização deve ser executado antes dessa implementação.

## Estrutura principal

```text
prisma/
├── migrations/          # histórico versionado da estrutura do banco
├── schema.prisma        # modelos Prisma
└── seed.js              # administrador e empresa de teste

src/
├── app/
│   ├── (public)/login/  # página de login
│   └── api/             # endpoints de administrador, empresa e CNPJ
├── components/          # componentes visuais
├── context/             # contexto de autenticação
├── hooks/               # regras dos formulários
└── lib/                 # Prisma, serviços e validações
```

## Endpoints atuais

```text
POST /api/auth/admin/login
POST /api/auth/empresa/login
GET  /api/empresas/cnpj/:cnpj/validar
```
