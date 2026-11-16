// Edge Function: ielts-agent  (JWT majburiy; ruxsat: can_ielts()) — ilova ichidagi AI yordamchi: reja tuzadi va vazifalarni taklif qiladi.
// POST {messages:[{role,content}], ctx:{...}} → {reply, actions:[…]}. Amallarni ilova (mijoz) tekshirib, foydalanuvchi tasdiqlagach bajaradi.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const cors = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type', 'Access-Control-Allow-Methods': 'POST, OPTIONS' }
const json = (o: unknown, s = 200) => new Response(JSON.stringify(o), { status: s, headers: { ...cors, 'content-type': 'application/json' } })
const GEMINI = Deno.env.get('GEMINI_API_KEY') || '', GROQ = Deno.env.get('GROQ_API_KEY') || ''
const clip = (s: unknown, n: number) => String(s ?? '').slice(0, n)
const parse = (t: string) => { try { return JSON.parse(t) } catch { const m = t.match(/\{[\s\S]*\}/); if (m) { try { return JSON.parse(m[0]) } catch { /* */ } } return null } }

let MC: { m: string[]; at: number } | null = null
const BADM = /image|tts|audio|live|vision|embed|robot|computer|imagen|veo|learnlm|gemma|aqa/i
async function models(): Promise<string[]> {
  if (!MC || Date.now() - MC.at > 3600e3) {
    try {
      const r = await fetch('https://generativelanguage.googleapis.com/v1beta/models?pageSize=200', { headers: { 'x-goog-api-key': GEMINI } }), j = await r.json().catch(() => ({}))
      const p = ((j.models || []) as any[]).filter((m) => (m.supportedGenerationMethods || []).includes('generateContent')).map((m) => String(m.name).replace('models/', '')).filter((n) => !BADM.test(n))
        .map((n) => { const m = /^gemini-(\d+(?:\.\d+)?)-flash(-lite)?(-preview)?/.exec(n); return m ? { n, v: parseFloat(m[1]), lite: !!m[2], prev: !!m[3] } : null }).filter(Boolean) as { n: string; v: number; lite: boolean; prev: boolean }[]
      // reja tuzish uchun "lite" emas, kuchliroq flash afzal
      p.sort((a, b) => Number(a.lite) - Number(b.lite) || b.v - a.v || Number(a.prev) - Number(b.prev))
      MC = { m: p.map((x) => x.n).slice(0, 5), at: Date.now() }
    } catch { MC = { m: [], at: Date.now() } }
  }
  const env = Deno.env.get('GEMINI_MODEL'); const base = MC.m.length ? MC.m : ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-2.5-flash-lite']
  return env ? [env, ...base.filter((x) => x !== env)] : base
}
const THINK: Array<Record<string, unknown> | null> = [{ thinkingLevel: 'minimal' }, { thinkingBudget: 0 }, null]
async function gemini(system: string, msgs: { role: string; content: string }[], maxTok: number): Promise<string> {
  const errs: string[] = []
  const contents = msgs.map((m) => ({ role: m.role === 'assistant' ? 'model' : 'user', parts: [{ text: m.content }] }))
  for (const m of (await models()).slice(0, 4)) {
    for (const th of THINK) {
      const ctl = new AbortController(), to = setTimeout(() => ctl.abort(), 45000)
      try {
        const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${m}:generateContent`, { method: 'POST', signal: ctl.signal, headers: { 'content-type': 'application/json', 'x-goog-api-key': GEMINI }, body: JSON.stringify({ systemInstruction: { parts: [{ text: system }] }, contents, generationConfig: { temperature: 0.3, maxOutputTokens: maxTok, responseMimeType: 'application/json', ...(th ? { thinkingConfig: th } : {}) } }) })
        const j: any = await r.json().catch(() => ({})); const t = j?.candidates?.[0]?.content?.parts?.map((p: any) => p.text || '').join('') || ''
        if (r.ok && t) return t
        errs.push(`${m} ${r.status}`)
        if (r.status === 400 && /think/i.test(String(j?.error?.message || ''))) continue
        break
      } catch { errs.push(`${m} vaqt`); break } finally { clearTimeout(to) }
    }
  }
  throw new Error('gemini [' + errs.join('; ') + ']')
}
async function groq(system: string, msgs: { role: string; content: string }[], maxTok: number): Promise<string> {
  const errs: string[] = []
  for (const model of ['llama-3.3-70b-versatile', 'openai/gpt-oss-20b']) {
    const r = await fetch('https://api.groq.com/openai/v1/chat/completions', { method: 'POST', headers: { 'content-type': 'application/json', authorization: 'Bearer ' + GROQ }, body: JSON.stringify({ model, temperature: 0.3, max_tokens: Math.min(maxTok, 6000), messages: [{ role: 'system', content: system }, ...msgs], response_format: { type: 'json_object' } }) })
    const j: any = await r.json().catch(() => ({})); const t = String(j?.choices?.[0]?.message?.content || '').trim()
    if (r.ok && t) return t
    errs.push(`${model} ${r.status}`)
  }
  throw new Error('groq [' + errs.join('; ') + ']')
}
async function ask(system: string, msgs: { role: string; content: string }[], maxTok: number): Promise<string> {
  const errs: string[] = []
  if (GEMINI) { try { return await gemini(system, msgs, maxTok) } catch (e) { errs.push(String((e as Error).message)) } }
  if (GROQ) { try { return await groq(system, msgs, maxTok) } catch (e) { errs.push(String((e as Error).message)) } }
  throw new Error(errs.join(' | ') || 'nokey')
}

const SYSTEM = `You are the built-in planning assistant ("AI yordamchi") of an IELTS Academic preparation app used by an Uzbek-speaking student. You can PROPOSE actions that the app will show to the student for confirmation and then execute. Reply ONLY with valid JSON:
{"reply": string, "actions": Action[]}
"reply" = friendly, concise Uzbek (Latin script), max 90 words; summarise what you propose (e.g. "2 haftalik reja tayyor: ...") or answer the question. Emojis are fine but sparse.
"actions" = array (max 60). Allowed Action objects (use EXACTLY these field names):
 {"type":"add_task","date":"YYYY-MM-DD","title":string,"mins":number,"go":route}  — a task on a day. title concrete and short (max 70 chars), e.g. "Reading: Cambridge 17 Test 2 Passage 1 + Tahlil", "Listening Section 3 + xatolar tahlili", "Writing Task 2 (40 daq)", "Speaking Part 2 chat", "So'z takrori (20 ta)". mins 10-120.
 {"type":"rest_day","date":"YYYY-MM-DD","on":true}  — rest day (streak is kept).
 {"type":"clear_tasks","from":"YYYY-MM-DD","to":"YYYY-MM-DD"}  — removes AI-created tasks in that range (use before re-planning).
 {"type":"set_profile","target":number,"date":"YYYY-MM-DD","mins":number,"level":"A2"|"B1"|"B2"|"C1","start":"HH:MM"}  — only the fields the student asked to change (target band 5-9 step 0.5, exam date, daily minutes 20-240, study start time).
 {"type":"add_words","words":[{"w":string,"uz":string,"def":string,"ex":string}]}  — up to 15 useful IELTS words (uz = Uzbek meaning, def = short English definition, ex = example sentence).
 {"type":"navigate","route":route}  — open a screen right now (only if the student asked to start/open something).
"route"/"go" must be one of: reading, listening, writing, speaking, vocab, vocab/review, typing, dict, chat, shadow, dictation, articles, articles/tab/p, mock, ana, practice, books, cambridge, plan, focus. Omit "go" if none fits.
Rules:
- Use the student's CONTEXT (today's date and weekday, exam date, target, level, daily minutes, preferred start time, skill bands, weakest skill, current plan, counts, due words). Dates must be ISO, from today up to today+60 days; never in the past.
- For plans: spread skills sensibly (Listening, Reading, Writing, Speaking, vocabulary, analysis of mistakes). Give extra time to the weakest skill. Per day, total minutes about the student's daily minutes (±15). For plans of 7+ days include at least one rest_day per week and one mock/full test near the end of each week when time allows. Count the days correctly from today (weekday names in context). If an exam date exists, adapt intensity to the days left (last week: mock tests, mistake review, no new material).
- If the student asked to replace/redo an existing plan, first emit clear_tasks for the range, then the new add_task actions.
- Create actions ONLY when the student asks to create/change/add something. For questions, advice or chit-chat return "actions": [].
- If essential info is missing (e.g. how many days, or exam date for a long plan), ask ONE short question in "reply" and return "actions": [].
- Never invent app features. Keep titles in Uzbek or English mix, no emojis in titles.`

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })
  if (req.method !== 'POST') return json({ error: 'POST kerak' }, 405)
  let b: any; try { b = await req.json() } catch { return json({ error: 'So‘rov noto‘g‘ri' }, 400) }
  const sb = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, { global: { headers: { Authorization: req.headers.get('Authorization') || '' } } })
  const { data: ok } = await sb.rpc('can_ielts'); if (!ok) return json({ error: 'IELTS uchun ruxsat yo‘q' }, 403)
  if (!GEMINI && !GROQ) return json({ error: 'AI sozlanmagan' }, 503)
  const raw: any[] = Array.isArray(b.messages) ? b.messages.slice(-10) : []
  const msgs = raw.map((m) => ({ role: m.role === 'assistant' ? 'assistant' : 'user', content: clip(m.content, 900) })).filter((m) => m.content.trim())
  if (!msgs.length || msgs[msgs.length - 1].role !== 'user') return json({ error: 'Xabar yo‘q' }, 400)
  const ctx = clip(JSON.stringify(b.ctx || {}), 3800)
  msgs[msgs.length - 1] = { role: 'user', content: `CONTEXT (JSON): ${ctx}\n\nSTUDENT MESSAGE: ${msgs[msgs.length - 1].content}` }
  try {
    const out = parse(await ask(SYSTEM, msgs, 5200))
    if (!out || typeof out.reply !== 'string') return json({ error: 'AI javobi tushunarsiz. Qayta urinib ko‘ring.' }, 502)
    return json({ reply: clip(out.reply, 900), actions: Array.isArray(out.actions) ? out.actions.slice(0, 60) : [] })
  } catch (e) { return json({ error: 'AI xatosi — ' + String((e as Error).message || e).slice(0, 300) }, 502) }
})
