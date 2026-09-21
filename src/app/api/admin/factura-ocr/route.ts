import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/lib/supabase/server";

export const maxDuration = 60;

const MEDIA_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"] as const;
type MediaType = (typeof MEDIA_TYPES)[number];

// Anthropic acepta hasta 5 MB por imagen; en base64 eso son ~6,9 M de caracteres.
const MAX_BASE64_CHARS = 6_500_000;

const PROMPT = `Esta es la foto de una factura de electricidad de Argentina.
Extraé estos datos y respondé SOLO con un objeto JSON (sin texto antes ni después, sin bloques de código):

{
  "kwh": consumo facturado del período en kWh (número),
  "dias": días del período de facturación (número; si no figura, calculalo con las fechas de inicio y fin del período),
  "distribuidora": nombre de la empresa distribuidora tal como figura (texto),
  "provincia": provincia o localidad si figura (texto),
  "monto_total": importe total a pagar en pesos (número),
  "periodo_desde": "AAAA-MM-DD" si figura,
  "periodo_hasta": "AAAA-MM-DD" si figura
}

Reglas:
- Los números van como números de JSON con punto decimal y sin separador de miles ni símbolo de moneda (ej: 1.234,56 en la factura → 1234.56).
- Si hay varios consumos (por ejemplo punta/resto/valle), sumá el total del período.
- Si un dato no se ve con claridad o no figura, poné null. No inventes valores.`;

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "No autenticado." }, { status: 401 });
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      {
        error:
          "La lectura por foto todavía no está activada: falta la clave ANTHROPIC_API_KEY en el servidor. Podés cargar los datos a mano.",
      },
      { status: 503 },
    );
  }

  let body: { image?: string; mediaType?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Pedido inválido." }, { status: 400 });
  }
  const image = (body.image ?? "").replace(/^data:[^;]+;base64,/, "");
  const mediaType = body.mediaType as MediaType;
  if (!image || !MEDIA_TYPES.includes(mediaType)) {
    return NextResponse.json({ error: "Falta la imagen o el formato no es válido." }, { status: 400 });
  }
  if (image.length > MAX_BASE64_CHARS) {
    return NextResponse.json({ error: "La foto es demasiado pesada. Probá con otra." }, { status: 413 });
  }

  const client = new Anthropic();

  try {
    const response = await client.messages.create({
      model: "claude-opus-5",
      max_tokens: 2000,
      output_config: { effort: "low" },
      messages: [
        {
          role: "user",
          content: [
            { type: "image", source: { type: "base64", media_type: mediaType, data: image } },
            { type: "text", text: PROMPT },
          ],
        },
      ],
    });

    if (response.stop_reason === "refusal") {
      return NextResponse.json({ error: "No se pudo leer esta imagen. Cargá los datos a mano." }, { status: 422 });
    }

    const text = response.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join("");
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) {
      return NextResponse.json({ error: "No se pudieron leer los datos de la factura." }, { status: 422 });
    }

    const raw = JSON.parse(match[0]) as Record<string, unknown>;
    const num = (v: unknown) => (typeof v === "number" && Number.isFinite(v) && v > 0 ? v : null);
    const str = (v: unknown) => (typeof v === "string" && v.trim() ? v.trim() : null);

    return NextResponse.json({
      kwh: num(raw.kwh),
      dias: num(raw.dias),
      distribuidora: str(raw.distribuidora),
      provincia: str(raw.provincia),
      montoTotal: num(raw.monto_total),
      desde: str(raw.periodo_desde),
      hasta: str(raw.periodo_hasta),
    });
  } catch (error) {
    if (error instanceof Anthropic.AuthenticationError) {
      return NextResponse.json({ error: "La clave de Claude del servidor no es válida." }, { status: 500 });
    }
    if (error instanceof Anthropic.RateLimitError) {
      return NextResponse.json({ error: "Muchas lecturas seguidas. Esperá un momento y reintentá." }, { status: 429 });
    }
    if (error instanceof Anthropic.APIError) {
      console.error("factura-ocr:", error.status, error.message);
      return NextResponse.json({ error: "No se pudo leer la factura ahora. Cargá los datos a mano." }, { status: 502 });
    }
    console.error("factura-ocr:", error);
    return NextResponse.json({ error: "No se pudieron leer los datos de la factura." }, { status: 500 });
  }
}
