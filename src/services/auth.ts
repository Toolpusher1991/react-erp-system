// ==========================================
// AUTHENTICATION SERVICE
// JWT Token Management & User Authentication
// ==========================================

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'manager' | 'user';
  createdAt: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  name: string;
}

export interface AuthResponse {
  user: User;
  token: string;
  refreshToken: string;
}

export interface LoginResult {
  success: boolean;
  data?: AuthResponse;
  error?: string;
}

// ==========================================
// TOKEN MANAGEMENT
// ==========================================

const TOKEN_KEY = 'authToken';
const REFRESH_TOKEN_KEY = 'refreshToken';
const USER_KEY = 'currentUser';

class AuthService {
  private token: string | null = null;
  private refreshToken: string | null = null;
  private user: User | null = null;

  constructor() {
    this.loadFromStorage();
  }

  // ==========================================
  // STORAGE MANAGEMENT
  // ==========================================

  private loadFromStorage(): void {
    this.token = localStorage.getItem(TOKEN_KEY);
    this.refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
    const userData = localStorage.getItem(USER_KEY);
    this.user = userData ? JSON.parse(userData) : null;
  }

  private saveToStorage(authData?: AuthResponse): void {
    if (authData) {
      this.token = authData.token;
      this.refreshToken = authData.refreshToken;
      this.user = authData.user;
      
      localStorage.setItem(TOKEN_KEY, authData.token);
      localStorage.setItem(REFRESH_TOKEN_KEY, authData.refreshToken);
      localStorage.setItem(USER_KEY, JSON.stringify(authData.user));
    } else {
      this.clearStorage();
    }
  }

  private clearStorage(): void {
    this.token = null;
    this.refreshToken = null;
    this.user = null;
    
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  }

  // ==========================================
  // AUTHENTICATION METHODS
  // ==========================================

  async login(credentials: LoginCredentials): Promise<LoginResult> {
    try {
      console.log('🔐 Attempting login for:', credentials.email);
      
      const response = await fetch('http://localhost:3001/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.message || 'Login failed'
        };
      }

      // Save authentication data
      this.saveToStorage(data);
      
      console.log('✅ Login successful:', data.user.email);
      return {
        success: true,
        data
      };

    } catch (error) {
      console.error('❌ Login error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error'
      };
    }
  }

  async register(userData: RegisterData): Promise<LoginResult> {
    try {
      console.log('📝 Attempting registration for:', userData.email);
      
      const response = await fetch('http://localhost:3001/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.message || 'Registration failed'
        };
      }

      // Save authentication data
      this.saveToStorage(data);
      
      console.log('✅ Registration successful:', data.user.email);
      return {
        success: true,
        data
      };

    } catch (error) {
      console.error('❌ Registration error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error'
      };
    }
  }

  async refreshAuthToken(): Promise<boolean> {
    if (!this.refreshToken) {
      console.log('❌ No refresh token available');
      this.logout();
      return false;
    }

    try {
      console.log('🔄 Refreshing auth token...');
      
      const response = await fetch('http://localhost:3001/api/auth/refresh', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refreshToken: this.refreshToken }),
      });

      const data = await response.json();

      if (!response.ok) {
        console.log('❌ Token refresh failed:', data.message);
        this.logout();
        return false;
      }

      // Update tokens
      this.saveToStorage(data);
      
      console.log('✅ Token refreshed successfully');
      return true;

    } catch (error) {
      console.error('❌ Token refresh error:', error);
      this.logout();
      return false;
    }
  }

  logout(): void {
    console.log('🚪 Logging out user');
    this.clearStorage();
    
    // Optionally notify backend about logout
    if (this.token) {
      fetch('http://localhost:3001/api/auth/logout', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.token}`,
        },
      }).catch(error => {
        console.log('Logout notification failed:', error);
      });
    }
  }

  // ==========================================
  // TOKEN & USER ACCESS
  // ==========================================

  getToken(): string | null {
    return this.token;
  }

  getUser(): User | null {
    return this.user;
  }

  isAuthenticated(): boolean {
    return !!(this.token && this.user);
  }

  hasRole(role: User['role']): boolean {
    return this.user?.role === role;
  }

  hasAnyRole(roles: User['role'][]): boolean {
    return roles.includes(this.user?.role as User['role']);
  }

  // ==========================================
  // TOKEN VALIDATION & AUTO-REFRESH
  // ==========================================

  private isTokenExpired(): boolean {
    if (!this.token) return true;
    
    try {
      // JWT tokens have 3 parts: header.payload.signature
      const payload = JSON.parse(atob(this.token.split('.')[1]));
      const currentTime = Math.floor(Date.now() / 1000);
      
      // Check if token expires within next 5 minutes
      return payload.exp < (currentTime + 300);
    } catch (error) {
      console.error('Token validation error:', error);
      return true;
    }
  }

  async ensureValidToken(): Promise<string | null> {
    if (!this.token) return null;
    
    if (this.isTokenExpired()) {
      const refreshed = await this.refreshAuthToken();
      return refreshed ? this.token : null;
    }
    
    return this.token;
  }

  // ==========================================
  // HTTP INTERCEPTOR HELPER
  // ==========================================

  async getAuthHeaders(): Promise<HeadersInit> {
    const token = await this.ensureValidToken();
    
    return {
      'Authorization': token ? `Bearer ${token}` : '',
      'Content-Type': 'application/json',
    };
  }
}

// ==========================================
// SINGLETON INSTANCE EXPORT
// ==========================================

export const authService = new AuthService();

// Export helper functions for convenience
export const {
  login,
  register,
  logout,
  getUser,
  getToken,
  isAuthenticated,
  hasRole,
  hasAnyRole,
  ensureValidToken,
  getAuthHeaders,
} = authService;

console.log('🔐 Auth Service initialized');