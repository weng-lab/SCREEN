function createGraphqlProxy({ upstreamUrl, apiKeyEnv, missingKeyMessage, upstreamErrorMessage }) {
  return async function handler(request, response) {
    if (request.method !== "POST") {
      response.setHeader("Allow", "POST")
      return response.status(405).json({ error: "Method not allowed" })
    }

    const apiKey = process.env[apiKeyEnv]
    if (!apiKey) {
      return response.status(500).json({ error: missingKeyMessage })
    }

    const body = typeof request.body === "string" ? request.body : JSON.stringify(request.body || {})

    try {
      const upstream = await fetch(upstreamUrl, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          "api-key": apiKey,
        },
        body,
      })

      const contentType = upstream.headers.get("content-type")
      if (contentType) {
        response.setHeader("Content-Type", contentType)
      }

      const text = await upstream.text()
      return response.status(upstream.status).send(text)
    } catch (error) {
      return response.status(502).json({ error: upstreamErrorMessage })
    }
  }
}

module.exports = createGraphqlProxy
