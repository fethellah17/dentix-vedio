import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { User, Phone, FileText, DollarSign, Activity, Stethoscope, CalendarCheck } from "lucide-react";
import { patientApi } from "@/lib/api";
import { type Patient } from "@/lib/mock-data";

interface PatientFileModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  patientId: string | null;
}

/* ──── reusable pieces ──── */

/** Compact Label: Value row */
function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-baseline gap-1.5 py-[2px] text-[13px] leading-tight">
      <span className="text-gray-500 font-medium shrink-0">{label}:</span>
      <span className="text-gray-900">{value ?? "—"}</span>
    </div>
  );
}

/** Section card with a slim header line */
function Section({
  icon: Icon,
  title,
  children,
}: {
  icon: React.ElementType;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="border border-neutral-200 rounded bg-white">
      <div className="flex items-center gap-1.5 px-3 py-1.5 border-b border-neutral-200 bg-neutral-50">
        <Icon className="h-3 w-3 text-gray-500" />
        <h3 className="text-[11px] font-bold text-gray-600 uppercase tracking-wider">
          {title}
        </h3>
      </div>
      <div className="px-3 py-2">{children}</div>
    </div>
  );
}

/* ──── main component ──── */

export function PatientFileModal({ open, onOpenChange, patientId }: PatientFileModalProps) {
  const [patient, setPatient] = useState<Patient | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPatientData = async () => {
      if (!patientId || !open) {
        setPatient(null);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const data = await patientApi.getById(patientId);
        setPatient(data);
      } catch (err) {
        console.error('Failed to fetch patient data:', err);
        setError('Impossible de charger les données du patient');
      } finally {
        setLoading(false);
      }
    };

    fetchPatientData();
  }, [patientId, open]);

  const resteAPayer = patient ? (patient.montantTotal || 0) - (patient.montantPaye || 0) : 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="!max-w-4xl w-full p-0 overflow-hidden">
        {/* ── Header ── */}
        <DialogHeader className="px-4 pt-3 pb-2.5 border-b border-neutral-200 bg-white">
          <DialogTitle className="flex items-center gap-2 text-base font-bold text-gray-900">
            <div className="h-7 w-7 rounded-full bg-neutral-100 flex items-center justify-center border border-neutral-200">
              <User className="h-3.5 w-3.5 text-gray-600" />
            </div>
            <div>
              <div className="text-base font-bold leading-tight">
                {patient ? `${patient.nom} ${patient.prenom}` : "Dossier Patient"}
              </div>
              {patient && (
                <div className="text-[11px] font-normal text-gray-500">
                  ID: {patient.id} • Créé le{" "}
                  {patient.dateCreation
                    ? new Date(patient.dateCreation).toLocaleDateString("fr-FR")
                    : "N/A"}
                </div>
              )}
            </div>
          </DialogTitle>
        </DialogHeader>

        {/* ── Loading ── */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-7 w-7 border-b-2 border-[#3b82f6]" />
              <p className="mt-2 text-xs text-gray-500">Chargement du dossier…</p>
            </div>
          </div>
        )}

        {/* ── Error ── */}
        {error && (
          <div className="mx-3 my-3 p-2.5 rounded bg-red-50 text-red-700 border border-red-200">
            <p className="text-sm font-medium">{error}</p>
          </div>
        )}

        {/* ── Body — 3-column dense dashboard ── */}
        {!loading && !error && patient && (
          <div className="px-3 py-3 bg-neutral-50/50">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">

              {/* ═══ COL 1 — Personal Info & Financial ═══ */}
              <div className="space-y-3">
                <Section icon={User} title="Informations Personnelles">
                  <Field label="Nom" value={patient.nom} />
                  <Field label="Prénom" value={patient.prenom} />
                  <Field label="Âge" value={`${patient.age} ans`} />
                  <Field
                    label="Téléphone"
                    value={
                      <span className="inline-flex items-center gap-1">
                        <Phone className="h-3 w-3 text-gray-400" />
                        {patient.telephone || "Non renseigné"}
                      </span>
                    }
                  />
                  <Field
                    label="Créé le"
                    value={
                      patient.dateCreation
                        ? new Date(patient.dateCreation).toLocaleDateString("fr-FR", {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          })
                        : "—"
                    }
                  />
                </Section>

                <Section icon={DollarSign} title="Résumé Financier">
                  <div className="flex items-baseline gap-1.5 py-[2px] text-[13px] leading-tight rounded px-1.5 -mx-1.5">
                    <span className="text-gray-500 font-medium shrink-0">Total:</span>
                    <span className="text-indigo-600 font-medium">{(patient.montantTotal ?? 0).toLocaleString()} DA</span>
                  </div>
                  <div className="flex items-baseline gap-1.5 py-[3px] text-[13px] leading-tight rounded px-1.5 -mx-1.5 bg-emerald-50/70">
                    <span className="text-gray-500 font-medium shrink-0">Payé:</span>
                    <span className="text-emerald-600 font-medium">{(patient.montantPaye ?? 0).toLocaleString()} DA</span>
                  </div>
                  <div className="flex items-baseline gap-1.5 py-[3px] text-[13px] leading-tight rounded px-1.5 -mx-1.5 bg-blue-50/70">
                    <span className="text-gray-500 font-medium shrink-0">Reste:</span>
                    <span className="text-blue-600 font-medium">{resteAPayer.toLocaleString()} DA</span>
                  </div>
                </Section>
              </div>

              {/* ═══ COL 2 — Medical History & Clinical Notes ═══ */}
              <div className="space-y-3">
                <Section icon={Stethoscope} title="Antécédents Médicaux">
                  <p className="text-[13px] text-gray-700 leading-snug whitespace-pre-wrap">
                    {patient.antecedents || "Aucun antécédent médical enregistré"}
                  </p>
                </Section>

                <Section icon={FileText} title="Notes Cliniques">
                  <p className="text-[13px] text-gray-700 leading-snug whitespace-pre-wrap">
                    {patient.clinicalNotes || "Aucune note clinique enregistrée"}
                  </p>
                </Section>
              </div>

              {/* ═══ COL 3 — Current Treatment & Steps ═══ */}
              <div className="space-y-3">
                <Section icon={Activity} title="Traitement en Cours">
                  <Field label="Catégorie" value={patient.categorie || "Non définie"} />
                  <Field label="Type de Soin" value={patient.typeSoin || "Non défini"} />
                  <Field
                    label="Étape passée"
                    value={patient.etapeActuelle || "Aucune"}
                  />
                </Section>

                {patient.stepsCompleted && patient.stepsCompleted.length > 0 && (
                  <Section icon={CalendarCheck} title="Étapes Complétées">
                    <ul className="space-y-0.5">
                      {patient.stepsCompleted.map((step, i) => (
                        <li
                          key={i}
                          className="flex items-center gap-1.5 text-[13px] text-gray-700 py-[1px]"
                        >
                          <span className="h-1.5 w-1.5 rounded-full bg-green-500 shrink-0" />
                          <span className="truncate">{step.stepName}</span>
                          <span className="text-[11px] text-gray-400 ml-auto shrink-0">
                            {new Date(step.completedAt).toLocaleDateString("fr-FR")}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </Section>
                )}
              </div>

            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
