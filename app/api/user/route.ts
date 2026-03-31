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

  if (config.id !== "am-dental-office") {
      return NextResponse.json({ exist: false });
  }

  const { webhookEndpoint } = config.api;
  const n8nUrl = `https://n8n.topi.cash/webhook/${webhookEndpoint}`;
  const parsedWa = parseInt(wa.replace(/\D/g, ""), 10);

  try {
    const res = await fetch(n8nUrl, { 
      method: "POST", 
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        flow: "user-exists", 
        wap: parsedWa 
      })
    });

    if (!res.ok) throw new Error("Failed to check user existence");
    
    // Si responde vacio n8n por error
    const text = await res.text();
    if (!text.trim()) {
        return NextResponse.json({ exist: false });
    }
    
    const data = JSON.parse(text);
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching user status:", error);
    return NextResponse.json({ exist: false }); // Failsafe para permitir agendar como nuevo si falla
  }
}
