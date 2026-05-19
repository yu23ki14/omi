import axios from 'axios';
import { keys } from '../keys';

const GROQ_TRANSCRIPTION_URL = 'https://api.groq.com/openai/v1/audio/transcriptions';
const MODEL = 'whisper-large-v3-turbo';

export async function transcribeWavWithGroq(wav: Blob, language?: string): Promise<string> {
    const form = new FormData();
    form.append('file', wav, 'audio.wav');
    form.append('model', MODEL);
    form.append('response_format', 'json');
    if (language) form.append('language', language);

    const response = await axios.post(GROQ_TRANSCRIPTION_URL, form, {
        headers: {
            Authorization: `Bearer ${keys.groq}`,
        },
    });
    return (response.data?.text ?? '').trim();
}
