// ==========================================
// TYPES & INTERFACES FÜR DAS ERP-SYSTEM
// ==========================================

// UserRole: Die 6 Benutzerrollen im System
export type UserRole = 
  | 'Admin'
  | 'E-Supervisor'
  | 'M-Supervisor'
  | 'Mechaniker'
  | 'Elektriker'
  | 'RSC'

// User Interface
export interface User {
  id: number
  name: string
  email: string
  password?: string
  role: UserRole
  status: 'Aktiv' | 'Inaktiv'
  assignedAssets: number[]
}

// Permissions Interface
export interface Permissions {
  canCreateUser: boolean
  canEditUser: boolean
  canDeleteUser: boolean
  canViewAllUsers: boolean
  canManageAssets: boolean
  canCreateTickets: boolean
  canAssignTickets: boolean
  canCloseTickets: boolean
}

// ==========================================
// ANLAGEN (ASSETS) TYPES
// ==========================================

export type AssetStatus = 
  | 'Betrieb'
  | 'Wartung'
  | 'Störung'
  | 'Stillstand'

export type AssetType = 
  | 'Bohranlage'
  | 'Motor'
  | 'Pumpe'
  | 'Bohrturm'
  | 'Generator'
  | 'Kompressor'
  | 'Sonstiges'

export interface Asset {
  id: number
  name: string
  type: AssetType
  status: AssetStatus
  location: string
  serialNumber?: string
  parentAssetId?: number
  assignedUsers: number[]
  lastMaintenance?: string
  notes?: string
}

// ==========================================
// WORK ORDER TYPES
// ==========================================

export type WorkOrderPriority = 
  | 'Niedrig'
  | 'Normal'
  | 'Hoch'
  | 'Kritisch'

export type WorkOrderStatus = 
  | 'Neu'
  | 'Zugewiesen'
  | 'In Arbeit'
  | 'Erledigt'
  | 'Abgebrochen'

export type WorkOrderType = 
  | 'Mechanisch'
  | 'Elektrisch'
  | 'Hydraulisch'
  | 'Sonstiges'

export type WorkOrderCategory = 
  | 'Im Betrieb'
  | 'Einlagerung & Rig Moves'

export type MaterialStatus = 
  | 'Nicht benötigt'
  | 'Benötigt'
  | 'Bestellt'
  | 'Geliefert'

export interface WorkOrder {
  id: number
  title: string
  description: string
  assetId: number
  assetName: string
  type: WorkOrderType
  category: WorkOrderCategory
  priority: WorkOrderPriority
  status: WorkOrderStatus
  createdBy: number
  createdByName: string
  assignedTo?: number
  assignedToName?: string
  createdAt: string
  updatedAt: string
  completedAt?: string
  notes?: string
  // Material-Management
  materialRequired: boolean
  materialStatus: MaterialStatus
  materialNumber?: string
  materialDescription?: string
  // Bilder
  images?: string[]
  // SAP Integration
  sapOrderNumber?: string
  sapBasicStartDate?: string
  sapEquipment?: string
  sapFunctionalLocation?: string
  // Tasks
  tasks?: WorkOrderTask[]
  
}

// ==========================================
// COMMENT TYPES
// ==========================================

export interface WorkOrderComment {
  id: number
  workOrderId: number
  userId: number
  userName: string
  userRole: string
  comment: string
  timestamp: string
  type: 'comment' | 'status_change' | 'assignment' | 'priority_change'
  oldValue?: string
  newValue?: string
}

// ==========================================
// NOTIFICATION TYPES
// ==========================================

export interface Notification {
  id: number
  userId: number
  type: 'comment' | 'assignment' | 'status_change'
  workOrderId: number
  workOrderTitle: string
  message: string
  createdAt: string
  read: boolean
  createdBy: number
  createdByName: string
}

// ==========================================
// SAP PREVENTIVE MAINTENANCE TYPES
// ==========================================

export interface SAPMaintenanceItem {
  id: string
  orderType: 'PM01' | 'PM02'
  mainWorkCenter: 'ELEC' | 'MECH'
  orderNumber: string
  description: string
  actualRelease: string
  basicStartDate: string // YYYY-MM-DD
  equipment: string
  descriptionDetail: string
  functionalLocation: string
  systemStatus: string
  asset: string // T207, T208, T700, T46
}

export interface WorkOrderTask {
  id: number
  description: string
  completed: boolean
  completedBy?: number
  completedByName?: string
  completedAt?: string
  required: boolean
}