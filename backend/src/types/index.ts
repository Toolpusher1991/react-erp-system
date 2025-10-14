// src/types/index.ts
export type UserRole =
  | "Admin"
  | "E-Supervisor"
  | "M-Supervisor"
  | "Mechaniker"
  | "Elektriker"
  | "RSC";

export interface User {
  id: number;
  name: string;
  email: string;
  password?: string;
  role: UserRole;
  status: "Aktiv" | "Inaktiv";
  assignedAssets: number[];
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  user: Omit<User, "password">;
  token?: string;
}

// Füge hier alle anderen Types aus deinem Frontend hinzu
export * from "./workorder.types";
export * from "./asset.types";
