import { PanelLeft } from "lucide-react";

interface HeaderProps {
  isSidebarOpen?: boolean;
  setIsSidebarOpen?: React.Dispatch<React.SetStateAction<boolean>>;
}

export default function Header({ isSidebarOpen, setIsSidebarOpen }: HeaderProps) {
  return (
    <header className="px-4 sm:px-6 md:px-10 py-3 sm:py-4 md:py-5 flex items-center justify-between bg-bg-app shrink-0 h-14 sm:h-16 md:h-[76px] border-b border-border">
      <div className="flex items-center gap-2">
        {setIsSidebarOpen && (
          <button
            type="button"
            onClick={() => setIsSidebarOpen((prev) => !prev)}
            aria-label="Toggle sidebar"
            className="md:hidden flex items-center gap-2 h-10 px-2.5 rounded-xl bg-surface-secondary hover:bg-surface border border-border text-text-primary shadow-elevation transition-all duration-200 cursor-pointer active:scale-95 group"
            title="Toggle sidebar"
          >
            <PanelLeft size={19} className="text-text-primary group-hover:text-accent transition-colors shrink-0" />
            <img src="/brand/axiom-mark-white.png" alt="Axiom" className="h-5 w-auto object-contain dark-logo group-hover:scale-105 transition-transform" />
            <img src="/brand/axiom-mark-black.png" alt="Axiom" className="h-5 w-auto object-contain light-logo group-hover:scale-105 transition-transform" />
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