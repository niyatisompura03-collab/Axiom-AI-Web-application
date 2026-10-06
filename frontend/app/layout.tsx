import "./globals.css";
import { ChatProvider } from "@/context/ChatContext";
import { AuthProvider } from "@/context/AuthContext";
import CustomCursor from "@/components/CustomCursor";
import ThemeInitializer from "@/components/ThemeInitializer";
export const metadata = {
  title: "Axiom",
  description: "AI Assistant",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <CustomCursor />
        <AuthProvider>
          <ThemeInitializer />
          <ChatProvider>
            {children}
          </ChatProvider>
        </AuthProvider>
      </body>
    </html>
  );
}