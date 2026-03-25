/**
 * Refactored Slot Finder
 * logic: Generate all possible slots for the day, then filter out any that overlap with appointments.
 */

export const getAvailableSlots = (appointments, config) => {
  const { startHour, endHour, slotDuration, daysToShow } = config;
  const openSlots = [];
  const now = new Date();
  
  for (let i = 0; i < daysToShow; i++) {
    const date = new Date();
    date.setDate(date.getDate() + i);
    date.setHours(0, 0, 0, 0);

    // 1. Define Business Window for this day
    const dayStart = new Date(date);
    dayStart.setHours(startHour, 0, 0, 0);
    const dayEnd = new Date(date);
    dayEnd.setHours(endHour, 0, 0, 0);

    // 2. Get today's busy periods
    const busyPeriods = appointments
      .filter(apt => apt.start.toDateString() === date.toDateString())
      .map(apt => ({
        start: apt.start.getTime(),
        end: (apt.end || new Date(apt.start.getTime() + slotDuration * 60000)).getTime()
      }));

    // 3. Slide through the day in increments
    let cursor = new Date(Math.max(dayStart, now));
    
    while (cursor.getTime() + (slotDuration * 60000) <= dayEnd.getTime()) {
      const slotStart = cursor.getTime();
      const slotEnd = slotStart + (slotDuration * 60000);

      // Check if this potential slot overlaps with ANY appointment
      const isOverlap = busyPeriods.some(busy => 
        (slotStart < busy.end && slotEnd > busy.start)
      );

      if (!isOverlap) {
        openSlots.push({
          start: new Date(slotStart),
          end: new Date(slotEnd),
          date: date.toDateString(),
        });
        // Move cursor to end of this slot
        cursor = new Date(slotEnd);
      } else {
        // If overlap, move cursor to the end of the appointment that blocked it
        const blocker = busyPeriods.find(busy => slotStart < busy.end && slotEnd > busy.start);
        cursor = new Date(blocker.end);
      }
    }
  }
  return openSlots;
};