"use client";

import { useState, useEffect, FormEvent } from "react";
import Image from "next/image";
import { TenantConfig } from "@/types/tenant";
import { MdChevronLeft, MdChevronRight, MdEdit } from "react-icons/md";

type UserState = "loading" | "unregistered" | "registered";

interface AgendaItem {
  id: string; // Used as event_id
  summary?: string;
  date: string;
  start: string;
  end?: string;
  status?: string;
  dentist?: string;
}

export default function BookingForm({ config, prefilledWa }: { config: TenantConfig; prefilledWa?: string }) {
  // Global states
  const [loading, setLoading] = useState(false);
  const isDental = config.id === "am-dental-office";

  // Navigation / Slot states
  const [loadingProfs, setLoadingProfs] = useState(true);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [professionals, setProfessionals] = useState<any[]>([]);
  const [selectedProf, setSelectedProf] = useState("");

  const MAX_DAYS_AHEAD = 60;
  const [dateOffset, setDateOffset] = useState(0);
  const [selectedDateIso, setSelectedDateIso] = useState("");
  const [dayLabel, setDayLabel] = useState("");
  const [dateLabel, setDateLabel] = useState("");

  const [allSlots, setAllSlots] = useState<Record<string, string[]>>({});
  const [selectedSlot, setSelectedSlot] = useState("");

  const [selectedType, setSelectedType] = useState(config.serviceTypes?.[0] || "");

  // Flujo I & II states
  const [userState, setUserState] = useState<UserState>("loading");
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [agenda, setAgenda] = useState<AgendaItem | null>(null);
  const [agendaLoading, setAgendaLoading] = useState(false);
  const [isEditingInfo, setIsEditingInfo] = useState(false);

  // Initialize: Check User & Fetch Agenda
  useEffect(() => {
    if (!prefilledWa) {
      setUserState("unregistered");
      setIsEditingInfo(true);
      return;
    }

    const checkUser = async (wa: string) => {
      try {
        const userRes = await fetch(`/api/user?tenantId=${config.id}&wa=${wa}`);
        let isRegistered = false;
        if (userRes.ok) {
          const userData = await userRes.json();
          isRegistered = userData.exist;
        }

        if (isRegistered) {
          setUserState("registered");
          setFormData({ wa: wa }); 
          setIsEditingInfo(false);
          await fetchUserAgenda(wa);
        } else {
          setUserState("unregistered");
          setIsEditingInfo(true);
          setFormData({ wa: wa }); 
        }
      } catch (err) {
         console.error("Error fetching user data", err);
         setUserState("unregistered");
         setIsEditingInfo(true);
         setFormData({ wa: wa });
      }
    };

    checkUser(prefilledWa);
  }, [prefilledWa, config.id]);

  const fetchUserAgenda = async (wa: string) => {
    setAgendaLoading(true);
    try {
      const res = await fetch(`/api/agenda?tenantId=${config.id}&wa=${wa}`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          setAgenda(data[0]);
        } else {
          setAgenda(null);
        }
      }
    } catch (e) {
      console.error("Error fetching agenda", e);
    } finally {
      setAgendaLoading(false);
    }
  };

  // Fetch Professionals
  useEffect(() => {
    async function fetchProfs() {
      try {
        const res = await fetch(`/api/professionals?tenantId=${config.id}`);
        if (!res.ok) throw new Error("API error");
        const data = await res.json();
        setProfessionals(Array.isArray(data) ? data : []);
        if (data.length > 0) setSelectedProf(data[0].Nombre);
      } catch (e) {
        console.error("Error cargando profesionales", e);
      } finally {
        setLoadingProfs(false);
      }
    }
    fetchProfs();
  }, [config.id]);

  // Date String Logic
  useEffect(() => {
    const d = new Date();
    d.setDate(d.getDate() + dateOffset);

    let text = "";
    if (dateOffset === 0) text = "Hoy";
    else if (dateOffset === 1) text = "Mañana";
    else text = d.toLocaleDateString("es-ES", { weekday: "long" });

    setDayLabel(text);
    setDateLabel(d.toLocaleDateString("es-ES", { day: "numeric", month: "short" }));
    setSelectedDateIso(
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
    );
  }, [dateOffset]);

  // Fetch Slots
  useEffect(() => {
    async function fetchSlots() {
      if (!selectedProf) return;
      if (!isDental && !selectedDateIso) return;

      setLoadingSlots(true);
      if (!isDental) setSelectedSlot("");

      try {
        const url = `/api/slots?tenantId=${config.id}&professional=${encodeURIComponent(
          selectedProf
        )}${!isDental ? `&date=${selectedDateIso}` : ""}`;
        const res = await fetch(url);
        if (res.ok) {
          const data = await res.json();
          if (isDental) {
            setAllSlots(data);
            // Auto jump logic
            const dateKeys = Object.keys(data);
            if (dateKeys.length > 0) {
              const currentHasSlots = data[selectedDateIso] && data[selectedDateIso].length > 0;
              if (!currentHasSlots) {
                const today = new Date();
                today.setHours(0, 0, 0, 0);

                const futureDates = dateKeys
                  .filter((d) => data[d] && data[d].length > 0 && new Date(d + "T00:00:00") >= today)
                  .sort();

                if (futureDates.length > 0) {
                  const nextDateStr = futureDates[0];
                  const nextDateObj = new Date(nextDateStr + "T00:00:00");
                  const diffTime = nextDateObj.getTime() - today.getTime();
                  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                  if (diffDays >= 0 && diffDays !== dateOffset) {
                    setDateOffset(diffDays);
                  }
                }
              }
            }
          } else {
            const s = Array.isArray(data) ? data[0]?.slots || [] : data.slots || [];
            setAllSlots((prev) => ({ ...prev, [selectedDateIso]: s }));
          }
        }
      } catch (e) {
        console.error("Error cargando slots", e);
      } finally {
        setLoadingSlots(false);
      }
    }
    fetchSlots();
  }, [selectedProf, isDental ? null : selectedDateIso, config.id]);

  const currentSlots = allSlots[selectedDateIso] || [];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  /** Flujo V: Solo actualizar Info */
  const handleUpdateInfo = async () => {
    if (!formData.name || !formData.email) return alert("Completa los datos esenciales");
    setLoading(true);
    try {
      const res = await fetch("/api/book", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, tenantId: config.id, actionType: "update-info" }),
      });
      if (!res.ok) throw new Error("API Error");
      alert("Información personal actualizada correctamente.");
      setIsEditingInfo(false);
    } catch (err) {
      alert("Error actualizando información.");
    } finally {
      setLoading(false);
    }
  };

  /** Flujo VI y Flujo VII: Agendar / Actualizar Agenda */
  const handleBookingAction = async (actionType: "create-new" | "create-agenda" | "update-agenda") => {
    if (!selectedSlot) return alert("Por favor selecciona un horario");

    if (actionType === "create-new") {
      const requiredFields = config.formFields.filter(f => f.required);
      for (const field of requiredFields) {
        if (!formData[field.name]) {
          return alert(`Por favor completa el campo: ${field.label}`);
        }
      }
    }

    if (actionType === "update-agenda") {
      const proceed = window.confirm(`¿Estás seguro que deseas reprogramar tu cita para el ${selectedDateIso} a las ${selectedSlot}?`);
      if (!proceed) return;
    }

    setLoading(true);
    try {
      if (actionType === "create-new") {
        // 1. Set Info Endpoint
        const infoPayload = {
          tenantId: config.id,
          actionType: "update-info",
          name: formData.name,
          last_name: formData.last_name,
          email: formData.email,
          wa: formData.wa,
        };
        const infoRes = await fetch("/api/book", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(infoPayload)
        });
        if (!infoRes.ok) throw new Error("Error enviando información personal");
        
        // 2. Create Agenda Endpoint
        const agendaPayload = {
          tenantId: config.id,
          actionType: "create-agenda",
          type: selectedType,
          wa: formData.wa,
          dentist: selectedProf,
          date: selectedDateIso,
          start: selectedSlot,
        };
        const agendaRes = await fetch("/api/book", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(agendaPayload)
        });
        if (!agendaRes.ok) throw new Error("Error creando la agenda");
      } else {
        const payload = {
          ...formData, // Esto solo se usa si actionType es distinto a create-new, para no romper lógica anterior
          tenantId: config.id,
          actionType,
          dentist: selectedProf,
          date: selectedDateIso,
          start: selectedSlot,
          type: selectedType,
        };

        if (actionType === "update-agenda" && agenda?.id) {
          (payload as any).event_id = agenda.id;
        }

        const res = await fetch("/api/book", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (!res.ok) throw new Error("API Error");
      }
      
      alert(config.texts.successMessage);

      // Refresh agenda locally
      if (actionType === "create-new") {
        setUserState("registered");
      }
      
      // Sincronizar agenda real de nuevo para obtener el event_id correcto de n8n
      await fetchUserAgenda(formData.wa || (prefilledWa as string));
      
      // Limpiar selección para evitar re-envíos accidentales
      setSelectedSlot("");
      
    } catch (err) {
      alert("Error al procesar la cita. Intenta de nuevo.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };


  if (userState === "loading") {
    return (
      <div className="w-full flex-col flex items-center justify-center py-20 animate-pulse text-[var(--color-primary)]">
        <div className="w-8 h-8 rounded-full border-4 border-[var(--color-primary)] border-t-transparent animate-spin mb-4" />
        <p className="font-label uppercase tracking-widest text-[10px]">Cargando experiencia...</p>
      </div>
    );
  }

  return (
    <>
      {/* SECCIÓN A: TITULO Y SALUDO */}
      <div className="mb-6 text-center">
        {config.brand.titleHtml && (
          <h2
            className="font-headline tracking-tight mb-2"
            dangerouslySetInnerHTML={{ __html: config.brand.titleHtml }}
          />
        )}
        {!config.brand.titleHtml && !config.brand.subtitleHtml && (
          <h2 className="font-headline italic text-3xl md:text-4xl text-[var(--color-tertiary)] tracking-tight mb-2">
            Reserva tu cita
          </h2>
        )}

        {userState === "registered" ? (
          <>
            {config.brand.subtitleHtml ? (
              <div
                className="font-label max-w-[90%] mx-auto mb-2"
                dangerouslySetInnerHTML={{
                  __html: config.brand.subtitleHtml
                    .replace(/Comienza tu/gi, "Continúa tu")
                    .replace(/Completa el formulario.*/gi, "")
                }}
              />
            ) : null}
            <p className="font-label text-[10px] uppercase tracking-[0.3em] text-[var(--color-secondary)]">
              <span className="text-[var(--color-primary)] font-bold">¡Bienvenido de nuevo!</span> Gestiona tu próxima cita
            </p>
          </>
        ) : (
          <>
            {config.brand.subtitleHtml ? (
              <div
                className="font-label max-w-[90%] mx-auto"
                dangerouslySetInnerHTML={{ __html: config.brand.subtitleHtml }}
              />
            ) : (
              <p className="font-label text-[10px] uppercase tracking-[0.3em] text-[var(--color-secondary)]">
                {config.brand.subtitle}
              </p>
            )}
          </>
        )}
      </div>

      <div className="space-y-6">
        
        {/* SECCIÓN B: DATOS PERSONALES */}
        {userState === "registered" && !isEditingInfo ? (
          <div className="flex justify-center">
            <button
              type="button"
              onClick={() => setIsEditingInfo(true)}
              className="text-[10px] text-[var(--color-secondary)] uppercase tracking-[0.15em] hover:text-[var(--color-primary)] transition-colors flex items-center gap-1.5 underline underline-offset-4"
            >
              <MdEdit /> Editar información personal
            </button>
          </div>
        ) : (
          <div className={`p-4 rounded-xl ${userState === 'registered' ? 'bg-[var(--color-surface-container-lowest)] border border-[var(--color-outline-variant)]' : ''}`}>
            {userState === 'registered' && (
              <h3 className="font-label text-[10px] uppercase tracking-[0.2em] text-[var(--color-tertiary)] mb-4 font-bold opacity-80 text-center">
                Tus Datos Personales
              </h3>
            )}
            
            <div className="space-y-4">
              {config.formFields.map((field) => {
                // Ocultar WA solo si es usuario nuevo y el parámetro vino por URL
                const isWa = field.name === "wa" || field.name === "wap" || field.name === "telefono";
                if (isWa && prefilledWa && userState === "unregistered") {
                  return null;
                }

                return (
                  <div key={field.name} className="relative group">
                    <label className="font-label text-[10px] uppercase tracking-widest text-[var(--color-secondary)] mb-2 block pl-2">
                      {field.label}
                    </label>
                    <input
                      name={field.name}
                      value={formData[field.name] || ""}
                      onChange={handleInputChange}
                      className={config.theme.components?.inputStyle || ""}
                      placeholder={field.placeholder}
                      type={field.type}
                    />
                  </div>
                );
              })}
            </div>

            {userState === "registered" && isEditingInfo && (
              <div className="flex justify-center gap-3 mt-5">
                <button
                  type="button"
                  onClick={() => setIsEditingInfo(false)}
                  className="px-4 py-2 rounded-lg text-[10px] uppercase tracking-widest text-[var(--color-secondary)] hover:bg-[var(--color-surface-container-low)] transition-all font-bold"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleUpdateInfo}
                  disabled={loading}
                  className="px-4 py-2 rounded-lg text-[10px] uppercase tracking-[0.2em] bg-[var(--color-primary)] text-[var(--color-on-primary)] font-extrabold shadow-md shadow-[var(--color-primary)]/20 hover:scale-[0.98] transition-all disabled:opacity-50"
                >
                  {loading ? "Evaluando..." : "Actualizar info"}
                </button>
              </div>
            )}
          </div>
        )}

        {/* SECCIÓN C: CALENDARIO Y DENTISTA */}
        <div className="space-y-5">
          {/* Especialistas */}
          <div>
            <label className="font-label text-[10px] uppercase tracking-widest text-[var(--color-secondary)] mb-3 block pl-2">
              {config.texts.professionalLabel}
            </label>
            <div className="flex overflow-x-auto gap-3 pb-2 snap-x snap-mandatory hide-scrollbars justify-start md:justify-center px-2 md:px-0 items-stretch">
              {loadingProfs ? (
                <div className="w-full py-4 text-center text-[var(--color-secondary)] text-[10px] uppercase tracking-widest animate-pulse">
                  Cargando...
                </div>
              ) : professionals.length === 0 ? (
                <div className="w-full py-2 text-center text-[var(--color-secondary)] text-[10px] uppercase">
                  No disponibles
                </div>
              ) : (
                professionals.map((prof) => {
                  const fallback = isDental
                    ? prof.Genero === "F"
                      ? "/dentist2.png"
                      : "/dentist1.png"
                    : prof.Genero === "F"
                    ? "/barber2.png"
                    : "/barber1.png";
                  const imageUrl = prof.Foto || fallback;
                  return (
                    <label key={prof.Nombre} className="cursor-pointer snap-center shrink-0 w-[100px] flex">
                      <input
                        className="sr-only peer"
                        name="profesional"
                        type="radio"
                        value={prof.Nombre}
                        checked={selectedProf === prof.Nombre}
                        onChange={() => setSelectedProf(prof.Nombre)}
                      />
                      <div className="barber-card flex flex-col items-center p-2 rounded-xl bg-[var(--color-surface-container-lowest)] border border-[var(--color-outline-variant)]/40 transition-all duration-300 peer-checked:border-[var(--color-primary)] peer-checked:bg-[var(--color-surface-bright)] peer-checked:shadow-sm w-full h-full">
                        <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-[var(--color-surface-variant)] transition-all shrink-0 mb-2 peer-checked:border-[var(--color-primary)]/50 bg-[var(--color-surface-container)] flex items-center justify-center relative">
                          <Image src={imageUrl} alt={prof.Nombre} fill className="object-cover scale-[1.1]" sizes="56px" />
                        </div>
                        <div className="text-center w-full px-1 flex-1 flex flex-col justify-center">
                          <p className="text-[var(--color-primary)] font-extrabold text-[11px] leading-tight mb-0.5">
                            {prof.Nombre}
                          </p>
                          <p className="text-[var(--color-tertiary)] text-[8px] uppercase font-bold leading-tight opacity-80">
                            {prof.Profesion || prof.Nivel || "Staff"}
                          </p>
                        </div>
                      </div>
                    </label>
                  );
                })
              )}
            </div>
          </div>

          {/* Selector de Horario + Tipo (Si es dental) */}
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <label className="font-label text-[10px] uppercase tracking-widest text-[var(--color-secondary)] shrink-0 pl-2 text-center sm:text-left">
                Programación
              </label>

              <div className="flex flex-wrap items-center gap-3 justify-center sm:justify-end w-full sm:w-auto">
                 {/* Custom Styled Dropdown for Service Type */}
                 {config.serviceTypes && config.serviceTypes.length > 0 && (
                   <div className="relative min-w-[150px] w-full sm:w-auto group">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          const dropdown = e.currentTarget.nextElementSibling;
                          dropdown?.classList.toggle('hidden');
                        }}
                        className="w-full flex items-center justify-between gap-3 bg-[var(--color-surface-bright)] text-[var(--color-primary)] font-bold text-[10px] uppercase tracking-widest border-2 border-[var(--color-primary)]/20 shadow-sm rounded-xl pl-4 pr-3 py-3.5 focus:border-[var(--color-primary)]/60 outline-none cursor-pointer transition-all hover:bg-[var(--color-surface-container-low)]"
                      >
                        <span>{selectedType}</span>
                        <svg className="fill-current h-4 w-4 opacity-70" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                          <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"/>
                        </svg>
                      </button>
                      
                      <div className="hidden absolute z-50 top-full left-0 mt-2 w-full bg-[var(--color-surface-container-lowest)] border-2 border-[var(--color-primary)]/10 rounded-xl shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                        {config.serviceTypes.map((t) => (
                          <div
                            key={t}
                            onClick={() => {
                              setSelectedType(t);
                              const dropdowns = document.querySelectorAll('.group > div');
                              dropdowns.forEach(d => d.classList.add('hidden'));
                            }}
                            className={`px-4 py-3 text-[10px] uppercase font-bold tracking-widest cursor-pointer transition-colors ${
                              selectedType === t 
                                ? 'bg-[var(--color-primary)] text-[var(--color-on-primary)]' 
                                : 'text-[var(--color-tertiary)] hover:bg-[var(--color-surface-container-low)]'
                            }`}
                          >
                            {t}
                          </div>
                        ))}
                      </div>
                   </div>
                )}

                {/* Day Navigator */}
                <div className="flex items-center bg-[var(--color-surface-container-low)] px-1.5 py-1 rounded-xl border border-[var(--color-outline-variant)]/30 shadow-inner min-w-[130px] justify-between w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={() => setDateOffset((prev) => Math.max(0, prev - 1))}
                    disabled={dateOffset === 0}
                    className="text-[var(--color-secondary)] hover:text-[var(--color-primary)] disabled:opacity-20 transition-all p-1"
                  >
                    <MdChevronLeft size={24} />
                  </button>
                  <div className="flex flex-col items-center px-2">
                    <span className="text-[var(--color-tertiary)] font-extrabold text-[10px] uppercase tracking-wider leading-none mb-1 mt-0.5">
                      {dayLabel}
                    </span>
                    <span className="text-[var(--color-secondary)] text-[8px] uppercase tracking-[0.1em] font-medium leading-none mb-0.5">
                      {dateLabel}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setDateOffset((prev) => Math.min(MAX_DAYS_AHEAD, prev + 1))}
                    disabled={dateOffset >= MAX_DAYS_AHEAD}
                    className="text-[var(--color-secondary)] hover:text-[var(--color-primary)] disabled:opacity-20 transition-all p-1"
                  >
                    <MdChevronRight size={24} />
                  </button>
                </div>
              </div>
            </div>

            {/* Slots Grid */}
            <div className="max-h-[160px] overflow-y-auto pr-1 custom-scrollbar">
              {loadingSlots ? (
                <div className="col-span-4 py-6 text-center animate-pulse text-[10px] uppercase tracking-widest text-[var(--color-secondary)]">
                  Consultando cupos...
                </div>
              ) : currentSlots.length === 0 ? (
                <div className="col-span-4 py-6 text-center text-[10px] uppercase text-[var(--color-secondary)] tracking-widest opacity-60 font-bold">
                  No hay turnos disponibles el {dateLabel}
                </div>
              ) : (
                <div className="grid grid-cols-4 gap-2 text-center text-[var(--color-secondary)] text-[10px] uppercase tracking-widest">
                  {currentSlots.map((time) => (
                    <label key={time} className="cursor-pointer">
                      <input
                        className="sr-only peer"
                        name="hora"
                        type="radio"
                        value={time}
                        checked={selectedSlot === time}
                        onChange={() => setSelectedSlot(time)}
                      />
                      <div className="py-2.5 text-center rounded-lg bg-[var(--color-surface-container-lowest)] border border-[var(--color-outline-variant)]/40 peer-checked:bg-[var(--color-primary)] peer-checked:text-[var(--color-on-primary)] peer-checked:shadow-sm peer-checked:scale-[1.02] text-[var(--color-secondary)] text-[10px] uppercase font-bold transition-all hover:border-[var(--color-primary)]/50">
                        {time}
                      </div>
                    </label>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* SECCIÓN D: BOTONES PRINCIPALES DE GESTIÓN */}
        <div className="pt-2">
          {agendaLoading ? (
             <div className="py-6 rounded-xl border border-[var(--color-outline-variant)]/30 text-center animate-pulse text-[10px] uppercase tracking-widest text-[var(--color-secondary)]">
               Sincronizando agenda...
             </div>
          ) : agenda ? (
             <div className="rounded-xl border border-[var(--color-primary)]/30 bg-[var(--color-surface-bright)] p-5 text-center shadow-sm relative overflow-hidden">
               {/* Decorators */}
               <div className="absolute -top-4 -right-4 w-12 h-12 bg-[var(--color-primary)]/10 rounded-full blur-xl" />
               <div className="absolute -bottom-4 -left-4 w-12 h-12 bg-[var(--color-primary)]/10 rounded-full blur-xl" />
               
               <p className="text-[10px] text-[var(--color-secondary)] tracking-[0.2em] uppercase font-bold mb-1">
                 📅 TIENES UNA CITA AGENDADA
               </p>
               <h4 className="text-[16px] text-[var(--color-tertiary)] font-extrabold mb-5">
                  <span className="opacity-70 capitalize mr-2">{agenda.date.substring(5).replace('-', '/')}</span>
                  {agenda.start}
               </h4>
               
               <button
                 type="button"
                 onClick={() => handleBookingAction("update-agenda")}
                 disabled={loading || !selectedSlot}
                 className="w-full bg-[var(--color-surface-container-lowest)] text-[var(--color-primary)] border border-[var(--color-primary)]/40 py-3.5 rounded-lg font-label text-[11px] uppercase tracking-[0.2em] font-extrabold shadow-sm hover:bg-[var(--color-primary)] hover:text-[var(--color-on-primary)] transition-all duration-200 disabled:opacity-40"
               >
                 {loading ? "Actualizando..." : "Reprogramar o Modificar Cita"}
               </button>
               
               {!selectedSlot && (
                 <p className="text-[8px] text-[var(--color-primary)]/80 mt-3 uppercase tracking-wider font-bold">
                   Selecciona un nuevo horario arriba para habilitar reprogramación
                 </p>
               )}
             </div>
          ) : (
            <button
              type="button"
              onClick={() => handleBookingAction(userState === "registered" ? "create-agenda" : "create-new")}
              disabled={loading || !selectedSlot}
              className="w-full bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-primary-dim)] text-[var(--color-on-primary)] py-4 rounded-xl font-label text-[12px] uppercase tracking-[0.2em] font-extrabold shadow-lg shadow-[var(--color-primary)]/15 hover:scale-[0.99] transition-all duration-150 disabled:opacity-50"
            >
               {loading ? "Procesando cita..." : config.texts.callToAction}
            </button>
          )}
        </div>
      </div>
    </>
  );
}
