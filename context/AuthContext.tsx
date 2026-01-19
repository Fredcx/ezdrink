"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useRouter } from "next/navigation";

interface User {
    name: string;
    phone: string;
    email?: string;
    id?: string;
}

interface AuthContextType {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    login: (token: string, userData: any) => void;
    logout: () => void;
    updateUser: (data: Partial<User>) => void;
    tempPhone: string;
    setTempPhone: (phone: string) => void;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export function AuthProvider({ children }: { children: ReactNode }) {
    const router = useRouter();
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [tempPhone, setTempPhone] = useState("");

    // Load from local storage on mount
    useEffect(() => {
        const storedUser = localStorage.getItem('ezdrink_user');
        if (storedUser) {
            setUser(JSON.parse(storedUser));
        }
        setIsLoading(false);
    }, []);

    const login = (token: string, userData: any) => {
        const newUser: User = {
            phone: userData.phone || "",
            email: userData.email,
            id: userData.id,
            name: userData.full_name || userData.name || "Visitante"
        };

        setUser(newUser);
        localStorage.setItem('ezdrink_user', JSON.stringify(newUser));
        localStorage.setItem('ezdrink_token', token);
        router.push('/');
    };

    const updateUser = (data: Partial<User>) => {
        if (!user) return;
        const updatedUser = { ...user, ...data };
        setUser(updatedUser);
        localStorage.setItem('ezdrink_user', JSON.stringify(updatedUser));
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem('ezdrink_user');
        router.push('/login');
    };

    return (
        <AuthContext.Provider value={{
            user,
            isLoading,
            isAuthenticated: !!user,
            login,
            logout,
            updateUser,
            tempPhone,
            setTempPhone
        }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => useContext(AuthContext);
