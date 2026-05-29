import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CalendarPlus, Clock } from "lucide-react";
import { type RendezVous } from "@/lib/mock-data";

interface RescheduleModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  appointment: RendezVous | null;
  onReschedule: (appointmentId: string, newDate: string, newHeure: string) => void;
  isLoading?: boolean;
}

export function RescheduleModal({
  open,
  onOpenChange,
  appointment,
  onReschedule,
  isLoading = false,
}: RescheduleModalProps) {
  const [newDate, setNewDate] = useState("");
  const [newHeure, setNewHeure] = useState("");

  useEffect(() => {
    if (open && appointment) {
      // Pre-fill with current appointment date and time
      setNewDate(appointment.date);
      setNewHeure(appointment.heure);
    }
  }, [open, appointment]);

  const handleReschedule = (e: React.FormEvent) => {
    e.preventDefault();

    if (!newDate || !newHeure) {
      alert("Veuillez remplir la date et l'heure");
      return;
    }

    if (!appointment) return;

    onReschedule(appointment.id, newDate, newHeure);
  };

  if (!appointment) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md w-[90vw] sm:w-full">
        <DialogHeader>
          <DialogTitle>Reschedule Rendez-vous</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Current Appointment Info */}
          <div className="p-4 bg-muted/30 rounded-lg border border-border space-y-3">
            <div>
              <p className="text-xs text-muted-foreground">Patient</p>
              <p className="font-semibold text-foreground">{appointment.patientNom}</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-muted-foreground">Date actuelle</p>
                <p className="font-semibold text-foreground text-sm">
                  {new Date(appointment.date).toLocaleDateString("fr-FR", {
                    weekday: "short",
                    month: "short",
                    day: "numeric",
                  })}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Heure actuelle</p>
                <p className="font-semibold text-foreground text-sm">{appointment.heure}</p>
              </div>
            </div>
          </div>

          {/* Reschedule Form */}
          <form onSubmit={handleReschedule} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div className="space-y-2">
                <Label htmlFor="newDate" className="text-sm flex items-center gap-2">
                  <CalendarPlus className="h-4 w-4" />
                  Nouvelle Date *
                </Label>
                <Input
                  id="newDate"
                  type="date"
                  value={newDate}
                  onChange={(e) => setNewDate(e.target.value)}
                  className="text-base"
                  disabled={isLoading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="newHeure" className="text-sm flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Nouvelle Heure *
                </Label>
                <Input
                  id="newHeure"
                  type="time"
                  value={newHeure}
                  onChange={(e) => setNewHeure(e.target.value)}
                  className="text-base"
                  disabled={isLoading}
                />
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => onOpenChange(false)}
                disabled={isLoading}
              >
                Annuler
              </Button>
              <Button
                type="submit"
                className="flex-1 bg-[#3b82f6] hover:bg-[#1e40af] text-white"
                disabled={isLoading}
              >
                {isLoading ? "En cours..." : "Confirmer"}
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
