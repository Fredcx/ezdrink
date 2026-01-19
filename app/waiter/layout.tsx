"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

export default function WaiterLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const { user, isAuthenticated, isLoading: authLoading } = useAuth();

    // Protection Logic
    useEffect(() => {
        // Allow public access to login page
        if (pathname === '/waiter/login') return;

        const checkWaiter = async () => {
            const token = localStorage.getItem('ezdrink_token');
            if (!token) {
                window.location.href = '/waiter/login';
                return;
            }
        };

        if (authLoading) return;

        // If not authenticated, go to login
        if (!isAuthenticated) {
            window.location.href = '/waiter/login';
            return;
        }

        // If authenticated but not staff
        // Assuming AuthContext 'user' has establishment_role.
        // If not, we might need to fetch /me like Admin Layout did.
        const verifyRole = async () => {
            const token = localStorage.getItem('ezdrink_token');
            try {
                const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/users/me`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (res.ok) {
                    const data = await res.json();
                    if (!['waiter', 'barman', 'manager'].includes(data.establishment_role)) {
                        // User is customer -> redirect to Login
                        // Or show "Access Denied"
                        alert("Acesso exclusivo para equipe");
                        window.location.href = '/waiter/login';
                    }
                } else {
                    window.location.href = '/waiter/login';
                }
            } catch (e) {
                window.location.href = '/waiter/login';
            }
        };
        verifyRole();

    }, [pathname, isAuthenticated, authLoading]);

    // If on login page, render just children
    if (pathname === '/waiter/login') {
        return <>{children}</>;
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* We can add a common Waiter Footer or Header here later */}
            {children}
        </div>
    );
}
