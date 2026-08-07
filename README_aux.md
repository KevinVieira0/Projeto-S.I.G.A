# Tela de Login — Admin + Empresa (MVP)

Front-end em **Next.js (App Router) + React + Tailwind CSS**, formulários com
**React Hook Form + Zod**.

## Como rodar

```bash
npm install
cp .env.example .env.local
npm run dev
```

Abra http://localhost:3000 — redireciona automaticamente para `/login`.

## Estrutura de pastas

```
src/
├── app/
│   ├── layout.js          # layout raiz, importa o CSS global
│   ├── globals.css        # diretivas do Tailwind
│   ├── page.js             # redireciona "/" -> "/login"
│   └── login/
│       └── page.js         # rota /login (monta o card com as abas)
│
├── components/
│   ├── login/
│   │   ├── LoginCard.jsx           # orquestra header + card + abas + rodapé
│   │   ├── PortalHeader.jsx        # badge "PORTAL DE ACESSO", cor conforme aba ativa
│   │   ├── LoginTabs.jsx           # seletor visual Admin <-> Empresa (controlado)
│   │   ├── AdminLoginForm.jsx      # form email + senha
│   │   ├── EmpresaLoginForm.jsx    # form CNPJ
│   │   └── CnpjInput.jsx           # input com máscara + status da validação
│   └── ui/
│       ├── Input.jsx           # input genérico (ícone, right element, cor de tema)
│       └── Button.jsx          # botão genérico (variantes blue/amber, ícone)
│
├── hooks/
│   ├── useAdminLogin.js       # RHF + zod + chamada de loginAdmin()
│   └── useCnpjValidation.js   # debounce + chamada de validarCnpjBeneficiaria()
│
├── lib/
│   ├── api/
│   │   ├── axiosClient.js     # instância única do axios (baseURL via .env)
│   │   ├── authService.js     # loginAdmin(), loginEmpresa()
│   │   └── cnpjService.js     # validarCnpjBeneficiaria() [MOCK trocável]
│   └── validations/
│       ├── adminLoginSchema.js
│       ├── empresaLoginSchema.js
│       └── cnpjUtils.js       # máscara + validação de dígito verificador
│
├── context/
│   └── AuthContext.jsx     # esqueleto para guardar sessão após o login
│
└── constants/
    ├── routes.js
    └── theme.js             # cores/textos/ícone por tipo de login (admin=azul, empresa=âmbar)
```

## Para o time de back-end (contrato de API esperado)

O front já está pronto para consumir 3 endpoints. Enquanto eles não existem,
o front usa mocks (veja `NEXT_PUBLIC_USE_CNPJ_MOCK` no `.env`).

### 1. Login Admin
```
POST /auth/admin/login
body: { "email": string, "senha": string }

200 -> { "token": string, "usuario": { "id", "nome", "email", "role": "admin" } }
401 -> credenciais inválidas
```

### 2. Validar CNPJ (beneficiária) — chamado enquanto o usuário digita
```
GET /empresas/cnpj/:cnpj/validar

200 -> { "beneficiaria": true, "razaoSocial": "Empresa Exemplo LTDA" }
404 -> { "beneficiaria": false, "message": "CNPJ não localizado" }
```

### 3. Login Empresa
```
POST /auth/empresa/login
body: { "cnpj": string }  // só dígitos

200 -> { "token": string, "empresa": { "id", "cnpj", "razaoSocial" } }
401/404 -> CNPJ não é beneficiária / não autorizado
```

> Sugestão para o back: como é JavaScript também, **NestJS** é uma boa escolha
> mesmo — ele já separa bem em `controllers/services/modules`, o que casa
> naturalmente com essa camada `lib/api` do front (cada `*Service.js` do
> front corresponde a um `*.controller.ts` do back).

## Pontos que faltam (próximos passos)
- Trocar a paleta/estilo em `tailwind.config.js` e nos componentes assim que
  tivermos a referência visual definitiva.
- Persistir a sessão (`AuthContext`) em cookie/localStorage e proteger as
  rotas `/admin/*` e `/empresa/*` (middleware do Next.js).
- Trocar `NEXT_PUBLIC_USE_CNPJ_MOCK=true` para `false` assim que o endpoint
  de validação de CNPJ estiver no ar.
