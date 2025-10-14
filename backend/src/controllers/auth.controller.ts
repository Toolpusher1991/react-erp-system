// src/controllers/auth.controller.ts
import { Request, Response } from 'express';
import { mockUsers } from '../utils/mockData';
import { LoginRequest, LoginResponse } from '../types';

export class AuthController {
  // Login
  async login(req: Request, res: Response) {
    try {
      const { email, password } = req.body as LoginRequest;

      // Validierung
      if (!email || !password) {
        return res.status(400).json({ 
          error: 'Email und Passwort erforderlich' 
        });
      }

      // User finden
      const user = mockUsers.find(
        (u) => u.email === email && u.password === password
      );

      if (!user) {
        return res.status(401).json({ 
          error: 'Falsche Email oder Passwort' 
        });
      }

      // User ohne Passwort zurückgeben
      const { password: _, ...userWithoutPassword } = user;

      const response: LoginResponse = {
        user: userWithoutPassword,
        // TODO: Später JWT Token hinzufügen
      };

      res.json(response);
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ error: 'Server Error' });
    }
  }

  // Aktuellen User abrufen (für Token-Validierung später)
  async getCurrentUser(req: Request, res: Response) {
    try {
      // TODO: User aus JWT Token extrahieren
      res.json({ message: 'Not implemented yet' });
    } catch (error) {
      console.error('Get current user error:', error);
      res.status(500).json({ error: 'Server Error' });
    }
  }
}