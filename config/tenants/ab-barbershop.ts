import { TenantConfig } from "@/types/tenant";

export const abBarbershopConfig: TenantConfig = {
  id: "ab-barbershop",
  brand: {
    name: "AB Barbershop",
    logo: "/ab_logo.jpg",
    subtitle: "Tu mejor versión empieza aquí",
  },
  theme: {
    colors: {
      "surface-dim": "#0e0e0e",
      "surface-container-lowest": "#000000",
      "surface-variant": "#252626",
      background: "#0e0e0e",
      outline: "#767575",
      primary: "#c6c6c6",
      "primary-dim": "#b8b9b9",
      "on-primary": "#3f4041",
      secondary: "#9f9d9d",
      tertiary: "#faf9f9",
      "surface-container-low": "#131313",
      "surface-container": "#191a1a",
      "surface-bright": "#2b2c2c",
      "outline-variant": "#484848",
    },
    fonts: {
      headline: "Noto Serif",
      body: "Manrope",
      label: "Manrope",
    },
    hexagonPattern: true,
    components: {
      inputStyle: "w-full bg-transparent border-0 border-b border-[var(--color-outline-variant)] focus:border-[var(--color-primary)] focus:ring-0 text-[var(--color-tertiary)] placeholder:text-[var(--color-outline)]/50 py-2 transition-all duration-300",
      cardStyle: "bg-[var(--color-surface-container)]/80 backdrop-blur-md rounded-xl p-5 border border-[var(--color-outline-variant)]/30 shadow-[0px_20px_40px_-5px_rgba(255,255,255,0.04)]"
    }
  },
  api: {
    webhookEndpoint: "barberia-disponibilidad",
    professionalsEndpoint: "barberos",
    slotsEndpoint: "disponibilidad",
  },
  texts: {
    professionalLabel: "Selecciona Barbero",
    callToAction: "Confirmar Cita",
    successMessage: "¡Cita agendada con éxito!",
  },
  formFields: [
    { name: "nombre", label: "Nombre completo", type: "text", placeholder: "Ej. Alejandro Martínez", required: true },
    { name: "telefono", label: "Teléfono (WhatsApp)", type: "tel", placeholder: "Ej. +57 300 123 4567", required: true }
  ],
  contact: {
    phone: "+57 300 000 0000",
    location: "Local 123, CC Principal",
    coordinates: "4.60971,-74.08175",
    instagramUrl: "https://instagram.com/ab.barbershop"
  }
};
