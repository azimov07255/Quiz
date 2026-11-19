// Edge Function: ielts-wr  (JWT majburiy; ruxsat: can_ielts()) — Cambridge Writing/Speaking: rasmdan savol o‘qish va Writing (Task 1/2) bahosi.
// POST {mode:'extract', kind:'w'|'sp', img}            → {result:{prompt?, desc?, p1?, p2?, p3?}}
// POST {mode:'para', s, text}                         → {result:{score:0-3, comment, better}}
// POST {mode:'eval', task:'1'|'2', prompt, desc?, text, img?} → {result:{task, tr, cc, lr, gra, overall, strengths, issues, upgrade, next}}
// Rasm base64 (JPEG, ≤ ~450 KB). Hech narsa serverda saqlanmaydi.
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
      p.sort((a, b) => Number(a.lite) - Number(b.lite) || b.v - a.v || Number(a.prev) - Number(b.prev))
      MC = { m: p.map((x) => x.n).slice(0, 5), at: Date.now() }
    } catch { MC = { m: [], at: Date.now() } }
  }
  const env = Deno.env.get('GEMINI_MODEL'); const base = MC.m.length ? MC.m : ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-2.5-flash-lite']
  return env ? [env, ...base.filter((x) => x !== env)] : base
}
const THINK: Array<Record<string, unknown> | null> = [{ thinkingLevel: 'minimal' }, { thinkingBudget: 0 }, null]
async function gemini(system: string, user: string, img: string, maxTok: number): Promise<string> {
  const errs: string[] = []
  const parts: any[] = [{ text: user }]; if (img) parts.push({ inlineData: { mimeType: 'image/jpeg', data: img } })
  for (const m of (await models()).slice(0, 4)) {
    for (const th of THINK) {
      const ctl = new AbortController(), to = setTimeout(() => ctl.abort(), 50000)
      try {
        const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${m}:generateContent`, { method: 'POST', signal: ctl.signal, headers: { 'content-type': 'application/json', 'x-goog-api-key': GEMINI }, body: JSON.stringify({ systemInstruction: { parts: [{ text: system }] }, contents: [{ role: 'user', parts }], generationConfig: { temperature: 0.25, maxOutputTokens: maxTok, responseMimeType: 'application/json', ...(th ? { thinkingConfig: th } : {}) } }) })
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
  for (const model of ['llama-3.3-70b-versatile', 'openai/gpt-oss-20b']) {
    const r = await fetch('https://api.groq.com/openai/v1/chat/completions', { method: 'POST', headers: { 'content-type': 'application/json', authorization: 'Bearer ' + GROQ }, body: JSON.stringify({ model, temperature: 0.25, max_tokens: Math.min(maxTok, 4000), messages: [{ role: 'system', content: system }, { role: 'user', content: user }], response_format: { type: 'json_object' } }) })
    const j: any = await r.json().catch(() => ({})); const t = String(j?.choices?.[0]?.message?.content || '').trim()
    if (r.ok && t) return t
    errs.push(`${model} ${r.status}`)
  }
  throw new Error('groq [' + errs.join('; ') + ']')
}
async function ask(system: string, user: string, img: string, maxTok: number): Promise<string> {
  const errs: string[] = []
  if (GEMINI) { try { return await gemini(system, user, img, maxTok) } catch (e) { errs.push(String((e as Error).message)) } }
  if (GROQ && !img) { try { return await groq(system, user, maxTok) } catch (e) { errs.push(String((e as Error).message)) } }
  throw new Error(errs.join(' | ') || (img ? 'rasm uchun Gemini kerak' : 'nokey'))
}

const EXW = `You read a photo/screenshot of an IELTS Writing task (from a book). Return ONLY valid JSON: {"prompt":string,"desc":string}
"prompt" = the exact task instruction text as printed (including "You should spend about 20 minutes…" line if visible, the question itself and "Write at least 150/250 words"). "desc" = ONLY for Task 1 with a chart/graph/table/map/process diagram: a precise factual English description of the visual (type, title, axes/units, categories, key numbers/trends/comparisons, map changes or process steps) detailed enough that an examiner could mark a report without seeing the image; empty string for Task 2 or if there is no visual. Never invent data you cannot read.`
const EXS = `You read a photo/screenshot of an IELTS Speaking test page. Return ONLY valid JSON: {"p1":[string],"p2":{"t":string,"b":[string]},"p3":[string]}
"p1" = Part 1 questions in order (all topics, plain strings; if there are several topics prefix none). "p2" = the Part 2 cue card: "t" = the "Describe …" line, "b" = the bullet points after "You should say" (including the final "and explain…" line). "p3" = Part 3 discussion questions. Use empty arrays/empty strings for parts that are not visible. Copy the wording exactly.`
const EVW = `You are a strict, fair IELTS Academic Writing examiner for an Uzbek-speaking student. You get ONE task (Task 1 report or Task 2 essay), optionally a description/image of the Task 1 visual, and the student's answer. Return ONLY valid JSON:
{"task":"1"|"2","tr":number,"cc":number,"lr":number,"gra":number,"overall":number,"strengths":[string],"issues":[{"quote":string,"fix":string,"why":string}],"upgrade":string,"next":string}
Scoring: "tr" = Task Achievement (Task 1: accuracy of data, clear overview, key features selected, 150+ words) or Task Response (Task 2: full answer, clear position, developed ideas, 250+ words); "cc" coherence & cohesion; "lr" lexical resource; "gra" grammatical range & accuracy. Bands 1-9 in 0.5 steps; "overall" = mean of the four rounded to nearest 0.5 (round .25 up). Be realistic, not generous; penalise under-length and missing overview (Task 1) / unclear position (Task 2). For Task 1 check every number/trend the student states against the visual/description and flag factual errors in "issues".
"strengths" = 2-3 short Uzbek (Latin) bullets. "issues" = 3-5 items: "quote" = exact fragment from the student's text (English), "fix" = improved English version, "why" = short Uzbek explanation. "upgrade" = ONE improved paragraph (English, 60-110 words) rewriting the student's weakest paragraph at about +1 band. "next" = ONE Uzbek sentence: the most valuable next step. Write all explanations in simple Uzbek (Latin script).`

const EPA = `You are an IELTS tutor checking a PARAPHRASE exercise for an Uzbek-speaking student. You get the ORIGINAL sentence and the student's rewrite. Return ONLY valid JSON: {"score":0|1|2|3,"comment":string,"better":string}
score: 3 = same meaning, key words replaced with natural synonyms/structure change, grammatical; 2 = same meaning and mostly good but small issues (one copied key word, slightly unnatural); 1 = meaning changed a little or too close to the original or noticeable grammar errors; 0 = meaning lost/wrong or copied.
"comment" = ONE or TWO short sentences in Uzbek (Latin script) explaining the score and the most useful fix. "better" = ONE improved English paraphrase (natural, band 7-8 level).`

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })
  if (req.method !== 'POST') return json({ error: 'POST kerak' }, 405)
  let b: any; try { b = await req.json() } catch { return json({ error: 'So‘rov noto‘g‘ri' }, 400) }
  const sb = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, { global: { headers: { Authorization: req.headers.get('Authorization') || '' } } })
  const { data: ok } = await sb.rpc('can_ielts'); if (!ok) return json({ error: 'IELTS uchun ruxsat yo‘q' }, 403)
  if (!GEMINI && !GROQ) return json({ error: 'AI sozlanmagan' }, 503)
  const img = clip(b.img, 700000).replace(/^data:image\/\w+;base64,/, '')
  try {
    if (b.mode === 'extract') {
      if (!img) return json({ error: 'Rasm yo‘q' }, 400)
      const out = parse(await ask(b.kind === 'sp' ? EXS : EXW, b.kind === 'sp' ? 'Extract the Speaking page.' : 'Extract the Writing task.', img, 2200))
      if (!out) return json({ error: 'Rasmdan o‘qib bo‘lmadi. Aniqroq rasm oling.' }, 502)
      return json({ result: out })
    }
    if (b.mode === 'para') {
      const orig = clip(b.s, 300).trim(), text = clip(b.text, 400).trim(); if (orig.length < 8 || text.split(/\s+/).length < 3) return json({ error: 'Gap juda qisqa' }, 400)
      const out = parse(await ask(EPA, `ORIGINAL: ${orig}\nSTUDENT REWRITE: ${text}`, '', 600))
      if (!out || typeof out.score !== 'number') return json({ error: 'AI javobi tushunarsiz. Qayta urinib ko‘ring.' }, 502)
      out.score = Math.max(0, Math.min(3, Math.round(out.score))); out.comment = clip(out.comment, 400); out.better = clip(out.better, 300)
      return json({ result: out })
    }
    if (b.mode === 'eval') {
      const text = clip(b.text, 7000).trim(), task = b.task === '1' ? '1' : '2', min = task === '1' ? 60 : 80
      if (text.split(/\s+/).length < min) return json({ error: 'Javob juda qisqa (kamida ' + min + ' so‘z).' }, 400)
      const user = `TASK ${task} QUESTION:\n${clip(b.prompt, 900)}\n${b.desc ? '\nVISUAL DESCRIPTION (reference for fact-checking):\n' + clip(b.desc, 1800) + '\n' : ''}\nSTUDENT ANSWER (${text.split(/\s+/).length} words):\n${text}`
      const out = parse(await ask(EVW, user, task === '1' ? img : '', 2600))
      if (!out || typeof out.overall !== 'number') return json({ error: 'AI javobi tushunarsiz. Qayta urinib ko‘ring.' }, 502)
      out.task = task
      return json({ result: out })
    }
    return json({ error: 'Noma’lum amal' }, 400)
  } catch (e) { return json({ error: 'AI xatosi — ' + String((e as Error).message || e).slice(0, 300) }, 502) }
})
