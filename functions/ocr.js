const { onCall, HttpsError } = require('firebase-functions/v2/https')
const { defineSecret } = require('firebase-functions/params')

const OPENAI_API_KEY = defineSecret('OPENAI_API_KEY')

exports.extractCarteVitaleNir = onCall(
  { secrets: [OPENAI_API_KEY], memory: '512MiB', timeoutSeconds: 60, maxInstances: 10 },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'Authentication required.')
    }

    // if data awake, return a simple message
    if (request.data && request.data.awake) {
      return { message: "Receipt function is awake!" }
    }

    const { imageBase64 } = request.data
    if (!imageBase64) {
      throw new HttpsError('invalid-argument', 'imageBase64 is required.')
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY.value()}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: 'This is a photo of a French Carte Vitale (health insurance card). Extract:\n1. The 15-digit NIR (Numéro de Sécurité Sociale)\n2. The issue date ("émise le DD/MM/YYYY")\nReturn a JSON object with exactly these keys: {"nir": "<15 digits>", "issueDate": "DD/MM/YYYY"}. If a field cannot be found, use null for its value. Return ONLY the JSON, nothing else.',
              },
              {
                type: 'image_url',
                image_url: {
                  url: `data:image/jpeg;base64,${imageBase64}`,
                },
              },
            ],
          },
        ],
        max_tokens: 100,
      }),
    })

    if (!response.ok) {
      throw new HttpsError('internal', 'OpenAI API request failed.')
    }

    const result = await response.json()
    const raw = result.choices?.[0]?.message?.content?.trim() || ''
    const content = raw.replace(/^```(?:json)?\s*/, '').replace(/\s*```$/, '')

    let parsed
    try {
      parsed = JSON.parse(content)
    } catch {
      throw new HttpsError('internal', 'Failed to parse OpenAI response.')
    }

    const nir = parsed.nir ? parsed.nir.replace(/\D/g, '') : null
    if (!nir || nir.length !== 15) {
      throw new HttpsError('not-found', 'Could not extract NIR from the image.')
    }

    const data = { nir }
    if (parsed.issueDate && /^\d{2}\/\d{2}\/\d{4}$/.test(parsed.issueDate)) {
      data.issueDate = parsed.issueDate
    }

    return data
  }
)

exports.extractAttestationSecuriteSociale = onCall(
  { secrets: [OPENAI_API_KEY], memory: '512MiB', timeoutSeconds: 60, maxInstances: 10 },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'Authentication required.')
    }

    if (request.data && request.data.awake) {
      return { message: 'Receipt function is awake!' }
    }

    const { imageBase64 } = request.data
    if (!imageBase64) {
      throw new HttpsError('invalid-argument', 'imageBase64 is required.')
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY.value()}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: 'This is a photo of a French "Attestation de droits" or "Attestation de Sécurité Sociale" (Ameli/CPAM). Extract the following fields:\n1. Full name of the insured person\n2. SSN (Numéro de Sécurité Sociale / NIR) — 13 or 15 digits\n3. Date of birth in DD/MM/YYYY format\n4. Whether coverage is currently valid (true/false)\n5. The managing organization name (e.g. CPAM Paris)\n6. Whether the person has an "Affection de Longue Durée" (ALD) mentioned (true/false)\nReturn ONLY a JSON object with exactly these keys: {"name": "<full name>", "ssn": "<digits only>", "birthDate": "DD/MM/YYYY", "coverageValid": true/false, "organization": "<org name>", "affectionLongueDuree": true/false}. Use null for any field that cannot be found.',
              },
              {
                type: 'image_url',
                image_url: {
                  url: `data:image/jpeg;base64,${imageBase64}`,
                },
              },
            ],
          },
        ],
        max_tokens: 200,
      }),
    })

    if (!response.ok) {
      throw new HttpsError('internal', 'OpenAI API request failed.')
    }

    const result = await response.json()
    const raw = result.choices?.[0]?.message?.content?.trim() || ''
    const content = raw.replace(/^```(?:json)?\s*/, '').replace(/\s*```$/, '')

    let parsed
    try {
      parsed = JSON.parse(content)
    } catch {
      throw new HttpsError('internal', 'Failed to parse OpenAI response.')
    }

    const ssn = parsed.ssn ? String(parsed.ssn).replace(/\D/g, '') : null
    if (!ssn || (ssn.length !== 13 && ssn.length !== 15)) {
      throw new HttpsError('not-found', 'Could not extract SSN from the image.')
    }

    const data = {
      ssn,
      name: parsed.name || null,
      coverageValid: parsed.coverageValid === true,
      organization: parsed.organization || null,
      affectionLongueDuree: parsed.affectionLongueDuree === true,
    }
    if (parsed.birthDate && /^\d{2}\/\d{2}\/\d{4}$/.test(parsed.birthDate)) {
      data.birthDate = parsed.birthDate
    }

    return data
  }
)