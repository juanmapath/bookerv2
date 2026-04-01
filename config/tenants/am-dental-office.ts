import { TenantConfig } from "@/types/tenant";

export const amDentalOfficeConfig: TenantConfig = {
  id: "am-dental-office",
  brand: {
    name: "AM Dental Office",
    logo: "/am-do-logo.jpg",
    subtitle: "Comienza tu camino de cuidado",
    titleHtml: '',
    subtitleHtml: '<span class="text-xs font-label font-semibold tracking-wider text-[var(--color-primary)] mb-2 block">Portal del Paciente</span><h2 class="text-4xl md:text-5xl font-headline font-extrabold text-[var(--color-tertiary)] leading-tight">Comienza tu <br/><span class="text-[var(--color-primary)]">camino de cuidado.</span></h2><p class="mt-4 text-[var(--color-secondary)] font-body text-base">Completa el formulario de registro para programar tu próxima cita.</p>',
  },
  theme: {
    colors: {
      "surface-dim": "#fff3fd",
      "surface-container-lowest": "#ffffff",
      "surface-variant": "#f7d0ff",
      background: "#fff3fd",
      outline: "#8b6c94",
      primary: "#7f30c3",
      "primary-dim": "#721fb6",
      "on-primary": "#fbefff",
      secondary: "#6e5177",    // on-surface-variant — color de labels
      tertiary: "#3f2547",     // on-background — color de headings y texto
      "surface-container-low": "#feebff",
      "surface-container": "#fbdfff",
      "surface-bright": "#fff3fd",
      "outline-variant": "#c4a1cc",
    },
    fonts: {
      headline: "Manrope",
      body: "Inter",
      label: "Inter",
    },
    hexagonPattern: false, // No pattern for dental office
    components: {
      inputStyle: "w-full h-14 px-5 rounded-xl border-none bg-white shadow-sm focus:ring-2 focus:ring-[var(--color-primary)] focus:bg-white transition-all text-[var(--color-tertiary)] placeholder:text-[var(--color-outline-variant)]/60 [&:-webkit-autofill]:shadow-[inset_0_0_0_1000px_#ffffff] [&:-webkit-autofill]:[--webkit-text-fill-color:var(--color-tertiary)]",
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
