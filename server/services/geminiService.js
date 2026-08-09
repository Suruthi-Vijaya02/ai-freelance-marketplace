import { getGeminiClient, GEMINI_MODEL } from '../config/gemini.js';

// ─────────────────────────────────────────────────────────────
// EXTRACT TEXT FROM GEMINI RESPONSE
// ─────────────────────────────────────────────────────────────

function extractText(response) {
  if (!response) return '';

  // New Gemini SDK response style
  if (typeof response.text === 'string') {
    return response.text.trim();
  }

  // Some SDK versions expose text as a function
  if (typeof response.text === 'function') {
    try {
      const value = response.text();
      return typeof value === 'string' ? value.trim() : '';
    } catch {
      // Continue to candidates fallback
    }
  }

  // Fallback: manually extract candidate parts
  const candidates = response.candidates;

  if (Array.isArray(candidates) && candidates.length > 0) {
    const parts = candidates[0]?.content?.parts;

    if (Array.isArray(parts)) {
      return parts
        .map((part) => (typeof part.text === 'string' ? part.text : ''))
        .join('')
        .trim();
    }
  }

  return '';
}

// ─────────────────────────────────────────────────────────────
// ERROR MAPPING
// ─────────────────────────────────────────────────────────────

function mapErrorToResponse(error, context) {
  const status =
    error?.status ||
    error?.response?.status ||
    error?.httpStatusCode ||
    500;

  let code = 'GEMINI_ERROR';
  let message = 'Gemini request failed. Please try again.';

  const rawMessage =
    typeof error?.message === 'string'
      ? error.message
      : '';

  // Missing API key
  if (error?.code === 'GEMINI_MISSING_API_KEY') {
    code = 'GEMINI_MISSING_API_KEY';
    message =
      rawMessage ||
      'GEMINI_API_KEY is not configured on the server.';
  }

  // Invalid API key
  else if (
    /api key not valid|api_key_invalid|invalid api key/i.test(
      rawMessage
    )
  ) {
    code = 'GEMINI_INVALID_API_KEY';
    message = 'The configured Gemini API key is invalid.';
  }

  // Rate limit / quota
  else if (
    status === 429 ||
    /quota|rate limit|resource_exhausted/i.test(rawMessage)
  ) {
    code = 'GEMINI_RATE_LIMIT';
    message =
      'Gemini rate limit or quota exceeded. The application will use its fallback AI logic.';
  }

  // Forbidden
  else if (status === 403) {
    code = 'GEMINI_FORBIDDEN';
    message =
      'Gemini API key is not authorized to perform this request.';
  }

  // Bad request
  else if (status === 400) {
    code = 'GEMINI_BAD_REQUEST';
    message =
      rawMessage ||
      'Gemini rejected the request as invalid.';
  }

  // Timeout
  else if (error?.code === 'GEMINI_TIMEOUT') {
    code = 'GEMINI_TIMEOUT';
    message =
      'Gemini request timed out. The application will use its fallback AI logic.';
  }

  // Server unavailable
  else if (status >= 500) {
    code = 'GEMINI_UNAVAILABLE';
    message =
      'Gemini service is temporarily unavailable. The application will use its fallback AI logic.';
  }

  // Other error
  else if (rawMessage) {
    message = rawMessage;
  }

  console.error(
    `[geminiService] ${context} failed:`,
    rawMessage || error
  );

  return {
    success: false,
    data: null,
    error: {
      code,
      message,
      status,
    },
    source: 'gemini',
    model: null,
  };
}

// ─────────────────────────────────────────────────────────────
// VALIDATE PROMPT
// ─────────────────────────────────────────────────────────────

function validatePrompt(prompt) {
  return (
    typeof prompt === 'string' &&
    prompt.trim().length > 0
  );
}

// ─────────────────────────────────────────────────────────────
// TIMEOUT HELPER
// ─────────────────────────────────────────────────────────────

function withTimeout(promise, timeoutMs = 20000) {
  let timeoutId;

  const timeoutPromise = new Promise((_, reject) => {
    timeoutId = setTimeout(() => {
      const error = new Error(
        `Gemini request timed out after ${timeoutMs}ms`
      );

      error.code = 'GEMINI_TIMEOUT';

      reject(error);
    }, timeoutMs);
  });

  return Promise.race([
    promise,
    timeoutPromise,
  ]).finally(() => {
    clearTimeout(timeoutId);
  });
}

