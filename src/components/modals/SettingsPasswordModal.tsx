import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { systemApi } from "@/lib/api";

interface SettingsPasswordModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  startTime: string;
  endTime: string;
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

export function SettingsPasswordModal({
  open,
  onOpenChange,
  startTime,
  endTime,
  onSuccess,
  onError,
}: SettingsPasswordModalProps) {
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (!password.trim()) {
        setError("Veuillez entrer le mot de passe");
        setLoading(false);
        return;
      }

      // Call the backend to save working hours with password verification
      await systemApi.saveWorkingHours(startTime, endTime, password);

      // Save to localStorage as well
      localStorage.setItem(
        'clinic_working_hours',
        JSON.stringify({ startTime, endTime })
      );

      toast.success("Les paramètres ont été sauvegardés");

      // Reset form and close modal
      setPassword("");
      setError("");
      onOpenChange(false);

      // Call onSuccess callback if provided
      if (onSuccess) {
        onSuccess();
      }
    } catch (error: unknown) {
      console.error("Settings save error:", error);
      const err = error as Error;
      const errorMessage = err.message || "Erreur lors de la sauvegarde";

      if (errorMessage.includes("Invalid password")) {
        setError("Mot de passe incorrect");
        if (onError) onError("Mot de passe incorrect");
      } else {
        setError(errorMessage);
        if (onError) onError(errorMessage);
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
          <DialogTitle>Confirmer les paramètres</DialogTitle>
        </DialogHeader>

        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded text-sm">
          <p className="font-medium text-blue-900">Heures de travail</p>
          <p className="text-blue-700 text-xs mt-2">
            Début: <span className="font-semibold">{startTime}</span>
          </p>
          <p className="text-blue-700 text-xs mt-1">
            Fin: <span className="font-semibold">{endTime}</span>
          </p>
        </div>

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
            {loading ? "Vérification..." : "Valider"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
