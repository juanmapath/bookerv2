import { NextResponse } from "next/server";
import { getTenantConfig } from "@/config/tenants";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const tenantId = searchParams.get("tenantId");
  const isNewPatient = searchParams.get("isNewPatient") === "true";

  if (!tenantId) return NextResponse.json({ error: "Missing tenantId" }, { status: 400 });

  const config = getTenantConfig(tenantId);
  if (!config) return NextResponse.json({ error: "Tenant not found" }, { status: 404 });

  const n8nUrl = `https://n8n.topi.cash/webhook/${config.api.professionalsEndpoint || config.api.webhookEndpoint}`;
  const isPost = config.api.professionalsEndpoint === "form-patient";
  const postBody = isPost
    ? { flow: "dentists", wap: 573163994204, ...(isNewPatient ? { valoration: true } : {}) }
    : undefined;

  try {
    const res = await fetch(n8nUrl, {
      method: isPost ? "POST" : "GET",
      headers: { "Content-Type": "application/json" },
      body: isPost ? JSON.stringify(postBody) : undefined
    });
    if (!res.ok) throw new Error("Failed to fetch from n8n");
    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching professionals:", error);
    return NextResponse.json({ error: "No se pudieron obtener los profesionales" }, { status: 500 });
  }
}
