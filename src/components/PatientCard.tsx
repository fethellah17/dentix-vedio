import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Edit2, Trash2, History, Wallet, CheckCircle2, MessageCircle, FileText, CalendarPlus, CircleCheck } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { getWhatsAppLink } from "@/lib/phone-utils";
import type { Patient } from "@/lib/mock-data";

interface PatientCardProps {
  patient: Patient;
  categoryName?: string;
  onEdit: (patient: Patient) => void;
  onDelete: (patientId: string) => void;
  onHistory: (patientId: string) => void;
  onPayment: (patientId: string) => void;
  onNotes: (patientId: string) => void;
  onQuickRdv?: (patient: Patient) => void;
  onToggleStatu?: (patientId: string) => void;
}

export function PatientCard({
  patient,
  categoryName,
  onEdit,
  onDelete,
  onHistory,
  onPayment,
  onNotes,
  onQuickRdv,
  onToggleStatu,
}: PatientCardProps) {
  // Helper function to check if patient is fully paid
  const isFullyPaid = (patient: Patient): boolean => {
    const montantTotal = patient.montantTotal || 0;
    const montantPaye = patient.montantPaye || 0;
    return montantTotal > 0 && montantPaye >= montantTotal;
  };

  const isDone = patient.statu === 1;

  return (
    <Card className={`border border-border shadow-sm hover:shadow-md transition-all bg-white dark:bg-slate-950 ${isDone ? 'opacity-50' : ''}`}>
      <CardContent className="p-6 space-y-5">
        {/* Top Row: Name and Category Badge */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            {onToggleStatu && (
              <button
                onClick={() => {
                  if (isDone && !window.confirm("Êtes-vous sûr de vouloir réactiver ce patient ?")) return;
                  onToggleStatu(patient.id);
                }}
                className={`flex-shrink-0 inline-flex items-center justify-center rounded-full p-1 transition-colors ${
                  isDone
                    ? 'text-slate-400 dark:text-slate-500'
                    : 'text-neutral-300 dark:text-neutral-600 hover:text-neutral-400 dark:hover:text-neutral-500'
                }`}
                title={isDone ? 'Marquer comme actif' : 'Marquer comme terminé'}
              >
                <CircleCheck className={`h-5 w-5 ${isDone ? 'fill-slate-400/30 dark:fill-slate-500/30' : ''}`} />
              </button>
            )}
            <Link
              to="/patients/$patientId"
              params={{ patientId: patient.id }}
              className="flex-1 min-w-0"
            >
              <h3 className="font-bold text-lg md:text-base text-foreground hover:text-primary transition-colors line-clamp-2">
                {patient.prenom} {patient.nom}
              </h3>
            </Link>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onNotes(patient.id)}
              className="p-2 h-auto hover:bg-accent"
              title="Notes cliniques"
            >
              <FileText
                className={`h-5 w-5 ${
                  patient.clinicalNotes
                    ? "fill-[#3b82f6] text-[#3b82f6]"
                    : "text-muted-foreground"
                }`}
              />
            </Button>
            {isFullyPaid(patient) && (
              <div title="Paiement complet">
                <CheckCircle2 className="h-6 w-6 text-green-600 dark:text-green-400 flex-shrink-0" />
              </div>
            )}
            {categoryName && (
              <Badge variant="outline" className="border-border text-foreground bg-muted/50 font-semibold text-sm whitespace-nowrap flex-shrink-0">
                {categoryName}
              </Badge>
            )}
          </div>
        </div>

        {/* Middle Row: Type de Soin and Étape Actuelle */}
        <div className="space-y-4 border-t border-b border-border py-4">
          <div>
            <p className="text-muted-foreground text-xs font-semibold uppercase tracking-wide mb-1">Type de Soin</p>
            <p className="text-foreground font-semibold text-base">
              {patient.typeSoin || "-"}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs font-semibold uppercase tracking-wide mb-1">Étape passée</p>
            <p className="text-foreground font-semibold text-base">
              {patient.etapeActuelle || "-"}
            </p>
          </div>
        </div>

        {/* Financial Info Row - Large and Clear */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-slate-50 dark:bg-slate-900 rounded-lg p-3">
            <p className="text-muted-foreground text-xs font-semibold uppercase tracking-wide mb-1">Montant Total</p>
            <p className="text-slate-700 dark:text-slate-300 font-bold text-lg">
              {(patient.montantTotal || 0).toLocaleString()} DA
            </p>
          </div>
          <div className={`rounded-lg p-3 ${isFullyPaid(patient) ? 'bg-green-100 dark:bg-green-950/50' : 'bg-green-50 dark:bg-green-950/30'}`}>
            <p className="text-muted-foreground text-xs font-semibold uppercase tracking-wide mb-1">Montant Payé</p>
            <div className="flex items-center gap-2">
              <p className="text-green-700 dark:text-green-400 font-bold text-lg">
                {(patient.montantPaye || 0).toLocaleString()} DA
              </p>
              {isFullyPaid(patient) && (
                <div title="Paiement complet">
                  <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0" />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Additional Info Row */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground text-xs font-semibold uppercase tracking-wide mb-1">Âge</p>
            <p className="text-foreground font-semibold text-base">{patient.age} ans</p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs font-semibold uppercase tracking-wide mb-1">Téléphone</p>
            <div className="flex items-center gap-1">
              <p className="text-foreground font-semibold text-base">{patient.telephone}</p>
              <a
                href={getWhatsAppLink(patient.telephone)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center p-1 text-green-600 hover:bg-green-100 dark:hover:bg-green-950/30 rounded-full transition-colors flex-shrink-0"
                title="Envoyer un message WhatsApp"
              >
                <MessageCircle className="h-5 w-5" />
              </a>
            </div>
          </div>
        </div>

        {/* Spacer for visual hierarchy */}
        <div className="h-2"></div>

        {/* Bottom Row: Action Buttons */}
        <div className={`grid grid-cols-3 gap-2 pt-2 ${isDone ? 'pointer-events-none opacity-50' : ''}`}>
          <Button
            onClick={() => onQuickRdv?.(patient)}
            className="h-12 md:h-10 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm flex flex-col items-center justify-center gap-1 rounded-lg transition-colors"
            title="Prendre un rendez-vous rapide"
            disabled={isDone}
          >
            <CalendarPlus className="h-5 w-5" />
            <span className="text-xs">RDV</span>
          </Button>
          <Button
            onClick={() => onPayment(patient.id)}
            className="h-12 md:h-10 bg-teal-600 hover:bg-teal-700 text-white font-semibold text-sm flex flex-col items-center justify-center gap-1 rounded-lg transition-colors"
            title="Gérer les paiements"
            disabled={isDone}
          >
            <Wallet className="h-5 w-5" />
            <span className="text-xs">Paiement</span>
          </Button>
          <Button
            onClick={() => onHistory(patient.id)}
            className="h-12 md:h-10 bg-[#3b82f6] hover:bg-[#1e40af] text-white font-semibold text-sm flex flex-col items-center justify-center gap-1 rounded-lg transition-colors"
            title="Voir l'historique du traitement"
            disabled={isDone}
          >
            <History className="h-5 w-5" />
            <span className="text-xs">Historique</span>
          </Button>
          <Button
            onClick={() => onEdit(patient)}
            className="h-12 md:h-10 bg-slate-600 hover:bg-slate-700 text-white font-semibold text-sm flex flex-col items-center justify-center gap-1 rounded-lg transition-colors"
            title="Modifier le patient"
            disabled={isDone}
          >
            <Edit2 className="h-5 w-5" />
            <span className="text-xs">Modifier</span>
          </Button>
          <Button
            onClick={() => onDelete(patient.id)}
            className="h-12 md:h-10 bg-red-600 hover:bg-red-700 text-white font-semibold text-sm flex flex-col items-center justify-center gap-1 rounded-lg transition-colors"
            title="Supprimer le patient"
            disabled={isDone}
          >
            <Trash2 className="h-5 w-5" />
            <span className="text-xs">Supprimer</span>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
