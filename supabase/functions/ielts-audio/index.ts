// Edge Function: ielts-audio  (verify_jwt = false — <audio> sarlavha yubora olmaydi; himoya imzo bilan)
// POST {url}  (Authorization: JWT, can_ielts)  → { src } : 6 soatga imzolangan oqim manzili
// GET  ?u=&e=&k=  (+ Range)                    → audioni uzatadi (bloklangan/hotlink/aralash kontent manbalarni aylanib o‘tadi)
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, range',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Expose-Headers': 'content-length, content-range, accept-ranges',
}
const json = (o: unknown, s = 200) => new Response(JSON.stringify(o), { status: s, headers: { ...cors, 'content-type': 'application/json' } })
const enc = new TextEncoder()
const UA = 'Mozilla/5.0 (compatible; IELTSPractice/1.0)'

async function hmac(msg: string): Promise<string> {
  const key = await crypto.subtle.importKey('raw', enc.encode(Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || 'x'), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(msg))
  return [...new Uint8Array(sig)].map((b) => b.toString(16).padStart(2, '0')).join('')
}
function badHost(h: string): boolean {
  const x = h.toLowerCase().replace(/\.$/, '')
  if (!x.includes('.') || x.includes(':') || x.startsWith('[') || /^\d+\.\d+\.\d+\.\d+$/.test(x)) return true
  return /(^|\.)(localhost|local|internal|lan|home|corp|intranet|test|invalid)$/.test(x)
}
function privateIp(ip: string): boolean {
  const m = ip.match(/^(\d+)\.(\d+)\.(\d+)\.(\d+)$/)
  if (m) { const a = +m[1], b = +m[2]; return a === 10 || a === 127 || a === 0 || (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168) || (a === 100 && b >= 64 && b <= 127) || a >= 224 }
  const v = ip.toLowerCase(); return v === '::1' || v === '::' || v.startsWith('fc') || v.startsWith('fd') || v.startsWith('fe8') || v.startsWith('fe9') || v.startsWith('fea') || v.startsWith('feb')
}
async function resolvesPrivate(host: string): Promise<boolean> {
  try {
    const d: any = (globalThis as any).Deno
    if (!d || typeof d.resolveDns !== 'function') return false
    for (const t of ['A', 'AAAA']) { try { const r: string[] = await d.resolveDns(host, t); if (r.some(privateIp)) return true } catch { /* yozuv yo‘q */ } }
  } catch { /* */ }
  return false
}
const okUrl = async (u: URL) => /^https?:$/.test(u.protocol) && !u.username && !u.password && !badHost(u.hostname) && !(await resolvesPrivate(u.hostname))

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })
  const base = (Deno.env.get('SUPABASE_URL') || '').replace(/\/$/, '') + '/functions/v1/ielts-audio'
  if (req.method === 'POST') {
    const sb = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, { global: { headers: { Authorization: req.headers.get('Authorization') || '' } } })
    const { data: okI } = await sb.rpc('can_ielts'); if (!okI) return json({ error: 'IELTS uchun ruxsat yo‘q' }, 403)
    let b: any; try { b = await req.json() } catch { return json({ error: 'So‘rov noto‘g‘ri' }, 400) }
    let t: URL; try { t = new URL(String(b.url || '').trim().slice(0, 900)) } catch { return json({ error: 'Havola noto‘g‘ri' }, 400) }
    if (!(await okUrl(t))) return json({ error: 'Bu havola ruxsat etilmagan' }, 400)
    const exp = Math.floor(Date.now() / 1000) + 6 * 3600, k = await hmac(t.toString() + '|' + exp)
    return json({ src: `${base}?u=${encodeURIComponent(t.toString())}&e=${exp}&k=${k}` })
  }
  if (req.method !== 'GET' && req.method !== 'HEAD') return json({ error: 'Usul qo‘llab-quvvatlanmaydi' }, 405)
  const q = new URL(req.url).searchParams, target = q.get('u') || '', exp = Number(q.get('e')) || 0, k = q.get('k') || ''
  if (!target || exp < Date.now() / 1000 || k !== (await hmac(target + '|' + exp))) return new Response('forbidden', { status: 403, headers: cors })
  let cur: URL; try { cur = new URL(target) } catch { return new Response('bad url', { status: 400, headers: cors }) }
  const range = req.headers.get('range')
  for (let hop = 0; hop < 6; hop++) {
    if (!(await okUrl(cur))) return new Response('forbidden host', { status: 403, headers: cors })
    const ctl = new AbortController(), to = setTimeout(() => ctl.abort(), 25000)
    let r: Response
    try { r = await fetch(cur.toString(), { method: req.method, redirect: 'manual', signal: ctl.signal, headers: { 'User-Agent': UA, Accept: 'audio/*,*/*;q=0.5', ...(range ? { Range: range } : {}) } }) }
    catch { clearTimeout(to); return new Response('upstream failed', { status: 504, headers: cors }) }
    clearTimeout(to)
    if (r.status >= 300 && r.status < 400) { const loc = r.headers.get('location'); if (!loc) return new Response('bad redirect', { status: 502, headers: cors }); try { cur = new URL(loc, cur) } catch { return new Response('bad redirect', { status: 502, headers: cors }) } continue }
    if (!r.ok && r.status !== 206) return new Response('upstream ' + r.status, { status: 502, headers: cors })
    const h = new Headers(cors); h.set('content-type', (r.headers.get('content-type') || '').startsWith('audio/') ? r.headers.get('content-type')! : 'audio/mpeg'); h.set('accept-ranges', 'bytes'); h.set('cache-control', 'private, max-age=3600')
    for (const n of ['content-length', 'content-range']) { const v = r.headers.get(n); if (v) h.set(n, v) }
    return new Response(req.method === 'HEAD' ? null : r.body, { status: r.status, headers: h })
  }
  return new Response('too many redirects', { status: 508, headers: cors })
})
