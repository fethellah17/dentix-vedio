import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { rendezVousApi } from "@/lib/api";
import { type RendezVous } from "@/lib/mock-data";
import { CheckCircle2, XCircle } from "lucide-react";
import { UnarchivePasswordModal } from "./UnarchivePasswordModal";

interface HistoriqueRendezVousModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUnarchived?: (appointment: RendezVous) => void;
}

export function HistoriqueRendezVousModal({
  open,
  onOpenChange,
  onUnarchived,
}: HistoriqueRendezVousModalProps) {
  const [archivedAppointments, setArchivedAppointments] = useState<RendezVous[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [unarchiveModalOpen, setUnarchiveModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      fetchArchivedAppointments();
    }
  }, [open]);

  const fetchArchivedAppointments = async () => {
    try {
      setIsLoading(true);
      const appointments = await rendezVousApi.getHistory();
      setArchivedAppointments(appointments || []);
    } catch (error) {
      console.error("Failed to fetch archived appointments:", error);
      setArchivedAppointments([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Group appointments by date
  const groupedByDate = archivedAppointments.reduce(
    (acc, appointment) => {
      if (!acc[appointment.date]) {
        acc[appointment.date] = [];
      }
      acc[appointment.date].push(appointment);
      return acc;
    },
    {} as Record<string, RendezVous[]>
  );

  // Sort dates in descending order
  const sortedDates = Object.keys(groupedByDate).sort().reverse();

  const formatDate = (dateStr: string) => {
    try {
      const [year, month, day] = dateStr.split("-");
      return `${day}/${month}/${year}`;
    } catch {
      return dateStr;
    }
  };

  const handleUnarchiveClick = (date: string) => {
    setSelectedDate(date);
    setUnarchiveModalOpen(true);
  };

  const handleUnarchiveSuccess = () => {
    // Refetch archived appointments
    fetchArchivedAppointments();
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="!max-w-[95vw] !w-[95vw] !max-h-[90vh] overflow-y-auto p-6">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl">
              Historique des Rendez-vous
            </DialogTitle>
          </DialogHeader>

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-[#3b82f6]"></div>
              <span className="ml-2 text-muted-foreground">Chargement...</span>
            </div>
          ) : archivedAppointments.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground text-sm">
                Aucun historique disponible
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {sortedDates.map((date) => (
                <div key={date} className="border-b border-border pb-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-semibold text-foreground">
                      Historique du {formatDate(date)}
                    </h3>
                    <Button
                      variant="outline"
                      onClick={() => handleUnarchiveClick(date)}
                      className="text-xs h-8 px-3 border border-black text-black bg-transparent hover:bg-black hover:text-white transition-colors"
                    >
                      Désarchiver
                    </Button>
                  </div>
                  <div className="space-y-2">
                    {groupedByDate[date].map((appointment) => (
                      <div
                        key={appointment.id}
                        className="flex items-center justify-between rounded border border-border p-3 bg-muted/20 hover:bg-muted/40 transition-colors"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm text-foreground truncate">
                            {appointment.patientNom}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">
                            {appointment.motif}
                          </p>
                        </div>
                        <div className="flex items-center gap-3 ml-4 flex-shrink-0">
                          <span className="text-sm font-semibold text-foreground tabular-nums">
                            {appointment.heure}
                          </span>
                          <div className="flex items-center gap-2">
                            {appointment.statut === "confirmé" ? (
                              <div className="flex items-center gap-1 text-green-600">
                                <CheckCircle2 className="h-4 w-4" />
                                <span className="text-xs font-medium">Confirmé</span>
                              </div>
                            ) : appointment.statut === "annulé" ? (
                              <div className="flex items-center gap-1 text-red-600">
                                <XCircle className="h-4 w-4" />
                                <span className="text-xs font-medium">Annulé</span>
                              </div>
                            ) : (
                              <span className="text-xs font-medium text-muted-foreground">
                                {appointment.statut}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <UnarchivePasswordModal
        open={unarchiveModalOpen}
        onOpenChange={setUnarchiveModalOpen}
        date={selectedDate}
        onSuccess={handleUnarchiveSuccess}
      />
    </>
  );
}
