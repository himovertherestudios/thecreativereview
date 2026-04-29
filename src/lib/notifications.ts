import { supabase } from './supabase';

type NotificationMetadata = Record<
    string,
    string | number | boolean | null | undefined
>;

type CreateNotificationInput = {
    userId: string | null | undefined;
    type: string;
    entityType?: string | null;
    entityId?: string | null;
    message: string;
    metadata?: NotificationMetadata;
};

export async function createNotification({
    userId,
    type,
    entityType = null,
    entityId = null,
    message,
    metadata = {},
}: CreateNotificationInput) {
    try {
        if (!userId) return;

        const {
            data: { user },
            error: userError,
        } = await supabase.auth.getUser();

        if (userError) throw userError;
        if (!user) return;

        // Do not notify someone about their own action.
        if (user.id === userId) return;

        const cleanMetadata = Object.fromEntries(
            Object.entries(metadata).filter(([, value]) => value !== undefined)
        );

        const { error } = await supabase.from('notifications').insert({
            user_id: userId,
            trigger_user_id: user.id,
            type,
            entity_type: entityType,
            entity_id: entityId,
            message,
            metadata: cleanMetadata,
            is_read: false,
        });

        if (error) {
            console.error('Notification insert error:', error.message);
        }
    } catch (error) {
        console.error('Notification failed:', error);
    }
}