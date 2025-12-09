"use client";

import { usePathname } from "next/navigation";
import Header from "@/components/NavBar";

const AUTH_PATHS = [
    '/auth/login',
    '/auth/sign-up',
    '/auth/forgot-password',
    '/auth/update-password',
    '/auth/confirm',
    '/auth/sign-up-success',
    '/auth/error',
    '/me'
];

export default function LayoutWrapper({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();
    const shouldHideHeader = AUTH_PATHS.some(path =>
        pathname.startsWith(path)
    );

    return (
        <>
            {!shouldHideHeader && <Header />}
            {children}
        </>
    );
}