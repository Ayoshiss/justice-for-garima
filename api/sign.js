const { configured, cmd, LIST_KEY, SET_KEY, MAX } = require("./_kv.js");

// Strip control characters and angle brackets, collapse whitespace, cap length.
function clean(v, max) {
  return String(v == null ? "" : v)
    .replace(/[\u0000-\u001F\u007F<>]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max);
}

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("allow", "POST");
    return res.status(405).json({ error: "method_not_allowed" });
  }
  if (!configured) return res.status(503).json({ configured: false });

  let body = req.body;
  if (typeof body === "string") { try { body = JSON.parse(body); } catch (e) { body = {}; } }
  body = body || {};

  const n = clean(body.name, 60);
  const d = clean(body.district, 40);
  const m = clean(body.message, 180);
  if (!n || n.length < 2) return res.status(400).json({ error: "name_required" });

  const fwd = req.headers["x-forwarded-for"] || "";
  const ip = String(fwd).split(",")[0].trim() || "unknown";

  try {
    // At most 5 signatures per IP per hour.
    const rlKey = `jfg:rl:${ip}`;
    const hits = await cmd(["INCR", rlKey]);
    if (hits === 1) await cmd(["EXPIRE", rlKey, "3600"]);
    if (hits > 5) return res.status(429).json({ error: "rate_limited" });

    // One signature per name + district.
    const fresh = await cmd(["SADD", SET_KEY, `${n.toLowerCase()}|${d.toLowerCase()}`]);
    if (fresh === 0) return res.status(409).json({ error: "duplicate" });

    const entry = { n, d, m, t: new Date().toISOString().slice(0, 10) };
    await cmd(["RPUSH", LIST_KEY, JSON.stringify(entry)]);
    await cmd(["LTRIM", LIST_KEY, String(-MAX), "-1"]);

    const raw = (await cmd(["LRANGE", LIST_KEY, "-500", "-1"])) || [];
    const signatures = raw
      .map((s) => { try { return JSON.parse(s); } catch (e) { return null; } })
      .filter(Boolean);

    return res.status(200).json({ ok: true, count: signatures.length, signatures });
  } catch (e) {
    return res.status(500).json({ error: "write_failed" });
  }
};
