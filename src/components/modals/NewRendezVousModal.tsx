import { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { type RendezVous, type Category } from "@/lib/mock-data";
import { generateTimeSlots } from "@/lib/time-slots-utils";
import { Check } from "lucide-react";

interface PrefilledPatientData {
  nom: string;
  prenom: string;
  telephone?: string;
  categorie?: string;
  age?: number;
  typeSoin?: string;
}

interface NewRendezVousModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categories: Category[];
  onSubmit: (rdv: Omit<RendezVous, "id">) => void;
  prefilledDate?: string;
  prefilledPatient?: PrefilledPatientData;
}

export function NewRendezVousModal({ open, onOpenChange, categories, onSubmit, prefilledDate, prefilledPatient }: NewRendezVousModalProps) {
  const [formData, setFormData] = useState({
    nom: "",
    prenom: "",
    telephone: "",
    age: "",
    categorie: "",
    date: "",
    heure: "",
  });

  const [filledFields, setFilledFields] = useState<Set<string>>(new Set());
  const formRef = useRef<HTMLFormElement>(null);
  const magicDemoTriggeredRef = useRef(false);

  // Get tomorrow's date in YYYY-MM-DD format
  const getTomorrowDate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  };

  // Magic Demo Fill Function
  const triggerMagicDemo = async () => {
    // Only trigger once per modal open
    if (magicDemoTriggeredRef.current) return;
    magicDemoTriggeredRef.current = true;

    // Only trigger if the form is empty
    if (formData.nom.trim() !== "") return;

    const demoData = {
      nom: "Hadj-bouziane",
      prenom: "Fethellah",
      telephone: "0795632344",
      date: getTomorrowDate(),
      heure: "10:00",
    };

    const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
    const updateDelay = 200;

    // Initial delay of 1.5 seconds before starting auto-fill
    await delay(1500);

    // Fill fields with animation delays
    await delay(updateDelay);
    setFormData(prev => ({ ...prev, nom: demoData.nom }));
    setFilledFields(prev => new Set([...prev, "nom"]));

    await delay(updateDelay);
    setFormData(prev => ({ ...prev, prenom: demoData.prenom }));
    setFilledFields(prev => new Set([...prev, "prenom"]));

    await delay(updateDelay);
    setFormData(prev => ({ ...prev, telephone: demoData.telephone }));
    setFilledFields(prev => new Set([...prev, "telephone"]));

    // Select first available category
    await delay(updateDelay);
    if (categories.length > 0) {
      setFormData(prev => ({ ...prev, categorie: categories[0].name }));
      setFilledFields(prev => new Set([...prev, "categorie"]));
    }

    // Set date
    await delay(updateDelay);
    setFormData(prev => ({ ...prev, date: demoData.date }));
    setFilledFields(prev => new Set([...prev, "date"]));

    // Set time (10:00 if available, otherwise first available)
    await delay(updateDelay);
    const timeSlots = generateTimeSlots();
    const selectedTime = timeSlots.includes(demoData.heure) ? demoData.heure : timeSlots[0];
    setFormData(prev => ({ ...prev, heure: selectedTime }));
    setFilledFields(prev => new Set([...prev, "heure"]));

    // Auto-submit after final delay
    await delay(500);
    formRef.current?.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
  };

  useEffect(() => {
    if (!open) {
      setFormData({
        nom: "",
        prenom: "",
        telephone: "",
        age: "",
        categorie: "",
        date: "",
        heure: "",
      });
      setFilledFields(new Set());
      magicDemoTriggeredRef.current = false;
    } else {
      // Reset the trigger flag when modal opens
      magicDemoTriggeredRef.current = false;

      // Pre-fill from patient data if available
      if (prefilledPatient) {
        setFormData(prev => ({
          ...prev,
          nom: prefilledPatient.nom || "",
          prenom: prefilledPatient.prenom || "",
          telephone: prefilledPatient.telephone || "",
          categorie: prefilledPatient.categorie || "",
          age: prefilledPatient.age != null ? String(prefilledPatient.age) : "",
        }));
      }
      // Pre-fill the date when modal opens with a specific date
      if (prefilledDate) {
        setFormData(prev => ({
          ...prev,
          date: prefilledDate,
        }));
      }

      // Trigger magic demo when modal opens (if no prefilled patient)
      if (!prefilledPatient) {
        triggerMagicDemo();
      }
    }
  }, [open, prefilledDate, prefilledPatient]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.nom || !formData.prenom || !formData.date || !formData.heure || !formData.categorie) {
      alert("Veuillez remplir tous les champs obligatoires");
      return;
    }

    onSubmit({
      patientId: "",
      patientNom: `${formData.nom} ${formData.prenom}`,
      nom: formData.nom,
      prenom: formData.prenom,
      date: formData.date,
      heure: formData.heure,
      motif: formData.categorie,
      statut: "en attente",
      telephone: formData.telephone || undefined,
      age: formData.age ? parseInt(formData.age) : undefined,
      typeSoin: prefilledPatient?.typeSoin || undefined,
    });

    setFormData({
      nom: "",
      prenom: "",
      telephone: "",
      age: "",
      categorie: "",
      date: "",
      heure: "",
    });
    setFilledFields(new Set());
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] max-w-md sm:w-full p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle className="text-lg sm:text-xl">Nouveau Rendez-vous</DialogTitle>
        </DialogHeader>
        <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div className="space-y-2">
              <Label htmlFor="nom" className="text-sm">Nom *</Label>
              <div className="relative">
                <Input
                  id="nom"
                  value={formData.nom}
                  onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                  placeholder="Hadj-bouziane"
                  disabled={!!prefilledPatient}
                  className={`text-base ${prefilledPatient ? 'bg-muted/50 text-muted-foreground cursor-not-allowed' : ''}`}
                />
                {filledFields.has("nom") && (
                  <Check className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-green-500" />
                )}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="prenom" className="text-sm">Prénom *</Label>
              <div className="relative">
                <Input
                  id="prenom"
                  value={formData.prenom}
                  onChange={(e) => setFormData({ ...formData, prenom: e.target.value })}
                  placeholder="Fethellah"
                  disabled={!!prefilledPatient}
                  className={`text-base ${prefilledPatient ? 'bg-muted/50 text-muted-foreground cursor-not-allowed' : ''}`}
                />
                {filledFields.has("prenom") && (
                  <Check className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-green-500" />
                )}
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="telephone" className="text-sm">Téléphone (Optionnel)</Label>
            <div className="relative">
              <Input
                id="telephone"
                value={formData.telephone}
                onChange={(e) => setFormData({ ...formData, telephone: e.target.value })}
                placeholder="0795632344"
                disabled={!!prefilledPatient}
                className={`text-base ${prefilledPatient ? 'bg-muted/50 text-muted-foreground cursor-not-allowed' : ''}`}
              />
              {filledFields.has("telephone") && (
                <Check className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-green-500" />
              )}
            </div>
            {formData.telephone && (
              <p className="text-xs text-muted-foreground mt-1.5 flex items-center gap-1">
                <span className="text-primary font-medium">✓ Téléphone:</span>
                <span className="font-mono bg-muted/50 px-2 py-0.5 rounded">{formData.telephone}</span>
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="age" className="text-sm">Âge (Optionnel)</Label>
            <Input
              id="age"
              type="number"
              value={formData.age}
              onChange={(e) => setFormData({ ...formData, age: e.target.value })}
              placeholder="25"
              disabled={!!prefilledPatient}
              className={`text-base ${prefilledPatient ? 'bg-muted/50 text-muted-foreground cursor-not-allowed' : ''}`}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="categorie" className="text-sm">Catégorie de Soin *</Label>
            <div className="relative">
              <Select 
                value={formData.categorie} 
                onValueChange={(value) => setFormData({ ...formData, categorie: value })}
                disabled={!!prefilledPatient}
              >
                <SelectTrigger id="categorie" className={`text-base ${prefilledPatient ? 'bg-muted/50 text-muted-foreground cursor-not-allowed' : ''} ${filledFields.has("categorie") ? "pr-10" : ""}`}>
                  <SelectValue placeholder={categories.length === 0 ? "Aucune catégorie trouvée" : "Sélectionner une catégorie"} />
                </SelectTrigger>
                <SelectContent>
                  {categories.length === 0 ? (
                    <div className="px-2 py-6 text-center text-sm text-muted-foreground">
                      Aucune catégorie trouvée
                    </div>
                  ) : (
                    categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.name}>
                        {cat.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              {filledFields.has("categorie") && (
                <Check className="absolute right-10 top-1/2 -translate-y-1/2 h-5 w-5 text-green-500 pointer-events-none" />
              )}
            </div>
          </div>

          {prefilledPatient && (
            <div className="space-y-2">
              <Label htmlFor="typeSoin" className="text-sm">Type de Soin</Label>
              <Input
                id="typeSoin"
                value={prefilledPatient.typeSoin || ""}
                disabled
                className="text-base bg-muted/50 text-muted-foreground cursor-not-allowed"
              />
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div className="space-y-2">
              <Label htmlFor="date" className="text-sm">Date *</Label>
              <div className="relative">
                <Input
                  id="date"
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="text-base"
                />
                {filledFields.has("date") && (
                  <Check className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-green-500" />
                )}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="heure" className="text-sm">Heure *</Label>
              <div className="relative">
                <Select 
                  value={formData.heure} 
                  onValueChange={(value) => setFormData({ ...formData, heure: value })}
                >
                  <SelectTrigger id="heure" className={`text-base ${filledFields.has("heure") ? "pr-10" : ""}`}>
                    <SelectValue placeholder="Sélectionner une heure" />
                  </SelectTrigger>
                  <SelectContent>
                  {generateTimeSlots().map((time) => (
                    <SelectItem key={time} value={time}>
                      {time}
                    </SelectItem>
                  ))}
                </SelectContent>
                </Select>
                {filledFields.has("heure") && (
                  <Check className="absolute right-10 top-1/2 -translate-y-1/2 h-5 w-5 text-green-500 pointer-events-none" />
                )}
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <Button type="submit" className="bg-[#3b82f6] hover:bg-[#1e40af] text-sm sm:text-base">
              Ajouter RDV
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
