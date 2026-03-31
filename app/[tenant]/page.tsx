import { getTenantConfig } from "@/config/tenants";
import { notFound } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import BookingForm from "@/components/BookingForm";

export default async function TenantPage(props: {
  params: Promise<{ tenant: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const resolvedParams = await props.params;
  const searchParams = await props.searchParams;
  
  const config = getTenantConfig(resolvedParams.tenant);

  if (!config) {
    notFound();
  }

  const wa = typeof searchParams.wa === "string" ? searchParams.wa : undefined;

  return (
    <>
      <Header brand={config.brand} />
      
      <main className="flex-grow pt-12 pb-6 px-6 flex items-center justify-center font-body">
        <div className="max-w-xl w-full">
          

          <div className={config.theme.components?.cardStyle || "p-5"}>
            <BookingForm config={config} prefilledWa={wa} />
          </div>
        </div>
      </main>

      <Footer contact={config.contact} />
    </>
  );
}
