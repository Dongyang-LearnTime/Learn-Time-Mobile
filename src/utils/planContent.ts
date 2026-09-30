export function parsePlanContent(content: string) {
  return content.split(/,\s+|\r?\n|\s*[•●▪]\s*/).map((part) => part.trim()).filter(Boolean).map((part) => {
    const isReview = /^(\[복습\]|\(복습\)|복습:|복습\s+-\s+)/.test(part);
    const text = part.replace(/^(\[복습\]|\(복습\)|복습:|복습\s+-\s+)/, '').trim();
    const pageMatch = text.match(/(.+?)\s*\(\s*(\d+)\s*(?:p|page|페이지|쪽)\.?\s*\)$/i);
    return { title: pageMatch?.[1]?.trim() ?? text, pages: pageMatch ? Number(pageMatch[2]) : null, isReview };
  });
}
