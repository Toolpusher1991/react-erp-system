// ==========================================
// API SERVICE - FRONTEND TO BACKEND CONNECTION
// ==========================================

const API_BASE_URL = 'http://localhost:3001/api';

// ==========================================
// HTTP CLIENT CONFIGURATION
// ==========================================

interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      const url = `${this.baseUrl}${endpoint}`;
      
      const defaultHeaders = {
        'Content-Type': 'application/json',
        ...options.headers,
      };

      const config: RequestInit = {
        ...options,
        headers: defaultHeaders,
        credentials: 'include', // für CORS cookies
      };

      console.log(`🔄 API Request: ${options.method || 'GET'} ${url}`);

      const response = await fetch(url, config);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log(`✅ API Response: ${options.method || 'GET'} ${url}`, data);
      
      return { data };
    } catch (error) {
      console.error(`❌ API Error: ${endpoint}`, error);
      return { 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  // GET Request
  async get<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  // POST Request
  async post<T>(endpoint: string, body?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  // PUT Request
  async put<T>(endpoint: string, body?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  // DELETE Request
  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }
}

// ==========================================
// API CLIENT INSTANCE
// ==========================================

export const apiClient = new ApiClient(API_BASE_URL);

// ==========================================
// API SERVICE FUNCTIONS
// ==========================================

// Health Check
export const checkHealth = async () => {
  return apiClient.get('/health');
};

// Authentication
export const login = async (email: string, password: string) => {
  return apiClient.post('/auth/login', { email, password });
};

export const getCurrentUser = async () => {
  return apiClient.get('/auth/me');
};

// Users
export const getUsers = async () => {
  return apiClient.get('/users');
};

export const getUserById = async (id: number) => {
  return apiClient.get(`/users/${id}`);
};

// Work Orders
export const getWorkOrders = async () => {
  return apiClient.get('/workorders');
};

export const createWorkOrder = async (workOrder: any) => {
  return apiClient.post('/workorders', workOrder);
};

export const updateWorkOrder = async (id: number, updates: any) => {
  return apiClient.put(`/workorders/${id}`, updates);
};

export const deleteWorkOrder = async (id: number) => {
  return apiClient.delete(`/workorders/${id}`);
};

// Assets
export const getAssets = async () => {
  return apiClient.get('/assets');
};

export const updateAsset = async (id: number, updates: any) => {
  return apiClient.put(`/assets/${id}`, updates);
};

// Projects
export const getProjects = async () => {
  return apiClient.get('/projects');
};

export const createProject = async (project: any) => {
  return apiClient.post('/projects', project);
};

export const updateProject = async (id: number, updates: any) => {
  return apiClient.put(`/projects/${id}`, updates);
};

export const deleteProject = async (id: number) => {
  return apiClient.delete(`/projects/${id}`);
};

// ==========================================
// UTILITY FUNCTIONS
// ==========================================

export const isServerOnline = async (): Promise<boolean> => {
  const result = await checkHealth();
  return !result.error;
};

// Test Connection
export const testConnection = async () => {
  console.log('🧪 Testing Backend Connection...');
  
  const health = await checkHealth();
  
  if (health.error) {
    console.error('❌ Backend Connection Failed:', health.error);
    return false;
  }
  
  console.log('✅ Backend Connection Successful:', health.data);
  return true;
};

// ==========================================
// WORK ORDER HELPER FUNCTIONS
// ==========================================

export const fetchWorkOrders = async () => {
  console.log('📋 Fetching Work Orders from Backend...');
  
  const result = await getWorkOrders();
  
  if (result.error) {
    console.error('❌ Failed to fetch Work Orders:', result.error);
    return [];
  }
  
  console.log('✅ Work Orders fetched successfully:', result.data);
  return result.data || [];
};