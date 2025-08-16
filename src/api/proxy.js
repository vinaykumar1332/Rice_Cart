export default async function handler(req, res) {
  // Set CORS headers for all responses
  res.setHeader('Access-Control-Allow-Origin', 'https://vinaykumar1332.github.io'); // Restrict to your frontend origin
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS'); // Allow POST and OPTIONS
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type'); // Allow Content-Type header

  // Handle preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    return res.status(200).end(); // Respond with 200 OK for preflight
  }

  // Restrict to POST requests for actual API calls
  if (req.method !== 'POST') {
    return res.status(405).json({
      error: 'Method Not Allowed',
      details: 'Only POST requests are supported',
    });
  }

  try {
    // Validate req.body is an object (for JSON serialization)
    if (!req.body || typeof req.body !== 'object') {
      return res.status(400).json({
        error: 'Bad Request',
        details: 'Request body must be a valid JSON object',
      });
    }

    const response = await fetch(process.env.GOOGLE_API_URL_LINK, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(req.body),
    });

    // Check if the response is successful
    if (!response.ok) {
      return res.status(response.status).json({
        error: 'Google Apps Script Error',
        details: `Received status ${response.status} from upstream API`,
      });
    }

    // Attempt to parse JSON response
    const data = await response.json();
    res.status(200).json(data);
  } catch (err) {
    res.status(500).json({
      error: 'Proxy Failed',
      details: err.message || 'An unexpected error occurred while proxying the request',
    });
  }
}