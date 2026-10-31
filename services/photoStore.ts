import { Directory, File, Paths } from 'expo-file-system';
// Picker / camera results live in the cache folder, which Android can clear at any time.
// Copy each picked photo into the app's document folder so profile photos do not go blank later.
export function persistPhoto(uri: string): string {
  try {
    if (!uri || uri.startsWith('http') || uri.startsWith(Paths.document.uri)) return uri;
    const dir = new Directory(Paths.document, 'photos');
    if (!dir.exists) dir.create({ intermediates: true, idempotent: true });
    const ext = (uri.split('?')[0].match(/\.(jpe?g|png|webp|heic)$/i)?.[0] || '.jpg').toLowerCase();
    const dest = new File(dir, `p${Date.now()}${Math.random().toString(36).slice(2, 7)}${ext}`);
    new File(uri).copy(dest);
    return dest.uri;
  } catch {
    return uri; // keep the cache path rather than losing the photo
  }
}
