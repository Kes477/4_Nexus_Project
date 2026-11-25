import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  test: {
  globals: true, // Limpieza después de cada prueba  
  environment: 'jsdom', // Crea entorno de pruebas con vitest
  setupFiles: ['./src/setupTests.js']
}
});
