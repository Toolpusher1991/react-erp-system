// ==========================================
// PERMISSIONS LOGIC
// ==========================================

import type { UserRole, Permissions, User, Asset } from '../types'

export function getPermissionsForRole(role: UserRole): Permissions {
  switch (role) {
    
    case 'Admin':
      // Admin darf ALLES
      return {
        canCreateUser: true,
        canEditUser: true,
        canDeleteUser: true,
        canViewAllUsers: true,      // NUR ADMIN!
        canManageAssets: true,
        canCreateTickets: true,
        canAssignTickets: true,
        canCloseTickets: true,
      }
    
    case 'E-Supervisor':
    case 'M-Supervisor':
      // Supervisor darf viel, aber KEINE User-Verwaltung!
      return {
        canCreateUser: false,
        canEditUser: false,
        canDeleteUser: false,
        canViewAllUsers: false,     // KEIN Zugriff auf User-Verwaltung!
        canManageAssets: true,
        canCreateTickets: true,
        canAssignTickets: true,
        canCloseTickets: true,
      }
    
    case 'Elektriker':
    case 'Mechaniker':
      return {
        canCreateUser: false,
        canEditUser: false,
        canDeleteUser: false,
        canViewAllUsers: false,
        canManageAssets: false,
        canCreateTickets: true,
        canAssignTickets: false,
        canCloseTickets: true,
      }
    
    case 'RSC':
      return {
        canCreateUser: false,
        canEditUser: false,
        canDeleteUser: false,
        canViewAllUsers: false,
        canManageAssets: false,
        canCreateTickets: true,
        canAssignTickets: false,
        canCloseTickets: false,
      }
    
    default:
      return {
        canCreateUser: false,
        canEditUser: false,
        canDeleteUser: false,
        canViewAllUsers: false,
        canManageAssets: false,
        canCreateTickets: false,
        canAssignTickets: false,
        canCloseTickets: false,
      }
  }
}

// ==========================================
// ASSET ACCESS CONTROL
// ==========================================

export function canAccessAsset(user: User, assetId: number): boolean {
  if (user.role === 'Admin') {
    return true
  }
  
  if (user.role === 'E-Supervisor' || user.role === 'M-Supervisor') {
    return true
  }
  
  if (user.role === 'RSC') {
    return true
  }
  
  return user.assignedAssets.includes(assetId)
}

export function filterAssetsForUser(user: User, assets: Asset[]): Asset[] {
  if (
    user.role === 'Admin' || 
    user.role === 'E-Supervisor' || 
    user.role === 'M-Supervisor' ||
    user.role === 'RSC'
  ) {
    return assets
  }
  
  return assets.filter(asset => user.assignedAssets.includes(asset.id))
}