// ==========================================
// TYPES & INTERFACES FÜR DAS ERP-SYSTEM
// ==========================================

// UserRole: Die 6 Benutzerrollen im System
// Jede Rolle hat unterschiedliche Berechtigungen
export type UserRole = 
  | 'Admin'           // Volle Rechte über alles
  | 'E-Supervisor'    // Elektro-Team-Leiter
  | 'M-Supervisor'    // Mechanik-Team-Leiter
  | 'Mechaniker'      // Mechanische Arbeiten
  | 'Elektriker'      // Elektrische Arbeiten
  | 'RSC'             // Remote Service Center (Support/Überwachung)

// User Interface: Beschreibt wie ein User-Objekt aussehen muss
export interface User {
  id: number                        // Eindeutige ID
  name: string                      // Name des Users
  email: string                     // Email-Adresse
  password?: string                 // Optional - nur beim Login
  role: UserRole                    // Die Rolle des Users
  status: 'Aktiv' | 'Inaktiv'       // Account-Status
  assignedAssets: number[]          // NEU: IDs der zugewiesenen Anlagen ([] = alle)
}


// Permissions Interface: Definiert was ein User darf/nicht darf
export interface Permissions {
  canCreateUser: boolean        // Darf neue User erstellen?
  canEditUser: boolean          // Darf User bearbeiten?
  canDeleteUser: boolean        // Darf User löschen?
  canViewAllUsers: boolean      // Darf alle User sehen?
  canManageAssets: boolean      // Darf Anlagen verwalten?
  canCreateTickets: boolean     // Darf Tickets erstellen?
  canAssignTickets: boolean     // Darf Tickets zuweisen?
  canCloseTickets: boolean      // Darf Tickets schließen?
}

// ==========================================
// ANLAGEN (ASSETS) TYPES
// ==========================================

// Asset Status: Wie ist der Zustand der Anlage?
export type AssetStatus = 
  | 'Betrieb'       // Läuft normal
  | 'Wartung'       // Geplante Wartung
  | 'Störung'       // Problem vorhanden
  | 'Stillstand'    // Außer Betrieb

// Asset Type: Welche Art von Ausrüstung?
export type AssetType = 
  | 'Bohranlage'    // Hauptanlage
  | 'Motor'         // Motor-Komponente
  | 'Pumpe'         // Pumpen-System
  | 'Bohrturm'      // Turm-Struktur
  | 'Generator'     // Stromversorgung
  | 'Kompressor'    // Druckluft
  | 'Sonstiges'     // Andere Komponenten

// Asset Interface: Beschreibt eine Anlage oder Komponente
export interface Asset {
  id: number                    // Eindeutige ID
  name: string                  // Name (z.B. "T207", "Motor 1")
  type: AssetType               // Typ der Anlage
  status: AssetStatus           // Aktueller Status
  location: string              // Standort (z.B. "Feld Nord")
  serialNumber?: string         // Seriennummer (optional)
  parentAssetId?: number        // Wenn Komponente: ID der Hauptanlage
  assignedUsers: number[]       // IDs der zugewiesenen User
  lastMaintenance?: string      // Letzte Wartung (Datum)
  notes?: string                // Zusätzliche Notizen
}

// ==========================================
// WORK ORDER TYPES
// ==========================================

// Work Order Priority: Wie dringend ist das Problem?
export type WorkOrderPriority = 
  | 'Niedrig'       // Kann warten
  | 'Normal'        // Standard
  | 'Hoch'          // Wichtig
  | 'Kritisch'      // SOFORT!

// Work Order Status: Wo steht der Auftrag?
export type WorkOrderStatus = 
  | 'Neu'           // Gerade erstellt
  | 'Zugewiesen'    // Einem Techniker zugewiesen
  | 'In Arbeit'     // Techniker arbeitet daran
  | 'Erledigt'      // Fertig!
  | 'Abgebrochen'   // Wurde abgebrochen

// Work Order Type: Welche Art von Arbeit?
export type WorkOrderType = 
  | 'Mechanisch'    // Mechanik-Problem
  | 'Elektrisch'    // Elektrik-Problem
  | 'Hydraulisch'   // Hydraulik
  | 'Sonstiges'     // Andere

// Work Order Interface: Beschreibt einen Arbeitsauftrag
export interface WorkOrder {
  id: number                        // Eindeutige ID
  title: string                     // Titel/Kurzbeschreibung
  description: string               // Detaillierte Beschreibung
  assetId: number                   // Zu welcher Anlage gehört es?
  assetName: string                 // Name der Anlage (für schnellen Zugriff)
  type: WorkOrderType               // Art der Arbeit
  priority: WorkOrderPriority       // Dringlichkeit
  status: WorkOrderStatus           // Aktueller Status
  createdBy: number                 // User-ID: Wer hat es erstellt?
  createdByName: string             // Name des Erstellers
  assignedTo?: number               // User-ID: Wem zugewiesen?
  assignedToName?: string           // Name des zugewiesenen Technikers
  createdAt: string                 // Zeitstempel: Wann erstellt?
  updatedAt: string                 // Zeitstempel: Letzte Änderung
  completedAt?: string              // Zeitstempel: Wann erledigt?
  notes?: string                    // Zusätzliche Notizen
}

// Comment Interface: Kommentare zu Work Orders
export interface WorkOrderComment {
  id: number                        // Kommentar-ID
  workOrderId: number               // Zu welchem Work Order?
  userId: number                    // Wer hat kommentiert?
  userName: string                  // Name des Kommentators
  comment: string                   // Der Kommentar-Text
  timestamp: string                 // Wann geschrieben?
}