// ─────────────────────────────────────────────────────────────
// CLEAN GEMINI JSON RESPONSE
// ─────────────────────────────────────────────────────────────

function cleanJsonText(rawText) {
  if (!rawText || typeof rawText !== 'string') {
    return '';
  }

  let cleanedText = rawText.trim();

  // Remove ```json ... ```
  if (cleanedText.startsWith('```')) {
    cleanedText = cleanedText
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/i, '')
      .replace(/\s*```$/i, '')
      .trim();
  }

  return cleanedText;
}

// ─────────────────────────────────────────────────────────────
// TEXT GENERATION
// ─────────────────────────────────────────────────────────────

/**
 * Generate free-form text from a prompt.
 *
 * @param {string} prompt
 * @param {object} [options]
 * @param {string} [options.model]
 * @param {string} [options.systemInstruction]
 * @param {number} [options.temperature]
 * @param {number} [options.maxOutputTokens]
 * @param {number} [options.topP]
 * @param {number} [options.timeoutMs]
 */

export async function generateText(
  prompt,
  options = {}
) {
  if (!validatePrompt(prompt)) {
    return {
      success: false,
      data: null,
      error: {
        code: 'GEMINI_INVALID_INPUT',
        message: 'Prompt must be a non-empty string.',
        status: 400,
      },
      source: 'gemini',
      model: null,
    };
  }

  const model =
    options.model || GEMINI_MODEL;

  try {
    const client = getGeminiClient();

    const config = {
      temperature:
        options.temperature ?? 0.7,

      maxOutputTokens:
        options.maxOutputTokens ?? 1024,

      topP:
        options.topP ?? 0.95,
    };

    if (options.systemInstruction) {
      config.systemInstruction =
        options.systemInstruction;
    }

    const response = await withTimeout(
      client.models.generateContent({
        model,
        contents: prompt,
        config,
      }),
      options.timeoutMs ?? 20000
    );

    const text = extractText(response);

    if (!text) {
      return {
        success: false,
        data: null,
        error: {
          code: 'GEMINI_EMPTY_RESPONSE',
          message:
            'Gemini returned an empty response for this prompt.',
          status: 502,
        },
        source: 'gemini',
        model,
      };
    }

    return {
      success: true,
      data: {
        text,
      },
      error: null,
      source: 'gemini',
      model,
    };
  } catch (error) {
    return mapErrorToResponse(
      error,
      'generateText'
    );
  }
}

// ─────────────────────────────────────────────────────────────
// STRUCTURED JSON GENERATION
// ─────────────────────────────────────────────────────────────

/**
 * Generate a JSON object from a prompt.
 *
 * Uses Gemini structured output mode when a responseSchema
 * is supplied.
 *
 * @param {string} prompt
 * @param {object} [options]
 * @param {object} [options.responseSchema]
 * @param {string} [options.model]
 * @param {string} [options.systemInstruction]
 * @param {number} [options.temperature]
 * @param {number} [options.maxOutputTokens]
 * @param {number} [options.timeoutMs]
 */

export async function generateJSON(
  prompt,
  options = {}
) {
  if (!validatePrompt(prompt)) {
    return {
      success: false,
      data: null,
      error: {
        code: 'GEMINI_INVALID_INPUT',
        message: 'Prompt must be a non-empty string.',
        status: 400,
      },
      source: 'gemini',
      model: null,
    };
  }

  const model =
    options.model || GEMINI_MODEL;

  try {
    const client = getGeminiClient();

    const config = {
      temperature:
        options.temperature ?? 0.4,

      maxOutputTokens:
        options.maxOutputTokens ?? 1024,

      responseMimeType:
        'application/json',
    };

    // Structured output schema
    if (options.responseSchema) {
      config.responseSchema =
        options.responseSchema;
    }

    // System instruction
    if (options.systemInstruction) {
      config.systemInstruction =
        options.systemInstruction;
    }

    const response = await withTimeout(
      client.models.generateContent({
        model,
        contents: prompt,
        config,
      }),
      options.timeoutMs ?? 20000
    );

    const rawText = extractText(response);

    // Empty response
    if (!rawText) {
      return {
        success: false,
        data: null,
        error: {
          code: 'GEMINI_EMPTY_RESPONSE',
          message:
            'Gemini returned an empty response for this prompt.',
          status: 502,
        },
        source: 'gemini',
        model,
      };
    }

    // ─────────────────────────────────────────────
    // CLEAN JSON
    // ─────────────────────────────────────────────

    const cleanedText =
      cleanJsonText(rawText);

    // ─────────────────────────────────────────────
    // PARSE JSON
    // ─────────────────────────────────────────────

    let parsed;

    try {
      parsed = JSON.parse(cleanedText);
    } catch (parseError) {
      console.error(
        '[geminiService] generateJSON parse failure:',
        parseError.message
      );

      console.error(
        '[geminiService] Gemini raw response:',
        rawText
      );

      return {
        success: false,
        data: null,
        error: {
          code: 'GEMINI_INVALID_JSON',
          message:
            'Gemini response could not be parsed as JSON.',
          status: 502,
        },
        source: 'gemini',
        model,
      };
    }

    // ─────────────────────────────────────────────
    // SUCCESS
    // ─────────────────────────────────────────────

    return {
      success: true,
      data: parsed,
      error: null,
      source: 'gemini',
      model,
    };
  } catch (error) {
    return mapErrorToResponse(
      error,
      'generateJSON'
    );
  }
}

// ─────────────────────────────────────────────────────────────
// MULTI-TURN CHAT
// ─────────────────────────────────────────────────────────────

/**
 * Generate a reply given a conversation history.
 *
 * @param {Array<{ role: 'user'|'model', text: string }>} messages
 * @param {object} [options]
 * @param {string} [options.model]
 * @param {string} [options.systemInstruction]
 * @param {number} [options.temperature]
 * @param {number} [options.maxOutputTokens]
 * @param {number} [options.timeoutMs]
 */

export async function generateChatReply(
  messages,
  options = {}
) {
  if (
    !Array.isArray(messages) ||
    messages.length === 0
  ) {
    return {
      success: false,
      data: null,
      error: {
        code: 'GEMINI_INVALID_INPUT',
        message:
          'messages must be a non-empty array of { role, text } items.',
        status: 400,
      },
      source: 'gemini',
      model: null,
    };
  }

  const model =
    options.model || GEMINI_MODEL;

  try {
    const client = getGeminiClient();

    const contents = messages
      .filter(
        (m) =>
          m &&
          validatePrompt(m.text)
      )
      .map((m) => ({
        role:
          m.role === 'model'
            ? 'model'
            : 'user',

        parts: [
          {
            text: m.text,
          },
        ],
      }));

    if (contents.length === 0) {
      return {
        success: false,
        data: null,
        error: {
          code: 'GEMINI_INVALID_INPUT',
          message:
            'No valid messages with text were provided.',
          status: 400,
        },
        source: 'gemini',
        model,
      };
    }

    const config = {
      temperature:
        options.temperature ?? 0.7,

      maxOutputTokens:
        options.maxOutputTokens ?? 1024,
    };

    if (options.systemInstruction) {
      config.systemInstruction =
        options.systemInstruction;
    }

    const response = await withTimeout(
      client.models.generateContent({
        model,
        contents,
        config,
      }),
      options.timeoutMs ?? 20000
    );

    const text = extractText(response);

    if (!text) {
      return {
        success: false,
        data: null,
        error: {
          code: 'GEMINI_EMPTY_RESPONSE',
          message:
            'Gemini returned an empty response for this conversation.',
          status: 502,
        },
        source: 'gemini',
        model,
      };
    }

    return {
      success: true,
      data: {
        text,
      },
      error: null,
      source: 'gemini',
      model,
    };
  } catch (error) {
    return mapErrorToResponse(
      error,
      'generateChatReply'
    );
  }
}

// ─────────────────────────────────────────────────────────────
// DEFAULT EXPORT
// ─────────────────────────────────────────────────────────────

export default {
  generateText,
  generateJSON,
  generateChatReply,
};