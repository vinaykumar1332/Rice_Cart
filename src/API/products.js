export default async function handler(req, res) {
  try {
    // CORS headers
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");

    const googleApiUrl = process.env.GOOGLE_API_URL; // we'll store it in Vercel env vars

    if (!googleApiUrl) {
      return res.status(500).json({ error: "Missing GOOGLE_API_URL" });
    }

    const response = await fetch(googleApiUrl);
    const data = await response.json();

    res.status(200).json(data);
  } catch (err) {
    console.error("API Error:", err);
    res.status(500).json({ error: "Internal Server Error", details: err.message });
  }
}
