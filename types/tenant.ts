export interface FormField {
  name: string;
  label: string;
  type: string;
  placeholder: string;
  required: boolean;
}

export interface TenantConfig {
  id: string;
  brand: {
    name: string;
    logo: string;
    subtitle: string;
    titleHtml?: string;
    subtitleHtml?: string;
  };
  theme: {
    colors: {
      "surface-dim": string;
      "surface-container-lowest": string;
      "surface-variant": string;
      "background": string;
      "outline": string;
      "primary": string;
      "primary-dim": string;
      "on-primary": string;
      "secondary": string;
      "tertiary": string;
      "surface-container-low": string;
      "surface-container": string;
      "surface-bright": string;
      "outline-variant": string;
    };
    fonts: {
      headline: string;
      body: string;
      label: string;
    };
    hexagonPattern: boolean;
    components?: {
      inputStyle?: string;
      cardStyle?: string;
    };
  };
  api: {
    webhookEndpoint: string;
    professionalsEndpoint?: string;
    slotsEndpoint?: string;
  };
  texts: {
    professionalLabel: string;
    callToAction: string;
    successMessage: string;
  };
  formFields: FormField[];
  contact: {
    phone: string;
    location: string;
    coordinates?: string;
    instagramUrl: string;
  };
  serviceTypes?: string[];
}
