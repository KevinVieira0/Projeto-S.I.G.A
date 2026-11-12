import "./globals.css";
import "@/shared/styles/tokens.css";
import "@/shared/styles/motion.css";
import "@/layouts/admin/admin.css";
import "@/layouts/empresa/empresa.css";
import { AuthProvider } from "@/context/AuthContext";

export const metadata = {
  title: "Login | Projeto S.I.G.A",
  description: "Portal de acesso - Admin e Empresas beneficiárias",
};

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR">
      <body className="min-h-screen bg-gray-50 antialiased">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
