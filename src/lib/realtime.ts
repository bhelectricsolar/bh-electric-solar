"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "./supabase/client";

// Vuelve a pedir los datos apenas cambia algo en las tablas indicadas
// (Supabase Realtime), y además cada 30 s y al volver a la pestaña como
// respaldo por si el tiempo real se cae. Devuelve si está "en vivo".
export function useLiveRefresh(tables: string[], onChange: () => void) {
  const [live, setLive] = useState(false);
  const callback = useRef(onChange);
  const key = tables.join(",");

  useEffect(() => {
    callback.current = onChange;
  });

  useEffect(() => {
    const supabase = createClient();
    let timer: ReturnType<typeof setTimeout> | null = null;
    const trigger = () => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => callback.current(), 350);
    };

    const channel = supabase.channel(`live-${key}`);
    key.split(",").forEach((table) => {
      channel.on("postgres_changes", { event: "*", schema: "public", table }, trigger);
    });
    channel.subscribe((status) => setLive(status === "SUBSCRIBED"));

    const poll = window.setInterval(() => callback.current(), 30000);
    const onVisible = () => {
      if (document.visibilityState === "visible") callback.current();
    };
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      if (timer) clearTimeout(timer);
      window.clearInterval(poll);
      document.removeEventListener("visibilitychange", onVisible);
      supabase.removeChannel(channel);
    };
  }, [key]);

  return live;
}
