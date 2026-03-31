import { FaMapMarkerAlt, FaPhoneAlt, FaInstagram } from "react-icons/fa";
import { TenantConfig } from "@/types/tenant";

export default function Footer({ contact }: { contact: TenantConfig["contact"] }) {
  return (
    <footer className="w-full py-6 px-8 bg-[var(--color-surface-container-low)] flex flex-col md:flex-row justify-between items-center gap-6 font-body mt-auto relative z-10 border-t border-[var(--color-outline-variant)]/20">
      <div className="flex flex-col items-center md:items-start opacity-70">
        <span className="font-extrabold text-[11px] uppercase tracking-widest text-[var(--color-secondary)] mb-1">Contacto</span>
        <div className="flex flex-col gap-1 text-[10px] text-[var(--color-outline)]">
          <span className="flex items-center gap-2"><FaPhoneAlt className="text-[10px]" /> {contact.phone}</span>
          <span className="flex items-center gap-2"><FaMapMarkerAlt className="text-[10px]" /> {contact.location}</span>
          {contact.coordinates && (
            <span className="text-[8px] opacity-50 ml-4 hidden md:block">GPS: {contact.coordinates}</span>
          )}
        </div>
      </div>
      
      <a href={contact.instagramUrl} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center w-10 h-10 rounded-full bg-[var(--color-surface-container)] border border-[var(--color-outline-variant)] text-[var(--color-secondary)] hover:text-[var(--color-primary)] transition-all social-icon-ig hover:scale-110">
        <FaInstagram size={18} />
      </a>
    </footer>
  );
}
