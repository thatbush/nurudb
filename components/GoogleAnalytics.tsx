// components/GoogleAnalytics.tsx
'use client'

import { usePathname, useSearchParams } from 'next/navigation'
import { useEffect } from 'react'
import { pageview, existsGaId } from '@/lib/gtag'
import { Suspense } from 'react'

function GoogleAnalytics() {
    const pathname = usePathname()
    const searchParams = useSearchParams()

    useEffect(() => {
        if (!existsGaId) return

        const url = pathname + (searchParams.toString() ? `?${searchParams.toString()}` : '')
        pageview(url)
    }, [pathname, searchParams])

    return null
}

// Suspense boundary
export default function GoogleAnalyticsWrapper() {
    return (
        <Suspense fallback={null}>
            <GoogleAnalytics />
        </Suspense>
    )
}