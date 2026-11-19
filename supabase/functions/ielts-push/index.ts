// Edge Function: ielts-push  (verify_jwt = false; ichkarida o‘zi tekshiradi) — kunlik eslatma (Web Push, payload'siz).
// POST {action:'key'}                                  → {key}   VAPID ochiq kalit (birinchi chaqiruvda kalit juftligi yaratiladi, bazada saqlanadi — maxfiy qiymatlar kerak emas)
// POST {action:'sub', sub, hhmm, tz}  + JWT             → {ok}    obuna (hhmm = mahalliy vaqt, daqiqa; tz = UTC dan daqiqa farqi)
// POST {action:'unsub', endpoint}     + JWT             → {ok}
// POST {action:'tick'}  + header x-cron-key (pg_cron)  → {sent}  vaqti kelgan obunachilarga bildirishnoma yuboradi
// Bildirishnoma matni — service worker (sw.js) ichida; serverdan foydalanuvchi ma’lumoti chiqmaydi.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const cors = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-cron-key', 'Access-Control-Allow-Methods': 'POST, OPTIONS' }
const json = (o: unknown, s = 200) => new Response(JSON.stringify(o), { status: s, headers: { ...cors, 'content-type': 'application/json' } })
const URL_ = Deno.env.get('SUPABASE_URL')!, ANON = Deno.env.get('SUPABASE_ANON_KEY')!, SVC = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const svc = createClient(URL_, SVC, { auth: { persistSession: false } })
const b64u = (b: ArrayBuffer | Uint8Array | string) => {
  const u = typeof b === 'string' ? new TextEncoder().encode(b) : b instanceof Uint8Array ? b : new Uint8Array(b)
  let s = ''; for (const c of u) s += String.fromCharCode(c)
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}
const eq = (a: string, b: string) => { if (a.length !== b.length) return false; let r = 0; for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i); return r === 0 }

