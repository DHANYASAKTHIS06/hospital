/**
 * Client-side translation using MyMemory free API.
 * Runs in the browser where network access is unrestricted.
 */

export async function translateToTamil(text: string): Promise<string> {
  if (!text || !text.trim()) return '';
  try {
    const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text.trim())}&langpair=en|ta`;
    const res = await fetch(url);
    if (!res.ok) return text;
    const data = await res.json();
    if (data.responseStatus === 200 && data.responseData?.translatedText) {
      const translated: string = data.responseData.translatedText;
      if (translated.toUpperCase().includes('PLEASE SELECT')) return text;
      return translated;
    }
    return text;
  } catch {
    return text;
  }
}

export async function translateToEnglish(text: string): Promise<string> {
  if (!text || !text.trim()) return '';
  try {
    const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text.trim())}&langpair=ta|en`;
    const res = await fetch(url);
    if (!res.ok) return text;
    const data = await res.json();
    if (data.responseStatus === 200 && data.responseData?.translatedText) {
      const translated: string = data.responseData.translatedText;
      if (translated.toUpperCase().includes('PLEASE SELECT')) return text;
      return translated;
    }
    return text;
  } catch {
    return text;
  }
}
