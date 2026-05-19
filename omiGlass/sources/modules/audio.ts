import { OpusDecoder } from 'opus-decoder';

const SAMPLE_RATE = 16000;
const CHANNELS = 1;

type Decoder = OpusDecoder<typeof SAMPLE_RATE>;
let decoderPromise: Promise<Decoder> | null = null;

async function getDecoder(): Promise<Decoder> {
    if (!decoderPromise) {
        decoderPromise = (async () => {
            const decoder = new OpusDecoder({ sampleRate: SAMPLE_RATE, channels: CHANNELS });
            await decoder.ready;
            return decoder;
        })();
    }
    return decoderPromise;
}

export async function opusFramesToWav(frames: Uint8Array[]): Promise<Blob> {
    const decoder = await getDecoder();
    const { channelData } = decoder.decodeFrames(frames);
    const pcmFloat = channelData[0];
    const pcmInt16 = floatTo16BitPCM(pcmFloat);
    return new Blob([wavHeader(pcmInt16.length, SAMPLE_RATE, CHANNELS) as BlobPart, pcmInt16.buffer as BlobPart], {
        type: 'audio/wav',
    });
}

function floatTo16BitPCM(input: Float32Array): Int16Array {
    const out = new Int16Array(input.length);
    for (let i = 0; i < input.length; i++) {
        const s = Math.max(-1, Math.min(1, input[i]));
        out[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
    }
    return out;
}

function wavHeader(sampleCount: number, sampleRate: number, channels: number): ArrayBuffer {
    const dataSize = sampleCount * 2;
    const buffer = new ArrayBuffer(44);
    const view = new DataView(buffer);
    const writeString = (offset: number, s: string) => {
        for (let i = 0; i < s.length; i++) view.setUint8(offset + i, s.charCodeAt(i));
    };
    writeString(0, 'RIFF');
    view.setUint32(4, 36 + dataSize, true);
    writeString(8, 'WAVE');
    writeString(12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, channels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * channels * 2, true);
    view.setUint16(32, channels * 2, true);
    view.setUint16(34, 16, true);
    writeString(36, 'data');
    view.setUint32(40, dataSize, true);
    return buffer;
}
