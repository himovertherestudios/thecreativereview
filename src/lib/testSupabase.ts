import { supabase } from './supabase';

export async function testSupabaseConnection() {
    const { data, error } = await supabase.from('profiles').select('id').limit(1);

    if (error) {
        console.error('Supabase connection failed:', error.message);
        return false;
    }

    console.log('Supabase connection works:', data);
    return true;
}