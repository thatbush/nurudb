// components/DashboardAnalytics.tsx
'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'

export default function DashboardAnalytics() {
    const pathname = usePathname()

    useEffect(() => {
        if (!pathname?.startsWith('/dashboard')) return

        // Track dashboard-specific events
        window.gtag?.('event', 'page_view', {
            page_location: window.location.href,
            page_title: document.title,
            user_type: 'authenticated', // Custom dimension
        })
    }, [pathname])

    return null
}