import { TenantConfig } from "@/types/tenant";

export const amDentalOfficeConfig: TenantConfig = {
  id: "am-dental-office",
  brand: {
    name: "AM Dental Office",
    logo: "/am-do-logo.jpg",
    subtitle: "Comienza tu camino de cuidado",
    titleHtml: '',
    subtitleHtml: '<span class="text-4xl text-[var(--color-tertiary)] font-bold">Comienza tu <br/><span class="text-[var(--color-primary)]">camino de cuidado.</span></span><br/><br/><span class="text-[var(--color-secondary)] text-sm tracking-normal normal-case">Completa el formulario de registro para programar tu próxima cita.</span>',
  },
  theme: {
    colors: {
      "surface-dim": "#f8ebf8", // pale pink background
      "surface-container-lowest": "#ffffff",
      "surface-variant": "#f4e0f4",
      background: "#fcf4f9", // Based on screenshot background
      outline: "#d1b3d1",
      primary: "#7021B6", // Purple
      "primary-dim": "#571692",
      "on-primary": "#ffffff",
      secondary: "#a075a0",
      tertiary: "#511287", // Darker purple text
      "surface-container-low": "#f6e4f6",
      "surface-container": "#ffffff", // white cards
      "surface-bright": "#f3e8ff", // light purple hue for active card
      "outline-variant": "#ebd5eb",
    },
    fonts: {
      headline: "Manrope", // Using Manrope for headline (or maybe another sans serif)
      body: "Manrope",
      label: "Manrope",
    },
    hexagonPattern: false, // No pattern for dental office
    components: {
      inputStyle: "w-full bg-[var(--color-surface-container)] rounded-2xl border-0 shadow-sm focus:ring-2 focus:ring-[var(--color-primary)] text-[var(--color-tertiary)] placeholder:text-[var(--color-outline)] py-3 px-4 transition-all duration-300",
      cardStyle: "bg-transparent border-none shadow-none p-0",
    }
  },
  api: {
    webhookEndpoint: "form-patient",
    professionalsEndpoint: "form-patient",
    slotsEndpoint: "form-patient",
  },
  texts: {
    professionalLabel: "Selecciona Especialista",
    callToAction: "Agendar Cita",
    successMessage: "¡Tu cita ha sido programada con éxito!",
  },
  formFields: [
    { name: "name", label: "Nombre", type: "text", placeholder: "Ingresa tu nombre", required: true },
    { name: "last_name", label: "Apellido", type: "text", placeholder: "Ingresa tu apellido", required: true },
    { name: "email", label: "Correo electrónico", type: "email", placeholder: "email@ejemplo.com", required: true },
    { name: "wa", label: "WhatsApp", type: "tel", placeholder: "57...", required: true }
  ],
  contact: {
    phone: "+57 312 000 1234",
    location: "Laureles – Medellín",
    coordinates: "4.6853,-74.0531",
    instagramUrl: "https://www.instagram.com/am_dentaloffice/"
  },
  serviceTypes: ["Control", "Valoración", "Procedimiento"]
};
