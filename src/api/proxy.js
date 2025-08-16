export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed", details: "Only POST requests are supported" });
  }

  try {
    if (!req.body || typeof req.body !== "object") {
      return res.status(400).json({ error: "Bad Request", details: "Request body must be a valid JSON object" });
    }

    const response = await fetch(process.env.GOOGLE_API_URL_LINK, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(req.body),
    });
    if (!response.ok) {
      return res.status(response.status).json({
        error: "Google Apps Script Error",
        details: `Received status ${response.status} from upstream API`,
      });
    }
    const data = await response.json();
    res.status(200).json(data);
  } catch (err) {
    res.status(500).json({
      error: "Proxy Failed",
      details: err.message || "An unexpected error occurred while proxying the request",
    });
  }
}