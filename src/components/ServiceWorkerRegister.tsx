"use client";

import { useEffect } from "react";

export default function ServiceWorkerRegister() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") {
      // En desarrollo evitamos registrar el service worker: cachear HTML
      // mientras las rutas cambian con cada recarga en caliente provoca
      // errores de hydration (HTML cacheado desactualizado + JS del cliente
      // nuevo). Si quedó uno registrado de una sesión anterior, lo quitamos.
      navigator.serviceWorker?.getRegistrations().then((regs) => {
        regs.forEach((reg) => reg.unregister());
      });
      return;
    }
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        // Silencioso: el service worker es una mejora progresiva.
      });
    }
  }, []);

  return null;
}
