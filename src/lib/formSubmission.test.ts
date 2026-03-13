import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock supabase
const mockUpload = vi.fn();
const mockGetPublicUrl = vi.fn();
const mockInsert = vi.fn();
const mockSelect = vi.fn();
const mockSingle = vi.fn();
const mockEq = vi.fn();
const mockMaybeSingle = vi.fn();

vi.mock('@/lib/supabase', () => ({
    supabase: {
        storage: {
            from: () => ({
                upload: mockUpload,
                getPublicUrl: mockGetPublicUrl,
            }),
        },
        from: () => ({
            select: mockSelect,
            insert: mockInsert,
            eq: mockEq,
        }),
    },
}));

import { uploadFormFiles } from '@/lib/formSubmission';

describe('formSubmission', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('uploadFormFiles', () => {
        it('should return empty array for no files', async () => {
            const result = await uploadFormFiles([], 'print');
            expect(result).toEqual([]);
        });

        it('should upload file to supabase storage and return public URL', async () => {
            const mockFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' });

            mockUpload.mockResolvedValue({ error: null });
            mockGetPublicUrl.mockReturnValue({
                data: { publicUrl: 'https://storage.supabase.co/test.jpg' },
            });

            const result = await uploadFormFiles([mockFile], 'print');

            expect(mockUpload).toHaveBeenCalledTimes(1);
            expect(result).toHaveLength(1);
            expect(result[0]).toContain('https://');
        });

        it('should skip failed uploads without breaking', async () => {
            const file1 = new File(['test1'], 'ok.jpg', { type: 'image/jpeg' });
            const file2 = new File(['test2'], 'fail.jpg', { type: 'image/jpeg' });

            mockUpload
                .mockResolvedValueOnce({ error: null })
                .mockResolvedValueOnce({ error: new Error('Upload failed') });

            mockGetPublicUrl.mockReturnValue({
                data: { publicUrl: 'https://storage.supabase.co/ok.jpg' },
            });

            const result = await uploadFormFiles([file1, file2], 'print');

            expect(mockUpload).toHaveBeenCalledTimes(2);
            expect(result).toHaveLength(1); // Only the successful one
        });

        it('should use correct storage path for prints', async () => {
            const mockFile = new File(['test'], 'screenshot.png', { type: 'image/png' });

            mockUpload.mockResolvedValue({ error: null });
            mockGetPublicUrl.mockReturnValue({
                data: { publicUrl: 'https://storage.supabase.co/screenshot.png' },
            });

            await uploadFormFiles([mockFile], 'print');

            const uploadPath = mockUpload.mock.calls[0][0] as string;
            expect(uploadPath).toMatch(/^public-forms\/prints\//);
            expect(uploadPath).toMatch(/\.png$/);
        });

        it('should use correct storage path for calls', async () => {
            const mockFile = new File(['test'], 'call.webm', { type: 'audio/webm' });

            mockUpload.mockResolvedValue({ error: null });
            mockGetPublicUrl.mockReturnValue({
                data: { publicUrl: 'https://storage.supabase.co/call.webm' },
            });

            await uploadFormFiles([mockFile], 'call');

            const uploadPath = mockUpload.mock.calls[0][0] as string;
            expect(uploadPath).toMatch(/^public-forms\/calls\//);
            expect(uploadPath).toMatch(/\.webm$/);
        });
    });
});
