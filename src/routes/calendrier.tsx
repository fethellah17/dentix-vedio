import { createFileRoute } from "@tanstack/react-router";
import { AppLayout } from "@/components/AppLayout";
import { useAuth } from "@/lib/auth-context";
import { LoginPage } from "@/components/LoginPage";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from "lucide-react";
import { useState, useMemo } from "react";
import { useRendezVous } from "@/hooks/use-rendez-vous";
import { generateTimeSlots } from "@/lib/time-slots-utils";

export const Route = createFileRoute("/calendrier")({
  component: CalendrierPage,
  head: () => ({
    meta: [{ title: "Calendrier - Dentix" }],
  }),
});

// Helper: Format Date to YYYY-MM-DD in LOCAL time (no timezone offset)
const formatLocalDate = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

// Helper: Format date for display (e.g., "dimanche 24 mai 2026")
const formatDateDisplay = (date: Date): string => {
  return date.toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
};

// Helper: Format week range for display (e.g., "24 - 30 mai 2026")
const formatWeekDisplay = (startDate: Date): string => {
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + 6);
  
  const startDay = startDate.getDate();
  const endDay = endDate.getDate();
  const month = startDate.toLocaleDateString("fr-FR", {
    month: "long",
    year: "numeric",
  });
  
  return `${startDay} - ${endDay} ${month}`;
};

interface TimeSlot {
  time: string;
  isBooked: boolean;
  appointment?: {
    id: string;
    patientNom: string;
    motif: string;
    statut: "confirmé" | "en attente" | "annulé";
    telephone?: string;
  };
}

