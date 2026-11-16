// Edge Function: ielts-dict  (JWT majburiy; ruxsat: can_ielts()) — Dictionary 2.0 uchun boy AI ma’lumot.
// POST {mode:'word'|'uz'|'sent'|'qa', q, hint?, qa?} → {result, cached}
// Natijalar (so‘z va UZ→EN) foydalanuvchilar o‘rtasida umumiy keshlanadi (ielts_transcripts jadvali, kalit "dx1:…") — tez va AI tejaydi.
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
      p.sort((a, b) => Number(b.lite) - Number(a.lite) || b.v - a.v || Number(a.prev) - Number(b.prev))
      MC = { m: p.map((x) => x.n).slice(0, 5), at: Date.now() }
    } catch { MC = { m: [], at: Date.now() } }
  }
  const env = Deno.env.get('GEMINI_MODEL'); const base = MC.m.length ? MC.m : ['gemini-2.5-flash-lite', 'gemini-2.5-flash', 'gemini-2.0-flash']
  return env ? [env, ...base.filter((x) => x !== env)] : base
}
const THINK: Array<Record<string, unknown> | null> = [{ thinkingLevel: 'minimal' }, { thinkingBudget: 0 }, null]
async function gemini(system: string, user: string, maxTok: number): Promise<string> {
  const errs: string[] = []
  for (const m of (await models()).slice(0, 4)) {
    for (const th of THINK) {
      const ctl = new AbortController(), to = setTimeout(() => ctl.abort(), 40000)
      try {
        const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${m}:generateContent`, { method: 'POST', signal: ctl.signal, headers: { 'content-type': 'application/json', 'x-goog-api-key': GEMINI }, body: JSON.stringify({ systemInstruction: { parts: [{ text: system }] }, contents: [{ role: 'user', parts: [{ text: user }] }], generationConfig: { temperature: 0.2, maxOutputTokens: maxTok, responseMimeType: 'application/json', ...(th ? { thinkingConfig: th } : {}) } }) })
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
async function groq(system: string, user: string, maxTok: number): Promise<string> {
  const errs: string[] = []
  for (const model of ['llama-3.3-70b-versatile', 'llama-3.1-8b-instant', 'openai/gpt-oss-20b']) {
    const r = await fetch('https://api.groq.com/openai/v1/chat/completions', { method: 'POST', headers: { 'content-type': 'application/json', authorization: 'Bearer ' + GROQ }, body: JSON.stringify({ model, temperature: 0.2, max_tokens: Math.min(maxTok, 4000), messages: [{ role: 'system', content: system }, { role: 'user', content: user }], response_format: { type: 'json_object' } }) })
    const j: any = await r.json().catch(() => ({})); const t = String(j?.choices?.[0]?.message?.content || '').trim()
    if (r.ok && t) return t
    errs.push(`${model} ${r.status}`)
  }
  throw new Error('groq [' + errs.join('; ') + ']')
}
async function ask(system: string, user: string, maxTok: number): Promise<string> {
  const errs: string[] = []
  if (GEMINI) { try { return await gemini(system, user, maxTok) } catch (e) { errs.push(String((e as Error).message)) } }
  if (GROQ) { try { return await groq(system, user, maxTok) } catch (e) { errs.push(String((e as Error).message)) } }
  throw new Error(errs.join(' | ') || 'nokey')
}

const WORD = `You are an English-Uzbek learner dictionary for IELTS Academic students. Return ONLY valid JSON:
{"uz":string,"ipa":string,"defs":[{"pos":string,"d":string,"ex":string}],"level":"A1"|"A2"|"B1"|"B2"|"C1"|"C2","reg":"formal"|"neutral"|"informal"|"academic"|"spoken","ielts":string,
 "family":[{"w":string,"pos":string,"uz":string}],
 "colloc":[{"p":string,"uz":string}],
 "idioms":[{"p":string,"uz":string,"ex":string}],
 "ex":[{"e":string,"uz":string}],
 "ant":[string],"tip":string}
Rules: "defs" = 1-4 senses (most common first), each with part of speech ("noun","verb","adjective"…), a clear ENGLISH learner-dictionary definition (max 25 words, simple words) and one short English example sentence. "ipa" = British IPA like /rɪˈzɪliənt/ (empty string if unsure). "uz" = the most useful Uzbek (Latin script) meanings, 1-3 short items separated by commas (most common senses first). "level" = CEFR. "ielts" = ONE short Uzbek sentence: how/where to use the word in IELTS Writing/Speaking (or empty string). "family" = up to 6 related word forms (noun/verb/adjective/adverb) with Uzbek. "colloc" = exactly 6 natural collocations/phrases that contain the word (English phrase + Uzbek). "idioms" = up to 3 idioms or phrasal verbs with the word (empty array if none). "ex" = 3 natural example sentences at IELTS level with Uzbek translations. "ant" = up to 4 antonyms. "tip" = ONE Uzbek note: common mistakes, confusable words or register. If the input is not a real English word/expression return {"error":"..."} in Uzbek.`
const UZ = `You are an Uzbek-to-English dictionary for IELTS students. The user types an Uzbek word or phrase (Latin or Cyrillic). Return ONLY valid JSON: {"items":[{"w":string,"pos":string,"uz":string,"ex":string,"level":string}]}
Give up to 6 best English equivalents ordered by usefulness for IELTS (prefer natural, precise words over rare ones). "w" = the English word/phrase; "pos" = part of speech; "uz" = the Uzbek nuance/meaning in Latin script (short); "ex" = one natural English example sentence; "level" = CEFR. If the input is not Uzbek or has no sense return {"items":[],"error":"..."}.`
const SENT = `You help an Uzbek-speaking IELTS student with a sentence. Detect the language (English or Uzbek) and translate to the other one. Return ONLY valid JSON: {"dir":"en2uz"|"uz2en","tr":string,"key":[{"w":string,"uz":string}],"grammar":string,"para":[string,string]}
"tr" = natural translation (Uzbek in Latin script). "key" = 3-6 important words/phrases of the ENGLISH sentence with short Uzbek meanings. "grammar" = 1-2 sentence Uzbek explanation of the notable structure (empty string if trivial). "para" = two alternative ways to say the ENGLISH version (more natural / higher band IELTS style).`

const QA = `You are an expert IELTS Reading tutor for an Uzbek-speaking student. You get ONE question from an IELTS Reading test, its correct answer, the student's answer and the relevant passage text. Explain in simple UZBEK (Latin script) but keep every quotation from the passage in English. Return ONLY valid JSON:
{"why":string,"evidence":string,"para":[{"q":string,"p":string}],"mine":string,"trap":string,"tip":string,"words":[{"w":string,"uz":string}]}
Rules: "why" = 2-4 sentences: why the correct answer is correct, pointing to the exact evidence. "evidence" = the exact sentence or fragment from the passage that proves the answer (English, max 40 words, copied EXACTLY, empty string if the answer is NOT GIVEN). "para" = up to 3 pairs showing the paraphrase: wording in the question/option -> wording in the passage. "mine" = if the student's answer is wrong or empty: why that answer is tempting but wrong (1-3 sentences); if the student was correct: one sentence confirming the reasoning ("Siz to'g'ri topdingiz, chunki ..."). "trap" = the trap or skill tested, max 12 words. "tip" = ONE practical strategy tip for this question type (1 sentence). "words" = up to 4 useful words/phrases from the evidence with short Uzbek meanings.`

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })
  if (req.method !== 'POST') return json({ error: 'POST kerak' }, 405)
  let b: any; try { b = await req.json() } catch { return json({ error: 'So‘rov noto‘g‘ri' }, 400) }
  const sb = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, { global: { headers: { Authorization: req.headers.get('Authorization') || '' } } })
  const { data: ok } = await sb.rpc('can_ielts'); if (!ok) return json({ error: 'IELTS uchun ruxsat yo‘q' }, 403)
  if (!GEMINI && !GROQ) return json({ error: 'AI sozlanmagan' }, 503)
  const mode = ['word', 'uz', 'sent', 'qa'].includes(b.mode) ? b.mode : 'word', q = mode === 'qa' ? 'qa' : clip(b.q, mode === 'sent' ? 500 : 90).trim().replace(/\s+/g, ' ')
  if (!q) return json({ error: 'So‘z kiriting' }, 400)
  const key = (mode === 'sent' || mode === 'qa') ? '' : `dx${mode === 'word' ? 2 : 1}:${mode}:${q.toLowerCase()}`, svc = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)
  if (key) { const { data: hit } = await svc.from('ielts_transcripts').select('data').eq('key', key).maybeSingle(); if (hit && hit.data) return json({ result: hit.data, cached: true }) }
  try {
    const qa = b.qa || {}, qaUser = `QUESTION TYPE: ${clip(qa.type, 20)}\nQUESTION: ${clip(qa.q, 400)}${qa.opts ? '\nOPTIONS / HEADINGS:\n' + clip(qa.opts, 900) : ''}\nCORRECT ANSWER: ${clip(qa.correct, 200)}\nSTUDENT ANSWER: ${clip(qa.mine, 200) || '(no answer)'}\n\nPASSAGE TEXT:\n${clip(qa.ctx, 3600)}`
    const hint = clip(b.hint, 500).trim(), user = mode === 'qa' ? qaUser : mode === 'word' ? `WORD: ${q}` + (hint ? `\nDICTIONARY DEFINITIONS (for disambiguation): ${hint}` : '') : mode === 'uz' ? `UZBEK: ${q}` : `SENTENCE: ${q}`
    const out = parse(await ask(mode === 'word' ? WORD : mode === 'uz' ? UZ : mode === 'qa' ? QA : SENT, user, mode === 'word' ? 2800 : 1400))
    if (!out) return json({ error: 'AI javobi tushunarsiz. Qayta urinib ko‘ring.' }, 502)
    if (key && !out.error && ((mode === 'word' && out.uz) || (mode === 'uz' && Array.isArray(out.items) && out.items.length))) await svc.from('ielts_transcripts').upsert({ key, data: out })
    return json({ result: out })
  } catch (e) { return json({ error: 'AI xatosi — ' + String((e as Error).message || e).slice(0, 300) }, 502) }
})
