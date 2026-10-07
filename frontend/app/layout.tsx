import "./globals.css";
import { ChatProvider } from "@/context/ChatContext";
import { AuthProvider } from "@/context/AuthContext";
import CustomCursor from "@/components/CustomCursor";
import ThemeInitializer from "@/components/ThemeInitializer";
export const metadata = {
  title: "Axiom",
  description: "Think • Remember • Do more",
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/brand/axiom-mark-white.png", type: "image/png", media: "(prefers-color-scheme: dark)" },
      { url: "/brand/axiom-mark-black.png", type: "image/png", media: "(prefers-color-scheme: light)" }
    ],
    apple: "/brand/app_icon_dark.png",
  },
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