function CalendrierPage() {
  const { isAuthenticated, isInitialized } = useAuth();
  const { rendezVous } = useRendezVous();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<"day" | "week">("day");
  const [calendarOpen, setCalendarOpen] = useState(false);

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

  // Get all appointments mapped by date (YYYY-MM-DD format)
  const appointmentsByDate = useMemo(() => {
    const map = new Map<string, typeof rendezVous>();
    if (!Array.isArray(rendezVous)) return map;

    rendezVous.forEach((rdv) => {
      if (rdv.date && !rdv.archived) {
        const dateKey = rdv.date; // Use date string directly from database
        if (!map.has(dateKey)) {
          map.set(dateKey, []);
        }
        map.get(dateKey)?.push(rdv);
      }
    });
    return map;
  }, [rendezVous]);

  // Generate time slots for selected day (15-minute intervals)
  const timeSlots = useMemo((): TimeSlot[] => {
    const selectedDateStr = formatLocalDate(selectedDate);
    const dayAppointments = appointmentsByDate.get(selectedDateStr) || [];
    const generatedTimes = generateTimeSlots();

    const slots: TimeSlot[] = generatedTimes.map((timeStr) => {
      const appointment = dayAppointments.find((apt) => apt.heure === timeStr);

      return {
        time: timeStr,
        isBooked: !!appointment,
        appointment: appointment
          ? {
              id: appointment.id,
              patientNom: appointment.patientNom || "Sans patient",
              motif: appointment.motif,
              statut: appointment.statut,
              telephone: appointment.telephone,
            }
          : undefined,
      };
    });
    return slots;
  }, [selectedDate, appointmentsByDate]);

  // Navigation handlers with day/week mode awareness
  const goToPreviousDay = () => {
    const prev = new Date(selectedDate);
    if (viewMode === "day") {
      prev.setDate(prev.getDate() - 1);
    } else {
      prev.setDate(prev.getDate() - 7);
    }
    setSelectedDate(prev);
  };

  const goToNextDay = () => {
    const next = new Date(selectedDate);
    if (viewMode === "day") {
      next.setDate(next.getDate() + 1);
    } else {
      next.setDate(next.getDate() + 7);
    }
    setSelectedDate(next);
  };

  const goToToday = () => {
    setSelectedDate(new Date());
  };

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      setSelectedDate(date);
      setCalendarOpen(false);
    }
  };

  const bookedCount = timeSlots.filter((s) => s.isBooked).length;
  const displayDate = viewMode === "day" 
    ? formatDateDisplay(selectedDate)
    : formatWeekDisplay(selectedDate);

  return (
    <AppLayout>
      <div className="min-h-screen bg-gray-50 p-4 md:p-6">
        <div className="max-w-full mx-auto">
          {/* Control Bar */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 mb-6">
            <div className="flex items-center justify-between gap-4">
              {/* Left: Calendar Icon Button with Popover */}
              <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-gray-600 hover:text-gray-900"
                  >
                    <CalendarIcon className="h-4 w-4" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={handleDateSelect}
                    disabled={(date) =>
                      date > new Date(new Date().setFullYear(new Date().getFullYear() + 1))
                    }
                  />
                </PopoverContent>
              </Popover>

              {/* Center: Date and Count */}
              <div className="text-center flex-1 min-w-0">
                <h2 className="text-base md:text-lg font-semibold text-gray-900 capitalize truncate">
                  {displayDate}
                </h2>
                <p className="text-xs md:text-sm text-gray-600 mt-1">
                  {bookedCount} rendez-vous planifiés
                </p>
              </div>

              {/* Right: View Mode Buttons */}
              <div className="flex gap-1 md:gap-2">
                <Button
                  size="sm"
                  variant={viewMode === "day" ? "default" : "outline"}
                  onClick={() => setViewMode("day")}
                  className={
                    viewMode === "day"
                      ? "bg-[#3b82f6] text-white hover:bg-[#1e40af]"
                      : "text-gray-700"
                  }
                >
                  Jour
                </Button>
                <Button
                  size="sm"
                  variant={viewMode === "week" ? "default" : "outline"}
                  onClick={() => setViewMode("week")}
                  className={
                    viewMode === "week"
                      ? "bg-[#3b82f6] text-white hover:bg-[#1e40af]"
                      : "text-gray-700"
                  }
                >
                  Semaine
                </Button>
              </div>

              {/* Far Right: Navigation Arrows */}
              <div className="flex gap-1 md:gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={goToPreviousDay}
                  className="text-gray-600 hover:text-gray-900"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={goToToday}
                  className="text-gray-600 hover:text-gray-900 text-xs px-2"
                >
                  Aujourd'hui
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={goToNextDay}
                  className="text-gray-600 hover:text-gray-900"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Daily Schedule Grid - Compact */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="inline-block w-full">
              <div className="grid grid-cols-4 gap-0">
                {timeSlots.map((slot) => (
                  <div
                    key={slot.time}
                    className={`min-h-24 border border-gray-200 flex flex-col transition-all ${
                      slot.isBooked
                        ? "bg-red-50 hover:bg-red-100"
                        : "bg-white hover:bg-gray-50"
                    }`}
                  >
                    {slot.isBooked && slot.appointment ? (
                      // Booked Slot - Balanced
                      <div className="p-2 flex flex-col h-full overflow-hidden text-left">
                        <p className="text-xs font-bold text-gray-700 leading-tight">
                          {slot.time}
                        </p>
                        <p className="text-xs font-semibold text-red-800 line-clamp-2 leading-tight mt-1">
                          {slot.appointment.patientNom}
                        </p>
                        <p className="text-[0.7rem] text-red-700 font-medium line-clamp-1 mt-1">
                          {slot.appointment.motif}
                        </p>
                        {slot.appointment.telephone && (
                          <p className="text-[0.7rem] text-red-600 line-clamp-1 mt-1">
                            {slot.appointment.telephone}
                          </p>
                        )}
                        <div className="mt-auto pt-1 border-t border-red-200">
                          <span
                            className={`inline-block px-1.5 py-0.5 text-[0.6rem] font-semibold rounded leading-none whitespace-nowrap ${
                              slot.appointment.statut === "confirmé"
                                ? "bg-green-100 text-green-700"
                                : slot.appointment.statut === "en attente"
                                ? "bg-yellow-100 text-yellow-700"
                                : "bg-gray-100 text-gray-700"
                            }`}
                          >
                            {slot.appointment.statut}
                          </span>
                        </div>
                      </div>
                    ) : (
                      // Available Slot (Libre) - Balanced
                      <div className="flex flex-col items-center justify-center h-full p-2 text-center">
                        <p className="text-xs font-bold text-gray-700 leading-tight">
                          {slot.time}
                        </p>
                        <p className="text-xs text-gray-500 font-medium mt-1">
                          Libre
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

export default CalendrierPage;
