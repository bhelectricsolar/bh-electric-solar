"use client";

import { useEffect } from "react";

// Comportamiento común de todos los menús desplegables (hojas, paneles y el
// carrito), sin tocar cada uno:
//  - Mientras hay uno abierto, la pantalla de atrás queda inmóvil.
//  - En celular se cierra deslizando hacia abajo (o hacia la derecha si es
//    un panel lateral) o tocando/arrastrando el fondo oscuro.
//  - El menú de navegación desplegable del sitio se cierra al hacer scroll.
// Cada hoja se marca con data-sheet ("side" si es lateral) y su fondo es el
// primer botón con aria-label "Cerrar…".
export default function SheetManager() {
  useEffect(() => {
    const SHEET = "[data-sheet]";
    const touchDevice = navigator.maxTouchPoints > 0;
    let locked = false;
    let savedScroll = 0;

    const lock = () => {
      if (locked) return;
      locked = true;
      savedScroll = window.scrollY;
      const b = document.body;
      b.style.position = "fixed";
      b.style.top = `-${savedScroll}px`;
      b.style.left = "0";
      b.style.right = "0";
      b.style.width = "100%";
      if (!touchDevice) b.style.overflowY = "scroll";
    };
    const unlock = () => {
      if (!locked) return;
      locked = false;
      const b = document.body;
      b.style.position = "";
      b.style.top = "";
      b.style.left = "";
      b.style.right = "";
      b.style.width = "";
      b.style.overflowY = "";
      window.scrollTo(0, savedScroll);
    };
    // Menú de navegación desplegable: guardamos el scroll del momento en que
    // se abrió para saber cuánto se movió la pantalla después.
    let dropdownScroll: number | null = null;
    const sync = () => {
      if (document.querySelector(SHEET)) lock();
      else unlock();
      if (document.querySelector("[data-dropdown]")) {
        if (dropdownScroll === null) dropdownScroll = window.scrollY;
      } else {
        dropdownScroll = null;
      }
    };

    const observer = new MutationObserver(sync);
    observer.observe(document.body, { childList: true, subtree: true });
    sync();

    const closeSheet = (sheet: Element) => {
      (sheet.querySelector('button[aria-label^="Cerrar"]') as HTMLElement | null)?.click();
    };

    const scrollableParent = (el: Element | null, root: Element): HTMLElement | null => {
      while (el && el !== root) {
        const node = el as HTMLElement;
        const oy = getComputedStyle(node).overflowY;
        if ((oy === "auto" || oy === "scroll") && node.scrollHeight > node.clientHeight) return node;
        el = el.parentElement;
      }
      return null;
    };

    let start: { x: number; y: number; sheet: Element; scroller: HTMLElement | null; backdrop: boolean } | null =
      null;
    let closed = false;

    const onTouchStart = (e: TouchEvent) => {
      closed = false;
      const target = e.target as Element;
      const sheet = target.closest(SHEET);
      if (!sheet) {
        start = null;
        return;
      }
      const t = e.touches[0];
      const backdrop = target.closest('button[aria-label^="Cerrar"]')?.parentElement === sheet;
      start = { x: t.clientX, y: t.clientY, sheet, scroller: scrollableParent(target, sheet), backdrop };
    };

    const onTouchMove = (e: TouchEvent) => {
      if (!start || closed) return;
      const t = e.touches[0];
      const dy = t.clientY - start.y;
      const dx = t.clientX - start.x;
      const side = (start.sheet as HTMLElement).dataset.sheet === "side";

      if (start.backdrop) {
        if (e.cancelable) e.preventDefault();
        if (Math.abs(dy) > 12 || Math.abs(dx) > 12) {
          closed = true;
          closeSheet(start.sheet);
        }
        return;
      }
      const atTop = !start.scroller || start.scroller.scrollTop <= 0;
      if (side ? dx > 90 && Math.abs(dy) < 60 : dy > 90 && atTop) {
        closed = true;
        closeSheet(start.sheet);
      }
    };

    // Se cierra apenas se hace scroll.
    const onScroll = () => {
      if (dropdownScroll === null) return;
      if (Math.abs(window.scrollY - dropdownScroll) > 24) {
        dropdownScroll = null;
        (document.querySelector('[data-dropdown-toggle]') as HTMLElement | null)?.click();
      }
    };

    document.addEventListener("touchstart", onTouchStart, { passive: true });
    document.addEventListener("touchmove", onTouchMove, { passive: false });
    window.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      observer.disconnect();
      document.removeEventListener("touchstart", onTouchStart);
      document.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("scroll", onScroll);
      unlock();
    };
  }, []);

  return null;
}
