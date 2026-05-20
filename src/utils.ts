export function hashPw(s: string): string {
  let h = 5381;
  for (let i = 0; i < s.length; i++) {
    h = ((h << 5) + h) + s.charCodeAt(i);
    h = h & h;
  }
  return (h >>> 0).toString(36);
}

export function getInitials(name: string): string {
  return (name || '').split(' ').map(w => w[0] || '').join('').toUpperCase().slice(0, 2) || '??';
}
