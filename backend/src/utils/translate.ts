/**
 * Auto-translate text using MyMemory free translation API.
 * Falls back to the original text if translation fails.
 */

interface MyMemoryResponse {
  responseData: {
    translatedText: string;
    match: number;
  };
  responseStatus: number;
}

/**
 * Translate English text to Tamil using MyMemory API.
 * Free tier: 5000 words/day — more than enough for announcements.
 */
export async function translateToTamil(text: string): Promise<string> {
  if (!text || !text.trim()) return '';
  try {
    const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text.trim())}&langpair=en|ta`;
    const res = await fetch(url);
    if (!res.ok) return text;
    const data: MyMemoryResponse = await res.json();
    if (data.responseStatus === 200 && data.responseData?.translatedText) {
      // MyMemory returns "PLEASE SELECT TWO LANGUAGES" or similar on error
      const translated = data.responseData.translatedText;
      if (translated.toUpperCase().includes('PLEASE SELECT')) return text;
      return translated;
    }
    return text;
  } catch (err) {
    console.warn('Translation failed, using original text:', err);
    return text;
  }
}

/**
 * Translate Tamil text to English using MyMemory API.
 */
export async function translateToEnglish(text: string): Promise<string> {
  if (!text || !text.trim()) return '';
  try {
    const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text.trim())}&langpair=ta|en`;
    const res = await fetch(url);
    if (!res.ok) return text;
    const data: MyMemoryResponse = await res.json();
    if (data.responseStatus === 200 && data.responseData?.translatedText) {
      const translated = data.responseData.translatedText;
      if (translated.toUpperCase().includes('PLEASE SELECT')) return text;
      return translated;
    }
    return text;
  } catch (err) {
    console.warn('Translation failed, using original text:', err);
    return text;
  }
}
