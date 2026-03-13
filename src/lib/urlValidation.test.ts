import { describe, it, expect } from 'vitest';

/**
 * Tests for URL validation logic used across Admin and CS panels. 
 * Validates the pattern applied to AdminDashboard.tsx and CSInbox.tsx.
 */

function isValidEvidenceUrl(url: string): boolean {
    return url.startsWith('http');
}

describe('Evidence URL Validation', () => {
    it('should accept valid HTTPS URLs', () => {
        expect(isValidEvidenceUrl('https://storage.supabase.co/print.jpg')).toBe(true);
        expect(isValidEvidenceUrl('https://fgokyxoukehyfpdaglnf.supabase.co/storage/v1/object/public/submissions/prints/123.jpg')).toBe(true);
    });

    it('should accept valid HTTP URLs', () => {
        expect(isValidEvidenceUrl('http://localhost:3000/test.jpg')).toBe(true);
    });

    it('should reject mock/placeholder URLs', () => {
        expect(isValidEvidenceUrl('print_mock_0.jpg')).toBe(false);
        expect(isValidEvidenceUrl('call_recording_mock.webm')).toBe(false);
        expect(isValidEvidenceUrl('/admin/uploads/print.jpg')).toBe(false);
    });

    it('should reject empty strings', () => {
        expect(isValidEvidenceUrl('')).toBe(false);
    });

    it('should reject relative URLs', () => {
        expect(isValidEvidenceUrl('./uploads/print.jpg')).toBe(false);
        expect(isValidEvidenceUrl('uploads/print.jpg')).toBe(false);
    });
});
