import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { passageDirectApi } from "@/lib/api";
import { PassageDirect } from "@/lib/mock-data";
import { CheckCircle2, XCircle } from "lucide-react";

interface HistoriquePassagesModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function HistoriquePassagesModal({ open, onOpenChange }: HistoriquePassagesModalProps) {
  const [archivedPassages, setArchivedPassages] = useState<PassageDirect[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (open) {
      fetchArchivedPassages();
    }
  }, [open]);

  const fetchArchivedPassages = async () => {
    try {
      setIsLoading(true);
      const passages = await passageDirectApi.getHistory();
      setArchivedPassages(passages || []);
    } catch (error) {
      console.error('Failed to fetch archived passages:', error);
      setArchivedPassages([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Group passages by date
  const groupedByDate = archivedPassages.reduce((acc, passage) => {
    if (!acc[passage.date]) {
      acc[passage.date] = [];
    }
    acc[passage.date].push(passage);
    return acc;
  }, {} as Record<string, PassageDirect[]>);

  // Sort dates in descending order
  const sortedDates = Object.keys(groupedByDate).sort().reverse();

  const formatDate = (dateStr: string) => {
    try {
      const [year, month, day] = dateStr.split('-');
      return `${day}/${month}/${year}`;
    } catch {
      return dateStr;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] max-w-2xl sm:w-full p-4 sm:p-6 max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg sm:text-xl">Historique des Passages Directs</DialogTitle>
        </DialogHeader>
        
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-[#3b82f6]"></div>
            <span className="ml-2 text-muted-foreground">Chargement...</span>
          </div>
        ) : archivedPassages.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground text-sm">Aucun historique disponible</p>
          </div>
        ) : (
          <div className="space-y-6">
            {sortedDates.map((date) => (
              <div key={date} className="border-b border-border pb-4">
                <h3 className="text-sm font-semibold text-foreground mb-3">
                  Historique du {formatDate(date)}
                </h3>
                <div className="space-y-2">
                  {groupedByDate[date].map((passage) => (
                    <div
                      key={passage.id}
                      className="flex items-center justify-between rounded border border-border p-3 bg-muted/20 hover:bg-muted/40 transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm text-foreground truncate">
                          {passage.nomPrenom}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {passage.motif}
                        </p>
                      </div>
                      <div className="flex items-center gap-3 ml-4 flex-shrink-0">
                        <span className="text-sm font-semibold text-foreground tabular-nums">
                          {passage.heure}
                        </span>
                        <div className="flex items-center gap-2">
                          {passage.statut === "passé" ? (
                            <div className="flex items-center gap-1 text-green-600">
                              <CheckCircle2 className="h-4 w-4" />
                              <span className="text-xs font-medium">Passé</span>
                            </div>
                          ) : passage.statut === "annulé" ? (
                            <div className="flex items-center gap-1 text-red-600">
                              <XCircle className="h-4 w-4" />
                              <span className="text-xs font-medium">Annulé</span>
                            </div>
                          ) : (
                            <span className="text-xs font-medium text-muted-foreground">
                              {passage.statut}
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
  );
}
