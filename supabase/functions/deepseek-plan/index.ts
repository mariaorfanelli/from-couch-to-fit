// Supabase Edge Function: deepseek-plan
//
// Turns a training objective into a structured, trackable plan using DeepSeek.
// The DeepSeek API key lives ONLY here as a function secret — it never ships in
// the app. The app calls this via supabase.functions.invoke("deepseek-plan").
//
// Deploy:
//   supabase functions deploy deepseek-plan
//   supabase secrets set DEEPSEEK_API_KEY=sk-...
//
// Deno runtime — this file is not part of the mobile TypeScript project.

const DEEPSEEK_API_KEY = Deno.env.get("DEEPSEEK_API_KEY") ?? "";
const DEEPSEEK_URL = "https://api.deepseek.com/chat/completions";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface Target {
  kind: "distance" | "pace";
  value: number;
}

function paceStr(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = Math.round(sec % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

function buildPrompt(objective: string, target: Target, weeks: number, stats: any): string {
  const goal =
    target.kind === "distance"
      ? `run ${target.value} km continuously`
      : `reach an average running pace of ${paceStr(target.value)} per km`;

  const durationDays = weeks * 7;
  return `You are a warm, encouraging running coach for a gentle fitness app called "From Couch to Fit".
Design a ${weeks}-week (${durationDays}-day) plan to help the user ${goal}.

User's current fitness:
- Weekly distance: ${stats?.weeklyKm ?? 0} km
- Best recent pace: ${stats?.bestPaceSec ? paceStr(stats.bestPaceSec) + " /km" : "unknown"}
- Typical run distance: ${stats?.typicalRunKm ?? 0} km
Objective note from the user: "${objective || "(none)"}"

Rules:
- 3 training days per week (rest on the others).
- Progress gradually and kindly; never jump volume more than ~10% per week.
- Use run/walk intervals early on, transitioning toward continuous running.
- dayIndex is 0-based from the plan start (0..${durationDays - 1}); use days like Mon/Wed/Sat.
- Each interval, when present, has this exact shape:
  { "name": string, "warmup": {"type":"walk","seconds":300}, "blocks":[{"repeat":N,"phases":[{"type":"walk"|"run","seconds":S}]}], "cooldown": {"type":"walk","seconds":180} }

Return ONLY minified JSON of this exact shape (no markdown):
{"title": string, "summary": string, "days": [ { "dayIndex": number, "label": string, "prescription": string, "activityType": "run"|"walk", "targetKm"?: number, "interval"?: {..as above..} } ] }`;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });

  try {
    if (!DEEPSEEK_API_KEY) {
      return json({ error: "DEEPSEEK_API_KEY not configured" }, 500);
    }
    const { objective = "", target, weeks = 6, stats = {} } = await req.json();
    if (!target || (target.kind !== "distance" && target.kind !== "pace")) {
      return json({ error: "Invalid target" }, 400);
    }

    const resp = await fetch(DEEPSEEK_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${DEEPSEEK_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: [
          { role: "system", content: "You are a running coach. You reply with strictly valid JSON only." },
          { role: "user", content: buildPrompt(objective, target, weeks, stats) },
        ],
        response_format: { type: "json_object" },
        temperature: 0.7,
        max_tokens: 4000,
      }),
    });

    if (!resp.ok) {
      const t = await resp.text();
      return json({ error: `DeepSeek ${resp.status}: ${t.slice(0, 300)}` }, 502);
    }

    const completion = await resp.json();
    const content = completion?.choices?.[0]?.message?.content ?? "{}";
    let plan: any;
    try {
      plan = JSON.parse(content);
    } catch {
      return json({ error: "DeepSeek returned non-JSON" }, 502);
    }
    return json(plan, 200);
  } catch (e) {
    return json({ error: String(e) }, 500);
  }
});

function json(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, "Content-Type": "application/json" },
  });
}
