import { createFileRoute } from "@tanstack/react-router";
import { AppLayout } from "@/components/AppLayout";
import { useAuth } from "@/lib/auth-context";
import { LoginPage } from "@/components/LoginPage";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Info, CheckCircle, Shield, Facebook, Instagram, Phone } from "lucide-react";

export const Route = createFileRoute("/about")({
  component: AboutPage,
  head: () => ({
    meta: [{ title: "À propos - Dentix" }],
  }),
});

function AboutPage() {
  const { isAuthenticated, isInitialized } = useAuth();

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
          <h1 className="text-2xl font-bold text-foreground">À propos</h1>
          <p className="text-sm text-muted-foreground">Informations sur l'application</p>
        </div>

        {/* Main About Card */}
        <Card className="border border-border">
          <CardHeader className="bg-muted/30 border-b border-border pb-6">
            <div className="flex flex-col items-center justify-center text-center space-y-4">
              {/* Logo/Brand */}
              <div className="flex items-center justify-center">
                <h2 className="text-5xl font-bold text-black">
                  Dentix<span className="text-[#3b82f6]">.</span>
                </h2>
              </div>
              <p className="text-base text-muted-foreground font-medium">
                Softix Dentaire
              </p>
            </div>
          </CardHeader>
          <CardContent className="pt-8 pb-8 space-y-8">
            {/* Description */}
            <div className="text-center space-y-2">
              <div className="flex items-center justify-center gap-2 mb-4">
                <Info className="h-5 w-5 text-[#3b82f6]" />
                <h3 className="text-lg font-semibold text-foreground">Description</h3>
              </div>
              <p className="text-base text-foreground max-w-2xl mx-auto leading-relaxed">
                Système de gestion professionnel développé et maintenu par Softix Agency.
              </p>
            </div>

            {/* Divider */}
            <div className="border-t border-border"></div>

            {/* Version Information */}
            <div className="space-y-4">
              <div className="flex items-center justify-center gap-2 mb-4">
                <CheckCircle className="h-5 w-5 text-[#3b82f6]" />
                <h3 className="text-lg font-semibold text-foreground">Informations</h3>
              </div>
              <div className="bg-muted/30 rounded-lg p-6 max-w-md mx-auto space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-muted-foreground">Version</span>
                  <span className="text-sm font-semibold text-foreground">1.0.0</span>
                </div>
                <div className="border-t border-border"></div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-muted-foreground">Développeur</span>
                  <span className="text-sm font-semibold text-foreground">Softix Agency</span>
                </div>
                <div className="border-t border-border"></div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-muted-foreground">Année</span>
                  <span className="text-sm font-semibold text-foreground">2026</span>
                </div>
              </div>
            </div>

            {/* Divider */}
            <div className="border-t border-border"></div>

            {/* Copyright */}
            <div className="text-center">
              <p className="text-sm text-muted-foreground">
                © 2026 Softix Agency. All Rights Reserved.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Contactez-nous Card */}
        <Card className="border border-border">
          <CardHeader className="bg-muted/30 border-b border-border pb-4">
            <div className="flex items-center justify-center gap-2">
              <Phone className="h-5 w-5 text-[#3b82f6]" />
              <h3 className="text-lg font-semibold text-foreground">Contactez-nous</h3>
            </div>
          </CardHeader>
          <CardContent className="pt-8 pb-8 space-y-8">
            {/* Social Media Links */}
            <div className="space-y-4">
              <h4 className="text-sm font-semibold text-foreground text-center">Suivez-nous</h4>
              <div className="flex items-center justify-center gap-8">
                {/* Facebook */}
                <a
                  href="https://www.facebook.com/share/1J19co7JrP/?mibextid=wwXIfr"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex flex-col items-center gap-2 p-3 rounded-lg hover:bg-muted/50 transition-colors"
                  aria-label="Facebook"
                >
                  <Facebook className="h-6 w-6 text-[#3b82f6]" />
                  <span className="text-xs text-muted-foreground font-medium">Facebook</span>
                </a>

                {/* Instagram */}
                <a
                  href="https://www.instagram.com/softix_agency?igsh=MTZ5bDh5dXFmaDFk"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex flex-col items-center gap-2 p-3 rounded-lg hover:bg-muted/50 transition-colors"
                  aria-label="Instagram"
                >
                  <Instagram className="h-6 w-6 text-[#3b82f6]" />
                  <span className="text-xs text-muted-foreground font-medium">Instagram</span>
                </a>
              </div>
            </div>

            {/* Divider */}
            <div className="border-t border-border"></div>

            {/* Contact Numbers */}
            <div className="space-y-4">
              <h4 className="text-sm font-semibold text-foreground text-center">Numéros de téléphone</h4>
              <div className="bg-muted/30 rounded-lg p-6 max-w-md mx-auto space-y-4">
                <div className="flex items-center justify-center gap-3 py-2">
                  <Phone className="h-4 w-4 text-[#3b82f6] flex-shrink-0" />
                  <span className="text-sm font-semibold text-foreground">0795 63 23 44</span>
                </div>
                <div className="border-t border-border"></div>
                <div className="flex items-center justify-center gap-3 py-2">
                  <Phone className="h-4 w-4 text-[#3b82f6] flex-shrink-0" />
                  <span className="text-sm font-semibold text-foreground">0559 84 16 03</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Conditions d'utilisation Card */}
        <Card className="border border-border">
          <CardHeader className="bg-muted/30 border-b border-border pb-4">
            <div className="flex items-center justify-center gap-2">
              <Shield className="h-5 w-5 text-[#3b82f6]" />
              <h3 className="text-lg font-semibold text-foreground">Conditions d'utilisation</h3>
            </div>
          </CardHeader>
          <CardContent className="pt-6 pb-6">
            <div className="space-y-4 max-w-3xl mx-auto">
              {/* Propriété Intellectuelle */}
              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-foreground flex items-start gap-2">
                  <span className="text-[#3b82f6] flex-shrink-0">•</span>
                  <span>Propriété Intellectuelle</span>
                </h4>
                <p className="text-xs text-muted-foreground leading-relaxed pl-4">
                  Le code source et le nom "Dentix" sont la propriété exclusive de "Softix Agency". 
                  Le client dispose uniquement d'un droit d'usage personnel sur un seul appareil ou dans une seule clinique.
                </p>
              </div>

              {/* Divider */}
              <div className="border-t border-border"></div>

              {/* Interdiction de revente */}
              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-foreground flex items-start gap-2">
                  <span className="text-[#3b82f6] flex-shrink-0">•</span>
                  <span>Interdiction de revente</span>
                </h4>
                <p className="text-xs text-muted-foreground leading-relaxed pl-4">
                  Toute reproduction, revente ou partage du logiciel est strictement interdite. 
                  Cette mesure vise à protéger la propriété intellectuelle et la sécurité du système.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Additional Info Card */}
        <Card className="border border-border bg-muted/20">
          <CardContent className="pt-6 pb-6">
            <div className="text-center space-y-2">
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
