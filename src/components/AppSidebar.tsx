import {
  LayoutDashboard,
  Users,
  Calendar,
  Settings,
  LogOut,
  KeyRound,
  Info,
  Activity,
} from "lucide-react";
import { Link, useLocation, useRouter } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth-context";
import { useState } from "react";
import { ChangePasswordModal } from "@/components/modals/ChangePasswordModal";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  SidebarHeader,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

const mainItems = [
  { title: "Tableau de Bord", url: "/", icon: LayoutDashboard },
  { title: "Patients", url: "/patients", icon: Users },
  { title: "Rendez-vous", url: "/rendez-vous", icon: Calendar },
  { title: "Calendrier", url: "/calendrier", icon: Calendar },
];

const configItems = [
  { title: "Catégories de Soins", url: "/configurations/categories", icon: Settings },
  { title: "État du système", url: "/system-status", icon: Activity },
  { title: "À propos", url: "/about", icon: Info },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const router = useRouter();
  const { logout } = useAuth();
  const currentPath = location.pathname;
  const [changePasswordOpen, setChangePasswordOpen] = useState(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);

  const isActive = (path: string) => {
    if (path === "/") return currentPath === "/";
    return currentPath.startsWith(path);
  };

  const handleLogoutClick = () => {
    setIsLogoutModalOpen(true);
  };

  const handleLogoutConfirm = () => {
    setIsLogoutModalOpen(false);
    logout();
    router.navigate({ to: "/" });
  };

  const handleLogoutCancel = () => {
    setIsLogoutModalOpen(false);
  };

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border p-4 bg-muted/20 transition-all duration-300 overflow-hidden">
        {collapsed ? (
          <div className="flex items-center justify-center w-full">
            <span className="text-2xl font-bold text-black">
              D<span className="text-[#3b82f6]">.</span>
            </span>
          </div>
        ) : (
          <div className="flex flex-col gap-1 w-full overflow-hidden">
            <h2 className="text-xl font-bold text-black truncate">
              Dentix<span className="text-[#3b82f6]">.</span>
            </h2>
            <p className="text-xs text-muted-foreground truncate">Softix Dentaire</p>
          </div>
        )}
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs uppercase tracking-wider text-muted-foreground font-semibold px-3">Menu</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive(item.url)}
                    tooltip={item.title}
                  >
                    <Link to={item.url}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className="text-xs uppercase tracking-wider text-muted-foreground font-semibold px-3">Configuration</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {configItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive(item.url)}
                    tooltip={item.title}
                  >
                    <Link to={item.url}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border p-0">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={() => setChangePasswordOpen(true)}
              tooltip="Modifier le mot de passe"
              className="text-sidebar-foreground/70 hover:text-sidebar-foreground"
            >
              <KeyRound className="h-4 w-4" />
              <span>Modifier le mot de passe</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={handleLogoutClick}
              tooltip="Déconnexion"
              className="text-sidebar-foreground/70 hover:text-sidebar-foreground"
            >
              <LogOut className="h-4 w-4" />
              <span>Déconnexion</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      <ChangePasswordModal
        open={changePasswordOpen}
        onOpenChange={setChangePasswordOpen}
      />

      {/* Logout Confirmation Dialog */}
      <Dialog open={isLogoutModalOpen} onOpenChange={setIsLogoutModalOpen}>
        <DialogContent className="bg-white text-black border-gray-200 sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold text-black">
              Confirmation de déconnexion
            </DialogTitle>
            <DialogDescription className="text-gray-600 text-base pt-2">
              Êtes-vous sûr de vouloir vous déconnecter ?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0 mt-4">
            <Button
              variant="outline"
              onClick={handleLogoutCancel}
              className="bg-white text-black border-gray-300 hover:bg-gray-50 hover:text-black"
            >
              Annuler
            </Button>
            <Button
              onClick={handleLogoutConfirm}
              className="bg-[#3b82f6] text-white hover:bg-[#1e40af] shadow-sm"
            >
              Confirmer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Sidebar>
  );
}
