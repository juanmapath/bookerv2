# Booker v2

Sistema de agendamiento de citas multi-tenant construido con Next.js 16, React 19 y Tailwind CSS v4. Cada tenant tiene su propio branding, tema de colores, campos de formulario y conexión a webhooks de n8n para disponibilidad y reservas.

## Stack

- **Next.js 16.2** (App Router + Turbopack)
- **React 19**
- **Tailwind CSS v4**
- **TypeScript**

## Requisitos

- **Node.js >= 22.13.1** (el proyecto usa v24 — ver `.nvmrc`)
- npm 10+

## Levantamiento local

```bash
# Si usas nvm
nvm use

# Instalar dependencias (importante: si falla con errores de native bindings,
# elimina node_modules y package-lock.json antes de reinstalar)
rm -rf node_modules package-lock.json
npm install

# Iniciar servidor de desarrollo
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000).

> **Nota sobre native bindings de Tailwind v4:** hay un bug conocido de npm con dependencias opcionales ([npm#4828](https://github.com/npm/cli/issues/4828)). Si el servidor arranca con un error de `@tailwindcss/oxide`, ejecuta la limpieza completa de dependencias descrita arriba.

## Rutas

| Ruta | Descripción |
|------|-------------|
| `/` | Página de inicio (placeholder) |
| `/[tenant]` | Formulario de agendamiento del tenant |
| `/[tenant]?wa=573001234567` | Pre-rellena el campo WhatsApp |

### Tenants disponibles

| ID | Negocio |
|----|---------|
| `ab-barbershop` | AB Barbershop |
| `am-dental-office` | AM Dental Office |

Ejemplos:
- http://localhost:3000/ab-barbershop
- http://localhost:3000/am-dental-office

## API Routes

| Endpoint | Método | Descripción |
|----------|--------|-------------|
| `/api/professionals?tenantId=` | GET | Lista de profesionales del tenant |
| `/api/slots?tenantId=&date=&professional=` | GET | Slots de disponibilidad |
| `/api/book` | POST | Crea una reserva |
| `/api/agenda?tenantId=&wa=` | GET | Agenda actual del usuario (AM Dental) |
| `/api/user?tenantId=&wa=` | GET | Datos del usuario por WhatsApp |

Los endpoints de API se conectan a webhooks de n8n configurados por tenant.

## Agregar un nuevo tenant

1. Crea el archivo de configuración en [config/tenants/](config/tenants/) siguiendo el tipo `TenantConfig` de [types/tenant.ts](types/tenant.ts).
2. Regístralo en [config/tenants/index.ts](config/tenants/index.ts).
3. Accede en `http://localhost:3000/<nuevo-tenant-id>`.

## Estructura del proyecto

```
app/
  [tenant]/        # Página dinámica de cada tenant
  api/             # Rutas de API (professionals, slots, book, agenda, user)
  layout.tsx       # Layout raíz
  globals.css      # Estilos globales y variables CSS de tema
components/
  BookingForm.tsx  # Formulario principal de agendamiento
  Header.tsx
  Footer.tsx
config/
  tenants/         # Configuración de cada tenant (branding, tema, API, campos)
types/
  tenant.ts        # Tipos TypeScript del sistema
```

## Scripts

```bash
npm run dev    # Servidor de desarrollo (Turbopack)
npm run build  # Build de producción
npm run start  # Servidor de producción
npm run lint   # Linter
```
