import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle, Edit2 } from "lucide-react";
import { type RendezVous, type Category } from "@/lib/mock-data";

interface AppointmentActionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  appointment: RendezVous | null;
  categories: Category[];
  onConfirm: (appointment: RendezVous) => void;
  onReject: (appointmentId: string) => void;
  onReschedule: (appointmentId: string) => void;
}

export function AppointmentActionModal({
  open,
  onOpenChange,
  appointment,
  categories,
  onConfirm,
  onReject,
  onReschedule,
}: AppointmentActionModalProps) {
  if (!appointment) return null;

  const getCategoryName = (motif: string) => {
    // Remove QUICK| or STD| prefix and clean the motif
    let cleanMotif = motif.replace(/^(QUICK\||STD\|)/, '');
    // If it has type separator, split and format
    if (cleanMotif.includes(' | ')) {
      return cleanMotif.split(' | ').join(' • ');
    }
    const category = categories.find(c => c.name === cleanMotif);
    return category?.name || cleanMotif;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md w-[90vw] sm:w-full">
        <DialogHeader>
          <DialogTitle>Gestion du Rendez-vous</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="p-4 bg-muted/30 rounded-lg border border-border space-y-3">
            <div>
              <p className="text-xs text-muted-foreground">Patient</p>
              <p className="font-semibold text-foreground">{appointment.patientNom}</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-muted-foreground">Date</p>
                <p className="font-semibold text-foreground">
                  {new Date(appointment.date).toLocaleDateString("fr-FR", {
                    weekday: "short",
                    month: "short",
                    day: "numeric",
                  })}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Heure</p>
                <p className="font-semibold text-foreground">{appointment.heure}</p>
              </div>
            </div>

            <div>
              <p className="text-xs text-muted-foreground">Catégorie de Soin</p>
              <p className="font-semibold text-foreground">{getCategoryName(appointment.motif)}</p>
            </div>

            <div>
              <p className="text-xs text-muted-foreground">Statut</p>
              <Badge
                variant="outline"
                className={`mt-1 font-normal ${
                  appointment.statut === "confirmé"
                    ? "border-success/30 bg-success/5 text-success"
                    : "border-warning/30 bg-warning/5 text-warning"
                }`}
              >
                {appointment.statut === "confirmé" ? "Confirmé" : "En attente"}
              </Badge>
            </div>
          </div>

          <div className="space-y-2 pt-4">
            <p className="text-sm text-muted-foreground">
              Que souhaitez-vous faire avec ce rendez-vous ?
            </p>

            <div className="flex flex-col gap-3 sm:flex-row sm:gap-2">
              <Button
                onClick={() => {
                  onConfirm(appointment);
                  onOpenChange(false);
                }}
                variant="outline"
                className="flex-1 border-success/50 text-success hover:bg-success hover:text-white hover:border-success transition-all duration-300"
              >
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Confirmer
              </Button>
              <Button
                onClick={() => {
                  onReschedule(appointment.id);
                  onOpenChange(false);
                }}
                variant="outline"
                className="flex-1 border-primary/50 text-primary hover:bg-primary hover:text-white hover:border-primary transition-all duration-300"
              >
                <Edit2 className="h-4 w-4 mr-2" />
                Changer
              </Button>
              <Button
                onClick={() => {
                  onReject(appointment.id);
                  onOpenChange(false);
                }}
                variant="outline"
                className="flex-1 border-destructive/50 text-destructive hover:bg-destructive hover:text-white hover:border-destructive transition-all duration-300"
              >
                <XCircle className="h-4 w-4 mr-2" />
                Rejeter
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
