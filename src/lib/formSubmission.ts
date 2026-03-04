import { supabase } from './supabase';
import type { FormType, FormData } from '@/types/forms';

interface SubmitFormParams {
    formType: FormType;
    submitterName: string;
    submitterEmail?: string;
    submitterPhone?: string;
    data: FormData;
    attachments?: string[];
}

export async function submitPublicForm({
    formType,
    submitterName,
    submitterEmail,
    submitterPhone,
    data,
    attachments = [],
}: SubmitFormParams): Promise<{ id: string } | null> {
    // Try to match existing user by email
    let userId: string | undefined;
    let clientId: string | undefined;

    if (submitterEmail) {
        const { data: existingUser } = await (supabase as any)
            .from('users')
            .select('id, client_id')
            .eq('email', submitterEmail)
            .maybeSingle();

        if (existingUser) {
            userId = existingUser.id;
            clientId = existingUser.client_id;
        }
    }

    const { data: inserted, error } = await (supabase as any)
        .from('form_submissions')
        .insert({
            form_type: formType,
            submitter_name: submitterName,
            submitter_email: submitterEmail || null,
            submitter_phone: submitterPhone || null,
            user_id: userId || null,
            client_id: clientId || null,
            data,
            attachments,
            submission_date: new Date().toISOString().split('T')[0],
        })
        .select('id')
        .single();

    if (error) throw error;

    // Post-submission: Handle individual calls for Closer
    if (formType === 'closer_daily' && userId) {
        const closerData = data as any;
        if (closerData.individual_calls && Array.isArray(closerData.individual_calls)) {
            const logs = closerData.individual_calls.map((call: any) => ({
                closer_id: userId,
                client_id: clientId || null,
                prospect_name: call.prospect_name,
                call_date: new Date().toISOString().split('T')[0],
                outcome: call.outcome,
                notes: call.notes || null,
            }));

            if (logs.length > 0) {
                await (supabase as any).from('call_logs').insert(logs);
            }
        }
    }

    return inserted;
}

export async function triggerFormAnalysis(submissionId: string, formType: FormType) {
    const { error } = await (supabase as any).functions.invoke('analyze-form', {
        body: { submission_id: submissionId, form_type: formType },
    });
    if (error) console.warn('AI analysis trigger error:', error);
}

export async function uploadFormFiles(
    files: File[],
    type: 'print' | 'call',
): Promise<string[]> {
    if (!files.length) return [];

    const urls: string[] = [];

    for (const file of files) {
        const fileExt = file.name.split('.').pop() || 'jpg';
        const filePath = `public-forms/${type}s/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;

        const { error: uploadError } = await (supabase as any).storage
            .from('submissions')
            .upload(filePath, file);

        if (uploadError) {
            console.error('Upload error:', uploadError);
            continue; // Skip failed uploads instead of breaking
        }

        const { data } = (supabase as any).storage
            .from('submissions')
            .getPublicUrl(filePath);

        if (data?.publicUrl) {
            urls.push(data.publicUrl);
        }
    }

    return urls;
}
