import { supabase } from './supabase';

type AnalyticsMetadata = Record<string, string | number | boolean | null | undefined>;

export async function trackEvent(
    eventName: string,
    page: string,
    metadata: AnalyticsMetadata = {}
) {
    try {
        const {
            data: { user },
        } = await supabase.auth.getUser();

        if (!user) return;

        const cleanMetadata = Object.fromEntries(
            Object.entries(metadata).filter(([, value]) => value !== undefined)
        );

        const { error } = await supabase.from('app_events').insert({
            user_id: user.id,
            event_name: eventName,
            page,
            metadata: cleanMetadata,
        });

        if (error) {
            console.error('Analytics tracking error:', error.message);
        }
    } catch (error) {
        console.error('Analytics tracking failed:', error);
    }
}