
Readme · MD
# feat: tela de login (Admin + Empresa)
 
Tela de login com validações via **React Hook Form + Zod**, rotas em
**Next.js (App Router)** e estilização com **Tailwind CSS**.
 
## O que essa branch entrega
 
- Portal de acesso com 2 abas: **Administrador** (e-mail + senha) e
  **Empresa** (CNPJ com máscara e validação assíncrona de beneficiária)
- Validação de formulário em tempo real, com mensagens de erro por campo
- Componentes de UI reutilizáveis (Input, Button) já preparados para tema
  azul (admin) e âmbar (empresa)
- Camada de serviço isolada (`lib/api`) já com o contrato de endpoints
  documentado para o time de back-end
## Stack
 
| Camada | Tecnologia |
|---|---|
| Framework / rotas | Next.js 14 (App Router) |
| UI | React 18 + Tailwind CSS |
| Formulários e validação | React Hook Form + Zod |
| Ícones | lucide-react |
| Requisições HTTP | Axios |
| Sessão (esqueleto) | Context API (`AuthContext`) |
 
## Como rodar
 
```bash
npm install
cp .env.example .env.local
npm run dev
```
 
Abre em `http://localhost:3000` e redireciona automaticamente pra `/login`.
 
## Estrutura
 
```
src/
├── app/login/          # rota /login
├── components/
│   ├── login/           # LoginCard, abas, formulários (Admin/Empresa)
│   └── ui/               # Input e Button genéricos
├── hooks/
│   ├── useAdminLogin.js       # RHF + zod + chamada de loginAdmin()
│   ├── useEmpresaLogin.js     # RHF + zod + chamada de loginEmpresa()
│   └── useCnpjValidation.js   # debounce + validação de CNPJ na API
├── lib/
│   ├── api/              # axiosClient, authService, cnpjService
│   └── validations/      # schemas zod (adminLoginSchema, empresaLoginSchema)
├── context/AuthContext.jsx   # esqueleto de sessão (ainda não plugado no layout)
└── constants/             # rotas e tema (cores por tipo de conta)
```
 
Os dois formulários seguem o mesmo padrão: **componente visual → hook
(RHF + zod) → serviço de API**.
 
## Contrato de API esperado (back-end)
 
```
POST /auth/admin/login        body: { email, senha }
GET  /empresas/cnpj/:cnpj/validar
POST /auth/empresa/login      body: { cnpj }
```
 
Enquanto o endpoint de validação de CNPJ não existe, use
`NEXT_PUBLIC_USE_CNPJ_MOCK=true` no `.env.local` (mock em `cnpjService.js`).
 
## Próximos passos (fora do escopo desta branch)
 
- Plugar `AuthContext` no `layout.js` e persistir sessão
- Redirecionar para `/admin/dashboard` ou `/empresa/dashboard` após login
- Proteger rotas privadas via middleware do Next.js
- Trocar `NEXT_PUBLIC_USE_CNPJ_MOCK` para `false` quando o endpoint real estiver no ar
