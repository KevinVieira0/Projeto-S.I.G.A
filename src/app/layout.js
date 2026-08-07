import "./globals.css";

export const metadata = {
  title: "Login | Projeto S.I.G.A",
  description: "Portal de acesso - Admin e Empresas beneficiárias",
};

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR">
      <body className="min-h-screen bg-gray-50 antialiased">{children}</body>
    </html>
  );
}
