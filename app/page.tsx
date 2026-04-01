import Link from "next/link";
import { getTenantConfig } from "@/config/tenants";

const tenantIds = ["ab-barbershop", "am-dental-office"];

export default function Home() {
  const tenants = tenantIds.map((id) => getTenantConfig(id)!);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-zinc-50 dark:bg-zinc-900 px-6">
      <h1 className="text-2xl font-semibold text-zinc-800 dark:text-zinc-100 mb-2">
        Booker v2
      </h1>
      <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-8">
        Selecciona un tenant para ver su formulario de agendamiento
      </p>
      <ul className="flex flex-col gap-3 w-full max-w-xs">
        {tenants.map((tenant) => (
          <li key={tenant.id}>
            <Link
              href={`/${tenant.id}`}
              className="flex items-center justify-between w-full px-5 py-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 hover:border-zinc-400 dark:hover:border-zinc-500 transition-colors text-sm font-medium"
            >
              {tenant.brand.name}
              <span className="text-zinc-400 text-xs font-normal">{tenant.id}</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
