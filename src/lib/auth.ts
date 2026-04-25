import { supabase } from './supabase';

type SignUpProfileInput = {
    email: string;
    password: string;
    displayName: string;
    instagramHandle: string;
    website?: string;
    role: string;
    customTitle?: string;
    city: string;
    experienceLevel: string;
    inviteCode: string;
};

export async function signUpWithProfile(input: SignUpProfileInput) {
    const cleanedInstagram = input.instagramHandle.replace('@', '').trim().toLowerCase();
    const cleanedInviteCode = input.inviteCode.trim().toLowerCase();

    if (!cleanedInviteCode) {
        throw new Error('Invite code is required.');
    }

    const { data: inviteCodeRow, error: inviteCodeError } = await supabase
        .from('invite_codes')
        .select('id, code, is_used')
        .eq('code', cleanedInviteCode)
        .eq('is_used', false)
        .maybeSingle();

    if (inviteCodeError) {
        throw inviteCodeError;
    }

    if (!inviteCodeRow) {
        throw new Error('Invalid or already used invite code.');
    }

    const { data, error } = await supabase.auth.signUp({
        email: input.email.trim().toLowerCase(),
        password: input.password,
        options: {
            data: {
                display_name: input.displayName.trim(),
                username: cleanedInstagram,
                instagram_handle: cleanedInstagram,
                website: input.website?.trim() || '',
                role: input.role,
                custom_title: input.customTitle?.trim() || '',
                city: input.city.trim(),
                experience_level: input.experienceLevel,
                invite_code: cleanedInviteCode,
            },
        },
    });

    if (error) {
        throw error;
    }

    if (data.user?.id) {
        const { error: claimInviteError } = await supabase.rpc('claim_invite_code', {
            invite_code_text: cleanedInviteCode,
            user_id_value: data.user.id,
        });

        if (claimInviteError) {
            throw claimInviteError;
        }
    }

    return data;
}

export async function getCurrentUser() {
    const {
        data: { user },
        error,
    } = await supabase.auth.getUser();

    if (error) {
        throw error;
    }

    return user;
}

export async function signOut() {
    const { error } = await supabase.auth.signOut();

    if (error) {
        throw error;
    }
}