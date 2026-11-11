const cookieName = '__Host-workshop-image-key';
const maxAge = 30 * 24 * 60 * 60;
const cookieAttributes = 'Path=/; Secure; HttpOnly; SameSite=Strict';
const encode = (value: Uint8Array) => btoa(String.fromCharCode(...value)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const decode = (value: string) => Uint8Array.from(atob(value.replace(/-/g, '+').replace(/_/g, '/')), c => c.charCodeAt(0));
const utf8 = new TextEncoder();

async function encryptionKey(secret: string) {
  return crypto.subtle.importKey('raw', decode(secret), 'AES-GCM', false, ['encrypt', 'decrypt']);
}

export async function imageKeyCookie(secret: string, owner: string, apiKey: string) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const plaintext = utf8.encode(JSON.stringify({ apiKey, expires: Date.now() + maxAge * 1000 }));
  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv, additionalData: utf8.encode(owner) },
    await encryptionKey(secret), plaintext,
  );
  return `${cookieName}=${encode(iv)}.${encode(new Uint8Array(encrypted))}; ${cookieAttributes}; Max-Age=${maxAge}`;
}

export function clearImageKeyCookie() {
  return `${cookieName}=; ${cookieAttributes}; Max-Age=0`;
}

export async function readImageKey(req: Request, secret: string | undefined, owner: string) {
  const token = req.headers.get('cookie')?.split(';').map(part => part.trim())
    .find(part => part.startsWith(cookieName + '='))?.slice(cookieName.length + 1);
  if (!secret || !token || token.length > 3000) return undefined;
  try {
    const [iv, encrypted] = token.split('.');
    const decoded = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: decode(iv), additionalData: utf8.encode(owner) },
      await encryptionKey(secret), decode(encrypted),
    );
    const { apiKey, expires } = JSON.parse(new TextDecoder().decode(decoded));
    return typeof apiKey === 'string' && expires > Date.now() ? apiKey : undefined;
  } catch {
    return undefined;
  }
}
