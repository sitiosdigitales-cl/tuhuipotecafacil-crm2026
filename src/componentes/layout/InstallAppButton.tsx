"use client";

import { useState, useEffect } from "react";
import { Download, Check, Smartphone } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function InstallAppButton() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(() =>
    typeof window !== "undefined" && window.matchMedia("(display-mode: standalone)").matches
  );
  const [showTooltip, setShowTooltip] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", handler);

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) {
      // Show instructions for manual install
      setShowTooltip(true);
      setTimeout(() => setShowTooltip(false), 5000);
      return;
    }

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === "accepted") {
      setIsInstalled(true);
    }
    setDeferredPrompt(null);
  };

  if (isInstalled) {
    return (
      <div className="w-10 h-10 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center border border-emerald-200">
        <Check size={18} />
      </div>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={handleInstall}
        className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-500 text-white rounded-xl flex items-center justify-center hover:opacity-90 transition-all shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30"
        title="Instalar App"
      >
        <Download size={18} />
      </button>

      {/* Tooltip de instalación */}
      {showTooltip && (
        <div className="absolute right-0 top-full mt-2 w-72 bg-white rounded-xl shadow-2xl border border-slate-200 z-50 p-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <Smartphone size={18} className="text-blue-500" />
            </div>
            <div>
              <h4 className="text-[12px] font-bold text-slate-800 mb-1">
                Instalar App
              </h4>
              <p className="text-[10px] text-slate-500 mb-2">
                Para instalar en tu teléfono:
              </p>
              <ol className="text-[10px] text-slate-600 space-y-1">
                <li>1. Abre este sitio en Chrome</li>
                <li>2. Toca el menú ⋮</li>
                <li>3. Selecciona &quot;Instalar app&quot;</li>
              </ol>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
