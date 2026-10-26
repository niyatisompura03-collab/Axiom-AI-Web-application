import { Menu } from "lucide-react";

interface HeaderProps {
  isSidebarOpen?: boolean;
  setIsSidebarOpen?: React.Dispatch<React.SetStateAction<boolean>>;
}

export default function Header({ isSidebarOpen, setIsSidebarOpen }: HeaderProps) {
  return (
    <header className="px-4 sm:px-6 md:px-10 py-3 sm:py-4 md:py-5 flex items-center justify-between bg-bg-app shrink-0 h-14 sm:h-16 md:h-[76px] border-b border-border/30">
      <div className="flex items-center gap-2">
        {setIsSidebarOpen && (
          <button
            type="button"
            onClick={() => setIsSidebarOpen((prev) => !prev)}
            aria-label="Toggle navigation menu"
            className="md:hidden w-9 h-9 rounded-xl flex items-center justify-center text-text-secondary hover:text-text-primary hover:bg-surface-secondary border border-border/60 transition-colors cursor-pointer"
            title="Toggle menu"
          >
            <Menu size={18} />
          </button>
        )}
      </div>

      <div className="flex items-center">
        <img src="/brand/axiom-wordmark-white.png" alt="AXIOM" className="h-4 sm:h-4.5 w-auto object-contain dark-logo" />
        <img src="/brand/axiom-wordmark-black.png" alt="AXIOM" className="h-4 sm:h-4.5 w-auto object-contain light-logo" />
      </div>
    </header>
  );
}