import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { rendezVousApi } from "@/lib/api";
import { useData } from "@/lib/data-context";

interface UnarchivePasswordModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  date: string | null;
  onSuccess?: () => void;
}

export function UnarchivePasswordModal({
  open,
  onOpenChange,
  date,
  onSuccess,
}: UnarchivePasswordModalProps) {
  const { unarchiveRendezVous } = useData();
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const formatDate = (dateStr: string) => {
    try {
      const [year, month, day] = dateStr.split("-");
      return `${day}/${month}/${year}`;
    } catch {
      return dateStr;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (!date) {
        setError("Aucune date sélectionnée");
        setLoading(false);
        return;
      }

      if (!password.trim()) {
        setError("Veuillez entrer le mot de passe");
        setLoading(false);
        return;
      }

      // Call the unarchive by date function from data context
      // This will refetch the appointments and update the main state
      await unarchiveRendezVous(date, password);
      
      toast.success("Journée désarchivée avec succès");
      
      // Reset form and close modal
      setPassword("");
      setError("");
      onOpenChange(false);
      
      // Call onSuccess callback if provided
      if (onSuccess) {
        onSuccess();
      }
    } catch (error: unknown) {
      console.error("Unarchive error:", error);
      const err = error as Error;
      const errorMessage = err.message || "Erreur lors de la désarchivation";
      
      if (errorMessage.includes("Invalid password")) {
        setError("Mot de passe incorrect");
      } else if (errorMessage.includes("not found")) {
        setError("Aucun rendez-vous trouvé pour cette date");
      } else {
        setError(errorMessage);
      }
      
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setPassword("");
    setError("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Désarchiver la journée</DialogTitle>
        </DialogHeader>
        
        {date && (
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded text-sm">
            <p className="font-medium text-blue-900">
              Historique du {formatDate(date)}
            </p>
            <p className="text-blue-700 text-xs mt-1">
              Tous les rendez-vous de cette date seront désarchivés
            </p>
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label htmlFor="password" className="text-slate-700 font-medium">
              Mot de passe administrateur
            </Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Entrez le mot de passe pour confirmer"
              className="border-slate-300 bg-white text-slate-900 placeholder:text-slate-400"
              required
              disabled={loading}
              autoFocus
            />
          </div>

          {error && (
            <p className="text-sm text-red-600 text-center font-medium">{error}</p>
          )}

          <Button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 mt-6"
            disabled={loading}
          >
            {loading ? "Vérification..." : "Désarchiver"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
