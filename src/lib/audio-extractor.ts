/**
 * Client-side audio extraction from video files using FFmpeg.wasm.
 *
 * HOW IT WORKS:
 * 1. The user selects a video file (.mp4, .mkv, .mov, .webm)
 * 2. FFmpeg.wasm loads in the browser (WebAssembly)
 * 3. The video is written to an in-memory virtual filesystem
 * 4. FFmpeg extracts ONLY the audio track → .mp3 (~20MB from 500MB video)
 * 5. The resulting .mp3 Blob is returned for upload to Supabase
 *
 * This means: NO video is ever uploaded to our servers.
 * The user's machine does the heavy lifting, and we only receive the small audio.
 */

// Dynamic imports — @ffmpeg is externalized in vite config, load only when needed
type ProgressCallback = (progress: number, message: string) => void;

interface ExtractionResult {
    audioBlob: Blob;
    audioFile: File;
    durationSeconds: number;
    originalSizeMB: number;
    compressedSizeMB: number;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let ffmpegInstance: any = null;

async function getFFmpeg(onProgress?: ProgressCallback): Promise<any> {
    if (ffmpegInstance) return ffmpegInstance;

    onProgress?.(5, 'Carregando motor de conversão...');

    const { FFmpeg } = await import('@ffmpeg/ffmpeg');
    const { toBlobURL } = await import('@ffmpeg/util');
    const ffmpeg = new FFmpeg();

    // Load single-thread core from CDN (no SharedArrayBuffer needed)
    const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd';

    await ffmpeg.load({
        coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
        wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
    });

    ffmpegInstance = ffmpeg;
    onProgress?.(15, 'Motor carregado!');
    return ffmpeg;
}

const SUPPORTED_VIDEO_EXTENSIONS = ['.mp4', '.mkv', '.mov', '.webm', '.avi', '.m4v'];
const SUPPORTED_AUDIO_EXTENSIONS = ['.mp3', '.wav', '.m4a', '.ogg', '.aac', '.flac'];

export function isVideoFile(file: File): boolean {
    const ext = '.' + file.name.split('.').pop()?.toLowerCase();
    return SUPPORTED_VIDEO_EXTENSIONS.includes(ext);
}

export function isAudioFile(file: File): boolean {
    const ext = '.' + file.name.split('.').pop()?.toLowerCase();
    return SUPPORTED_AUDIO_EXTENSIONS.includes(ext);
}

export function isSupportedMediaFile(file: File): boolean {
    return isVideoFile(file) || isAudioFile(file);
}

export async function extractAudioFromVideo(
    videoFile: File,
    onProgress?: ProgressCallback,
): Promise<ExtractionResult> {
    const originalSizeMB = videoFile.size / (1024 * 1024);

    // If the file is already audio, just return it as-is
    if (isAudioFile(videoFile)) {
        onProgress?.(100, 'Arquivo de áudio detectado!');
        return {
            audioBlob: videoFile,
            audioFile: videoFile,
            durationSeconds: 0,
            originalSizeMB,
            compressedSizeMB: originalSizeMB,
        };
    }

    const startTime = Date.now();

    // Step 1: Load FFmpeg
    const ffmpeg = await getFFmpeg(onProgress);

    // Step 2: Write video to virtual filesystem
    onProgress?.(20, `Lendo vídeo (${originalSizeMB.toFixed(0)}MB)...`);
    const inputName = 'input' + getExtension(videoFile.name);
    const { fetchFile } = await import('@ffmpeg/util');
    await ffmpeg.writeFile(inputName, await fetchFile(videoFile));

    // Step 3: Set up progress monitoring
    ffmpeg.on('progress', ({ progress }) => {
        const pct = Math.min(95, 25 + Math.round(progress * 70));
        onProgress?.(pct, `Extraindo áudio... ${Math.round(progress * 100)}%`);
    });

    // Step 4: Extract audio (strip video, encode to MP3 at quality 2 ~190kbps)
    onProgress?.(25, 'Iniciando extração de áudio...');
    await ffmpeg.exec([
        '-i', inputName,
        '-vn',               // no video
        '-acodec', 'libmp3lame',
        '-q:a', '4',         // quality 4 (~130kbps, good for speech)
        '-ac', '1',          // mono (calls are speech, not music)
        '-ar', '16000',      // 16kHz sample rate (optimal for Whisper)
        'output.mp3',
    ]);

    // Step 5: Read result
    onProgress?.(96, 'Finalizando...');
    const outputData = await ffmpeg.readFile('output.mp3');

    // Cleanup virtual filesystem
    await ffmpeg.deleteFile(inputName);
    await ffmpeg.deleteFile('output.mp3');

    const audioBlob = new Blob([new Uint8Array(outputData as Uint8Array)], { type: 'audio/mpeg' });
    const compressedSizeMB = audioBlob.size / (1024 * 1024);
    const durationSeconds = (Date.now() - startTime) / 1000;

    const audioFile = new File(
        [audioBlob],
        videoFile.name.replace(/\.[^.]+$/, '.mp3'),
        { type: 'audio/mpeg' },
    );

    onProgress?.(100, `Pronto! ${originalSizeMB.toFixed(0)}MB → ${compressedSizeMB.toFixed(1)}MB`);

    return {
        audioBlob,
        audioFile,
        durationSeconds,
        originalSizeMB,
        compressedSizeMB,
    };
}

function getExtension(filename: string): string {
    const idx = filename.lastIndexOf('.');
    return idx >= 0 ? filename.substring(idx) : '.mp4';
}

/** Check if the current browser supports WebAssembly */
export function isWasmSupported(): boolean {
    try {
        return typeof WebAssembly === 'object' && typeof WebAssembly.instantiate === 'function';
    } catch {
        return false;
    }
}
