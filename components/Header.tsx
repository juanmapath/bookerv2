import Image from "next/image";

import { TenantConfig } from "@/types/tenant";

export default function Header({ brand }: { brand: TenantConfig["brand"] }) {
  return (
    <header className="fixed top-0 w-full z-50 bg-[var(--color-surface-dim)]/60 backdrop-blur-xl flex justify-between items-center px-6 py-2 max-w-full">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-[var(--color-surface-container)] flex items-center justify-center border border-[var(--color-outline-variant)]/20 overflow-hidden relative">
          <Image
            src={brand.logo}
            alt={`${brand.name} Logo`}
            fill
            className="object-cover scale-[1.4]"
            sizes="32px"
          />
        </div>
        {brand.titleHtml ? (
          <h1 className="text-xl font-bold tracking-tighter font-headline" dangerouslySetInnerHTML={{ __html: brand.titleHtml }} />
        ) : (
          <h1 className="text-xl font-bold italic text-[var(--color-tertiary)] tracking-tighter font-headline">
            {brand.name}
          </h1>
        )}
      </div>
      <div className="flex items-center gap-4">
        <button className="bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-primary-dim)] text-[var(--color-on-primary)] px-4 py-1.5 rounded-lg font-label text-[11px] uppercase tracking-widest font-bold hover:scale-95 transition-all duration-150">
          Citas
        </button>
      </div>
      <div className="absolute bottom-0 left-0 bg-gradient-to-b from-[var(--color-surface-container)] to-transparent h-px w-full"></div>
    </header>
  );
}
