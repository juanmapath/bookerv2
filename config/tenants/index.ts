import { abBarbershopConfig } from "./ab-barbershop";
import { amDentalOfficeConfig } from "./am-dental-office";
import { TenantConfig } from "@/types/tenant";

const tenants: Record<string, TenantConfig> = {
  "ab-barbershop": abBarbershopConfig,
  "am-dental-office": amDentalOfficeConfig,
};

export function getTenantConfig(id: string): TenantConfig | undefined {
  return tenants[id];
}
