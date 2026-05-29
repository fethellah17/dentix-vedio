import type { ReactNode } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { ApiErrorNotification } from "@/components/ApiErrorNotification";
import { useEffect, useRef } from "react";

export function AppLayout({ children }: { children: ReactNode }) {
  const containerRef = useRef<HTMLDivElement>(null);

  // Update sidebar state class on mount and when sidebar state changes
  useEffect(() => {
    if (!containerRef.current) return;

    const updateSidebarStateClass = () => {
      const sidebar = containerRef.current?.querySelector('[data-state]');
      if (sidebar) {
        const state = sidebar.getAttribute('data-state');
        containerRef.current?.classList.remove('sidebar-expanded', 'sidebar-collapsed');
        if (state === 'expanded') {
          containerRef.current?.classList.add('sidebar-expanded');
        } else if (state === 'collapsed') {
          containerRef.current?.classList.add('sidebar-collapsed');
        }
      }
    };

    // Initial update
    updateSidebarStateClass();

    // Watch for changes using MutationObserver
    const observer = new MutationObserver(updateSidebarStateClass);
    observer.observe(containerRef.current, {
      attributes: true,
      subtree: true,
      attributeFilter: ['data-state'],
    });

    return () => observer.disconnect();
  }, []);

  const currentDate = new Date().toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

  return (
    <SidebarProvider>
      <div ref={containerRef} className="min-h-screen flex w-full sidebar-expanded">
        <AppSidebar />
        <div className="flex-1 flex flex-col">
          <header className="h-14 flex items-center border-b bg-card px-4 gap-4">
            <SidebarTrigger />
            <div className="flex-1" />
            <span className="text-xs text-muted-foreground hidden sm:block">
              {currentDate}
            </span>
            <span className="text-xs text-muted-foreground hidden sm:block">
              Softix Team
            </span>
          </header>
          <main className="flex-1 p-4 md:p-6 overflow-auto">
            {children}
          </main>
          <footer className="border-t bg-card px-4 py-3 text-xs text-muted-foreground">
            <div className="flex items-center justify-center">
              <div className="text-xs">
                Dentix © 2026 | Softix Dentaire
              </div>
            </div>
          </footer>
        </div>
      </div>
      <ApiErrorNotification />
    </SidebarProvider>
  );
}
