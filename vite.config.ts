import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true, // Erlaubt Zugriff aus dem lokalen Netzwerk
    port: 5173, // Standard Vite Port
    strictPort: false, // Verwendet nächsten freien Port falls 5173 belegt
  },
})