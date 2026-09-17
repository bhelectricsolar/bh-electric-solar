"use client";

import { useEffect } from "react";

export default function InstallServiceWorker() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/admin-sw.js", { scope: "/admin" }).catch(() => {
        // Instalación de la app sigue funcionando igual sin service worker;
        // solo se pierde el shell offline.
      });
    }
  }, []);

  return null;
}
