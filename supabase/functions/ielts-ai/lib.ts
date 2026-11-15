// Materiallar (maqola / podkast) uchun yordamchilar: xavfsiz yuklab olish (SSRF himoyasi), RSS va maqola matnini ajratish.
export class ArtErr extends Error { status: number; constructor(m: string, s: number) { super(m); this.status = s } }

export function badHost(h: string): boolean {
  const x = h.toLowerCase().replace(/\.$/, '')
  if (!x.includes('.') || x.includes(':') || x.startsWith('[') || /^\d+\.\d+\.\d+\.\d+$/.test(x)) return true
  return /(^|\.)(localhost|local|internal|lan|home|corp|intranet|test|invalid)$/.test(x)
}
export function privateIp(ip: string): boolean {
  const m = ip.match(/^(\d+)\.(\d+)\.(\d+)\.(\d+)$/)
  if (m) { const a = +m[1], b = +m[2]; return a === 10 || a === 127 || a === 0 || (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168) || (a === 100 && b >= 64 && b <= 127) || a >= 224 }
  const v = ip.toLowerCase(); return v === '::1' || v === '::' || v.startsWith('fc') || v.startsWith('fd') || v.startsWith('fe8') || v.startsWith('fe9') || v.startsWith('fea') || v.startsWith('feb')
}
async function resolvesPrivate(host: string): Promise<boolean> {
  try {
    const d: any = (globalThis as any).Deno
    if (!d || typeof d.resolveDns !== 'function') return false
    for (const t of ['A', 'AAAA']) { try { const r: string[] = await d.resolveDns(host, t); if (r.some(privateIp)) return true } catch { /* yozuv yo‘q */ } }
  } catch { /* qo‘llab-quvvatlanmaydi */ }
  return false
}
const UA = 'Mozilla/5.0 (compatible; IELTSPractice/1.0)'

/** Redirectlarni qo‘lda kuzatib, har qadamda manzilni tekshiradi; hajm va vaqt cheklangan. */
export async function fetchBytes(start: URL, accept: string, max: number, ctOk: RegExp, timeoutMs: number): Promise<{ bytes: Uint8Array; url: string; ct: string }> {
  let cur = start
  for (let hop = 0; hop < 5; hop++) {
    if (!/^https?:$/.test(cur.protocol) || cur.username || cur.password || badHost(cur.hostname) || await resolvesPrivate(cur.hostname)) throw new ArtErr('Bu havola ruxsat etilmagan (faqat ochiq veb-manzillar).', 400)
    const ctl = new AbortController(); const to = setTimeout(() => ctl.abort(), timeoutMs)
    let r: Response
    try { r = await fetch(cur.toString(), { redirect: 'manual', signal: ctl.signal, headers: { 'User-Agent': UA, Accept: accept } }) }
    catch { clearTimeout(to); throw new ArtErr('Manzil ochilmadi yoki juda sekin javob berdi.', 504) }
    if (r.status >= 300 && r.status < 400) { clearTimeout(to); const loc = r.headers.get('location'); if (!loc) throw new ArtErr('Manzil noto‘g‘ri yo‘naltirdi.', 502); try { cur = new URL(loc, cur) } catch { throw new ArtErr('Manzil noto‘g‘ri yo‘naltirdi.', 502) } continue }
    if (!r.ok) { clearTimeout(to); throw new ArtErr(r.status === 404 ? 'Topilmadi (404).' : (r.status === 401 || r.status === 403) ? 'Kirish rad etildi (yopiq yoki pullik).' : 'Manzil xatosi: HTTP ' + r.status, 502) }
    const ct = (r.headers.get('content-type') || '').toLowerCase()
    if (ct && !ctOk.test(ct)) { clearTimeout(to); throw new ArtErr('Bu manzil kutilgan turdagi fayl emas.', 415) }
    const cl = Number(r.headers.get('content-length') || 0); if (cl > max) { clearTimeout(to); throw new ArtErr('Fayl juda katta (' + Math.round(max / 1048576) + ' MB gacha).', 413) }
    const rd = r.body ? r.body.getReader() : null; const chunks: Uint8Array[] = []; let n = 0
    try { if (rd) { for (;;) { const { done, value } = await rd.read(); if (done) break; if (value) { chunks.push(value); n += value.length; if (n > max) { try { await rd.cancel() } catch { /* */ } throw new ArtErr('Fayl juda katta (' + Math.round(max / 1048576) + ' MB gacha).', 413) } } } } }
    catch (e) { clearTimeout(to); if (e instanceof ArtErr) throw e; throw new ArtErr('Yuklab olish uzildi.', 504) }
    clearTimeout(to)
    const all = new Uint8Array(n); let o = 0; for (const c of chunks) { all.set(c, o); o += c.length }
    return { bytes: all, url: cur.toString(), ct }
  }
  throw new ArtErr('Manzil juda ko‘p marta yo‘naltiriladi.', 400)
}

