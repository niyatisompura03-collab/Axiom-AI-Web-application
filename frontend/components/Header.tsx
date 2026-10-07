import { PanelLeftOpen } from "lucide-react";

interface HeaderProps {
  isSidebarOpen: boolean;
  setIsSidebarOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

export default function Header({ isSidebarOpen, setIsSidebarOpen }: HeaderProps) {
  if (!isSidebarOpen) return null;

  return (
    <header className="px-6 md:px-10 py-5 md:py-6 flex items-center justify-between bg-surface-secondary/80 backdrop-blur-xl border-b border-border shrink-0 h-[73px] md:h-[89px]">
      <div className="flex items-center gap-3.5">
        {/* Logo and text have been moved to the sidebar */}
      </div>
    </header>
  );
}