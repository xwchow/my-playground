import { promises as fs } from 'fs';
import path from 'path';

/**
 * Helper to fetch JSON
 */
async function fetchJson(url, options = {}) {
  const res = await fetch(url, options);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`HTTP ${res.status} ${res.statusText}: ${text}`);
  }
  return res.json();
}

/**
 * Load repository context (AGENTS.md, DESIGN_SYSTEM.md, index.html)
 */
async function getRepoContext() {
  const rootDir = process.cwd();
  let agentsDoc = '';
  let designSystemDoc = '';
  let indexHtmlSample = '';

  try {
    agentsDoc = await fs.readFile(path.join(rootDir, 'AGENTS.md'), 'utf-8');
  } catch {
    try {
      const res = await fetch('https://raw.githubusercontent.com/xwchow/my-playground/main/AGENTS.md');
      if (res.ok) agentsDoc = await res.text();
    } catch {}
  }

  try {
    designSystemDoc = await fs.readFile(path.join(rootDir, 'docs/design-system/DESIGN_SYSTEM.md'), 'utf-8');
  } catch {
    try {
      const res = await fetch('https://raw.githubusercontent.com/xwchow/my-playground/main/docs/design-system/DESIGN_SYSTEM.md');
      if (res.ok) designSystemDoc = await res.text();
    } catch {}
  }

  try {
    indexHtmlSample = await fs.readFile(path.join(rootDir, 'index.html'), 'utf-8');
  } catch {
    try {
      const res = await fetch('https://raw.githubusercontent.com/xwchow/my-playground/main/index.html');
      if (res.ok) indexHtmlSample = await res.text();
    } catch {}
  }

  return { agentsDoc, designSystemDoc, indexHtmlSample };
}

/**
 * Vercel Serverless Handler: POST /api/generate
 */
export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, x-studio-secret, Authorization'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Use POST.' });
  }

  // Verify Studio Passcode if STUDIO_SECRET is configured
  const expectedSecret = process.env.STUDIO_SECRET;
  if (expectedSecret) {
    const providedSecret = req.headers['x-studio-secret'] || (req.headers['authorization'] || '').replace(/^Bearer\s+/i, '');
    if (providedSecret !== expectedSecret) {
      return res.status(401).json({ error: 'Unauthorized: Invalid or missing Studio Passcode.' });
    }
  }

  const { prompt, model: requestedModel } = req.body || {};
  if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
    return res.status(400).json({ error: 'Missing required "prompt" string.' });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({
      error: 'GEMINI_API_KEY is not configured in Vercel Environment Variables.'
    });
  }

  try {
    const { agentsDoc, designSystemDoc } = await getRepoContext();

    const systemInstruction = `You are an expert frontend web developer building standalone, single-page applications for the "my-playground" static playground repository.

CRITICAL ARCHITECTURAL REQUIREMENTS:
1. Zero Build Step: Pure HTML/JS/CSS. No bundlers, no npm imports, no JSX.
2. External CDNs: Include Tailwind CSS CDN (<script src="https://cdn.tailwindcss.com"></script>), Google Fonts (Plus Jakarta Sans & JetBrains Mono), and Lucide Icons CDN (<script src="https://unpkg.com/lucide@latest"></script>).
3. Design System Compliance: Strictly adhere to the Editorial Paper Design System:
   - Palette: Warm paper backgrounds (bg-[#f7f6f2]), pure white cards (bg-white), deep zinc text (text-[#18181b]), cobalt accents (bg-[#1d4ed8], text-[#1d4ed8]).
   - Borders: 1.5px solid #27272a (border-[1.5px] border-zinc-800).
   - Shadows: 2px 2px 0px 0px #27272a (shadow-editorial), 1.5px 1.5px (shadow-editorial-sm), 3px 3px (shadow-editorial-lg).
   - Typography: Plus Jakarta Sans for UI body/headings. JetBrains Mono for numbers, formulas, timers, <kbd> shortcuts, scores, and uppercase eyebrow badges.
   - Interactive Buttons: .btn-editorial with active depression translate(1.5px, 1.5px).
   - Navigation: Top-left back button linking to "../" (Home) with arrow icon and consistent styling.
4. Mobile & Touch Optimized: Large touch targets (min 44x44px), responsive layouts, haptic feedback if appropriate, Web Audio API sound FX.
5. Self-Contained: The app must live in a dedicated folder (e.g. <slug>/index.html).

Output MUST be valid JSON adhering to this schema:
{
  "slug": "kebab-case-app-slug (e.g. reaction-timer)",
  "title": "Title Case App Name (e.g. Reaction Time Tester)",
  "category": "tools" | "games" | "mental-math" | "puzzles",
  "emoji": "single emoji icon (e.g. ⚡)",
  "summary": "1-2 sentence description for the home page card",
  "tags": ["Tag1", "Tag2", "Tag3"],
  "files": [
    {
      "path": "<slug>/index.html",
      "content": "<!DOCTYPE html>..."
    }
  ],
  "summaryMessage": "Markdown notes describing features, controls, and instructions."
}`;

    const geminiPayload = {
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: `USER REQUEST:
${prompt.trim()}

REPOSITORY GUIDELINES:
${agentsDoc}

DESIGN SYSTEM RULES:
${designSystemDoc}

Generate a complete, beautiful, fully functional single-page web app adhering to the above specifications.`
            }
          ]
        }
      ],
      systemInstruction: {
        parts: [{ text: systemInstruction }]
      },
      generationConfig: {
        responseMimeType: 'application/json',
        temperature: 0.2
      }
    };

    // Candidate model sequence: requested -> gemini-3.7-flash -> gemini-3.6-flash
    const candidateModels = [
      requestedModel || 'gemini-3.7-flash',
      'gemini-3.6-flash'
    ].filter((m, idx, self) => self.indexOf(m) === idx);

    let rawTextResponse = '';
    let usedModel = candidateModels[0];
    let lastError = null;
    let success = false;

    for (const model of candidateModels) {
      usedModel = model;
      for (let attempt = 1; attempt <= 3; attempt++) {
        try {
          const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
          const resJson = await fetchJson(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(geminiPayload),
          });

          rawTextResponse = resJson.candidates?.[0]?.content?.parts?.[0]?.text;
          if (rawTextResponse) {
            success = true;
            break;
          }
        } catch (err) {
          lastError = err;
          const isOverloaded = 
            err.message.includes('503') ||
            err.message.includes('429') ||
            err.message.includes('500') ||
            err.message.toLowerCase().includes('overloaded') ||
            err.message.toLowerCase().includes('high demand');

          if (isOverloaded && attempt < 3) {
            await new Promise(r => setTimeout(r, attempt * 2500));
          } else {
            break;
          }
        }
      }
      if (success) break;
    }

    if (!success || !rawTextResponse) {
      return res.status(502).json({
        error: `Gemini generation failed: ${lastError?.message || 'Empty response'}`
      });
    }

    const appData = JSON.parse(rawTextResponse);
    return res.status(200).json({
      success: true,
      modelUsed: usedModel,
      appData
    });
  } catch (err) {
    console.error('Server error in /api/generate:', err);
    return res.status(500).json({ error: err.message || 'Internal server error' });
  }
}
