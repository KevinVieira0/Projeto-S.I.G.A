import "./globals.css";

export const metadata = {
  title: "Login | Nome do Projeto",
  description: "Portal de acesso - Admin e Empresas beneficiárias",
};

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR">
      <body className="min-h-screen bg-gray-50 antialiased">{children}</body>
    </html>
  );
}