async function cfg(): Promise<{ pub: string; priv: JsonWebKey; cron_key: string }> {
  const { data } = await svc.from('ielts_push_cfg').select('pub, priv, cron_key').eq('id', 1).maybeSingle()
  if (data && data.pub) return data as any
  const kp = await crypto.subtle.generateKey({ name: 'ECDSA', namedCurve: 'P-256' }, true, ['sign', 'verify']) as CryptoKeyPair
  const pub = b64u(await crypto.subtle.exportKey('raw', kp.publicKey)), priv = await crypto.subtle.exportKey('jwk', kp.privateKey)
  const ck = data?.cron_key || b64u(crypto.getRandomValues(new Uint8Array(24)))
  const { error } = await svc.from('ielts_push_cfg').upsert({ id: 1, pub, priv, cron_key: ck })
  if (error) throw new Error('cfg: ' + error.message)
  return { pub, priv, cron_key: ck }
}
async function vapid(endpoint: string, c: { pub: string; priv: JsonWebKey }): Promise<string> {
  const aud = new URL(endpoint).origin
  const key = await crypto.subtle.importKey('jwk', c.priv, { name: 'ECDSA', namedCurve: 'P-256' }, false, ['sign'])
  const head = b64u(JSON.stringify({ typ: 'JWT', alg: 'ES256' })), body = b64u(JSON.stringify({ aud, exp: Math.floor(Date.now() / 1000) + 12 * 3600, sub: 'mailto:noreply@example.com' }))
  const sig = await crypto.subtle.sign({ name: 'ECDSA', hash: 'SHA-256' }, key, new TextEncoder().encode(head + '.' + body))
  return `vapid t=${head}.${body}.${b64u(sig)}, k=${c.pub}`
}
const dayKey = (ms: number) => { const d = new Date(ms); return d.getUTCFullYear() + '-' + String(d.getUTCMonth() + 1).padStart(2, '0') + '-' + String(d.getUTCDate()).padStart(2, '0') }

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })
  if (req.method !== 'POST') return json({ error: 'POST kerak' }, 405)
  let b: any; try { b = await req.json() } catch { return json({ error: 'So‘rov noto‘g‘ri' }, 400) }
  try {
    if (b.action === 'tick') {
      const c = await cfg(); if (!eq(String(req.headers.get('x-cron-key') || ''), c.cron_key)) return json({ error: 'ruxsat yo‘q' }, 403)
      const now = Date.now(), { data: subs } = await svc.from('ielts_push_subs').select('endpoint, user_id, hhmm, tz, last_sent, fails').limit(2000)
      let sent = 0, gone = 0, skipped = 0
      for (const s of (subs || []) as any[]) {
        const loc = now + (s.tz || 0) * 60000, today = dayKey(loc), mins = Math.floor((loc / 60000) % 1440), diff = (mins - s.hhmm + 1440) % 1440
        if (diff >= 15 || s.last_sent === today) continue            // vaqti kelmagan yoki bugun yuborilgan
        const { data: st } = await svc.from('ielts_state').select('data').eq('user_id', s.user_id).maybeSingle()
        const days: string[] = Array.isArray((st as any)?.data?.days) ? (st as any).data.days : []
        await svc.from('ielts_push_subs').update({ last_sent: today }).eq('endpoint', s.endpoint)
        if (days.includes(today)) { skipped++; continue }            // bugun allaqachon o‘qigan — bezovta qilmaymiz
        try {
          const r = await fetch(s.endpoint, { method: 'POST', headers: { Authorization: await vapid(s.endpoint, c), TTL: '14400', Urgency: 'normal', 'Content-Length': '0' } })
          if (r.status === 404 || r.status === 410) { await svc.from('ielts_push_subs').delete().eq('endpoint', s.endpoint); gone++ }
          else if (r.ok) sent++
          else await svc.from('ielts_push_subs').update({ fails: (s.fails || 0) + 1 }).eq('endpoint', s.endpoint)
        } catch { await svc.from('ielts_push_subs').update({ fails: (s.fails || 0) + 1 }).eq('endpoint', s.endpoint) }
      }
      await svc.from('ielts_push_subs').delete().gte('fails', 8)
      return json({ sent, gone, skipped, total: (subs || []).length })
    }
    if (b.action === 'key') return json({ key: (await cfg()).pub })
    // quyidagilar — foydalanuvchi (JWT) kerak
    const auth = req.headers.get('Authorization') || '', sb = createClient(URL_, ANON, { global: { headers: { Authorization: auth } } })
    const { data: u } = await sb.auth.getUser(); if (!u?.user) return json({ error: 'Kirish kerak' }, 401)
    const { data: ok } = await sb.rpc('can_ielts'); if (!ok) return json({ error: 'IELTS uchun ruxsat yo‘q' }, 403)
    if (b.action === 'sub') {
      const s = b.sub || {}, ep = String(s.endpoint || ''); if (!/^https:\/\//.test(ep) || ep.length > 600) return json({ error: 'Obuna noto‘g‘ri' }, 400)
      const hhmm = Math.max(0, Math.min(1439, parseInt(b.hhmm, 10) || 1140)), tz = Math.max(-840, Math.min(840, parseInt(b.tz, 10) || 0))
      const { count } = await svc.from('ielts_push_subs').select('endpoint', { count: 'exact', head: true }).eq('user_id', u.user.id)
      if ((count || 0) >= 5) { const { data: old } = await svc.from('ielts_push_subs').select('endpoint').eq('user_id', u.user.id).order('created_at').limit(1); if (old?.[0]) await svc.from('ielts_push_subs').delete().eq('endpoint', old[0].endpoint) }
      const { error } = await svc.from('ielts_push_subs').upsert({ endpoint: ep, user_id: u.user.id, p256dh: String(s.keys?.p256dh || '').slice(0, 200), auth: String(s.keys?.auth || '').slice(0, 100), hhmm, tz, fails: 0, last_sent: null })
      if (error) return json({ error: 'Saqlab bo‘lmadi' }, 500)
      return json({ ok: true })
    }
    if (b.action === 'unsub') { await svc.from('ielts_push_subs').delete().eq('endpoint', String(b.endpoint || '')).eq('user_id', u.user.id); return json({ ok: true }) }
    return json({ error: 'Noma’lum amal' }, 400)
  } catch (e) { return json({ error: 'Xatolik — ' + String((e as Error).message || e).slice(0, 200) }, 500) }
})
