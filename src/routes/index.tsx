import { createFileRoute } from "@tanstack/react-router";
import { AppLayout } from "@/components/AppLayout";
import { useAuth } from "@/lib/auth-context";
import { LoginPage } from "@/components/LoginPage";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Users, Clock, CheckCircle2, XCircle, Archive, FolderOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useState } from "react";
import { usePatients } from "@/hooks/use-patients";
import { useRendezVous } from "@/hooks/use-rendez-vous";
import { usePassageDirect } from "@/hooks/use-passage-direct";
import { useCategories } from "@/hooks/use-categories";
import { NewPatientModal } from "@/components/modals/NewPatientModal";
import { NewRendezVousModal } from "@/components/modals/NewRendezVousModal";
import { NewPassageDirectModal } from "@/components/modals/NewPassageDirectModal";
import { AppointmentActionModal } from "@/components/modals/AppointmentActionModal";
import { RescheduleModal } from "@/components/modals/RescheduleModal";
import { PatientFileModal } from "@/components/modals/PatientFileModal";
import { HistoriquePassagesModal } from "@/components/modals/HistoriquePassagesModal";
import { toast } from "sonner";
import { type RendezVous } from "@/lib/mock-data";

export const Route = createFileRoute("/")({
  component: Index,
  head: () => ({
    meta: [
      { title: "Dentix - Softix Dentaire" },
      { name: "description", content: "Système de gestion - Softix Dentaire" },
    ],
  }),
});

