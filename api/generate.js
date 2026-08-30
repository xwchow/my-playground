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
 * Robust Model Output Parser: Extracts <meta> and <file> blocks
 * Prevents JSON escaping errors on raw code files.
 */
export function parseModelOutput(rawText) {
  if (!rawText || typeof rawText !== 'string') {
    throw new Error('Empty or invalid response from model');
  }

  const text = rawText.trim();
  let metadata = null;
  const files = [];

  // 1. Extract <meta> block
  const metaMatch = text.match(/<meta>([\s\S]*?)<\/meta>/i);
  if (metaMatch) {
    try {
      let metaJson = metaMatch[1].trim();
      if (metaJson.startsWith('```')) {
        metaJson = metaJson.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
      }
      metadata = JSON.parse(metaJson);
    } catch (e) {
      console.warn('Failed to parse <meta> JSON:', e.message);
    }
  }

  // 2. Extract all <file path="...">...</file> blocks
  const fileRegex = /<file\s+path=["']([^"']+)["']>([\s\S]*?)<\/file>/gi;
  let match;
  while ((match = fileRegex.exec(text)) !== null) {
    const filePath = match[1].trim();
    let content = match[2].trim();
    if (content.startsWith('```')) {
      content = content.replace(/^```[a-z]*\s*\n?/i, '').replace(/\n?```$/i, '').trim();
    }
    files.push({ path: filePath, content });
  }

  // 3. Fallback: If no <file> tags, try finding markdown code block ```html ... ```
  if (files.length === 0) {
    const htmlBlockMatch = text.match(/```(?:html)?\s*\n([\s\S]*?)\n```/i);
    if (htmlBlockMatch) {
      const slug = metadata?.slug || 'my-app';
      files.push({
        path: `${slug}/index.html`,
        content: htmlBlockMatch[1].trim()
      });
    }
  }

  // 4. Fallback: If model returned pure JSON
  if (!metadata || files.length === 0) {
    try {
      let cleaned = text;
      if (cleaned.startsWith('```')) {
        cleaned = cleaned.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
      }
      const firstBrace = cleaned.indexOf('{');
      const lastBrace = cleaned.lastIndexOf('}');
      if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
        cleaned = cleaned.substring(firstBrace, lastBrace + 1);
      }
      const parsedJson = JSON.parse(cleaned);
      if (parsedJson.slug && parsedJson.files) {
        return parsedJson;
      }
    } catch {}
  }

  if (files.length === 0) {
    throw new Error('No valid <file> code blocks found in model response.');
  }

  const slug = metadata?.slug || files[0].path.split('/')[0] || 'app';
  const title = metadata?.title || slug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

  return {
    slug,
    title,
    category: metadata?.category || 'tools',
    emoji: metadata?.emoji || '⚡',
    summary: metadata?.summary || 'Interactive playground mini-app.',
    tags: metadata?.tags || ['Interactive', 'Web App'],
    files,
    summaryMessage: `### ${metadata?.emoji || '⚡'} ${title}\n\n- Created \`${files[0].path}\`\n\n${metadata?.summary || ''}`
  };
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

OUTPUT FORMAT:
Output MUST use these exact XML delimiter tags. DO NOT escape code inside JSON.

<meta>
{
  "slug": "kebab-case-app-slug",
  "title": "Title Case App Name",
  "category": "tools" | "games" | "mental-math" | "puzzles",
  "emoji": "⚡",
  "summary": "1-2 sentence description for the home page card",
  "tags": ["Tag1", "Tag2", "Tag3"]
}
</meta>

<file path="<slug>/index.html">
<!DOCTYPE html>
<html lang="en">
<!-- Complete, working, single-file HTML/JS/CSS -->
</html>
</file>`;

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

Generate the complete single-page web app inside <meta> and <file> delimiter tags as specified.`
            }
          ]
        }
      ],
      systemInstruction: {
        parts: [{ text: systemInstruction }]
      },
      generationConfig: {
        maxOutputTokens: 8192,
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

    const appData = parseModelOutput(rawTextResponse);

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
