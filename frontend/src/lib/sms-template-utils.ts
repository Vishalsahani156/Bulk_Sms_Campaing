/** GSM 7-bit basic character set (simplified check for segment encoding). */
const GSM7_REGEX = /^[\n\r @£$¥èéùìòÇØøÅåΔ_ΦΓΛΩΠΨΣΘΞÆæßÉ!"#¤%&'()*+,\-./0-9:;<=>?¡ÄÖÑÜ§¿äöñüà]*$/;

export function isGsm7Encoding(text: string): boolean {
  return GSM7_REGEX.test(text);
}

export function getCharacterCount(text: string): number {
  return [...text].length;
}

export function getSmsSegmentInfo(text: string) {
  const chars = getCharacterCount(text);
  const gsm7 = isGsm7Encoding(text);
  const singleLimit = gsm7 ? 160 : 70;
  const multiLimit = gsm7 ? 153 : 67;

  if (chars === 0) {
    return { chars: 0, segments: 0, encoding: gsm7 ? "GSM-7" : "Unicode", perSegment: singleLimit };
  }

  if (chars <= singleLimit) {
    return { chars, segments: 1, encoding: gsm7 ? "GSM-7" : "Unicode", perSegment: singleLimit };
  }

  const segments = Math.ceil(chars / multiLimit);
  return { chars, segments, encoding: gsm7 ? "GSM-7" : "Unicode", perSegment: multiLimit };
}

export function extractVariables(text: string): string[] {
  const matches = text.matchAll(/\{\{(\w+)\}\}/g);
  return [...new Set([...matches].map((m) => m[1]))];
}

export function truncatePreview(text: string, max = 72): string {
  const oneLine = text.replace(/\s+/g, " ").trim();
  if (oneLine.length <= max) return oneLine;
  return `${oneLine.slice(0, max)}…`;
}

export function formatTemplateDate(iso: string): string {
  return new Intl.DateTimeFormat(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(iso));
}
