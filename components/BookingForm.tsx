"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { TenantConfig } from "@/types/tenant";
import { MdChevronLeft, MdChevronRight, MdEdit, MdCheck } from "react-icons/md";

type UserState = "loading" | "unregistered" | "registered";
type NotificationType = "success" | "error" | "warning";

interface AgendaItem {
  id: string;
  summary?: string;
  date: string;
  start: string;
  end?: string;
  status?: string;
  dentist?: string;
}

export default function BookingForm({ config, prefilledWa }: { config: TenantConfig; prefilledWa?: string }) {
  const isDental = config.id === "am-dental-office";

  // Wizard states (dental only)
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [notification, setNotification] = useState<{ type: NotificationType; message: string } | null>(null);
  const [bookingConfirmed, setBookingConfirmed] = useState<{
    type: "new" | "reschedule";
    date: string;
    time: string;
    specialist: string;
  } | null>(null);

  // Global states
  const [loading, setLoading] = useState(false);
  const [loadingProfs, setLoadingProfs] = useState(!isDental);
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

  const [patientStatus, setPatientStatus] = useState<"existing" | "new" | null>(null);
  const [calViewYear, setCalViewYear] = useState(() => new Date().getFullYear());
  const [calViewMonth, setCalViewMonth] = useState(() => new Date().getMonth());
  const selectedType = isDental
    ? patientStatus === "existing" ? "Control" : "Valoración"
    : config.serviceTypes?.[0] || "";

  const [userState, setUserState] = useState<UserState>("loading");
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [agendas, setAgendas] = useState<AgendaItem[]>([]);
  const [selectedAgenda, setSelectedAgenda] = useState<AgendaItem | null>(null);
  const [agendaLoading, setAgendaLoading] = useState(false);
  const [isEditingInfo, setIsEditingInfo] = useState(false);

  // ── Helpers ──────────────────────────────────────────────────

  const showNotification = (type: NotificationType, message: string, autoDismiss = true) => {
    setNotification({ type, message });
    if (autoDismiss) setTimeout(() => setNotification(null), 4000);
  };

  const goBack = () => {
    setNotification(null);
    if (step === 2) {
      setStep(1);
    } else if (step === 3) {
      setStep(2);
      setSelectedSlot("");
    }
  };

  // ── Initialize: Check User & Fetch Agenda ────────────────────

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
          setFormData({ wa });
          setIsEditingInfo(false);
          if (isDental) setStep(2);
          await fetchUserAgenda(wa);
        } else {
          setUserState("unregistered");
          setIsEditingInfo(true);
          setFormData({ wa });
        }
      } catch (err) {
        console.error("Error fetching user data", err);
        setUserState("unregistered");
        setIsEditingInfo(true);
        setFormData({ wa: prefilledWa });
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
        setAgendas(Array.isArray(data) ? data : []);
        setSelectedAgenda(null);
      }
    } catch (e) {
      console.error("Error fetching agenda", e);
    } finally {
      setAgendaLoading(false);
    }
  };

  // ── Fetch Professionals — non-dental (on mount) ───────────────

  useEffect(() => {
    if (isDental) return;
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

  // ── Fetch Professionals — dental (triggered by patient status) ──

  useEffect(() => {
    if (!isDental || patientStatus === null) return;
    setProfessionals([]);
    setSelectedProf("");
    setAllSlots({});
    setSelectedSlot("");
    setLoadingProfs(true);
    async function fetchProfs() {
      try {
        const res = await fetch(
          `/api/professionals?tenantId=${config.id}&isNewPatient=${patientStatus === "new"}`
        );
        if (!res.ok) throw new Error("API error");
        const data = await res.json();
        setProfessionals(Array.isArray(data) ? data : []);
      } catch (e) {
        console.error("Error cargando especialistas", e);
      } finally {
        setLoadingProfs(false);
      }
    }
    fetchProfs();
  }, [patientStatus, config.id]);

  // ── Date String Logic ─────────────────────────────────────────

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

  // ── Fetch Slots ───────────────────────────────────────────────

  useEffect(() => {
    async function fetchSlots() {
      if (!selectedProf) return;
      if (!isDental && !selectedDateIso) return;
      setLoadingSlots(true);
      if (!isDental) setSelectedSlot("");
      try {
        const url = `/api/slots?tenantId=${config.id}&professional=${encodeURIComponent(selectedProf)}${
          !isDental ? `&date=${selectedDateIso}` : ""
        }`;
        const res = await fetch(url);
        if (res.ok) {
          const data = await res.json();
          if (isDental) {
            setAllSlots(data);
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
                  setSelectedDateIso(nextDateStr);
                  setCalViewYear(nextDateObj.getFullYear());
                  setCalViewMonth(nextDateObj.getMonth());
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

  // ── Flujo V: Solo actualizar Info ─────────────────────────────

  const handleUpdateInfo = async () => {
    if (!formData.name || !formData.email) {
      showNotification("error", "Completa los datos esenciales");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/book", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, tenantId: config.id, actionType: "update-info" }),
      });
      if (!res.ok) throw new Error("API Error");
      showNotification("success", "Información personal actualizada correctamente.");
      setIsEditingInfo(false);
    } catch (err) {
      showNotification("error", "Error actualizando información.");
    } finally {
      setLoading(false);
    }
  };

  // ── Flujo VI/VII: Agendar / Actualizar Agenda ─────────────────

  const handleBookingAction = async (actionType: "create-new" | "create-agenda" | "update-agenda") => {
    if (!selectedSlot) {
      showNotification("error", "Por favor selecciona un horario");
      return;
    }
    if (actionType === "create-new") {
      const requiredFields = config.formFields.filter((f) => f.required);
      for (const field of requiredFields) {
        if (!formData[field.name]) {
          showNotification("error", `Por favor completa el campo: ${field.label}`);
          return;
        }
      }
    }
    setLoading(true);
    try {
      if (actionType === "create-new") {
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
          body: JSON.stringify(infoPayload),
        });
        if (!infoRes.ok) throw new Error("Error enviando información personal");

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
          body: JSON.stringify(agendaPayload),
        });
        if (!agendaRes.ok) throw new Error("Error creando la agenda");
      } else {
        const payload: Record<string, unknown> = {
          ...formData,
          tenantId: config.id,
          actionType,
          dentist: selectedProf,
          date: selectedDateIso,
          start: selectedSlot,
          type: selectedType,
        };
        if (actionType === "update-agenda" && selectedAgenda?.id) {
          payload.event_id = selectedAgenda.id;
        }
        const res = await fetch("/api/book", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error("API Error");
      }

      if (actionType === "create-new") setUserState("registered");
      await fetchUserAgenda(formData.wa || (prefilledWa as string));
      if (isDental) {
        setBookingConfirmed({
          type: actionType === "update-agenda" ? "reschedule" : "new",
          date: selectedDateIso,
          time: selectedSlot,
          specialist: selectedProf,
        });
      }
      setSelectedSlot("");
      setSelectedAgenda(null);
      setPatientStatus(null);
      setSelectedProf("");
      setAllSlots({});
    } catch (err) {
      showNotification("error", "Error al procesar la cita. Intenta de nuevo.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // ── Loading state ─────────────────────────────────────────────

  if (userState === "loading") {
    return (
      <div className="w-full flex-col flex items-center justify-center py-20 animate-pulse text-[var(--color-primary)]">
        <div className="w-8 h-8 rounded-full border-4 border-[var(--color-primary)] border-t-transparent animate-spin mb-4" />
        <p className="font-label uppercase tracking-widest text-[10px]">Cargando experiencia...</p>
      </div>
    );
  }

  // ── Dental Wizard ─────────────────────────────────────────────

  if (isDental) {
    const stepLabels = ["Datos", "Especialista", "Cita"];

    const StepProgress = () => (
      <div className="mb-8">
        <div className="flex items-center justify-center mb-3">
          {stepLabels.map((label, i) => {
            const sn = i + 1;
            const done = sn < step;
            const active = sn === step;
            return (
              <div key={label} className="flex items-center">
                <div className="flex flex-col items-center">
                  <div
                    className={[
                      "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300",
                      done
                        ? "bg-[var(--color-primary)] text-[var(--color-on-primary)]"
                        : active
                        ? "bg-[var(--color-primary)] text-[var(--color-on-primary)] ring-4 ring-[var(--color-primary)]/20"
                        : "bg-[var(--color-surface-container-low)] text-[var(--color-secondary)] border-2 border-[var(--color-outline-variant)]",
                    ].join(" ")}
                  >
                    {done ? <MdCheck size={16} /> : sn}
                  </div>
                  <span
                    className={[
                      "text-[9px] font-label uppercase tracking-widest mt-1.5 font-bold",
                      active ? "text-[var(--color-primary)]" : "text-[var(--color-secondary)] opacity-50",
                    ].join(" ")}
                  >
                    {label}
                  </span>
                </div>
                {i < stepLabels.length - 1 && (
                  <div
                    className={[
                      "w-10 h-0.5 mx-2 mb-5 transition-all duration-500",
                      sn < step ? "bg-[var(--color-primary)]" : "bg-[var(--color-outline-variant)]/40",
                    ].join(" ")}
                  />
                )}
              </div>
            );
          })}
        </div>
        <p className="text-center text-[9px] font-label uppercase tracking-[0.25em] text-[var(--color-secondary)] opacity-60">
          Paso {step} de 3
        </p>
      </div>
    );

    const NotificationBanner = () =>
      notification ? (
        <div
          className={[
            "mb-6 px-4 py-3 rounded-xl flex items-center gap-3 text-sm font-body",
            notification.type === "success"
              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
              : notification.type === "error"
              ? "bg-red-50 text-red-700 border border-red-200"
              : "bg-amber-50 text-amber-700 border border-amber-200",
          ].join(" ")}
        >
          <span className="flex-1 font-medium">{notification.message}</span>
          <button
            onClick={() => setNotification(null)}
            className="opacity-50 hover:opacity-100 text-lg leading-none shrink-0"
          >
            ✕
          </button>
        </div>
      ) : null;

    // ── VISTA DE ÉXITO ────────────────────────────────────────

    if (bookingConfirmed) {
      const isReschedule = bookingConfirmed.type === "reschedule";
      const formattedDate = new Date(bookingConfirmed.date + "T00:00:00").toLocaleDateString("es-ES", {
        weekday: "long",
        day: "numeric",
        month: "long",
      });

      return (
        <div className="flex flex-col items-center justify-center min-h-[calc(100svh-160px)] text-center px-2">
          <div className="w-16 h-16 rounded-full bg-[var(--color-primary)]/10 flex items-center justify-center mb-6">
            <MdCheck size={36} className="text-[var(--color-primary)]" />
          </div>

          <h2 className="font-headline font-bold text-2xl text-[var(--color-tertiary)] tracking-tight mb-2">
            {isReschedule ? "¡Cita reprogramada!" : "¡Cita agendada!"}
          </h2>
          <p className="text-[var(--color-secondary)] font-body text-sm mb-8 max-w-xs">
            {config.texts.successMessage}
          </p>

          <div className="w-full p-4 rounded-xl bg-[var(--color-surface-container-lowest)] border border-[var(--color-outline-variant)]/40 text-left space-y-3 mb-10">
            <div>
              <p className="text-[9px] font-label uppercase tracking-widest text-[var(--color-secondary)] opacity-60 mb-0.5">
                Fecha y hora
              </p>
              <p className="font-bold text-[var(--color-tertiary)] text-sm capitalize">
                {formattedDate} · {bookingConfirmed.time}
              </p>
            </div>
            <div>
              <p className="text-[9px] font-label uppercase tracking-widest text-[var(--color-secondary)] opacity-60 mb-0.5">
                Especialista
              </p>
              <p className="font-bold text-[var(--color-tertiary)] text-sm">
                {bookingConfirmed.specialist}
              </p>
            </div>
          </div>

        </div>
      );
    }

    // ── PASO 1: Datos / Citas ──────────────────────────────────

    if (step === 1) {
      const handleContinue = async () => {
        if (userState === "unregistered") {
          const missing = config.formFields.filter((f) => {
            if (!f.required) return false;
            const isWa = f.name === "wa" || f.name === "wap";
            if (isWa && prefilledWa) return false;
            return !formData[f.name];
          });
          if (missing.length > 0) {
            showNotification("error", `Completa: ${missing.map((f) => f.label).join(", ")}`);
            return;
          }
        } else {
          // Registered: save data silently before continuing (only if fields were filled)
          if (formData.name || formData.email) {
            setLoading(true);
            try {
              await fetch("/api/book", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ...formData, tenantId: config.id, actionType: "update-info" }),
              });
            } catch {
              // non-blocking: proceed even if save fails
            } finally {
              setLoading(false);
            }
          }
        }
        setNotification(null);
        setStep(2);
      };

      return (
        <div className="flex flex-col min-h-[calc(100svh-160px)]">
          <StepProgress />
          <NotificationBanner />

          {/* Title: solo para usuarios nuevos; registrados ven encabezado de edición */}
          {userState === "registered" ? (
            <div className="mb-8">
              <h2 className="font-headline font-bold text-2xl text-[var(--color-tertiary)] tracking-tight mb-1">
                Tus datos personales
              </h2>
              <p className="text-[var(--color-secondary)] font-body text-sm">
                Actualiza tu información y presiona Guardar.
              </p>
            </div>
          ) : config.brand.subtitleHtml ? (
            <div className="font-label mb-8" dangerouslySetInnerHTML={{ __html: config.brand.subtitleHtml }} />
          ) : (
            <h2 className="font-headline italic text-3xl md:text-4xl text-[var(--color-tertiary)] tracking-tight mb-8 text-center">
              Reserva tu cita
            </h2>
          )}

          {/* Formulario de datos personales (nombre, apellido, correo) */}
          <div className="space-y-6 mb-6">
            {config.formFields.map((field) => {
              const isWa = field.name === "wa" || field.name === "wap";
              if (isWa) return null;
              return (
                <div key={field.name} className="relative group">
                  <label className="block text-sm font-label font-semibold text-[var(--color-secondary)] mb-2 ml-1">
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

          <div className="mt-auto pt-8">
            <button
              type="button"
              onClick={handleContinue}
              disabled={loading}
              className="w-full h-12 bg-[var(--color-primary)] text-[var(--color-on-primary)] font-headline font-bold text-sm rounded-xl shadow-lg shadow-[var(--color-primary)]/20 active:scale-95 transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? "Guardando..." : "Continuar →"}
            </button>
          </div>
        </div>
      );
    }

    // ── PASO 2: Especialista ───────────────────────────────────

    if (step === 2) {
      const canContinue = (patientStatus !== null || !!selectedAgenda) && selectedProf !== "";

      return (
        <div className="flex flex-col min-h-[calc(100svh-160px)]">
          <StepProgress />
          <NotificationBanner />

          <button
            type="button"
            onClick={goBack}
            className="flex items-center gap-1 text-[10px] text-[var(--color-secondary)] uppercase tracking-widest font-bold hover:text-[var(--color-primary)] transition-colors mb-6"
          >
            <MdChevronLeft size={16} /> Atrás
          </button>

          <h3 className="font-headline font-bold text-xl text-[var(--color-tertiary)] tracking-tight mb-6">
            Tu especialista
          </h3>

          {/* Patient type (only if not rescheduling) */}
          {!selectedAgenda && (
            <div className="mb-6">
              <label className="block text-sm font-label font-semibold text-[var(--color-secondary)] mb-4 ml-1">
                ¿Eres paciente actual?
              </label>
              <div className="grid grid-cols-2 gap-4">
                {(
                  [
                    { value: "existing", label: "Sí, lo soy" },
                    { value: "new", label: "No, soy nuevo" },
                  ] as const
                ).map(({ value, label }) => (
                  <label
                    key={value}
                    className="relative flex items-center justify-center h-16 rounded-xl bg-[var(--color-surface-container-low)] cursor-pointer hover:bg-[var(--color-surface-container)] transition-all border-2 border-transparent has-[:checked]:border-[var(--color-primary)] has-[:checked]:bg-[var(--color-surface-bright)]"
                  >
                    <input
                      className="sr-only peer"
                      name="patient_status"
                      type="radio"
                      value={value}
                      checked={patientStatus === value}
                      onChange={() => setPatientStatus(value)}
                    />
                    <span className="font-body font-semibold text-[var(--color-secondary)] peer-checked:text-[var(--color-primary)]">
                      {label}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Professional selection */}
          {(patientStatus !== null || !!selectedAgenda) && (
            <div className="mb-6">
              <label className="block text-sm font-label font-semibold text-[var(--color-secondary)] mb-3 ml-1">
                {config.texts.professionalLabel}
              </label>
              <div className="flex overflow-x-auto gap-3 pb-2 snap-x snap-mandatory hide-scrollbars justify-center px-2 md:px-0 items-stretch">
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
                    const fallback = prof.Genero === "F" ? "/dentist2.png" : "/dentist1.png";
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
                            <Image
                              src={imageUrl}
                              alt={prof.Nombre}
                              fill
                              className="object-cover scale-[1.1]"
                              sizes="56px"
                            />
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
          )}

          <div className="mt-auto pt-8">
            <button
              type="button"
              onClick={() => {
                if (!canContinue) {
                  const msg =
                    !patientStatus && !selectedAgenda
                      ? "Selecciona si eres paciente actual"
                      : "Selecciona un especialista";
                  showNotification("error", msg);
                  return;
                }
                setNotification(null);
                setStep(3);
              }}
              disabled={!canContinue}
              className="w-full h-12 bg-[var(--color-primary)] text-[var(--color-on-primary)] font-headline font-bold text-sm rounded-xl shadow-lg shadow-[var(--color-primary)]/20 active:scale-95 transition-all duration-200 disabled:opacity-40"
            >
              Continuar →
            </button>
          </div>
        </div>
      );
    }

    // ── PASO 3: Fecha y hora ───────────────────────────────────

    const actionType = selectedAgenda
      ? "update-agenda"
      : userState === "registered"
      ? "create-agenda"
      : "create-new";

    const todayObj = new Date();
    todayObj.setHours(0, 0, 0, 0);
    const maxDate = new Date(todayObj);
    maxDate.setDate(todayObj.getDate() + MAX_DAYS_AHEAD);
    const toIso = (d: Date) =>
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    const firstDow = new Date(calViewYear, calViewMonth, 1).getDay();
    const startOffset = (firstDow + 6) % 7;
    const daysInMonth = new Date(calViewYear, calViewMonth + 1, 0).getDate();
    const cells: (number | null)[] = [
      ...Array(startOffset).fill(null),
      ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
    ];

    return (
      <>
        <StepProgress />
        <NotificationBanner />

        <button
          type="button"
          onClick={goBack}
          className="flex items-center gap-1 text-[10px] text-[var(--color-secondary)] uppercase tracking-widest font-bold hover:text-[var(--color-primary)] transition-colors mb-6"
        >
          <MdChevronLeft size={16} /> Atrás
        </button>

        <h3 className="font-headline font-bold text-xl text-[var(--color-tertiary)] tracking-tight mb-6">
          Selecciona tu cita
        </h3>

        {/* Citas existentes para reprogramar (solo usuarios registrados con agenda) */}
        {userState === "registered" && (agendas.length > 0 || agendaLoading) && (
          <div className="mb-6 space-y-2">
            <p className="text-[10px] text-[var(--color-secondary)] tracking-[0.2em] uppercase font-bold mb-3">
              ¿Reprogramar una cita existente?
            </p>
            {agendaLoading ? (
              <div className="py-4 rounded-xl border border-[var(--color-outline-variant)]/30 text-center animate-pulse text-[10px] uppercase tracking-widest text-[var(--color-secondary)]">
                Sincronizando agenda...
              </div>
            ) : (
              agendas.map((item) => {
                const isSelected = selectedAgenda?.id === item.id;
                return (
                  <div
                    key={item.id}
                    onClick={() => {
                      setSelectedAgenda(isSelected ? null : item);
                    }}
                    className={[
                      "rounded-xl border p-4 cursor-pointer transition-all duration-200",
                      isSelected
                        ? "border-[var(--color-primary)] bg-[var(--color-surface-bright)] shadow-sm"
                        : "border-[var(--color-outline-variant)]/40 bg-[var(--color-surface-container-lowest)] hover:border-[var(--color-primary)]/50",
                    ].join(" ")}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-[var(--color-tertiary)] font-extrabold text-sm">
                          <span className="opacity-70 capitalize mr-2">
                            {item.date.substring(5).replace("-", "/")}
                          </span>
                          {item.start}
                        </p>
                        {item.dentist && (
                          <p className="text-[var(--color-secondary)] text-[10px] mt-0.5 uppercase tracking-wide">
                            {item.dentist}
                          </p>
                        )}
                      </div>
                      <div
                        className={[
                          "w-5 h-5 rounded-full border-2 shrink-0 transition-all flex items-center justify-center",
                          isSelected
                            ? "border-[var(--color-primary)] bg-[var(--color-primary)]"
                            : "border-[var(--color-outline-variant)]",
                        ].join(" ")}
                      >
                        {isSelected && <MdCheck size={12} className="text-[var(--color-on-primary)]" />}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
            <div className="border-t border-[var(--color-outline-variant)]/30 pt-2 mt-2" />
          </div>
        )}

        {/* Calendar */}
        <div className="space-y-4 mb-6">
          <div className="flex items-center justify-between px-1">
            <button
              type="button"
              onClick={() => {
                if (calViewMonth === 0) {
                  setCalViewYear((y) => y - 1);
                  setCalViewMonth(11);
                } else setCalViewMonth((m) => m - 1);
              }}
              disabled={
                calViewYear === new Date().getFullYear() && calViewMonth === new Date().getMonth()
              }
              className="p-1.5 rounded-full hover:bg-[var(--color-surface-container-low)] text-[var(--color-secondary)] disabled:opacity-30 transition-all"
            >
              <MdChevronLeft size={20} />
            </button>
            <span className="font-headline font-bold text-[var(--color-tertiary)] text-sm capitalize">
              {new Date(calViewYear, calViewMonth).toLocaleDateString("es-ES", {
                month: "long",
                year: "numeric",
              })}
            </span>
            <button
              type="button"
              onClick={() => {
                if (calViewMonth === 11) {
                  setCalViewYear((y) => y + 1);
                  setCalViewMonth(0);
                } else setCalViewMonth((m) => m + 1);
              }}
              className="p-1.5 rounded-full hover:bg-[var(--color-surface-container-low)] text-[var(--color-secondary)] transition-all"
            >
              <MdChevronRight size={20} />
            </button>
          </div>

          <div className="grid grid-cols-7 text-center mb-0.5">
            {["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"].map((d) => (
              <div key={d} className="text-[10px] font-semibold text-[var(--color-secondary)] py-0.5">
                {d}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-y-1">
            {cells.map((day, i) => {
              if (!day) return <div key={i} />;
              const dateObj = new Date(calViewYear, calViewMonth, day);
              const iso = toIso(dateObj);
              const available = !!(allSlots[iso]?.length);
              const disabled = dateObj < todayObj || dateObj > maxDate || !available;
              const selected = iso === selectedDateIso;
              return (
                <div key={i} className="flex items-center justify-center py-0.5">
                  <button
                    type="button"
                    disabled={disabled}
                    onClick={() => {
                      setSelectedDateIso(iso);
                      setSelectedSlot("");
                    }}
                    className={[
                      "w-8 h-8 rounded-full text-xs transition-all flex items-center justify-center shrink-0",
                      selected
                        ? "bg-[var(--color-primary)] text-[var(--color-on-primary)] font-bold shadow-sm"
                        : available
                        ? "bg-[var(--color-surface-variant)] text-[var(--color-primary)] font-semibold hover:bg-[var(--color-primary)]/20 cursor-pointer"
                        : "text-[var(--color-outline-variant)] cursor-default",
                    ].join(" ")}
                  >
                    {day}
                  </button>
                </div>
              );
            })}
          </div>

          {/* Time slots */}
          {selectedDateIso && (
            <div className="pt-2 border-t border-[var(--color-outline-variant)]/30">
              <p className="text-xs font-label font-semibold text-[var(--color-secondary)] mb-2 capitalize">
                {new Date(selectedDateIso + "T00:00:00").toLocaleDateString("es-ES", {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                })}
              </p>
              {loadingSlots ? (
                <div className="py-3 text-center animate-pulse text-xs text-[var(--color-secondary)]">
                  Consultando cupos...
                </div>
              ) : currentSlots.length === 0 ? (
                <div className="py-3 text-center text-xs text-[var(--color-secondary)] opacity-60">
                  Sin horarios disponibles
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-1.5">
                  {currentSlots.map((time) => (
                    <button
                      key={time}
                      type="button"
                      onClick={() => setSelectedSlot(time)}
                      className={[
                        "py-2 rounded-lg text-xs font-medium transition-all border",
                        selectedSlot === time
                          ? "bg-[var(--color-primary)] text-[var(--color-on-primary)] border-[var(--color-primary)] shadow-sm"
                          : "bg-white text-[var(--color-primary)] border-[var(--color-outline-variant)] hover:border-[var(--color-primary)] hover:bg-[var(--color-surface-container-low)]",
                      ].join(" ")}
                    >
                      {time}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Inline confirmation block for rescheduling */}
        {actionType === "update-agenda" && selectedSlot && (
          <div className="mb-4 p-4 rounded-xl bg-[var(--color-surface-container-lowest)] border border-[var(--color-primary)]/30">
            <p className="font-label font-bold text-[var(--color-tertiary)] text-sm mb-1">
              ¿Confirmar reprogramación?
            </p>
            <p className="text-[var(--color-secondary)] text-xs mb-0.5 capitalize">
              {new Date(selectedDateIso + "T00:00:00").toLocaleDateString("es-ES", {
                weekday: "long",
                day: "numeric",
                month: "long",
              })}{" "}
              · {selectedSlot}
            </p>
            {selectedProf && (
              <p className="text-[var(--color-secondary)] text-xs">{selectedProf}</p>
            )}
          </div>
        )}

        {/* Action button */}
        <button
          type="button"
          onClick={() => handleBookingAction(actionType)}
          disabled={loading || !selectedSlot}
          className="w-full h-11 bg-[var(--color-primary)] text-[var(--color-on-primary)] font-headline font-bold text-sm rounded-xl shadow-md shadow-[var(--color-primary)]/20 active:scale-95 duration-200 flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {loading
            ? "Procesando cita..."
            : actionType === "update-agenda"
            ? "Confirmar Reprogramación"
            : config.texts.callToAction}
        </button>

        {!selectedSlot && (
          <p className="text-[9px] text-center text-[var(--color-secondary)] mt-2 uppercase tracking-wider opacity-60">
            Selecciona una fecha y horario para continuar
          </p>
        )}
      </>
    );
  }

  // ── Original non-dental render (sin cambios) ──────────────────

  return (
    <>
      {/* SECCIÓN A: TITULO Y SALUDO */}
      <div className="mb-12">
        {config.brand.titleHtml && (
          <h2
            className="font-headline tracking-tight mb-2"
            dangerouslySetInnerHTML={{ __html: config.brand.titleHtml }}
          />
        )}
        {!config.brand.titleHtml && !config.brand.subtitleHtml && (
          <h2 className="font-headline italic text-3xl md:text-4xl text-[var(--color-tertiary)] tracking-tight mb-2 text-center">
            Reserva tu cita
          </h2>
        )}

        {userState === "registered" ? (
          <>
            {config.brand.subtitleHtml ? (
              <div
                className="font-label mb-2"
                dangerouslySetInnerHTML={{
                  __html: config.brand.subtitleHtml
                    .replace(/Comienza tu/gi, "Continúa tu")
                    .replace(/Completa el formulario.*/gi, ""),
                }}
              />
            ) : null}
            <p className="font-label text-[10px] uppercase tracking-[0.3em] text-[var(--color-secondary)] text-center">
              <span className="text-[var(--color-primary)] font-bold">¡Bienvenido de nuevo!</span> Gestiona tu
              próxima cita
            </p>
          </>
        ) : (
          <>
            {config.brand.subtitleHtml ? (
              <div
                className="font-label"
                dangerouslySetInnerHTML={{ __html: config.brand.subtitleHtml }}
              />
            ) : (
              <p className="font-label text-[10px] uppercase tracking-[0.3em] text-[var(--color-secondary)] text-center">
                {config.brand.subtitle}
              </p>
            )}
          </>
        )}
      </div>

      <div className="space-y-8">
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
          <div
            className={
              userState === "registered"
                ? "p-4 rounded-xl bg-[var(--color-surface-container-lowest)] border border-[var(--color-outline-variant)]"
                : ""
            }
          >
            {userState === "registered" && (
              <h3 className="font-label text-[10px] uppercase tracking-[0.2em] text-[var(--color-tertiary)] mb-4 font-bold opacity-80 text-center">
                Tus Datos Personales
              </h3>
            )}
            <div className="space-y-6">
              {config.formFields.map((field) => {
                const isWa =
                  field.name === "wa" || field.name === "wap" || field.name === "telefono";
                if (isWa && prefilledWa && userState === "unregistered") return null;
                return (
                  <div key={field.name} className="relative group">
                    <label className="block text-sm font-label font-semibold text-[var(--color-secondary)] mb-2 ml-1">
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

        {/* SECCIÓN C: PROFESIONAL Y PROGRAMACIÓN */}
        {(agendas.length === 0 || selectedAgenda !== null) && (
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-label font-semibold text-[var(--color-secondary)] mb-3 ml-1">
                {config.texts.professionalLabel}
              </label>
              <div className="flex overflow-x-auto gap-3 pb-2 snap-x snap-mandatory hide-scrollbars justify-center px-2 md:px-0 items-stretch">
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
                    const fallback = prof.Genero === "F" ? "/barber2.png" : "/barber1.png";
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
                          <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-[var(--color-surface-variant)] transition-all shrink-0 mb-2 bg-[var(--color-surface-container)] flex items-center justify-center relative">
                            <Image
                              src={imageUrl}
                              alt={prof.Nombre}
                              fill
                              className="object-cover scale-[1.1]"
                              sizes="56px"
                            />
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

            {/* Day navigator + slots (non-dental) */}
            {selectedProf && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <label className="block text-sm font-label font-semibold text-[var(--color-secondary)] ml-1">
                    Programación
                  </label>
                  <div className="flex items-center bg-[var(--color-surface-container-low)] px-1.5 py-1 rounded-xl border border-[var(--color-outline-variant)]/30 shadow-inner">
                    <button
                      type="button"
                      onClick={() => setDateOffset((p) => Math.max(0, p - 1))}
                      disabled={dateOffset === 0}
                      className="text-[var(--color-secondary)] hover:text-[var(--color-primary)] disabled:opacity-20 transition-all p-1"
                    >
                      <MdChevronLeft size={24} />
                    </button>
                    <div className="flex flex-col items-center px-2">
                      <span className="text-[var(--color-tertiary)] font-extrabold text-[10px] uppercase tracking-wider leading-none mb-1">
                        {dayLabel}
                      </span>
                      <span className="text-[var(--color-secondary)] text-[8px] uppercase tracking-[0.1em] font-medium leading-none">
                        {dateLabel}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setDateOffset((p) => Math.min(MAX_DAYS_AHEAD, p + 1))}
                      disabled={dateOffset >= MAX_DAYS_AHEAD}
                      className="text-[var(--color-secondary)] hover:text-[var(--color-primary)] disabled:opacity-20 transition-all p-1"
                    >
                      <MdChevronRight size={24} />
                    </button>
                  </div>
                </div>
                <div className="max-h-[160px] overflow-y-auto pr-1 custom-scrollbar">
                  {loadingSlots ? (
                    <div className="py-6 text-center animate-pulse text-[10px] uppercase tracking-widest text-[var(--color-secondary)]">
                      Consultando cupos...
                    </div>
                  ) : currentSlots.length === 0 ? (
                    <div className="py-6 text-center text-[10px] uppercase text-[var(--color-secondary)] tracking-widest opacity-60 font-bold">
                      No hay turnos disponibles el {dateLabel}
                    </div>
                  ) : (
                    <div className="grid grid-cols-4 gap-2">
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
                          <div className="py-2.5 text-center rounded-lg bg-[var(--color-surface-container-lowest)] border border-[var(--color-outline-variant)]/40 peer-checked:bg-[var(--color-primary)] peer-checked:text-[var(--color-on-primary)] peer-checked:shadow-sm text-[var(--color-secondary)] text-[10px] uppercase font-bold transition-all hover:border-[var(--color-primary)]/50">
                            {time}
                          </div>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* SECCIÓN D: BOTÓN PRINCIPAL */}
        <div className="pt-2">
          <button
            type="button"
            onClick={() =>
              handleBookingAction(userState === "registered" ? "create-agenda" : "create-new")
            }
            disabled={loading || !selectedSlot}
            className="w-full h-16 bg-[var(--color-primary)] text-[var(--color-on-primary)] font-headline font-bold text-lg rounded-xl shadow-lg shadow-[var(--color-primary)]/20 active:scale-95 duration-200 flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? "Procesando cita..." : config.texts.callToAction}
          </button>
        </div>
      </div>
    </>
  );
}
