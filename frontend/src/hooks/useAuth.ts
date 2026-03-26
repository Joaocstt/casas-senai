import React, { useState, useEffect, createContext, useContext } from 'react';
import type { User } from '../types/arcanum';

interface AuthContextType {
    user: User | null;
    login: (token: string, user: User) => void;
    logout: () => void;
    isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);

    useEffect(() => {
        const savedUser = localStorage.getItem('arcanum_user');
        if (savedUser) {
            setUser(JSON.parse(savedUser));
        }
    }, []);

    const login = (token: string, user: User) => {
        localStorage.setItem('arcanum_token', token);
        localStorage.setItem('arcanum_user', JSON.stringify(user));
        setUser(user);
    };

    const logout = () => {
        localStorage.removeItem('arcanum_token');
        localStorage.removeItem('arcanum_user');
        setUser(null);
    };

    return React.createElement(
        AuthContext.Provider,
        { value: { user, login, logout, isAuthenticated: !!user } },
        children
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) throw new Error('useAuth must be used within AuthProvider');
    return context;
};