function Index() {
  // HOOKS MUST BE AT THE TOP - before any conditional logic
  const { isAuthenticated, isInitialized } = useAuth();
  const { patients, addPatient } = usePatients();
  const { rendezVous, addRendezVous, updateRendezVous, archiveByDate } = useRendezVous();
  const { passagesDirects, addPassageDirect, updatePassageDirect, archivePassageDirectsByDate } = usePassageDirect();
  const { categories } = useCategories();
  const [newPatientOpen, setNewPatientOpen] = useState(false);
  const [newRdvOpen, setNewRdvOpen] = useState(false);
  const [newPassageOpen, setNewPassageOpen] = useState(false);
  const [historiquOpen, setHistoriqueOpen] = useState(false);
  const [archiveConfirmOpen, setArchiveConfirmOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<RendezVous | null>(null);
  const [appointmentActionOpen, setAppointmentActionOpen] = useState(false);
  const [appointmentToConvert, setAppointmentToConvert] = useState<RendezVous | null>(null);
  
  // Patient file modal state
  const [patientFileOpen, setPatientFileOpen] = useState(false);
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);

  // Reschedule modal state
  const [rescheduleOpen, setRescheduleOpen] = useState(false);
  const [rescheduleLoading, setRescheduleLoading] = useState(false);

  // NOW check initialization and authentication AFTER all hooks are declared
  if (!isInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#3b82f6]"></div>
          <p className="mt-4 text-slate-600">Chargement...</p>
        </div>
      </div>
    );
  }
  
  if (!isAuthenticated) return <LoginPage />;

  const todayStr = new Date().toISOString().split("T")[0];
  const todayRDV = (rendezVous || []).filter((r) => r.date === todayStr && !r.archived);
  const todayPassages = (passagesDirects || []).filter((p) => p.date === todayStr);
  const totalPatients = (patients || []).length;

  // Check if there are any "en attente" appointments today
  const hasEnAttenteToday = todayRDV.some((rdv) => rdv.statut === "en attente");

  const handleConfirmAppointment = async (appointment: RendezVous) => {
    try {
      // ONLY update status to "confirmé" - DO NOT open any modal
      await updateRendezVous(appointment.id, { statut: "confirmé" });
      setAppointmentActionOpen(false);
      toast.success("Rendez-vous confirmé");
    } catch (error) {
      console.error('Failed to confirm appointment:', error);
      toast.error("Erreur lors de la confirmation");
    }
  };

  const handleRejectAppointment = async (appointmentId: string) => {
    try {
      await updateRendezVous(appointmentId, { statut: "annulé" });
      setAppointmentActionOpen(false);
      toast.success("Rendez-vous rejeté");
    } catch (error) {
      console.error('Failed to reject appointment:', error);
      toast.error("Erreur lors du rejet");
    }
  };

  const handleRescheduleAppointment = (appointmentId: string) => {
    setSelectedAppointment(
      rendezVous.find((r) => r.id === appointmentId) || null
    );
    setRescheduleOpen(true);
  };

  const handleRescheduleSubmit = async (
    appointmentId: string,
    newDate: string,
    newHeure: string
  ) => {
    try {
      setRescheduleLoading(true);
      await updateRendezVous(appointmentId, {
        date: newDate,
        heure: newHeure,
        statut: "en attente",
      });
      setRescheduleOpen(false);
      toast.success("Rendez-vous reporté avec succès");
    } catch (error) {
      console.error('Failed to reschedule appointment:', error);
      toast.error("Erreur lors du changement de rendez-vous");
    } finally {
      setRescheduleLoading(false);
    }
  };

  const handleArchiveToday = async () => {
    try {
      await archiveByDate(todayStr);
      toast.success("Journée archivée");
    } catch (error) {
      console.error('Failed to archive:', error);
      toast.error("Erreur lors de l'archivage");
    }
  };

  const handleNewPatientSubmit = async (patientData: any) => {
    try {
      const newPatient = await addPatient(patientData);
      
      // Update appointment with patient ID
      if (appointmentToConvert) {
        await updateRendezVous(appointmentToConvert.id, {
          patientId: newPatient.id,
          patientNom: `${newPatient.nom} ${newPatient.prenom}`,
        });
      }

      toast.success("Patient créé avec succès. Veuillez compléter le dossier.");
      setNewPatientOpen(false);
      setAppointmentToConvert(null);
    } catch (error: any) {
      console.error('Failed to create patient:', error);
      
      // Show the conflict error message if patient already exists
      if (error.message && error.message.includes('existe déjà')) {
        toast.error("Ce patient existe déjà dans la base de données");
      } else {
        toast.error("Erreur lors de la création du patient");
      }
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Tableau de Bord</h1>
        </div>

        {/* Top Row: Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2">
          <Card className="border-l-4 border-l-primary border border-border">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Rendez-vous Aujourd'hui
              </CardTitle>
              <Calendar className="h-5 w-5 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground tabular-nums">{todayRDV.length}</div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-primary border border-border">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Total Patients
              </CardTitle>
              <Users className="h-5 w-5 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground tabular-nums">{totalPatients}</div>
            </CardContent>
          </Card>
        </div>

        {/* Split View: Rendez-vous & Passages Directs */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Left Column: Rendez-vous du jour */}
          <Card className="border border-border">
            <CardHeader className="bg-muted/30 border-b border-border">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold flex items-center gap-2 text-foreground">
                  <Clock className="h-5 w-5 text-primary" />
                  Rendez-vous du jour
                </CardTitle>
                {todayRDV.length > 0 && !hasEnAttenteToday && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleArchiveToday}
                    className="h-8 gap-2 text-xs"
                    title="Archiver cette journée"
                  >
                    <Archive className="h-3.5 w-3.5" />
                    Archiver la journée
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="pt-4">
              {todayRDV.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4">Aucun rendez-vous aujourd'hui</p>
              ) : (
                <div className="space-y-2">
                  {todayRDV.map((rdv) => (
                    <div
                      key={rdv.id}
                      className={`flex items-center justify-between rounded border border-border p-3 transition-colors ${
                        rdv.statut === "annulé" ? "opacity-60" : "hover:bg-muted/30"
                      }`}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1 sm:gap-2 flex-wrap mb-1">
                          <p className="font-medium text-sm text-foreground truncate">{rdv.patientNom}</p>
                          {rdv.motif.startsWith('QUICK|') ? (
                            <span className="text-xs text-gray-500 font-medium whitespace-nowrap">
                              [Ancien Patient]
                            </span>
                          ) : (
                            <span className="text-xs text-sky-600 font-medium whitespace-nowrap">
                              [Nouveau Patient]
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground truncate">
                          {(() => {
                            // Remove QUICK| or STD| prefix and display category • type
                            let cleanMotif = rdv.motif.replace(/^(QUICK\||STD\|)/, '');
                            return cleanMotif.includes(' | ') 
                              ? cleanMotif.split(' | ').join(' • ')
                              : cleanMotif;
                          })()}
                        </p>
                      </div>
                      <div className="flex items-center gap-3 ml-4 flex-shrink-0">
                        <span className="text-sm font-semibold text-foreground tabular-nums">{rdv.heure}</span>
                        {rdv.statut === "en attente" ? (
                          <button
                            onClick={() => {
                              setSelectedAppointment(rdv);
                              setAppointmentActionOpen(true);
                            }}
                            className="px-3 py-1 rounded border border-gray-300 bg-transparent text-gray-600 hover:bg-[#3b82f6] hover:text-white hover:border-[#3b82f6] transition-all duration-300 cursor-pointer text-sm font-normal"
                            title="Cliquez pour confirmer ou rejeter"
                          >
                            En attente
                          </button>
                        ) : rdv.statut === "confirmé" ? (
                          rdv.motif.startsWith('QUICK|') ? (
                            // Ancien Patient - Static badge (no action needed)
                            <span className="px-3 py-1 rounded border border-success/50 bg-success/5 text-success text-sm font-normal inline-block">
                              Confirmé
                            </span>
                          ) : (
                            // Nouveau Patient - Clickable to open patient creation modal
                            <button
                              onClick={() => {
                                setAppointmentToConvert(rdv);
                                setNewPatientOpen(true);
                              }}
                              className="px-3 py-1 rounded border border-success/50 bg-success/5 text-success hover:bg-success hover:text-white hover:border-success transition-all duration-300 cursor-pointer text-sm font-normal"
                              title="Cliquez pour créer le dossier patient"
                            >
                              Confirmé
                            </button>
                          )
                        ) : (
                          <span className="px-3 py-1 rounded border border-destructive/50 bg-destructive/5 text-destructive hover:bg-destructive hover:text-white hover:border-destructive transition-all duration-300 text-sm font-normal inline-block">
                            Annulé
                          </span>
                        )}
                        {/* View File Button - Only for Ancien Patient with patient_id */}
                        {rdv.motif.startsWith('QUICK|') && rdv.patientId && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedPatientId(rdv.patientId);
                              setPatientFileOpen(true);
                            }}
                            className="text-primary hover:text-primary hover:bg-primary/10 h-8 w-8 p-0"
                            title="Voir le dossier patient"
                          >
                            <FolderOpen className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Right Column: Passages Directs du Jour */}
          <Card className="border border-border">
            <CardHeader className="flex flex-row items-center justify-between bg-muted/30 border-b border-border gap-2">
              <CardTitle className="text-base font-semibold flex items-center gap-2 text-foreground">
                <Clock className="h-5 w-5 text-primary" />
                Passages Directs du Jour
              </CardTitle>
              <div className="flex gap-2">
                <Button 
                  size="sm" 
                  onClick={() => setHistoriqueOpen(true)} 
                  variant="outline"
                  className="text-xs sm:text-sm"
                >
                  Historique
                </Button>
                <Button 
                  size="sm" 
                  onClick={() => setNewPassageOpen(true)} 
                  className="bg-[#3b82f6] hover:bg-[#1e40af] text-white text-xs sm:text-sm"
                >
                  + Nouveau Passage
                </Button>
                <Button 
                  onClick={() => setArchiveConfirmOpen(true)}
                  variant="outline"
                  disabled={!todayPassages.some(p => p.statut === 'passé' || p.statut === 'annulé')}
                  size="icon"
                  title="Archiver les passages traités"
                >
                  <Archive className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-4">
              {todayPassages.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4">Aucun passage aujourd'hui</p>
              ) : (
                <div className="space-y-2">
                  {todayPassages.map((passage) => (
                    <div
                      key={passage.id}
                      className="flex items-center justify-between rounded border border-border p-3 hover:bg-muted/30 transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm text-foreground truncate">{passage.nomPrenom}</p>
                        <p className="text-xs text-muted-foreground truncate">{passage.motif}</p>
                      </div>
                      <div className="flex items-center gap-3 ml-4 flex-shrink-0">
                        <span className="text-sm font-semibold text-foreground tabular-nums">{passage.heure}</span>
                        {passage.statut === "en attente" ? (
                          <div className="flex gap-2">
                            <button
                              onClick={async () => {
                                try {
                                  await updatePassageDirect(passage.id, { statut: "passé" });
                                  toast.success("Marqué comme passé");
                                } catch (error) {
                                  console.error('Failed to update passage:', error);
                                  toast.error("Erreur lors de la mise à jour");
                                }
                              }}
                              className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                              title="Marquer comme passé"
                            >
                              <CheckCircle2 className="h-5 w-5" />
                            </button>
                            <button
                              onClick={async () => {
                                try {
                                  await updatePassageDirect(passage.id, { statut: "annulé" });
                                  toast.success("Marqué comme annulé");
                                } catch (error) {
                                  console.error('Failed to update passage:', error);
                                  toast.error("Erreur lors de la mise à jour");
                                }
                              }}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Marquer comme annulé"
                            >
                              <XCircle className="h-5 w-5" />
                            </button>
                          </div>
                        ) : passage.statut === "passé" ? (
                          <div className="flex items-center gap-1 text-green-600">
                            <CheckCircle2 className="h-5 w-5" />
                            <span className="text-xs font-medium">Passé</span>
                          </div>
                        ) : passage.statut === "annulé" ? (
                          <div className="flex items-center gap-1 text-red-600">
                            <XCircle className="h-5 w-5" />
                            <span className="text-xs font-medium">Annulé</span>
                          </div>
                        ) : (
                          <span className="text-xs font-medium text-muted-foreground">{passage.statut}</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <NewPatientModal
        open={newPatientOpen}
        onOpenChange={setNewPatientOpen}
        categories={categories}
        onSubmit={handleNewPatientSubmit}
        prefilledData={appointmentToConvert ? (() => {
          // Parse motif to extract category and type
          // Format: "STD|Category | Type" or "QUICK|Category | Type"
          let cleanMotif = appointmentToConvert.motif.replace(/^(QUICK\||STD\|)/, '');
          let category = "";
          let type = "";
          
          if (cleanMotif.includes(' | ')) {
            const parts = cleanMotif.split(' | ');
            category = parts[0] || "";
            type = parts[1] || "";
          } else {
            category = cleanMotif;
          }
          
          return {
            nom: appointmentToConvert.nom || appointmentToConvert.patientNom.split(' ')[0] || "",
            prenom: appointmentToConvert.prenom || appointmentToConvert.patientNom.split(' ').slice(1).join(' ') || "",
            telephone: appointmentToConvert.telephone,
            age: appointmentToConvert.age,
            categorie: category,
            type: type,
          };
        })() : undefined}
      />

      <NewRendezVousModal
        open={newRdvOpen}
        onOpenChange={setNewRdvOpen}
        categories={categories}
        onSubmit={async (rdvData) => {
          try {
            await addRendezVous(rdvData);
            toast.success("Rendez-vous ajouté");
          } catch (error) {
            console.error('Failed to add rendez-vous:', error);
            toast.error("Erreur lors de l'ajout");
          }
        }}
      />

      <NewPassageDirectModal
        open={newPassageOpen}
        onOpenChange={setNewPassageOpen}
        categories={categories}
        onSubmit={async (passageData) => {
          try {
            await addPassageDirect(passageData);
            toast.success("Passage direct ajouté");
          } catch (error) {
            console.error('Failed to add passage direct:', error);
            toast.error("Erreur lors de l'ajout");
          }
        }}
      />

      <AppointmentActionModal
        open={appointmentActionOpen}
        onOpenChange={setAppointmentActionOpen}
        appointment={selectedAppointment}
        categories={categories}
        onConfirm={handleConfirmAppointment}
        onReject={handleRejectAppointment}
        onReschedule={handleRescheduleAppointment}
      />

      <PatientFileModal
        open={patientFileOpen}
        onOpenChange={setPatientFileOpen}
        patientId={selectedPatientId}
      />

      <RescheduleModal
        open={rescheduleOpen}
        onOpenChange={setRescheduleOpen}
        appointment={selectedAppointment}
        onReschedule={handleRescheduleSubmit}
        isLoading={rescheduleLoading}
      />

      <HistoriquePassagesModal
        open={historiquOpen}
        onOpenChange={setHistoriqueOpen}
      />

      <AlertDialog open={archiveConfirmOpen} onOpenChange={setArchiveConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogTitle>Archiver les passages du jour</AlertDialogTitle>
          <AlertDialogDescription>
            Êtes-vous sûr de vouloir archiver tous les passages du jour ?
          </AlertDialogDescription>
          <div className="flex gap-2 justify-end">
            <AlertDialogCancel>Non</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                try {
                  const todayStr = new Date().toISOString().split("T")[0];
                  await archivePassageDirectsByDate(todayStr);
                  toast.success("Passages archivés avec succès");
                  setArchiveConfirmOpen(false);
                } catch (error) {
                  console.error('Failed to archive passages:', error);
                  toast.error("Erreur lors de l'archivage");
                  setArchiveConfirmOpen(false);
                }
              }}
            >
              Oui
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </AppLayout>
  );
}
