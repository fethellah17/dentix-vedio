// Working hours configuration
const WORKING_HOURS_KEY = 'clinic_working_hours';

export interface WorkingHours {
  startTime: string; // Format: "HH:MM"
  endTime: string;   // Format: "HH:MM"
}

/**
 * Get working hours from localStorage or return defaults (07:00 - 21:00)
 */
export function getWorkingHours(): WorkingHours {
  try {
    const stored = localStorage.getItem(WORKING_HOURS_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return {
        startTime: parsed.startTime || '07:00',
        endTime: parsed.endTime || '21:00',
      };
    }
  } catch (error) {
    console.error('Error reading working hours from localStorage:', error);
  }
  
  return {
    startTime: '07:00',
    endTime: '21:00',
  };
}

/**
 * Save working hours to localStorage
 */
export function saveWorkingHours(hours: WorkingHours): void {
  try {
    localStorage.setItem(WORKING_HOURS_KEY, JSON.stringify(hours));
  } catch (error) {
    console.error('Error saving working hours to localStorage:', error);
  }
}

/**
 * Generate time slots based on working hours from localStorage
 * Maintains 15-minute intervals
 */
export function generateTimeSlots(): string[] {
  const hours = getWorkingHours();
  const slots: string[] = [];
  
  // Parse start time
  const [startHourStr, startMinStr] = hours.startTime.split(':');
  const startHour = parseInt(startHourStr, 10);
  const startMin = parseInt(startMinStr, 10);
  
  // Parse end time
  const [endHourStr, endMinStr] = hours.endTime.split(':');
  const endHour = parseInt(endHourStr, 10);
  const endMin = parseInt(endMinStr, 10);
  
  // Generate slots from start to end time
  let currentHour = startHour;
  let currentMin = startMin;
  
  while (currentHour < endHour || (currentHour === endHour && currentMin < endMin)) {
    const timeString = `${String(currentHour).padStart(2, '0')}:${String(currentMin).padStart(2, '0')}`;
    slots.push(timeString);
    
    // Add 15 minutes
    currentMin += 15;
    if (currentMin >= 60) {
      currentMin -= 60;
      currentHour += 1;
    }
  }
  
  return slots;
}
