/**
 * Utility functions for calculating workdays (Monday-Friday)
 */

/**
 * Check if a date is a weekday (Monday = 1, Friday = 5)
 */
export function isWeekday(date: Date): boolean {
  const day = date.getDay();
  return day >= 1 && day <= 5;
}

/**
 * Check if a date is a weekend (Saturday = 6, Sunday = 0)
 */
export function isWeekend(date: Date): boolean {
  const day = date.getDay();
  return day === 0 || day === 6;
}

/**
 * Extract the day of month from a Date or string, handling timezone correctly
 */
function extractDayOfMonth(dateInput: Date | string): { year: number; month: number; day: number } {
  if (typeof dateInput === 'string') {
    // Parse YYYY-MM-DD directly to avoid timezone issues
    const parts = dateInput.split('T')[0].split('-');
    return {
      year: parseInt(parts[0], 10),
      month: parseInt(parts[1], 10), // 1-12
      day: parseInt(parts[2], 10),
    };
  }
  // For Date objects (from Prisma), use UTC methods since dates are stored as UTC
  return {
    year: dateInput.getUTCFullYear(),
    month: dateInput.getUTCMonth() + 1, // Convert to 1-12
    day: dateInput.getUTCDate(),
  };
}

/**
 * Count total workdays (Mon-Fri) in a given month
 * @param year - The year
 * @param month - The month (1-12)
 * @param startDate - Optional start date (only count workdays from this date)
 */
export function getWorkdaysInMonth(year: number, month: number, startDate?: Date | string | null): number {
  // Get the last day of the month
  const lastDayOfMonth = new Date(year, month, 0).getDate();

  // Determine the start day (1-31)
  let startDay = 1;
  if (startDate) {
    const parsed = extractDayOfMonth(startDate);
    if (parsed.year === year && parsed.month === month) {
      startDay = parsed.day;
    } else if (parsed.year > year || (parsed.year === year && parsed.month > month)) {
      // Start date is after this month - no workdays
      return 0;
    }
    // If start date is before this month, use day 1
  }

  let workdays = 0;
  for (let day = startDay; day <= lastDayOfMonth; day++) {
    const date = new Date(year, month - 1, day);
    if (isWeekday(date)) {
      workdays++;
    }
  }

  return workdays;
}

/**
 * Count workdays elapsed in a month up to a specific date
 * @param year - The year
 * @param month - The month (1-12)
 * @param startDate - Optional start date (only count workdays from this date)
 * @param upToDay - Optional specific day to count up to
 */
export function getWorkdaysElapsed(
  year: number,
  month: number,
  startDate?: Date | string | null,
  upToDay?: number
): number {
  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth() + 1; // 1-12
  const currentDay = today.getDate();
  const lastDayOfMonth = new Date(year, month, 0).getDate();

  // Determine the start day (1-31)
  let startDay = 1;
  if (startDate) {
    const parsed = extractDayOfMonth(startDate);
    if (parsed.year === year && parsed.month === month) {
      startDay = parsed.day;
    } else if (parsed.year > year || (parsed.year === year && parsed.month > month)) {
      // Start date is after this month - no workdays elapsed
      return 0;
    }
    // If start date is before this month, use day 1
  }

  // Determine the end day
  let endDay: number;
  if (upToDay) {
    endDay = upToDay;
  } else if (year === currentYear && month === currentMonth) {
    // Current month - use today
    endDay = currentDay;
  } else if (year < currentYear || (year === currentYear && month < currentMonth)) {
    // Past month - all workdays from start day
    endDay = lastDayOfMonth;
  } else {
    // Future month - no workdays elapsed
    return 0;
  }

  // If today is before the start day (in the current month), no workdays have elapsed
  if (year === currentYear && month === currentMonth && currentDay < startDay) {
    return 0;
  }

  // If the end day is before the start day, no workdays elapsed
  if (endDay < startDay) {
    return 0;
  }

  let workdays = 0;
  for (let day = startDay; day <= endDay; day++) {
    const date = new Date(year, month - 1, day);
    if (isWeekday(date)) {
      workdays++;
    }
  }

  return workdays;
}

/**
 * Get workday stats for a month
 * @param year - The year
 * @param month - The month (1-12)
 * @param startDate - Optional start date (only count workdays from this date)
 */
export function getWorkdayStats(year: number, month: number, startDate?: Date | string | null) {
  const totalWorkdays = getWorkdaysInMonth(year, month, startDate);
  const workdaysElapsed = getWorkdaysElapsed(year, month, startDate);

  return {
    totalWorkdays,
    workdaysElapsed,
    percentageElapsed: totalWorkdays > 0 ? (workdaysElapsed / totalWorkdays) * 100 : 0,
  };
}

/**
 * Format a date to YYYY-MM-DD string using UTC to avoid timezone issues
 */
export function formatDateToYMD(date: Date): string {
  // Use UTC methods to avoid timezone shifts
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Parse a YYYY-MM-DD string to a Date object at UTC noon
 * This ensures the date won't shift when stored in PostgreSQL
 */
export function parseDateStringToUTC(dateStr: string): Date {
  // Parse as UTC noon to avoid any timezone boundary issues
  return new Date(dateStr + 'T12:00:00.000Z');
}
