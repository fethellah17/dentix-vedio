import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Wallet, Lock, AlertCircle, X, ChevronLeft, Trash2, Edit2 } from "lucide-react";
import type { Patient, PaymentRecord } from "@/lib/mock-data";
import { toast } from "sonner";
import { paymentRecordApi } from "@/lib/api";
import { PaymentPasswordModal } from "./PaymentPasswordModal";

interface PaymentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  patient: Patient | null;
  onPaymentSaved: (paymentRecord: PaymentRecord) => void;
}

export function PaymentModal({
  open,
  onOpenChange,
  patient,
  onPaymentSaved,
}: PaymentModalProps) {
  const [newPayment, setNewPayment] = useState("");
  const [verificationStep, setVerificationStep] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [passwordModalMode, setPasswordModalMode] = useState<"delete" | "edit">("delete");
  const [pendingDeletePayment, setPendingDeletePayment] = useState<PaymentRecord | null>(null);
  const [editingPayment, setEditingPayment] = useState<PaymentRecord | null>(null);
  const [editAmount, setEditAmount] = useState("");
  const [editDate, setEditDate] = useState("");

  if (!patient) return null;

  const montantTotal = patient.montantTotal || 0;
  const montantPaye = patient.montantPaye || 0;
  const resteAPayer = montantTotal - montantPaye;
  const newPaymentAmount = parseFloat(newPayment) || 0;
  const totalAfterPayment = montantPaye + newPaymentAmount;
  const remainingAfterPayment = montantTotal - totalAfterPayment;

  const handleAddPayment = () => {
    if (!newPayment || newPaymentAmount <= 0) {
      toast.error("Veuillez entrer un montant valide");
      return;
    }

    if (newPaymentAmount > resteAPayer) {
      toast.error(`Le montant ne peut pas dépasser le reste à payer (${resteAPayer.toLocaleString()} DA)`);
      return;
    }

    setVerificationStep(true);
  };

  const handleConfirmPayment = () => {
    setIsProcessing(true);

    try {
      const paymentRecord: PaymentRecord = {
        id: `payment-${Date.now()}`,
        amount: newPaymentAmount,
        date: new Date().toISOString(),
        locked: true,
      };

      onPaymentSaved(paymentRecord);
      toast.success(`Paiement de ${newPaymentAmount.toLocaleString()} DA enregistré`);
      
      setNewPayment("");
      setVerificationStep(false);
      setIsProcessing(false);
      onOpenChange(false);
    } catch (error) {
      toast.error("Erreur lors de l'enregistrement du paiement");
      setIsProcessing(false);
    }
  };

  const handleStartDelete = (payment: PaymentRecord) => {
    setPendingDeletePayment(payment);
    setPasswordModalMode("delete");
    setPasswordModalOpen(true);
  };

  const handleStartEdit = (payment: PaymentRecord) => {
    setEditingPayment(payment);
    setEditAmount(payment.amount.toString());
    setEditDate(new Date(payment.date).toISOString().split('T')[0]);
  };

  const handleCancelEdit = () => {
    setEditingPayment(null);
    setEditAmount("");
    setEditDate("");
  };

  const handleConfirmEdit = () => {
    if (!editingPayment) return;

    const editAmountNum = parseFloat(editAmount);
    if (!editAmount || editAmountNum <= 0) {
      toast.error("Veuillez entrer un montant valide");
      return;
    }

    if (!editDate) {
      toast.error("Veuillez sélectionner une date");
      return;
    }

    setPasswordModalMode("edit");
    setPasswordModalOpen(true);
  };

  const handlePasswordConfirm = async (password: string) => {
    if (passwordModalMode === "delete" && !pendingDeletePayment) return;
    if (passwordModalMode === "edit" && !editingPayment) return;

    setIsProcessing(true);

    try {
      if (passwordModalMode === "delete") {
        await paymentRecordApi.deletePaymentRecord(pendingDeletePayment!.id, password);
        toast.success("Paiement supprimé avec succès");
        setPendingDeletePayment(null);
      } else {
        const editAmountNum = parseFloat(editAmount);
        await paymentRecordApi.updatePaymentRecord(
          editingPayment!.id,
          editAmountNum,
          editDate,
          password
        );
        toast.success("Paiement modifié avec succès");
        handleCancelEdit();
      }

      setPasswordModalOpen(false);
      // Trigger refresh by closing and reopening
      onOpenChange(false);
    } catch (error) {
      console.error("Error with payment operation:", error);
      if (passwordModalMode === "delete") {
        toast.error("Erreur lors de la suppression du paiement");
      } else {
        toast.error("Erreur lors de la modification du paiement");
      }
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[800px] w-[95vw] max-h-[90vh] flex flex-col p-0">
          <DialogHeader className="sticky top-0 z-[50] bg-white dark:bg-slate-950 border-b pb-4 px-6 pt-6 w-full">
            <div className="flex items-center justify-between gap-2">
              <DialogTitle className="flex items-center gap-2 text-lg">
                <Wallet className="h-5 w-5 text-[#3b82f6]" />
                Suivi des Paiements
              </DialogTitle>
              <button
                onClick={() => onOpenChange(false)}
                className="relative z-[51] inline-flex items-center justify-center w-10 h-10 rounded-full hover:bg-muted transition-colors touch-target"
                title="Fermer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              {patient.prenom} {patient.nom}
            </p>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto max-h-[60vh] space-y-6 px-6 py-6 pr-2">
            {/* Payment Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
              <Card className="border border-border">
                <CardContent className="pt-4 p-3 md:p-4">
                  <div className="text-xs text-muted-foreground mb-2 font-semibold uppercase">Montant Total</div>
                  <div className="text-xl md:text-2xl font-bold text-foreground">
                    {montantTotal.toLocaleString()} DA
                  </div>
                </CardContent>
              </Card>

              <Card className="border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-950/20">
                <CardContent className="pt-4 p-3 md:p-4">
                  <div className="text-xs text-green-700 dark:text-green-400 mb-2 font-semibold uppercase">Montant Payé</div>
                  <div className="text-xl md:text-2xl font-bold text-green-700 dark:text-green-400">
                    {montantPaye.toLocaleString()} DA
                  </div>
                </CardContent>
              </Card>

              <Card className="border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/20">
                <CardContent className="pt-4 p-3 md:p-4">
                  <div className="text-xs text-red-700 dark:text-red-400 mb-2 font-semibold uppercase">Reste à Payer</div>
                  <div className="text-xl md:text-2xl font-bold text-red-700 dark:text-red-400">
                    {resteAPayer.toLocaleString()} DA
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Payment History */}
            <div>
              <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                <Lock className="h-4 w-4 text-muted-foreground" />
                Historique des Paiements
              </h3>
              {patient.paymentHistory && patient.paymentHistory.length > 0 ? (
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {patient.paymentHistory.map((payment) => (
                    <div
                      key={payment.id}
                      className={`p-3 rounded-lg border flex items-center justify-between transition-colors ${
                        editingPayment?.id === payment.id
                          ? 'bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800'
                          : 'bg-muted/30 border-border'
                      }`}
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-foreground">
                            {payment.amount.toLocaleString()} DA
                          </span>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {new Date(payment.date).toLocaleDateString("fr-FR")}
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          onClick={() => handleStartEdit(payment)}
                          variant="ghost"
                          size="sm"
                          title="Modifier"
                          aria-label="Modifier ce paiement"
                          className="ml-2 h-8 w-8 p-0 flex items-center justify-center text-gray-900 dark:text-gray-100 hover:text-black hover:bg-gray-100 dark:hover:bg-gray-800"
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          onClick={() => handleStartDelete(payment)}
                          variant="ghost"
                          size="sm"
                          title="Supprimer"
                          aria-label="Supprimer ce paiement"
                          className="ml-2 h-8 w-8 p-0 flex items-center justify-center text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-4 bg-muted/20 rounded-lg text-center text-muted-foreground text-sm">
                  Aucun paiement enregistré
                </div>
              )}
            </div>

            {/* Edit Payment Section */}
            {editingPayment && (
              <div className="space-y-4 p-4 bg-white dark:bg-slate-900 rounded-lg border border-gray-200 dark:border-gray-700">
                <h3 className="font-semibold text-foreground">Modifier le Paiement</h3>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-foreground mb-2 block">
                      Nouveau Montant (DA)
                    </label>
                    <Input
                      type="number"
                      placeholder="0"
                      value={editAmount}
                      onChange={(e) => setEditAmount(e.target.value)}
                      min="0"
                      className="bg-background h-10"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground mb-2 block">
                      Nouvelle Date
                    </label>
                    <Input
                      type="date"
                      value={editDate}
                      onChange={(e) => setEditDate(e.target.value)}
                      className="bg-background h-10"
                    />
                  </div>
                </div>

                {editAmount && parseFloat(editAmount) > 0 && (
                  <div className="space-y-2 p-3 bg-background rounded border border-border text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Ancien montant:</span>
                      <span className="font-medium text-foreground">
                        {editingPayment.amount.toLocaleString()} DA
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Nouveau montant:</span>
                      <span className="font-medium text-foreground">
                        {parseFloat(editAmount).toLocaleString()} DA
                      </span>
                    </div>
                    <div className="flex justify-between border-t border-border pt-2">
                      <span className="text-muted-foreground">Différence:</span>
                      <span className={`font-bold ${parseFloat(editAmount) - editingPayment.amount >= 0 ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400'}`}>
                        {(parseFloat(editAmount) - editingPayment.amount >= 0 ? '+' : '')}{(parseFloat(editAmount) - editingPayment.amount).toLocaleString()} DA
                      </span>
                    </div>
                  </div>
                )}

                <div className="flex gap-2">
                  <Button
                    onClick={handleCancelEdit}
                    variant="outline"
                    className="flex-1"
                  >
                    Annuler
                  </Button>
                  <Button
                    onClick={handleConfirmEdit}
                    disabled={!editAmount || parseFloat(editAmount) <= 0 || !editDate}
                    className="flex-1 bg-blue-600 hover:bg-blue-700"
                  >
                    Enregistrer
                  </Button>
                </div>
              </div>
            )}

            {/* New Payment Section */}
            {!verificationStep && !editingPayment && (
              <div className="space-y-4 p-4 bg-muted/20 rounded-lg border border-border">
                <h3 className="font-semibold text-foreground">Nouveau Versement</h3>
                
                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">
                    Montant à payer (DA)
                  </label>
                  <Input
                    type="number"
                    placeholder="0"
                    value={newPayment}
                    onChange={(e) => setNewPayment(e.target.value)}
                    min="0"
                    max={resteAPayer}
                    className="bg-background h-10"
                  />
                </div>

                {newPayment && newPaymentAmount > 0 && (
                  <div className="space-y-2 p-3 bg-background rounded border border-border text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Montant à payer:</span>
                      <span className="font-medium text-foreground">
                        {newPaymentAmount.toLocaleString()} DA
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Total après paiement:</span>
                      <span className="font-medium text-green-700 dark:text-green-400">
                        {totalAfterPayment.toLocaleString()} DA
                      </span>
                    </div>
                    <div className="flex justify-between border-t border-border pt-2">
                      <span className="text-muted-foreground">Reste à payer:</span>
                      <span className={`font-bold ${remainingAfterPayment > 0 ? 'text-red-700 dark:text-red-400' : 'text-green-700 dark:text-green-400'}`}>
                        {remainingAfterPayment.toLocaleString()} DA
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Verification Step */}
            {verificationStep && (
              <div className="space-y-4 p-4 bg-amber-50 dark:bg-amber-950/20 rounded-lg border border-amber-200 dark:border-amber-800">
                <div className="flex gap-3">
                  <AlertCircle className="h-5 w-5 text-amber-700 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-amber-900 dark:text-amber-100 mb-2">
                      Confirmation du Paiement
                    </h4>
                    <p className="text-sm text-amber-800 dark:text-amber-200 mb-3">
                      Veuillez confirmer le paiement de <span className="font-bold">{newPaymentAmount.toLocaleString()} DA</span> pour {patient.prenom} {patient.nom}.
                    </p>
                    <p className="text-xs text-amber-700 dark:text-amber-300">
                      Cette action est irréversible. Le paiement sera verrouillé et ne pourra pas être modifié.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Sticky Footer Buttons */}
          <div className="sticky bottom-0 z-[50] bg-white dark:bg-slate-950 border-t pt-4 px-6 pb-6 w-full flex gap-3 justify-end">
            {!verificationStep && !editingPayment && (
              <Button
                onClick={handleAddPayment}
                disabled={!newPayment || newPaymentAmount <= 0 || newPaymentAmount > resteAPayer}
                className="w-full md:w-auto bg-[#3b82f6] hover:bg-[#1e40af] h-10"
              >
                Vérifier le Paiement
              </Button>
            )}

            {verificationStep && (
              <>
                <Button
                  onClick={() => setVerificationStep(false)}
                  variant="ghost"
                  className="h-10 gap-2"
                  disabled={isProcessing}
                >
                  <ChevronLeft className="h-4 w-4" />
                  <span className="hidden sm:inline">Retour</span>
                </Button>
                <Button
                  onClick={handleConfirmPayment}
                  disabled={isProcessing}
                  className="bg-green-700 hover:bg-green-800 h-10 text-white"
                >
                  {isProcessing ? "Enregistrement..." : "Confirmer le Paiement"}
                </Button>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Password Modal for Payment Record Operations */}
      <PaymentPasswordModal
        open={passwordModalOpen}
        onOpenChange={setPasswordModalOpen}
        amount={
          passwordModalMode === "delete"
            ? pendingDeletePayment?.amount || 0
            : editingPayment?.amount || 0
        }
        date={
          passwordModalMode === "delete"
            ? pendingDeletePayment?.date || ""
            : editingPayment?.date || ""
        }
        onConfirm={handlePasswordConfirm}
        isDelete={passwordModalMode === "delete"}
      />
    </>
  );
}

