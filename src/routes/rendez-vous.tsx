import { createFileRoute } from "@tanstack/react-router";
import { AppLayout } from "@/components/AppLayout";
import { useAuth } from "@/lib/auth-context";
import { LoginPage } from "@/components/LoginPage";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus, Calendar, Trash2, ChevronUp, Phone, Archive, FolderOpen, Settings } from "lucide-react";
import { useState } from "react";
import { useRendezVous } from "@/hooks/use-rendez-vous";
import { usePatients } from "@/hooks/use-patients";
import { useCategories } from "@/hooks/use-categories";
import { NewRendezVousModal } from "@/components/modals/NewRendezVousModal";
import { AppointmentActionModal } from "@/components/modals/AppointmentActionModal";
import { RescheduleModal } from "@/components/modals/RescheduleModal";
import { NewPatientModal } from "@/components/modals/NewPatientModal";
import { PatientFileModal } from "@/components/modals/PatientFileModal";
import { SettingsModal } from "@/components/modals/SettingsModal";
import { HistoriqueRendezVousModal } from "@/components/modals/HistoriqueRendezVousModal";
import { getWhatsAppLink, handleWhatsAppClick } from "@/lib/phone-utils";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { type RendezVous } from "@/lib/mock-data";
import {
  separateActiveAndArchived,
  groupAndSortAppointments,
  canArchiveDate,
} from "@/lib/appointment-utils";

export const Route = createFileRoute("/rendez-vous")({
  component: RendezVousPage,
  head: () => ({
    meta: [{ title: "Rendez-vous - Dentix" }],
  }),
});

