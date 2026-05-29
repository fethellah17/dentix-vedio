import { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { type Patient, type Category, type CategoryType } from "@/lib/mock-data";
import { Badge } from "@/components/ui/badge";
import { ChevronRight, Check } from "lucide-react";

interface NewPatientModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categories: Category[];
  onSubmit: (patient: Omit<Patient, "id" | "dateCreation">) => void;
  prefilledData?: {
    nom?: string;
    prenom?: string;
    telephone?: string;
    age?: number;
    categorie?: string;
    type?: string;
  };
}

export function NewPatientModal({ open, onOpenChange, categories, onSubmit, prefilledData }: NewPatientModalProps) {
  const [formData, setFormData] = useState({
    nom: "",
    prenom: "",
    age: "",
    telephone: "",
    antecedents: "",
    categorie: "",
    type: "",
    typeSoin: "",
    typeSoinId: "",
    etapeActuelle: "",
    montantTotal: "",
    montantPaye: "",
  });

  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [selectedType, setSelectedType] = useState<CategoryType | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const [filledFields, setFilledFields] = useState<Set<string>>(new Set());
  const magicDemoTriggeredRef = useRef(false);

  // Magic Demo Fill Function
  const triggerMagicDemo = async () => {
    // Only trigger if the form is empty
    if (formData.nom.trim() !== "") return;

    const demoData = {
      nom: "Hadj-bouziane",
      prenom: "Fethellah",
      age: "23",
      telephone: "0795632344",
      antecedents: "Aucun",
      montantTotal: "5000",
      montantPaye: "3000",
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
    setFormData(prev => ({ ...prev, age: demoData.age }));
    setFilledFields(prev => new Set([...prev, "age"]));

    await delay(updateDelay);
    setFormData(prev => ({ ...prev, telephone: demoData.telephone }));
    setFilledFields(prev => new Set([...prev, "telephone"]));

    await delay(updateDelay);
    setFormData(prev => ({ ...prev, antecedents: demoData.antecedents }));
    setFilledFields(prev => new Set([...prev, "antecedents"]));

    // Select first available category
    await delay(updateDelay);
    if (categories.length > 0) {
      const firstCategory = categories[0];
      setFormData(prev => ({ ...prev, categorie: firstCategory.name }));
      setSelectedCategory(firstCategory);
      setFilledFields(prev => new Set([...prev, "categorie"]));

      // Select first available type from the category
      await delay(updateDelay);
      if (firstCategory.types.length > 0) {
        const firstType = firstCategory.types[0];
        setFormData(prev => ({ ...prev, type: firstType.name }));
        setSelectedType(firstType);
        setFilledFields(prev => new Set([...prev, "type"]));
      }
    }

    await delay(updateDelay);
    setFormData(prev => ({ ...prev, montantTotal: demoData.montantTotal }));
    setFilledFields(prev => new Set([...prev, "montantTotal"]));

    await delay(updateDelay);
    setFormData(prev => ({ ...prev, montantPaye: demoData.montantPaye }));
    setFilledFields(prev => new Set([...prev, "montantPaye"]));

    // Auto-submit after final delay
    await delay(500);
    formRef.current?.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
  };

  // Initialize with prefilled data when modal opens
  useEffect(() => {
    if (open && prefilledData) {
      // Aggressive form update with all prefilled data
      const newFormData = {
        nom: prefilledData.nom || "",
        prenom: prefilledData.prenom || "",
        telephone: prefilledData.telephone || "",
        age: prefilledData.age ? String(prefilledData.age) : "",
        antecedents: "",
        categorie: prefilledData.categorie || "",
        type: prefilledData.type || "",
        typeSoin: "",
        typeSoinId: "",
        etapeActuelle: "",
        montantTotal: "",
        montantPaye: "",
      };
      setFormData(newFormData);
    } else if (!open) {
      // Reset form when modal closes
      setFormData({ nom: "", prenom: "", age: "", telephone: "", antecedents: "", categorie: "", type: "", typeSoin: "", typeSoinId: "", etapeActuelle: "", montantTotal: "", montantPaye: "" });
      setSelectedCategory(null);
      setSelectedType(null);
      setFilledFields(new Set());
      magicDemoTriggeredRef.current = false;
    }
  }, [open, prefilledData]);

  // Update selected category when categorie changes
  useEffect(() => {
    if (formData.categorie) {
      const category = categories.find(c => c.name === formData.categorie);
      setSelectedCategory(category || null);
      // Reset type when category changes
      setFormData(prev => ({ ...prev, type: "" }));
      setSelectedType(null);
    } else {
      setSelectedCategory(null);
      setSelectedType(null);
    }
  }, [formData.categorie, categories]);

  // Update selected type when type changes
  useEffect(() => {
    if (formData.type && selectedCategory) {
      const type = selectedCategory.types.find(t => t.name === formData.type);
      setSelectedType(type || null);
      if (type) {
        // Do NOT set etapeActuelle - it should remain empty until steps are manually confirmed
        setFormData(prev => ({
          ...prev,
          typeSoin: type.name,
          typeSoinId: type.id,
          etapeActuelle: "", // Keep empty for new patients
        }));
      }
    } else {
      setSelectedType(null);
      setFormData(prev => ({
        ...prev,
        typeSoin: "",
        typeSoinId: "",
        etapeActuelle: "",
      }));
    }
  }, [formData.type, selectedCategory]);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!formData.nom || !formData.prenom || !formData.age || !formData.telephone || !formData.categorie) {
      alert("Veuillez remplir tous les champs obligatoires");
      return;
    }
    
    const montantTotal = parseFloat(formData.montantTotal) || 0;
    const montantPaye = parseFloat(formData.montantPaye) || 0;
    const paymentHistory = montantPaye > 0 ? [{
      id: `payment-${Date.now()}`,
      amount: montantPaye,
      date: new Date().toISOString(),
      locked: true,
    }] : [];

    onSubmit({
      nom: formData.nom,
      prenom: formData.prenom,
      age: parseInt(formData.age),
      telephone: formData.telephone,
      antecedents: formData.antecedents,
      categorie: formData.categorie,
      typeSoin: formData.typeSoin || undefined,
      typeSoinId: formData.typeSoinId || undefined,
      etapeActuelle: formData.etapeActuelle || undefined,
      stepsCompleted: [],
      montantTotal,
      montantPaye,
      paymentHistory,
    });
    setFormData({ nom: "", prenom: "", age: "", telephone: "", antecedents: "", categorie: "", type: "", typeSoin: "", typeSoinId: "", etapeActuelle: "", montantTotal: "", montantPaye: "" });
    setSelectedCategory(null);
    setSelectedType(null);
    setFilledFields(new Set());
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nouveau Patient</DialogTitle>
        </DialogHeader>
        <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="nom">Nom *</Label>
              <div className="relative">
                <Input
                  id="nom"
                  value={formData.nom}
                  onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                  onFocus={triggerMagicDemo}
                  placeholder="Hadj-bouziane"
                />
                {filledFields.has("nom") && (
                  <Check className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-green-500" />
                )}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="prenom">Prénom *</Label>
              <div className="relative">
                <Input
                  id="prenom"
                  value={formData.prenom}
                  onChange={(e) => setFormData({ ...formData, prenom: e.target.value })}
                  placeholder="Fethellah"
                />
                {filledFields.has("prenom") && (
                  <Check className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-green-500" />
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="age">Âge *</Label>
              <div className="relative">
                <Input
                  id="age"
                  type="number"
                  value={formData.age}
                  onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                  placeholder="23"
                />
                {filledFields.has("age") && (
                  <Check className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-green-500" />
                )}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="telephone">Téléphone *</Label>
              <div className="relative">
                <Input
                  id="telephone"
                  value={formData.telephone}
                  onChange={(e) => setFormData({ ...formData, telephone: e.target.value })}
                  placeholder="0795632344"
                />
                {filledFields.has("telephone") && (
                  <Check className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-green-500" />
                )}
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="antecedents">Antécédents Médicaux</Label>
            <div className="relative">
              <Textarea
                id="antecedents"
                value={formData.antecedents}
                onChange={(e) => setFormData({ ...formData, antecedents: e.target.value })}
                placeholder="Diabète, Allergie, etc."
                className="min-h-20 pr-10"
              />
              {filledFields.has("antecedents") && (
                <Check className="absolute right-3 top-3 h-5 w-5 text-green-500" />
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="montantTotal">Montant Total (DA)</Label>
              <div className="relative">
                <Input
                  id="montantTotal"
                  type="number"
                  value={formData.montantTotal}
                  onChange={(e) => setFormData({ ...formData, montantTotal: e.target.value })}
                  placeholder="0"
                  min="0"
                />
                {filledFields.has("montantTotal") && (
                  <Check className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-green-500" />
                )}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="montantPaye">Montant Payé (DA)</Label>
              <div className="relative">
                <Input
                  id="montantPaye"
                  type="number"
                  value={formData.montantPaye}
                  onChange={(e) => setFormData({ ...formData, montantPaye: e.target.value })}
                  placeholder="0"
                  min="0"
                />
                {filledFields.has("montantPaye") && (
                  <Check className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-green-500" />
                )}
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="categorie">Catégorie *</Label>
            <div className="relative">
              <Select value={formData.categorie} onValueChange={(value) => setFormData({ ...formData, categorie: value })}>
                <SelectTrigger id="categorie" className={filledFields.has("categorie") ? "pr-10" : ""}>
                  <SelectValue placeholder={categories.length === 0 ? "Aucune catégorie trouvée, veuillez en créer une dans les paramètres" : "Sélectionner une catégorie"} />
                </SelectTrigger>
                <SelectContent>
                  {categories.length === 0 ? (
                    <div className="px-2 py-6 text-center text-sm text-muted-foreground">
                      Aucune catégorie trouvée.<br />Veuillez en créer une dans les paramètres.
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

          {/* Type dropdown - appears after category selection */}
          {selectedCategory && selectedCategory.types.length > 0 && (
            <div className="space-y-2">
              <Label htmlFor="type">Type</Label>
              <div className="relative">
                <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value })}>
                  <SelectTrigger id="type" className={filledFields.has("type") ? "pr-10" : ""}>
                    <SelectValue placeholder="Sélectionner un type (optionnel)" />
                  </SelectTrigger>
                  <SelectContent>
                  {selectedCategory.types.map((type) => (
                    <SelectItem key={type.id} value={type.name}>
                      {type.name}
                    </SelectItem>
                  ))}
                </SelectContent>
                </Select>
                {filledFields.has("type") && (
                  <Check className="absolute right-10 top-1/2 -translate-y-1/2 h-5 w-5 text-green-500 pointer-events-none" />
                )}
              </div>
            </div>
          )}

          {/* Steps preview - appears after type selection */}
          {selectedType && selectedType.steps.length > 0 && (
            <div className="space-y-2 p-4 bg-muted/30 rounded-lg border border-border">
              <Label className="text-sm font-semibold text-foreground">Aperçu du workflow</Label>
              <p className="text-xs text-muted-foreground mb-3">
                Les étapes suivantes seront associées à ce patient :
              </p>
              <div className="space-y-2">
                {selectedType.steps
                  .sort((a, b) => a.order - b.order)
                  .map((step, index) => (
                    <div key={step.id} className="flex items-center gap-2 text-sm">
                      <Badge variant="outline" className="w-6 h-6 flex items-center justify-center p-0 text-xs bg-background">
                        {index + 1}
                      </Badge>
                      <ChevronRight className="h-3 w-3 text-muted-foreground" />
                      <span className="text-foreground">{step.name}</span>
                    </div>
                  ))}
              </div>
            </div>
          )}

          <div className="flex justify-end pt-4">
            <Button type="submit" className="bg-[#3b82f6] hover:bg-[#1e40af]" disabled={categories.length === 0}>
              Ajouter Patient
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
