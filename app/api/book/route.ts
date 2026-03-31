import { NextResponse } from "next/server";
import { getTenantConfig } from "@/config/tenants";

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const { tenantId, actionType, ...formData } = data;

    const config = getTenantConfig(tenantId);
    if (!config) {
      return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
    }

    const { webhookEndpoint } = config.api;
    const n8nUrl = `https://n8n.topi.cash/webhook/${webhookEndpoint}`;

    // Helper para mapear "wa" a "wap" para el webhook
    const cleanFormData = { ...formData };
    if (cleanFormData.wa && !cleanFormData.wap) {
      cleanFormData.wap = cleanFormData.wa;
    }
    // Asegurar que wap sea numérico
    if (cleanFormData.wap) {
      const strippedNumber = String(cleanFormData.wap).replace(/\D/g, "");
      cleanFormData.wap = parseInt(strippedNumber, 10);
    }

    if (webhookEndpoint === "form-patient") {
      if (actionType === "update-info") {
        // Flujo V: Solo actualizar info
        const infoPayload = {
          flow: "set-info",
          name: cleanFormData.name,
          last_name: cleanFormData.last_name,
          email: cleanFormData.email,
          wap: cleanFormData.wap
        };
        await sendToN8N(n8nUrl, infoPayload);
        return NextResponse.json({ success: true, message: "Información actualizada" });
      } 
      else if (actionType === "create-agenda") {
        // Flujo VI: Solo agendar
        const agendaPayload = {
          flow: "create-agenda",
          type: cleanFormData.type || "Control",
          wap: cleanFormData.wap,
          dentist: cleanFormData.dentist,
          date: cleanFormData.date,
          start: cleanFormData.start
        };
        await sendToN8N(n8nUrl, agendaPayload);
        return NextResponse.json({ success: true, message: config.texts.successMessage });
      }
      else if (actionType === "update-agenda") {
        // Flujo VII: Modificar cita
        const updatePayload = {
          flow: "update-agenda",
          type: cleanFormData.type || "Control",
          wap: cleanFormData.wap,
          dentist: cleanFormData.dentist,
          date: cleanFormData.date,
          start: cleanFormData.start,
          event_id: cleanFormData.event_id
        };
        await sendToN8N(n8nUrl, updatePayload);
        return NextResponse.json({ success: true, message: "Reserva modificada" });
      }
      else {
        // Fallback default
        cleanFormData.flow = "set-info";
        await sendToN8N(n8nUrl, cleanFormData);
      }
    } else {
      // Logic for barbershop and other tenants
      await sendToN8N(n8nUrl, cleanFormData);
    }

    // Simular retraso UI (opcional, pero util si queremos feedback visual constante)
    await new Promise((resolve) => setTimeout(resolve, 800));

    return NextResponse.json({ success: true, message: config.texts.successMessage });
  } catch (error) {
    console.error("Booking Error:", error);
    return NextResponse.json(
      { error: "Error procesando la solicitud" },
      { status: 500 }
    );
  }
}

async function sendToN8N(url: string, payload: any) {
  console.log(">>> Sending to n8n:", url);
  console.log(">>> Payload:", JSON.stringify(payload, null, 2));
  
  const n8nResponse = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const responseText = await n8nResponse.text();
  console.log(">>> n8n response status:", n8nResponse.status);
  console.log(">>> n8n response body:", responseText);

  if (!n8nResponse.ok) {
    throw new Error(`Failed to forward to N8N (Status ${n8nResponse.status}) - ${responseText}`);
  }
  
  return responseText;
}
