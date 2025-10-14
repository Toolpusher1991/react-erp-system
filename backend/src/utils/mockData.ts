// src/utils/mockData.ts
import { User } from '../types';

// TEMPORÄR: Nutze die gleichen Daten wie im Frontend
export const mockUsers: User[] = [
  {
    id: 1,
    name: 'Max Admin',
    email: 'admin@erp.de',
    password: 'admin123', // In Production: gehashed!
    role: 'Admin',
    status: 'Aktiv',
    assignedAssets: [],
  },
  {
    id: 2,
    name: 'Anna E-Super',
    email: 'esuper@erp.de',
    password: 'es123',
    role: 'E-Supervisor',
    status: 'Aktiv',
    assignedAssets: [],
  },
  {
    id: 10,
    name: 'T207 Elektriker',
    email: 't207-el',
    password: 't207',
    role: 'Elektriker',
    status: 'Aktiv',
    assignedAssets: [1],
  },
];