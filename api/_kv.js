// Zero-dependency Upstash / Vercel KV REST client.
// Works with either env pair:
//   KV_REST_API_URL        + KV_REST_API_TOKEN          (Vercel KV / Marketplace Redis)
//   UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN   (Upstash direct)

const URL_ = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL || "";
const TOKEN = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN || "";

const configured = Boolean(URL_ && TOKEN);

async function cmd(args) {
  const res = await fetch(URL_.replace(/\/$/, ""), {
    method: "POST",
    headers: { authorization: `Bearer ${TOKEN}`, "content-type": "application/json" },
    body: JSON.stringify(args),
  });
  if (!res.ok) throw new Error(`kv ${res.status}`);
  const data = await res.json();
  if (data && data.error) throw new Error(data.error);
  return data ? data.result : null;
}

const LIST_KEY = "jfg:signatures";
const SET_KEY = "jfg:seen";
const MAX = 2000;

module.exports = { configured, cmd, LIST_KEY, SET_KEY, MAX };
