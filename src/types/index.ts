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

export interface WorkOrder {
  id: number
  title: string
  description: string
  assetId: number
  assetName: string
  type: WorkOrderType
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
}

// ==========================================
// COMMENT SYSTEM
// ==========================================

export type CommentType = 
  | 'comment'
  | 'status_change'
  | 'assignment'
  | 'priority_change'

export interface WorkOrderComment {
  id: number
  workOrderId: number
  userId: number
  userName: string
  userRole: string
  comment: string
  timestamp: string
  type: CommentType
  oldValue?: string
  newValue?: string
}

// ==========================================
// NOTIFICATION SYSTEM
// ==========================================

export type NotificationType = 
  | 'comment'
  | 'assignment'
  | 'status_change'
  | 'mention'

export interface Notification {
  id: number
  userId: number
  type: NotificationType
  workOrderId: number
  workOrderTitle: string
  message: string
  createdAt: string
  read: boolean
  createdBy: number
  createdByName: string
}