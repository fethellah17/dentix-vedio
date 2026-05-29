import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getWorkingHours } from "@/lib/time-slots-utils";
import { SettingsPasswordModal } from "./SettingsPasswordModal";

interface SettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave?: () => void;
}

export function SettingsModal({ open, onOpenChange, onSave }: SettingsModalProps) {
  const [startTime, setStartTime] = useState("07:00");
  const [endTime, setEndTime] = useState("21:00");
  const [saved, setSaved] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordError, setPasswordError] = useState("");

  useEffect(() => {
    if (open) {
      const hours = getWorkingHours();
      setStartTime(hours.startTime);
      setEndTime(hours.endTime);
      setSaved(false);
      setPasswordError("");
    }
  }, [open]);

  const handleSave = () => {
    // Validate times
    if (!startTime || !endTime) {
      alert("Veuillez remplir tous les champs");
      return;
    }

    const [startHour, startMin] = startTime.split(":").map(Number);
    const [endHour, endMin] = endTime.split(":").map(Number);
    const startTotalMin = startHour * 60 + startMin;
    const endTotalMin = endHour * 60 + endMin;

    if (startTotalMin >= endTotalMin) {
      alert("L'heure de début doit être antérieure à l'heure de fin");
      return;
    }

    // Open password confirmation modal instead of saving directly
    setShowPasswordModal(true);
  };

  const handlePasswordSuccess = () => {
    setSaved(true);
    
    setTimeout(() => {
      onSave?.();
      onOpenChange(false);
    }, 500);
  };

  const handlePasswordError = (error: string) => {
    setPasswordError(error);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="w-[95vw] max-w-md sm:w-full p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl">Paramètres</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="startTime" className="text-sm">
                Début de travail
              </Label>
              <Input
                id="startTime"
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="text-base"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="endTime" className="text-sm">
                Fin de travail
              </Label>
              <Input
                id="endTime"
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="text-base"
              />
            </div>

            {saved && (
              <div className="p-3 rounded-lg text-sm font-medium bg-green-100/50 text-green-700 border border-green-300">
                ✓ Les paramètres ont été sauvegardés
              </div>
            )}

            {passwordError && (
              <div className="p-3 rounded-lg text-sm font-medium bg-red-100/50 text-red-700 border border-red-300">
                ✗ {passwordError}
              </div>
            )}
          </div>

          <DialogFooter className="pt-4">
            <Button
              onClick={handleSave}
              className="bg-[#3b82f6] hover:bg-[#1e40af] text-sm sm:text-base"
            >
              Enregistrer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <SettingsPasswordModal
        open={showPasswordModal}
        onOpenChange={setShowPasswordModal}
        startTime={startTime}
        endTime={endTime}
        onSuccess={handlePasswordSuccess}
        onError={handlePasswordError}
      />
    </>
  );
}