function RendezVousPage() {
  // ALL HOOKS MUST BE CALLED AT TOP LEVEL - BEFORE ANY RETURNS
  const { isAuthenticated, isInitialized } = useAuth();
  const { rendezVous, addRendezVous, updateRendezVous, deleteRendezVous, archiveByDate } = useRendezVous();
  const { addPatient } = usePatients();
  const { categories } = useCategories();
  
  // STATE HOOKS
  const [newRdvOpen, setNewRdvOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [selectedAppointment, setSelectedAppointment] = useState<RendezVous | null>(null);
  const [appointmentActionOpen, setAppointmentActionOpen] = useState(false);
  const [newPatientOpen, setNewPatientOpen] = useState(false);
  const [appointmentToConvert, setAppointmentToConvert] = useState<RendezVous | null>(null);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [archiveConfirm, setArchiveConfirm] = useState<string | null>(null);
  const [showArchive, setShowArchive] = useState(false);
  const [prefilledDate, setPrefilledDate] = useState<string | undefined>(undefined);
  const [patientFileOpen, setPatientFileOpen] = useState(false);
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [rescheduleOpen, setRescheduleOpen] = useState(false);
  const [rescheduleLoading, setRescheduleLoading] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [historiqueOpen, setHistoriqueOpen] = useState(false);
  
  // NOW HANDLE INITIALIZATION/AUTH CHECKS AFTER ALL HOOKS
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

  // UI Guard: Ensure rendezVous is always an array
  if (!rendezVous || !Array.isArray(rendezVous)) {
    return (
      <AppLayout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#3b82f6]"></div>
            <p className="mt-4 text-slate-600">Chargement des rendez-vous...</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  // Save showArchive state to localStorage whenever it changes
  const handleToggleArchive = (show: boolean) => {
    setShowArchive(show);
  };

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleConfirmAppointment = async (appointment: RendezVous) => {
    try {
      // ONLY update status to "confirmé" - DO NOT open any modal
      await updateRendezVous(appointment.id, { statut: "confirmé" });
      setAppointmentActionOpen(false);
      showToast("Rendez-vous confirmé");
    } catch (error) {
      console.error('Failed to confirm appointment:', error);
      showToast("Erreur lors de la confirmation", "error");
    }
  };

  const handleRejectAppointment = async (appointmentId: string) => {
    try {
      // Mark as cancelled - appointment stays visible until day is archived
      await updateRendezVous(appointmentId, { statut: "annulé" });
      showToast("Rendez-vous annulé");
    } catch (error) {
      console.error('Failed to reject appointment:', error);
      showToast("Erreur lors du rejet", "error");
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
      showToast("Rendez-vous reporté avec succès");
    } catch (error) {
      console.error('Failed to reschedule appointment:', error);
      showToast("Erreur lors du changement de rendez-vous", "error");
    } finally {
      setRescheduleLoading(false);
    }
  };

  const handleArchiveDate = async (date: string) => {
    try {
      // Archive on backend and refetch fresh data
      await archiveByDate(date);
      showToast("Journée archivée avec succès");
      // Automatically show archive after archiving
      handleToggleArchive(true);
      setArchiveConfirm(null);
    } catch (error) {
      console.error('Failed to archive date:', error);
      showToast("Erreur lors de l'archivage", "error");
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

      showToast("Patient créé avec succès. Veuillez compléter le dossier.");
      setNewPatientOpen(false);
      setAppointmentToConvert(null);
    } catch (error: any) {
      console.error('Failed to create patient:', error);
      
      // Show the conflict error message if patient already exists
      if (error.message && error.message.includes('existe déjà')) {
        showToast("Ce patient existe déjà dans la base de données", "error");
      } else {
        showToast("Erreur lors de la création du patient", "error");
      }
    }
  };

  const handleAddRendezVous = async (rdvData: any) => {
    try {
      // Add STD prefix to identify standard appointments from Rendez-vous page
      const motifValue = `STD|${rdvData.motif}`;
      
      // Add the appointment with all fields including telephone and age
      await addRendezVous({
        patientId: "",
        patientNom: rdvData.patientNom,
        nom: rdvData.nom,
        prenom: rdvData.prenom,
        date: rdvData.date,
        heure: rdvData.heure,
        motif: motifValue,
        statut: "en attente",
        telephone: rdvData.telephone,
        age: rdvData.age,
      });
      
      showToast("Rendez-vous ajouté à la liste d'attente");
      setPrefilledDate(undefined);
      setNewRdvOpen(false);
      
      // Clear browser history state to prevent re-submission on refresh
      if (typeof window !== 'undefined' && window.history.replaceState) {
        window.history.replaceState(null, '', window.location.pathname);
      }
    } catch (error: any) {
      console.error('Failed to add appointment:', error);
      
      // Handle duplicate appointment (409 Conflict)
      if (error.message && error.message.includes('Duplicate')) {
        showToast("Ce rendez-vous existe déjà", "error");
      } else {
        showToast("Erreur lors de l'ajout du rendez-vous", "error");
      }
    }
  };

  const handleQuickAddClick = (date: string) => {
    setPrefilledDate(date);
    setNewRdvOpen(true);
  };

  // Separate active and archived appointments
  const { active: activeAppointments, archived: archivedAppointments } =
    separateActiveAndArchived(rendezVous);

  // Group and sort active appointments
  const { grouped: activeGrouped, sortedDates: activeSortedDates } =
    groupAndSortAppointments(activeAppointments);

  // Group and sort archived appointments
  const { grouped: archivedGrouped, sortedDates: archivedSortedDates } =
    groupAndSortAppointments(archivedAppointments);

  // Check if there are any active (non-archived) appointments
  const hasActiveAppointments = activeAppointments.length > 0;

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Gestion des Rendez-vous</h1>
            <p className="text-sm text-muted-foreground">
              {activeAppointments.length} rendez-vous actifs
              {archivedAppointments.length > 0 && ` • ${archivedAppointments.length} archivés`}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {/* Settings Button */}
            <Button
              variant="outline"
              onClick={() => setSettingsOpen(true)}
              className="p-2"
              title="Configurer les heures de travail"
              aria-label="Paramètres"
            >
              <Settings className="h-4 w-4" />
            </Button>
            {/* Archive History Button */}
            <Button
              variant="outline"
              onClick={() => setHistoriqueOpen(true)}
              className="gap-2"
            >
              <Archive className="h-4 w-4" />
              Historique {archivedAppointments.length > 0 && `(${archivedAppointments.length})`}
            </Button>
            <Button onClick={() => setNewRdvOpen(true)} className="bg-[#3b82f6] hover:bg-[#1e40af]">
              <Plus className="h-4 w-4 mr-2" /> Nouveau RDV
            </Button>
          </div>
        </div>

        {toast && (
          <div className={`p-3 rounded-lg text-sm font-medium ${
            toast.type === "success" 
              ? "bg-success/10 text-success border border-success/20" 
              : "bg-destructive/10 text-destructive border border-destructive/20"
          }`}>
            {toast.message}
          </div>
        )}

        {/* Active Appointments Section */}
        <div className="space-y-4">
          {!hasActiveAppointments ? (
            <Card className="border border-border">
              <CardContent className="pt-8 pb-8 text-center">
                <p className="text-muted-foreground">Aucun rendez-vous en attente</p>
                <p className="text-sm text-muted-foreground mt-1">Tous les rendez-vous ont été traités</p>
              </CardContent>
            </Card>
          ) : (
            activeSortedDates?.map((date) => (
              <Card key={date} className="border border-border">
                <CardHeader className="pb-3 bg-muted/30 border-b border-border">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-sm font-semibold flex items-center gap-2 text-foreground">
                        <Calendar className="h-4 w-4 text-primary" />
                        {new Date(date).toLocaleDateString("fr-FR", {
                          weekday: "long",
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </CardTitle>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleQuickAddClick(date)}
                        className="h-7 px-2 gap-1 text-xs"
                        title="Ajouter un rendez-vous pour cette date"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        <span className="hidden sm:inline">Ajouter</span>
                      </Button>
                    </div>
                    {canArchiveDate(rendezVous, date) && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setArchiveConfirm(date)}
                        className="h-8 gap-2 text-xs"
                        title="Archiver tous les rendez-vous confirmés/annulés"
                      >
                        <Archive className="h-3.5 w-3.5" />
                        Archiver
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="pt-4">
                  <div className="space-y-2">
                    {activeGrouped[date]
                      ?.sort((a, b) => a.heure.localeCompare(b.heure))
                      ?.map((rdv) => (
                        <div
                          key={rdv.id}
                          className={`flex items-center justify-between rounded border border-border p-2 sm:p-3 transition-colors ${
                            rdv.statut === "annulé"
                              ? "opacity-60"
                              : "hover:bg-muted/30"
                          }`}
                        >
                          {/* WhatsApp Button - Mobile Priority with Large Touch Target */}
                          <div className="flex-shrink-0 w-10 h-10 sm:w-12 flex items-center justify-center mr-2 sm:mr-0">
                            {rdv.telephone ? (
                              <a
                                href={getWhatsAppLink(rdv.telephone)}
                                onClick={(e) => handleWhatsAppClick(e, rdv.telephone)}
                                className="w-10 h-10 flex items-center justify-center rounded-full transition-all duration-200 active:scale-95"
                                style={{
                                  backgroundColor: 'rgba(37, 211, 102, 0.1)',
                                  color: '#25D366',
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.backgroundColor = 'rgba(37, 211, 102, 0.2)';
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.backgroundColor = 'rgba(37, 211, 102, 0.1)';
                                }}
                                title={`Envoyer un message WhatsApp à ${rdv.telephone}`}
                              >
                                <Phone className="h-5 w-5" />
                              </a>
                            ) : (
                              <div className="w-10 h-10 flex items-center justify-center rounded-full" style={{ backgroundColor: 'rgba(0, 0, 0, 0.05)' }}>
                                <Phone className="h-5 w-5 text-muted-foreground/30" />
                              </div>
                            )}
                          </div>

                          {/* Time and Patient Info */}
                          <div className="flex items-center gap-2 sm:gap-4 flex-1 min-w-0">
                            <div className="text-sm sm:text-base font-semibold text-black w-12 sm:w-16 tabular-nums flex-shrink-0">{rdv.heure}</div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1 sm:gap-2 flex-wrap">
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
                          </div>

                          {/* Status Badge, View File Button, and Delete Button */}
                          <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0 ml-2">
                            {/* Clickable Status Badge for Pending, Static Badge for Others */}
                            {rdv.statut === "en attente" ? (
                              <button
                                onClick={() => {
                                  setSelectedAppointment(rdv);
                                  setAppointmentActionOpen(true);
                                }}
                                className="px-2 sm:px-3 py-1 rounded border border-gray-300 bg-transparent text-gray-600 hover:bg-[#3b82f6] hover:text-white hover:border-[#3b82f6] transition-all duration-300 cursor-pointer text-xs sm:text-sm font-normal"
                                title="Cliquez pour confirmer ou rejeter"
                              >
                                En attente
                              </button>
                            ) : rdv.statut === "confirmé" ? (
                              rdv.motif.startsWith('QUICK|') ? (
                                // Ancien Patient - Static badge (no action needed)
                                <span
                                  className="px-2 sm:px-3 py-1 rounded border border-success/50 bg-success/5 text-success text-xs sm:text-sm font-normal inline-block"
                                >
                                  Confirmé
                                </span>
                              ) : (
                                // Nouveau Patient - Clickable to open patient creation modal
                                <button
                                  onClick={() => {
                                    setAppointmentToConvert(rdv);
                                    setNewPatientOpen(true);
                                  }}
                                  className="px-2 sm:px-3 py-1 rounded border border-success/50 bg-success/5 text-success hover:bg-success hover:text-white hover:border-success transition-all duration-300 cursor-pointer text-xs sm:text-sm font-normal"
                                  title="Cliquez pour créer le dossier patient"
                                >
                                  Confirmé
                                </button>
                              )
                            ) : (
                              <span
                                className="px-2 sm:px-3 py-1 rounded border border-destructive/50 bg-destructive/5 text-destructive hover:bg-destructive hover:text-white hover:border-destructive transition-all duration-300 text-xs sm:text-sm font-normal inline-block"
                              >
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
                                className="text-primary hover:text-primary hover:bg-primary/10 h-8 w-8 p-0 flex-shrink-0"
                                title="Voir le dossier patient"
                              >
                                <FolderOpen className="h-4 w-4" />
                              </Button>
                            )}
                            
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                setDeleteConfirm(rdv.id);
                              }}
                              className="text-destructive hover:text-destructive hover:bg-destructive/10 h-8 w-8 p-0 flex-shrink-0"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>
            )) ?? null
          )}
        </div>

        {/* Archive Section - Toggled visibility */}
        {archivedAppointments.length > 0 && showArchive && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 pt-4 border-t border-border">
              <Archive className="h-5 w-5 text-muted-foreground" />
              <h2 className="text-lg font-semibold text-muted-foreground">Historique archivé</h2>
            </div>
            <div className="space-y-4 opacity-75">
                {archivedSortedDates?.map((date) => (
                  <Card key={date} className="border border-border">
                    <CardHeader className="pb-3 bg-muted/30 border-b border-border">
                      <CardTitle className="text-sm font-semibold flex items-center gap-2 text-foreground">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        {new Date(date).toLocaleDateString("fr-FR", {
                          weekday: "long",
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-4">
                      <div className="space-y-2">
                        {archivedGrouped[date]
                          ?.sort((a, b) => a.heure.localeCompare(b.heure))
                          ?.map((rdv) => (
                            <div
                              key={rdv.id}
                              className="flex items-center justify-between rounded border border-border p-2 sm:p-3 opacity-60"
                            >
                              {/* WhatsApp Button - Mobile Priority with Large Touch Target */}
                              <div className="flex-shrink-0 w-10 h-10 sm:w-12 flex items-center justify-center mr-2 sm:mr-0">
                                {rdv.telephone ? (
                                  <a
                                    href={getWhatsAppLink(rdv.telephone)}
                                    onClick={(e) => handleWhatsAppClick(e, rdv.telephone)}
                                    className="w-10 h-10 flex items-center justify-center rounded-full transition-all duration-200 active:scale-95"
                                    style={{
                                      backgroundColor: 'rgba(37, 211, 102, 0.1)',
                                      color: '#25D366',
                                    }}
                                    onMouseEnter={(e) => {
                                      e.currentTarget.style.backgroundColor = 'rgba(37, 211, 102, 0.2)';
                                    }}
                                    onMouseLeave={(e) => {
                                      e.currentTarget.style.backgroundColor = 'rgba(37, 211, 102, 0.1)';
                                    }}
                                    title={`Envoyer un message WhatsApp à ${rdv.telephone}`}
                                  >
                                    <Phone className="h-5 w-5" />
                                  </a>
                                ) : (
                                  <div className="w-10 h-10 flex items-center justify-center rounded-full" style={{ backgroundColor: 'rgba(0, 0, 0, 0.05)' }}>
                                    <Phone className="h-5 w-5 text-muted-foreground/30" />
                                  </div>
                                )}
                              </div>

                              {/* Time and Patient Info */}
                              <div className="flex items-center gap-2 sm:gap-4 flex-1 min-w-0">
                                <div className="text-sm sm:text-base font-semibold text-muted-foreground w-12 sm:w-16 tabular-nums flex-shrink-0">{rdv.heure}</div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-1 sm:gap-2 flex-wrap">
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
                              </div>

                              {/* Status Badge - Read-Only */}
                              <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0 ml-2">
                                <span
                                  className={`px-2 sm:px-3 py-1 rounded border font-normal text-xs sm:text-sm inline-block transition-all duration-300 ${
                                    rdv.statut === "confirmé" 
                                      ? "border-success/50 bg-success/5 text-success hover:bg-success hover:text-white hover:border-success" 
                                      : "border-destructive/50 bg-destructive/5 text-destructive hover:bg-destructive hover:text-white hover:border-destructive"
                                  }`}
                                >
                                  {rdv.statut === "confirmé" ? "Confirmé" : "Annulé"}
                                </span>
                                
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
                                    className="text-primary hover:text-primary hover:bg-primary/10 h-8 w-8 p-0 flex-shrink-0"
                                    title="Voir le dossier patient"
                                  >
                                    <FolderOpen className="h-4 w-4" />
                                  </Button>
                                )}
                                
                                {/* Delete disabled for archived records */}
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  disabled
                                  className="text-muted-foreground/30 cursor-not-allowed h-8 w-8 p-0 flex-shrink-0"
                                  title="Les enregistrements archivés ne peuvent pas être supprimés"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          ))}
                      </div>
                    </CardContent>
                  </Card>
                )) ?? null}
            </div>
          </div>
        )}
      </div>

      <NewRendezVousModal
        open={newRdvOpen}
        onOpenChange={(open) => {
          setNewRdvOpen(open);
          if (!open) setPrefilledDate(undefined); // Clear prefilled date when modal closes
        }}
        categories={categories}
        onSubmit={handleAddRendezVous}
        prefilledDate={prefilledDate}
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

      <AlertDialog open={deleteConfirm !== null} onOpenChange={(open) => !open && setDeleteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer le rendez-vous</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer ce rendez-vous ? Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex gap-3 justify-end">
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteConfirm && deleteRendezVous(deleteConfirm)}
              className="bg-destructive hover:bg-destructive/90"
            >
              Supprimer
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={archiveConfirm !== null} onOpenChange={(open) => !open && setArchiveConfirm(null)}>
        <AlertDialogContent className="bg-white border-border">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-foreground">Archiver cette journée</AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              Êtes-vous sûr de vouloir archiver cette journée ?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex gap-3 justify-end">
            <AlertDialogCancel className="bg-white text-foreground border-border hover:bg-muted">
              Annuler
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => archiveConfirm && handleArchiveDate(archiveConfirm)}
              className="bg-[#3b82f6] hover:bg-[#1e40af] text-white"
            >
              Confirmer
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>

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

      <SettingsModal
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
      />

      <HistoriqueRendezVousModal
        open={historiqueOpen}
        onOpenChange={setHistoriqueOpen}
        onUnarchived={(unarchived) => {
          // Refetch appointments to reflect the unarchived appointment
          // The data context will handle the update
        }}
      />
    </AppLayout>
  );
}
