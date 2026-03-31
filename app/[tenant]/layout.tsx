import { getTenantConfig } from "@/config/tenants";
import { notFound } from "next/navigation";
import { ReactNode } from "react";

export default async function TenantLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ tenant: string }>;
}) {
  const resolvedParams = await params;
  const config = getTenantConfig(resolvedParams.tenant);

  if (!config) {
    notFound();
  }

  // Prepara las variables CSS basadas en la configuración
  const cssVars = {
    "--color-surface-dim": config.theme.colors["surface-dim"],
    "--color-surface-container-lowest": config.theme.colors["surface-container-lowest"],
    "--color-surface-variant": config.theme.colors["surface-variant"],
    "--color-background": config.theme.colors.background,
    "--color-outline": config.theme.colors.outline,
    "--color-primary": config.theme.colors.primary,
    "--color-primary-dim": config.theme.colors["primary-dim"],
    "--color-on-primary": config.theme.colors["on-primary"],
    "--color-secondary": config.theme.colors.secondary,
    "--color-tertiary": config.theme.colors.tertiary,
    "--color-surface-container-low": config.theme.colors["surface-container-low"],
    "--color-surface-container": config.theme.colors["surface-container"],
    "--color-surface-bright": config.theme.colors["surface-bright"],
    "--color-outline-variant": config.theme.colors["outline-variant"],
  } as React.CSSProperties;

  return (
    <html lang="es" style={cssVars} className={`bg-[var(--color-background)] text-[var(--color-tertiary)] ${config.theme.hexagonPattern ? "hexagon-pattern" : ""}`}>
      <body className="min-h-full flex flex-col">
        <style>{`
          /* Import Google Fonts dynamically for this tenant */
          @import url('https://fonts.googleapis.com/css2?family=Noto+Serif:ital,wght@0,400;0,700;1,400;1,700&family=Manrope:wght@300;400;500;600;700;800&display=swap');
          
          .font-headline { font-family: '${config.theme.fonts.headline}', serif; }
          .font-body { font-family: '${config.theme.fonts.body}', sans-serif; }
          .font-label { font-family: '${config.theme.fonts.label}', sans-serif; }
        `}</style>
        
        {/* We can include google icons globally here */}
        <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet" />

        {children}
      </body>
    </html>
  );
}
