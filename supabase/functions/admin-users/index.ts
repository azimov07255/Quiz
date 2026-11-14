// Faqat owner chaqira oladi: foydalanuvchi hisobini ochish va parolini o'rnatish.
// Maxfiy (service_role) kalit faqat shu yerda, serverda ishlatiladi. Supabase'ga joylangan versiyaning nusxasi.
import { createClient } from 'npm:@supabase/supabase-js@2';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};
const json = (b: unknown, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { ...cors, 'content-type': 'application/json' } });
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return json({ error: 'Faqat POST' }, 405);

  const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, { auth: { persistSession: false, autoRefreshToken: false } });
  const jwt = (req.headers.get('authorization') || '').replace(/^Bearer\s+/i, '');
  const { data: ud, error: ue } = await admin.auth.getUser(jwt);
  if (ue || !ud?.user) return json({ error: 'Kirish talab qilinadi' }, 401);
  const { data: me } = await admin.from('profiles').select('role').eq('user_id', ud.user.id).maybeSingle();
  if (!me || me.role !== 'owner') return json({ error: 'Ruxsat yo‘q' }, 403);

  let b: any;
  try { b = await req.json(); } catch { return json({ error: 'So‘rov noto‘g‘ri' }, 400); }
  const pw = String(b.password ?? '');
  if (b.action === 'create' || b.action === 'set_password') {
    if (pw.length < 6 || pw.length > 72) return json({ error: 'Parol 6 dan 72 gacha belgi bo‘lsin' }, 400);
  }

  if (b.action === 'create') {
    const email = String(b.email ?? '').trim().toLowerCase();
    const name = String(b.name ?? '').trim().slice(0, 80);
    const lifetime = b.lifetime === true;
    const days = Math.floor(Number(b.days) || 0);
    const amount = Math.floor(Number(b.amount) || 0);
    if (!EMAIL.test(email)) return json({ error: 'Email manzili noto‘g‘ri' }, 400);
    if (!lifetime && (days < 1 || days > 3650)) return json({ error: 'Obuna muddatini tanlang' }, 400);
    if (amount < 0 || amount > 1e12) return json({ error: 'Summa noto‘g‘ri' }, 400);

    const { data, error } = await admin.auth.admin.createUser({ email, password: pw, email_confirm: true, user_metadata: { name } });
    if (error || !data?.user) {
      const m = String(error?.message || '').toLowerCase();
      return json({ error: m.includes('already') || m.includes('registered') ? 'Bu email bilan hisob bor' : 'Hisob ochilmadi: ' + (error?.message || 'noma’lum xato') }, 400);
    }
    const uid = data.user.id;
    const expires_at = lifetime ? null : new Date(Date.now() + days * 864e5).toISOString();
    const up = await admin.from('profiles').update({ pending: false, lifetime, expires_at, blocked: false }).eq('user_id', uid);
    if (up.error) return json({ error: 'Hisob ochildi, lekin obuna yozilmadi: ' + up.error.message, user_id: uid }, 500);
    await admin.from('payments').insert({ user_id: uid, email, amount, days: lifetime ? 0 : days, lifetime });
    return json({ ok: true, user_id: uid });
  }

  if (b.action === 'set_password') {
    const uid = String(b.user_id ?? '');
    const { data: t } = await admin.from('profiles').select('role').eq('user_id', uid).maybeSingle();
    if (!t) return json({ error: 'Foydalanuvchi topilmadi' }, 404);
    if (t.role === 'owner') return json({ error: 'Owner parolini Sozlamalardan o‘zgartiring' }, 400);
    const { error } = await admin.auth.admin.updateUserById(uid, { password: pw });
    if (error) return json({ error: 'Parol o‘zgarmadi: ' + error.message }, 400);
    return json({ ok: true });
  }

  return json({ error: 'Noma’lum amal' }, 400);
});
