import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

interface PaymentPasswordModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  amount: number;
  date: string;
  onConfirm: (password: string) => Promise<void>;
  isDelete?: boolean;
}

export function PaymentPasswordModal({
  open,
  onOpenChange,
  amount,
  date,
  onConfirm,
  isDelete = false,
}: PaymentPasswordModalProps) {
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const formatDate = (dateStr: string) => {
    try {
      const parsedDate = new Date(dateStr);
      return parsedDate.toLocaleDateString("fr-FR", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

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

      await onConfirm(password);

      // Reset form and close modal
      setPassword("");
      setError("");
      onOpenChange(false);
    } catch (error: unknown) {
      console.error("Password verification error:", error);
      const err = error as Error;
      const errorMessage = err.message || "Erreur lors de la vérification du mot de passe";

      if (errorMessage.includes("Invalid password") || errorMessage.includes("401")) {
        setError("Mot de passe incorrect");
      } else {
        setError(errorMessage);
      }

      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setPassword("");
      setError("");
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {isDelete ? "Confirmation de la Suppression" : "Confirmation de la Modification"}
          </DialogTitle>
        </DialogHeader>

        <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded text-sm">
          <p className="font-medium text-blue-900 dark:text-blue-100">
            Montant: {amount.toLocaleString()} DA
          </p>
          <p className="text-blue-700 dark:text-blue-300 text-xs mt-1">
            Date: {formatDate(date)}
          </p>
          <p className="text-blue-700 dark:text-blue-300 text-xs mt-2">
            {isDelete 
              ? "Veuillez confirmer la suppression de ce paiement avec votre mot de passe"
              : "Veuillez confirmer cette modification avec votre mot de passe"
            }
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label htmlFor="password" className="text-slate-700 dark:text-slate-300 font-medium">
              Mot de passe administrateur
            </Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Entrez le mot de passe pour confirmer"
              className="border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500"
              required
              disabled={loading}
              autoFocus
            />
          </div>

          {error && (
            <p className="text-sm text-red-600 dark:text-red-400 text-center font-medium">{error}</p>
          )}

          <Button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800 mt-6"
            disabled={loading}
          >
            {loading ? "Vérification..." : isDelete ? "Confirmer la Suppression" : "Confirmer la Modification"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
