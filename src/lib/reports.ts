import { supabase } from './supabase';

export type ReportContentType =
    | 'photo'
    | 'critique'
    | 'vent'
    | 'vent_comment'
    | 'vent_reply';

type CreateReportInput = {
    contentType: ReportContentType;
    contentId: string;
    reason: string;
    details?: string;
};

export async function createReport(input: CreateReportInput) {
    const {
        data: { user },
        error: userError,
    } = await supabase.auth.getUser();

    if (userError) {
        throw userError;
    }

    if (!user) {
        throw new Error('You must be logged in to report content.');
    }

    const { data, error } = await supabase
        .from('reports')
        .insert({
            reporter_id: user.id,
            content_type: input.contentType,
            content_id: input.contentId,
            reason: input.reason,
            details: input.details?.trim() || '',
            status: 'open',
        })
        .select(
            `
      id,
      reporter_id,
      content_type,
      content_id,
      reason,
      details,
      status,
      created_at
    `
        )
        .single();

    if (error) {
        throw error;
    }

    return data;
}