// ThemeContext – light / dark switcher persisted in localStorage
import { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'light' | 'dark' | 'system';

interface ThemeContextValue {
    theme: Theme;
    resolvedTheme: 'light' | 'dark';
    setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
    const [theme, setThemeState] = useState<Theme>(() => {
        try {
            return (localStorage.getItem('theme') as Theme) || 'system';
        } catch {
            return 'system';
        }
    });

    const getResolved = (t: Theme): 'light' | 'dark' => {
        if (t === 'system') {
            return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
        }
        return t;
    };

    const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>(() => getResolved(theme));

    useEffect(() => {
        const resolved = getResolved(theme);
        setResolvedTheme(resolved);
        const root = document.documentElement;
        root.classList.toggle('dark', resolved === 'dark');
    }, [theme]);

    // Listen for system preference changes when theme === 'system'
    useEffect(() => {
        if (theme !== 'system') return;
        const mq = window.matchMedia('(prefers-color-scheme: dark)');
        const handler = () => {
            const resolved = getResolved('system');
            setResolvedTheme(resolved);
            document.documentElement.classList.toggle('dark', resolved === 'dark');
        };
        mq.addEventListener('change', handler);
        return () => mq.removeEventListener('change', handler);
    }, [theme]);

    const setTheme = (t: Theme) => {
        try {
            localStorage.setItem('theme', t);
        } catch { }
        setThemeState(t);
    };

    return (
        <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme }}>
            {children}
        </ThemeContext.Provider>
    );
}

export function useTheme() {
    const ctx = useContext(ThemeContext);
    if (!ctx) throw new Error('useTheme must be used inside ThemeProvider');
    return ctx;
}
