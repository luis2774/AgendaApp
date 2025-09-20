export const appointments = [
  {
    id: 1,
    client: "Maria Lopez",
    start: new Date(2025, 8, 18, 10, 0), // monthIndex 0 = Jan, so Sept = 8
    end: new Date(2025, 8, 18, 11, 0),   // assuming 1-hour appointments
  },
  {
    id: 2,
    client: "James Smith",
    start: new Date(2025, 8, 19, 14, 0),
    end: new Date(2025, 8, 19, 15, 0),
  },
  {
    id: 3,
    client: "Olivia Johnson",
    start: new Date(2025, 8, 20, 13, 0),
    end: new Date(2025, 8, 20, 14, 0),
  },
];
