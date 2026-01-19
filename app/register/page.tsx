"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function RegisterPage() {
    const router = useRouter();

    useEffect(() => {
        router.replace('/login');
    }, [router]);

    return (
        <div className="min-h-screen bg-primary flex items-center justify-center">
            <p className="text-white font-bold">Redirecionando para login...</p>
        </div>
    );
}
