import { createContext, useContext, useState, useEffect } from 'react';

// 1. Creamos el contexto
const ThemeContext = createContext();

// 2. Hook personalizado para usar el tema fácilmente
export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (!context) throw new Error('useTheme debe usarse dentro de un ThemeProvider');
    return context;
};

// 3. El Proveedor (Sujeto Observado)
export const ThemeProvider = ({ children }) => {
    // Buscamos si el usuario ya tenía un tema guardado, si no, usamos 'light'
    const [theme, setTheme] = useState(() => {
        return localStorage.getItem('app-theme') || 'light';
    });

    // Este efecto (Observer) se ejecuta cada vez que el tema cambia
    useEffect(() => {
        // Aplica el atributo al HTML
        document.documentElement.setAttribute('data-theme', theme);
        // Guarda la preferencia en el navegador
        localStorage.setItem('app-theme', theme);
    }, [theme]);

    // Función para cambiar de tema
    const toggleTheme = () => {
        setTheme((prevTheme) => (prevTheme === 'light' ? 'dark' : 'light'));
    };

    return (
        <ThemeContext.Provider value={{ theme, toggleTheme }}>
            {children}
        </ThemeContext.Provider>
    );
};