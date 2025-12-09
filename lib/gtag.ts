// lib/gtag.ts
declare global {
    interface Window {
        dataLayer: any[]
        gtag: (...args: any[]) => void
    }
}

export const GA_MEASUREMENT_ID = 'G-J069E6NLMH'

// Only initialize if in browser and GA is configured
export const existsGaId = GA_MEASUREMENT_ID === 'G-J069E6NLMH'

// Log page views
export const pageview = (url: string) => {
    if (typeof window !== 'undefined' && existsGaId && window.gtag) {
        window.gtag('config', GA_MEASUREMENT_ID, {
            page_path: url,
        })
    }
}

// Log specific events
export const event = ({
    action,
    category,
    label,
    value,
}: {
    action: string
    category: string
    label: string
    value?: number
}) => {
    if (typeof window !== 'undefined' && existsGaId && window.gtag) {
        window.gtag('event', action, {
            event_category: category,
            event_label: label,
            value: value,
        })
    }
}

// Common event helpers
export const gtagEvents = {
    login: (method: string) =>
        event({ action: 'login', category: 'engagement', label: method }),

    signUp: (method: string) =>
        event({ action: 'sign_up', category: 'engagement', label: method }),

    search: (search_term: string) =>
        event({ action: 'search', category: 'engagement', label: search_term }),

    selectContent: (content_type: string, item_id?: string) =>
        event({
            action: 'select_content',
            category: 'engagement',
            label: `${content_type}${item_id ? `:${item_id}` : ''}`
        }),
}