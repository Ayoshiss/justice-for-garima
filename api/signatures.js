const { configured, cmd, LIST_KEY } = require("./_kv.js");

module.exports = async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("allow", "GET");
    return res.status(405).json({ error: "method_not_allowed" });
  }
  if (!configured) {
    // No storage attached yet - the front end falls back to the letter.
    return res.status(503).json({ configured: false, signatures: [] });
  }
  try {
    const raw = (await cmd(["LRANGE", LIST_KEY, "-500", "-1"])) || [];
    const signatures = raw
      .map((s) => { try { return JSON.parse(s); } catch (e) { return null; } })
      .filter(Boolean);
    res.setHeader("cache-control", "public, s-maxage=10, stale-while-revalidate=60");
    return res.status(200).json({ configured: true, count: signatures.length, signatures });
  } catch (e) {
    return res.status(500).json({ error: "read_failed" });
  }
};
