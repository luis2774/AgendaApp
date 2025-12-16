import React, { createContext, useContext, useMemo, useState } from "react";
import { appointments as initialAppointments } from "../data/appointments";

const AppointmentsContext = createContext(null);

export const AppointmentsProvider = ({ children }) => {
  const [appointments, setAppointments] = useState(initialAppointments);

  const addAppointment = (appointment) => {
    setAppointments((prev) => [
      ...prev,
      {
        ...appointment,
        id: appointment.id ?? Date.now(),
        title: appointment.client,
      },
    ]);
  };

  const value = useMemo(
    () => ({
      appointments,
      addAppointment,
    }),
    [appointments]
  );

  return (
    <AppointmentsContext.Provider value={value}>
      {children}
    </AppointmentsContext.Provider>
  );
};

export const useAppointments = () => {
  const ctx = useContext(AppointmentsContext);
  if (!ctx) throw new Error("useAppointments must be used within AppointmentsProvider");
  return ctx;
};

