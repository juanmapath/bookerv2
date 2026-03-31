import { NextResponse } from "next/server";
import { getTenantConfig } from "@/config/tenants";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const tenantId = searchParams.get("tenantId");
  const date = searchParams.get("date");
  const professional = searchParams.get("professional");

  if (!tenantId || !professional) {
    return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
  }

  const config = getTenantConfig(tenantId);
  if (!config) return NextResponse.json({ error: "Tenant not found" }, { status: 404 });

  const n8nUrl = `https://n8n.topi.cash/webhook/${config.api.slotsEndpoint || 'disponibilidad'}`;
  const isDental = config.id === "am-dental-office";

  try {
    const res = await fetch(isDental ? n8nUrl : `${n8nUrl}?fecha=${date}&barbero=${encodeURIComponent(professional)}`, { 
      method: isDental ? "POST" : "GET", 
      headers: { "Content-Type": "application/json" },
      body: isDental ? JSON.stringify({ 
        flow: "availability", 
        dentist: professional, 
        wap: 573163994204 
      }) : undefined
    });

    if (!res.ok) throw new Error("Failed to fetch slots from n8n");
    const data = await res.json();

    // Transformación para el Dental Office (Bulk Availability)
    if (isDental && Array.isArray(data)) {
      const bulkAvailability: Record<string, string[]> = {};
      data.forEach((item: any) => {
        // Soportar tanto las keys antiguas como las nuevas de n8n
        const itemDate = item.date || item.Fecha;
        const itemSlots = item.slots || item.Disponibilidad;
        
        if (itemDate && itemSlots) {
          try {
            const slots = typeof itemSlots === 'string' 
              ? JSON.parse(itemSlots) 
              : itemSlots;
            bulkAvailability[itemDate] = slots;
          } catch (e) {
            console.error("Error parsing slots for date", itemDate, e);
          }
        }
      });
      return NextResponse.json(bulkAvailability);
    }

    // Formato estándar para otros tenants (como el barbero)
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching slots:", error);
    return NextResponse.json({ error: "No se pudieron obtener los horarios" }, { status: 500 });
  }
}
