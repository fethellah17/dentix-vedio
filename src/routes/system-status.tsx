import { createFileRoute } from "@tanstack/react-router";
import { AppLayout } from "@/components/AppLayout";
import { useAuth } from "@/lib/auth-context";
import { LoginPage } from "@/components/LoginPage";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Database, Calendar, HardDrive } from "lucide-react";
import { useState, useEffect } from "react";

export const Route = createFileRoute("/system-status")({
  component: SystemStatusPage,
  head: () => ({
    meta: [{ title: "État du système - Dentix" }],
  }),
});

function SystemStatusPage() {
  const { isAuthenticated, isInitialized } = useAuth();
  const [dbSize, setDbSize] = useState<string>("Calcul en cours...");
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [lastBackup] = useState<string>(new Date().toLocaleDateString("fr-FR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  }));

  useEffect(() => {
    // Calculate database size (read-only operation)
    const calculateDbSize = async () => {
      setIsLoading(true);
      try {
        const response = await fetch("http://localhost:3000/api/system/db-size");
        if (response.ok) {
          const data = await response.json();
          setDbSize(data.size);
        } else {
          setDbSize("Erreur de calcul");
        }
      } catch (error) {
        console.error("Error fetching database size:", error);
        setDbSize("Non disponible");
      } finally {
        setIsLoading(false);
      }
    };

    if (isAuthenticated) {
      calculateDbSize();
    }
  }, [isAuthenticated]);

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

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">État du système</h1>
          <p className="text-sm text-muted-foreground">Informations sur l'état du système</p>
        </div>

        {/* System Status Cards */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Database Size Card */}
          <Card className="border border-border">
            <CardHeader className="bg-muted/30 border-b border-border pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-[#3b82f6]/10 rounded-lg">
                  <Database className="h-5 w-5 text-[#3b82f6]" />
                </div>
                <h3 className="text-lg font-semibold text-foreground">Base de données</h3>
              </div>
            </CardHeader>
            <CardContent className="pt-6 pb-6">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-muted-foreground">Taille de la base de données</span>
                  {isLoading ? (
                    <div className="flex items-center gap-2">
                      <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-[#3b82f6]"></div>
                      <span className="text-sm text-muted-foreground">Calcul...</span>
                    </div>
                  ) : (
                    <span className="text-lg font-bold text-foreground">{dbSize}</span>
                  )}
                </div>
                <div className="border-t border-border"></div>
                <div className="flex items-start gap-2 bg-muted/30 rounded-lg p-3">
                  <HardDrive className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Taille exacte du fichier dental-clinic.db tel qu'affiché dans les propriétés Windows.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Last Backup Card */}
          <Card className="border border-border">
            <CardHeader className="bg-muted/30 border-b border-border pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-[#3b82f6]/10 rounded-lg">
                  <Calendar className="h-5 w-5 text-[#3b82f6]" />
                </div>
                <h3 className="text-lg font-semibold text-foreground">Sauvegarde</h3>
              </div>
            </CardHeader>
            <CardContent className="pt-6 pb-6">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-muted-foreground">Dernière sauvegarde</span>
                  <span className="text-sm font-semibold text-foreground">{lastBackup}</span>
                </div>
                <div className="border-t border-border"></div>
                <div className="flex items-center gap-2 bg-green-50 rounded-lg p-3">
                  <div className="h-2 w-2 rounded-full bg-green-500 flex-shrink-0"></div>
                  <p className="text-xs text-green-700 font-medium">
                    Système opérationnel
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* System Information Card */}
        <Card className="border border-border">
          <CardHeader className="bg-muted/30 border-b border-border pb-4">
            <h3 className="text-lg font-semibold text-foreground">Informations système</h3>
          </CardHeader>
          <CardContent className="pt-6 pb-6">
            <div className="space-y-3">
              <div className="flex justify-between items-center py-2">
                <span className="text-sm font-medium text-muted-foreground">Version de l'application</span>
                <span className="text-sm font-semibold text-foreground">1.0.0</span>
              </div>
              <div className="border-t border-border"></div>
              <div className="flex justify-between items-center py-2">
                <span className="text-sm font-medium text-muted-foreground">Environnement</span>
                <span className="text-sm font-semibold text-foreground">Production</span>
              </div>
              <div className="border-t border-border"></div>
              <div className="flex justify-between items-center py-2">
                <span className="text-sm font-medium text-muted-foreground">Statut</span>
                <span className="inline-flex items-center gap-2 text-sm font-semibold text-green-600">
                  <div className="h-2 w-2 rounded-full bg-green-500"></div>
                  En ligne
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Additional Info Card */}
        <Card className="border border-border bg-muted/20">
          <CardContent className="pt-6 pb-6">
            <div className="text-center space-y-2">
              <p className="text-xs text-muted-foreground">
                Cette page affiche des informations en lecture seule sur l'état du système.
              </p>
              <p className="text-xs text-muted-foreground">
                Pour toute question ou assistance, veuillez contacter votre administrateur système.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
