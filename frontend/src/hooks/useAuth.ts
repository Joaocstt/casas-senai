import React, { useState, useEffect, createContext, useContext } from 'react';
import type { User } from '../types/arcanum';

interface AuthContextType {
    user: User | null;
    login: (token: string, user: User) => void;
    logout: () => void;
    isAuthenticated: boolean;
    isAuthLoading: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [isAuthLoading, setIsAuthLoading] = useState(true);

    useEffect(() => {
        try {
            const savedUser = localStorage.getItem('arcanum_user');
            const savedToken = localStorage.getItem('arcanum_token');

            if (savedUser && savedToken) {
                setUser(JSON.parse(savedUser));
            }
        } catch (error) {
            localStorage.removeItem('arcanum_token');
            localStorage.removeItem('arcanum_user');
            setUser(null);
        } finally {
            setIsAuthLoading(false);
        }
    }, []);

    const login = (token: string, user: User) => {
        localStorage.setItem('arcanum_token', token);
        localStorage.setItem('arcanum_user', JSON.stringify(user));
        setUser(user);
        setIsAuthLoading(false);
    };

    const logout = () => {
        localStorage.removeItem('arcanum_token');
        localStorage.removeItem('arcanum_user');
        setUser(null);
        setIsAuthLoading(false);
    };

    return React.createElement(
        AuthContext.Provider,
        { value: { user, login, logout, isAuthenticated: !!user, isAuthLoading } },
        children
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) throw new Error('useAuth must be used within AuthProvider');
    return context;
};
