import { NextResponse } from "next/server";
import { getTenantConfig } from "@/config/tenants";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const tenantId = searchParams.get("tenantId");
  const wa = searchParams.get("wa") || searchParams.get("wap");

  if (!tenantId || !wa) {
    return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
  }

  const config = getTenantConfig(tenantId);
  if (!config) return NextResponse.json({ error: "Tenant not found" }, { status: 404 });

  // Solo el tenant dental tiene este flujo actualmente, pero se puede abstraer
  if (config.id !== "am-dental-office") {
      return NextResponse.json([]); // Barbershop no tiene endpoint agenda aun
  }

  const { webhookEndpoint } = config.api;
  const n8nUrl = `https://n8n.topi.cash/webhook/${webhookEndpoint}`;

  const parsedWa = parseInt(wa.replace(/\D/g, ""), 10);

  try {
    const res = await fetch(n8nUrl, { 
      method: "POST", 
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        flow: "get-current-agenda", 
        wap: parsedWa 
      })
    });

    if (!res.ok) throw new Error("Failed to fetch agenda from n8n");
    
    const text = await res.text();
    // Sometimes n8n returns empty string instead of []
    if (!text.trim()) {
        return NextResponse.json([]);
    }
    
    const data = JSON.parse(text);

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching agenda:", error);
    return NextResponse.json({ error: "No se pudo obtener la agenda" }, { status: 500 });
  }
}
