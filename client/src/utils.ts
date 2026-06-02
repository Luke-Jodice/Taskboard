export function getProject(ref: string): string | null {
  const parts = ref.split('/');
  const codeIdx = parts.indexOf('Code');
  if (codeIdx === -1 || codeIdx + 1 >= parts.length) return null;
  return parts[codeIdx + 1] || null;
}
