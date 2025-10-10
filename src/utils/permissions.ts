// ==========================================
// PERMISSIONS LOGIC
// ==========================================
// Diese Funktion bestimmt was jede Rolle darf
import type { UserRole, Permissions, User, Asset } from '../types'

// Funktion: Nimmt eine Rolle und gibt die passenden Rechte zurück
export function getPermissionsForRole(role: UserRole): Permissions {


  
  // Switch-Statement: Prüft welche Rolle es ist und gibt entsprechende Rechte
  switch (role) {
    
    case 'Admin':
      // Admin darf ALLES
      return {
        canCreateUser: true,
        canEditUser: true,
        canDeleteUser: true,
        canViewAllUsers: true,
        canManageAssets: true,
        canCreateTickets: true,
        canAssignTickets: true,
        canCloseTickets: true,
      }
    
    case 'E-Supervisor':
      // Elektro-Supervisor darf viel, aber keine User löschen
      return {
        canCreateUser: false,
        canEditUser: true,          // Kann sein Team bearbeiten
        canDeleteUser: false,
        canViewAllUsers: true,
        canManageAssets: true,       // Kann Anlagen verwalten
        canCreateTickets: true,
        canAssignTickets: true,      // Kann Elektro-Tickets zuweisen
        canCloseTickets: true,
      }
    
    case 'M-Supervisor':
      // Mechanik-Supervisor - gleiche Rechte wie E-Supervisor
      return {
        canCreateUser: false,
        canEditUser: true,
        canDeleteUser: false,
        canViewAllUsers: true,
        canManageAssets: true,
        canCreateTickets: true,
        canAssignTickets: true,      // Kann Mechanik-Tickets zuweisen
        canCloseTickets: true,
      }
    
    case 'Elektriker':
      // Elektriker kann arbeiten, aber nicht zuweisen
      return {
        canCreateUser: false,
        canEditUser: false,
        canDeleteUser: false,
        canViewAllUsers: false,      // Sieht nur sein Team
        canManageAssets: false,      // Kann Anlagen nur ansehen
        canCreateTickets: true,
        canAssignTickets: false,     // Kann nicht zuweisen
        canCloseTickets: true,       // Kann seine Tickets schließen
      }
    
    case 'Mechaniker':
      // Mechaniker - gleiche Rechte wie Elektriker
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
      // RSC kann alles sehen, aber weniger ändern
      return {
        canCreateUser: false,
        canEditUser: false,
        canDeleteUser: false,
        canViewAllUsers: true,       // Kann alles überwachen
        canManageAssets: false,      // Nur ansehen
        canCreateTickets: true,      // Kann Tickets für Teams erstellen
        canAssignTickets: false,
        canCloseTickets: false,      // Kann nicht schließen (nur Teams vor Ort)
      }
    
    // Falls eine unbekannte Rolle kommt (sollte nicht passieren)
    default:
      // Gibt minimale Rechte
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

// Prüft ob ein User auf eine bestimmte Anlage zugreifen darf
export function canAccessAsset(user: User, assetId: number): boolean {
  // Admins dürfen ALLES sehen
  if (user.role === 'Admin') {
    return true
  }
  
  // Supervisors dürfen ALLES sehen
  if (user.role === 'E-Supervisor' || user.role === 'M-Supervisor') {
    return true
  }
  
  // RSC darf ALLES sehen (Remote Monitoring)
  if (user.role === 'RSC') {
    return true
  }
  
  // Techniker (Mechaniker, Elektriker): Nur zugewiesene Anlagen
  // Wenn assignedAssets leer ist [], dann KEINE Anlagen
  // Wenn assignedAssets [1,2] enthält, dann nur diese
  return user.assignedAssets.includes(assetId)
}

// Filtert Assets für einen User (gibt nur erlaubte Assets zurück)
export function filterAssetsForUser(user: User, assets: Asset[]): Asset[] {
  // Admins, Supervisors, RSC sehen alles
  if (
    user.role === 'Admin' || 
    user.role === 'E-Supervisor' || 
    user.role === 'M-Supervisor' ||
    user.role === 'RSC'
  ) {
    return assets
  }
  
  // Techniker sehen nur ihre zugewiesenen Anlagen
  return assets.filter(asset => user.assignedAssets.includes(asset.id))
}