export function decEnt(s: string): string {
  return s.replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#0*39;|&apos;/g, "'")
    .replace(/&rsquo;|&#8217;/g, '’').replace(/&lsquo;|&#8216;/g, '‘').replace(/&ldquo;|&rdquo;|&#8220;|&#8221;/g, '"').replace(/&ndash;|&mdash;|&#8211;|&#8212;/g, '—')
    .replace(/&#(\d+);/g, (_m, n) => String.fromCodePoint(Math.min(+n, 0x10FFFF))).replace(/&#x([0-9a-f]+);/gi, (_m, h) => String.fromCodePoint(Math.min(parseInt(h, 16), 0x10FFFF)))
}
const okImg = (u: string) => { u = String(u || '').replace(/^http:\/\//i, 'https://'); return /^https:\/\/[^\s"'<>]{8,500}$/.test(u) ? u : '' }

export function parseFeed(xml: string): { title: string; image: string; items: any[] } {
  const tg = (s: string, n: string) => { const m = s.match(new RegExp('<' + n + '(?:\\s[^>]*)?>([\\s\\S]*?)</' + n + '>', 'i')); return m ? decEnt(m[1].replace(/^\s*<!\[CDATA\[|\]\]>\s*$/g, '')).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim() : '' }
  const head = xml.replace(/<item[\s>][\s\S]*$/i, '')
  const chImg = okImg(((head.match(/<itunes:image[^>]*\shref=["']([^"']+)["']/i) || [])[1]) || tg((head.match(/<image>[\s\S]*?<\/image>/i) || [''])[0], 'url'))
  const items: any[] = []
  for (const m of xml.matchAll(/<item[\s>][\s\S]*?<\/item>/gi)) {
    const s = m[0], enc = s.match(/<enclosure[^>]*\surl=["']([^"']+)["'][^>]*>/i), im = s.match(/<itunes:image[^>]*\shref=["']([^"']+)["']/i)
    items.push({ t: tg(s, 'title').slice(0, 160), d: tg(s, 'pubDate').slice(0, 40), desc: tg(s, 'description').slice(0, 500), link: tg(s, 'link').slice(0, 400), au: enc ? okImg(decEnt(enc[1])) : '', dur: tg(s, 'itunes:duration').slice(0, 12), img: im ? okImg(decEnt(im[1])) : '' })
    if (items.length >= 25) break
  }
  return { title: tg(head, 'title').slice(0, 120), image: chImg, items }
}

export function extractArticle(html: string): { title: string; text: string; image: string } {
  const tm = html.match(/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i) || html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)
  const title = decEnt(tm ? tm[1] : '').replace(/\s+/g, ' ').trim().slice(0, 120)
  const im = html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i)
  const h = html.replace(/<!--[\s\S]*?-->/g, '').replace(/<(script|style|noscript|svg|iframe|form|nav|header|footer|aside|button|select|template)\b[\s\S]*?<\/\1>/gi, '')
  const pick = (tag: string) => { const m = h.match(new RegExp('<' + tag + '\\b[^>]*>([\\s\\S]*?)<\\/' + tag + '>', 'i')); return m ? m[1] : '' }
  const body = pick('article') || pick('main') || pick('body') || h
  const out: string[] = []; let prev = ''
  for (const m of body.matchAll(/<(p|h2|h3|li)\b[^>]*>([\s\S]*?)<\/\1>/gi)) {
    const tag = m[1].toLowerCase()
    const x = decEnt(m[2].replace(/<br\s*\/?>/gi, ' ').replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim()
    if (tag === 'p' ? x.length < 40 : tag === 'li' ? x.length < 60 : (x.length < 5 || x.length > 120)) continue
    if (x === prev) continue
    prev = x; out.push(x)
  }
  let text = out.join('\n\n'); if (text.length > 12000) text = text.slice(0, 12000).replace(/\s+\S*$/, '')
  return { title, text, image: im ? okImg(decEnt(im[1])) : '' }
}

/** Audio URL dan barqaror kalit (kesh uchun). */
export async function keyOf(url: string): Promise<string> {
  const d = await crypto.subtle.digest('SHA-1', new TextEncoder().encode(url))
  return [...new Uint8Array(d)].map((b) => b.toString(16).padStart(2, '0')).join('')
}
