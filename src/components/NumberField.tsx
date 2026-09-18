"use client";

import { useLayoutEffect, useRef, type InputHTMLAttributes } from "react";

type Props = Omit<InputHTMLAttributes<HTMLInputElement>, "value" | "onChange" | "type" | "prefix"> & {
  value: string | number;
  // Recibe el número "limpio" con punto decimal (ej "1234.5"), listo para Number().
  onValueChange: (raw: string) => void;
  prefix?: string;
  suffix?: string;
  decimals?: boolean;
};

function toDisplay(raw: string, prefix: string, suffix: string) {
  if (raw === "") return "";
  const [int, dec] = raw.split(".");
  const grouped = int.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return `${prefix}${grouped}${dec !== undefined ? "," + dec : ""}${suffix}`;
}

function toRaw(text: string, decimals: boolean) {
  const cleaned = text.replace(/[^\d,]/g, "");
  if (cleaned === "") return "";
  const [intPart, ...rest] = cleaned.split(",");
  const int = intPart.replace(/^0+(?=\d)/, "") || "0";
  if (!decimals || rest.length === 0) return int;
  return `${int}.${rest.join("").slice(0, 2)}`;
}

// Campo numérico que se auto-formatea mientras se escribe: puntos de miles,
// coma decimal y el signo ($, US$, %, kWh) — el valor que devuelve sigue
// siendo un número simple, así el resto del código no cambia.
export default function NumberField({
  value,
  onValueChange,
  prefix = "",
  suffix = "",
  decimals = false,
  ...rest
}: Props) {
  const ref = useRef<HTMLInputElement>(null);
  const digitsBefore = useRef<number | null>(null);
  const display = toDisplay(String(value ?? ""), prefix, suffix);

  useLayoutEffect(() => {
    const el = ref.current;
    if (digitsBefore.current == null || !el || document.activeElement !== el) return;
    const target = digitsBefore.current;
    digitsBefore.current = null;
    let pos = 0;
    if (target === 0) {
      const first = display.search(/[\d,]/);
      pos = first === -1 ? display.length - suffix.length : first;
    } else {
      let n = 0;
      pos = display.length - suffix.length;
      for (let i = 0; i < display.length; i++) {
        if (/[\d,]/.test(display[i])) n++;
        if (n === target) {
          pos = i + 1;
          break;
        }
      }
    }
    el.setSelectionRange(pos, pos);
  });

  return (
    <input
      {...rest}
      ref={ref}
      type="text"
      inputMode={decimals ? "decimal" : "numeric"}
      value={display}
      onChange={(e) => {
        const text = e.target.value;
        const caret = e.target.selectionStart ?? text.length;
        digitsBefore.current = (text.slice(0, caret).match(/[\d,]/g) ?? []).length;
        onValueChange(toRaw(text, decimals));
      }}
    />
  );
}
