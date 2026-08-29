#!/usr/bin/env node

/**
 * Gemini IssueOps Builder for my-playground
 * 
 * Automatically generates, refines, and commits self-contained mini-apps
 * adhering to the Editorial Paper Design System via GitHub Issues / PRs.
 */

import { promises as fs } from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '../../');

// Configuration
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = process.env.WORKFLOW_INPUT_MODEL || process.env.GEMINI_MODEL || 'gemini-3.7-flash';
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const GITHUB_REPOSITORY = process.env.GITHUB_REPOSITORY; // e.g. "owner/my-playground"
const GITHUB_EVENT_PATH = process.env.GITHUB_EVENT_PATH;

/**
 * Run shell command synchronously
 */
function run(cmd, options = {}) {
  return execSync(cmd, { cwd: ROOT_DIR, encoding: 'utf-8', stdio: 'pipe', ...options });
}

/**
 * Safe JSON fetch
 */
async function fetchJson(url, options = {}) {
  const res = await fetch(url, options);
  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`HTTP ${res.status} ${res.statusText}: ${errorText}`);
  }
  return res.json();
}

/**
 * Post comment to a GitHub Issue or PR
 */
async function postGitHubComment(issueNumber, body) {
  if (!GITHUB_TOKEN || !GITHUB_REPOSITORY || !issueNumber) {
    console.log(`[Dry-Run Comment on #${issueNumber}]:\n${body}`);
    return;
  }
  const url = `https://api.github.com/repos/${GITHUB_REPOSITORY}/issues/${issueNumber}/comments`;
  try {
    await fetchJson(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${GITHUB_TOKEN}`,
        Accept: 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ body }),
    });
  } catch (err) {
    console.error('Failed to post GitHub comment:', err.message);
  }
}

/**
 * Create a Pull Request via GitHub API
 */
async function createPullRequest(headBranch, baseBranch, title, body, issueNumber) {
  if (!GITHUB_TOKEN || !GITHUB_REPOSITORY) {
    console.log(`[Dry-Run PR]: ${title} -> base: ${baseBranch}`);
    return null;
  }
  const url = `https://api.github.com/repos/${GITHUB_REPOSITORY}/pulls`;
  try {
    const pr = await fetchJson(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${GITHUB_TOKEN}`,
        Accept: 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title,
        body,
        head: headBranch,
        base: baseBranch,
      }),
    });
    return pr;
  } catch (err) {
    console.error('Failed to create PR via API (might already exist):', err.message);
    return null;
  }
}

/**
 * Main IssueOps Orchestrator
 */
async function main() {
  console.log(`🚀 Starting Gemini IssueOps Builder using model: ${GEMINI_MODEL}`);

  let prompt = '';
  let issueNumber = null;
  let authorLogin = 'Developer';
  let isFollowUp = false;
  let targetBranch = null;

  // 1. Parse Event Context & Check Trigger Conditions
  if (process.env.WORKFLOW_INPUT_PROMPT) {
    prompt = process.env.WORKFLOW_INPUT_PROMPT;
    console.log('Using workflow_dispatch input prompt.');
  } else if (GITHUB_EVENT_PATH) {
    try {
      const eventData = JSON.parse(await fs.readFile(GITHUB_EVENT_PATH, 'utf-8'));

      // Ignore bot comments to prevent recursive loops
      const senderLogin = eventData.comment?.user?.login || eventData.sender?.login || '';
      if (senderLogin.endsWith('[bot]') || eventData.comment?.user?.type === 'Bot') {
        console.log(`🤖 Skipping event: originated from bot @${senderLogin}`);
        process.exit(0);
      }

      if (eventData.issue) {
        issueNumber = eventData.issue.number;
        authorLogin = eventData.issue.user?.login || 'User';

        if (eventData.comment) {
          // Comment on issue or PR
          const commentBody = eventData.comment.body || '';
          const isTrigger = /@gemini\b/i.test(commentBody) || /^\/(build|fix|retry)\b/i.test(commentBody.trim());

          if (!isTrigger) {
            console.log('ℹ️ Skipping comment: does not mention @gemini or /build command.');
            process.exit(0);
          }

          prompt = commentBody;
          isFollowUp = true;
          console.log(`Received comment on #${issueNumber} by @${eventData.comment.user?.login}`);
        } else {
          // New issue
          const title = eventData.issue.title || '';
          const body = eventData.issue.body || '';
          const labels = (eventData.issue.labels || []).map(l => l.name?.toLowerCase());

          const isTrigger = 
            /^build:\s*/i.test(title) ||
            /^feat:\s*/i.test(title) ||
            /@gemini\b/i.test(body) ||
            labels.includes('build');

          if (!isTrigger) {
            console.log('ℹ️ Skipping issue: does not match "build:", "feat:", label "build", or "@gemini".');
            process.exit(0);
          }

          prompt = `${title}\n\n${body}`;
          console.log(`Received issue #${issueNumber}: ${title}`);
        }
      }
    } catch (err) {
      console.warn('Could not parse GITHUB_EVENT_PATH:', err.message);
    }
  }

  // CLI fallback for local testing
  const args = process.argv.slice(2);
  const promptArgIdx = args.indexOf('--prompt');
  if (promptArgIdx !== -1 && args[promptArgIdx + 1]) {
    prompt = args[promptArgIdx + 1];
  }
  const isMock = args.includes('--mock') || process.env.MOCK_GEMINI === 'true';

  if (!prompt.trim()) {
    console.log('ℹ️ No active prompt found. Exiting gracefully.');
    process.exit(0);
  }

  // Clean prompt triggers (remove @gemini, /build, /fix, /retry, build:, etc.)
  const cleanPrompt = prompt
    .replace(/^build:\s*/i, '')
    .replace(/^feat:\s*/i, '')
    .replace(/@gemini\b/gi, '')
    .replace(/^\/(build|fix|retry)\b/gi, '')
    .trim();

  console.log(`\n📋 Cleaned Build Prompt:\n"${cleanPrompt}"\n`);

  if (!GEMINI_API_KEY && !isMock) {
    const errorMsg = '❌ `GEMINI_API_KEY` is not set! Please add it to your GitHub Repository Secrets.';
    console.error(errorMsg);
    if (issueNumber) {
      await postGitHubComment(
        issueNumber,
        `⚠️ **Gemini Builder Error**: Missing \`GEMINI_API_KEY\` secret in GitHub repository settings.\n\nPlease add your Gemini API key under **Settings > Secrets and variables > Actions > New repository secret**.`
      );
    }
    process.exit(1);
  }

  // 2. Read Repository Context & Design System Rules
  let agentsDoc = '';
  let designSystemDoc = '';
  let indexHtmlSample = '';

  try {
    agentsDoc = await fs.readFile(path.join(ROOT_DIR, 'AGENTS.md'), 'utf-8');
  } catch {}
  try {
    designSystemDoc = await fs.readFile(path.join(ROOT_DIR, 'docs/design-system/DESIGN_SYSTEM.md'), 'utf-8');
  } catch {}
  try {
    indexHtmlSample = await fs.readFile(path.join(ROOT_DIR, 'index.html'), 'utf-8');
  } catch {}

  // 3. Construct Gemini Prompt with JSON Schema Enforcement
  const systemInstruction = `You are an expert full-stack web developer building standalone, single-page web applications for the "my-playground" static playground repository.

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
4. Mobile & Touch Optimized: Large touch targets, responsive layouts, vibration (navigator.vibrate) if appropriate, sound FX via Web Audio API if helpful.
5. Self-Contained: The app must live in a dedicated folder (e.g. <slug>/index.html).

Output must be valid JSON matching this schema:
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
  "summaryMessage": "Markdown release notes describing controls, features, and instructions."
}`;

  const geminiPayload = {
    contents: [
      {
        role: 'user',
        parts: [
          {
            text: `USER REQUEST:
${cleanPrompt}

REPOSITORY CONTEXT:
${agentsDoc}

DESIGN SYSTEM TOKENS & RULES:
${designSystemDoc}

Generate the complete, beautiful, fully functional single-page web app complying with the above.`
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

  console.log('🤖 Generating app content...');
  let rawTextResponse = '';

  if (isMock) {
    console.log('⚡ Mock mode active: Returning simulated mini-app JSON.');
    rawTextResponse = JSON.stringify({
      slug: 'reaction-timer',
      title: 'Reaction Time Tester',
      category: 'games',
      emoji: '⚡',
      summary: 'Test your visual reaction speed in milliseconds with high-score tracking and audio feedback.',
      tags: ['Reaction Speed', 'High Scores', 'Sound FX'],
      files: [
        {
          path: 'reaction-timer/index.html',
          content: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reaction Time Tester | Playground</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@500;700;800&family=Plus+Jakarta+Sans:wght@500;600;700;800&display=swap" rel="stylesheet">
  <script src="https://cdn.tailwindcss.com"></script>
  <script src="https://unpkg.com/lucide@latest"></script>
  <style>
    body { background-color: #f7f6f2; color: #18181b; font-family: 'Plus Jakarta Sans', sans-serif; }
    .card-editorial { background: #fff; border: 1.5px solid #27272a; box-shadow: 2px 2px 0px 0px #27272a; }
    .btn-editorial { background: #fff; border: 1.5px solid #27272a; box-shadow: 1.5px 1.5px 0px 0px #27272a; transition: all 0.1s ease; }
    .btn-editorial:hover { background: #f0eee6; transform: translate(-0.5px, -0.5px); }
    .btn-editorial:active { transform: translate(1.5px, 1.5px); box-shadow: 0px 0px 0px 0px #27272a; }
  </style>
</head>
<body class="min-h-screen flex flex-col justify-between p-4 sm:p-8">
  <header class="max-w-xl mx-auto w-full flex items-center justify-between mb-8">
    <a href="../" class="btn-editorial px-3 py-1.5 rounded-xl text-xs font-extrabold flex items-center gap-1.5 text-zinc-700">
      <i data-lucide="arrow-left" class="w-4 h-4"></i> Playground
    </a>
    <span class="text-xs font-extrabold uppercase font-mono tracking-wider text-zinc-500">Games</span>
  </header>
  <main class="max-w-xl mx-auto w-full text-center space-y-6">
    <h1 class="text-3xl font-extrabold text-zinc-900">Reaction Time Tester</h1>
    <div id="target-box" class="card-editorial rounded-2xl p-12 cursor-pointer select-none bg-cobalt-50 text-center transition">
      <p class="font-extrabold text-lg text-zinc-800" id="prompt-text">Tap anywhere in this box to start</p>
      <p class="font-mono text-4xl font-extrabold text-cobalt-700 mt-4 hidden" id="time-display">0 ms</p>
    </div>
  </main>
  <footer class="text-center text-xs text-zinc-500 font-mono mt-8">
    Built with Editorial Paper Design System
  </footer>
  <script>
    lucide.createIcons();
  </script>
</body>
</html>`
        }
      ],
      summaryMessage: `### ⚡ Reaction Time Tester\n\n- Created \`/reaction-timer/index.html\`\n- Adheres to the Editorial Paper Design System\n- Features high-score tracking and Web Audio API alerts.`
    });
  } else {
    try {
      const geminiEndpoint = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;
      const geminiRes = await fetchJson(geminiEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(geminiPayload),
      });

      rawTextResponse = geminiRes.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!rawTextResponse) {
        throw new Error('Empty response from Gemini API: ' + JSON.stringify(geminiRes));
      }
    } catch (err) {
      const errorMsg = `❌ Gemini API call failed: ${err.message}`;
      console.error(errorMsg);
      if (issueNumber) {
        await postGitHubComment(issueNumber, `⚠️ **Gemini Generation Failed**:\n\`\`\`\n${err.message}\n\`\`\``);
      }
      process.exit(1);
    }
  }

  // 4. Parse Generated JSON
  let generatedData;
  try {
    generatedData = JSON.parse(rawTextResponse);
  } catch (err) {
    console.error('Failed to parse Gemini response as JSON:', rawTextResponse);
    process.exit(1);
  }

  const { slug, title, category, emoji, summary, tags, files, summaryMessage } = generatedData;
  console.log(`✨ Generated mini-app: "${title}" (slug: ${slug}) with ${files?.length || 0} file(s).`);

  // 5. Write Files to Disk
  for (const file of files) {
    const filePath = path.join(ROOT_DIR, file.path);
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.writeFile(filePath, file.content, 'utf-8');
    console.log(`   📝 Wrote ${file.path} (${file.content.length} bytes)`);
  }

  // 6. Update root index.html to add project card
  try {
    const indexPath = path.join(ROOT_DIR, 'index.html');
    let indexHtml = await fs.readFile(indexPath, 'utf-8');

    // Only inject if not already present
    if (!indexHtml.includes(`href="./${slug}/"`)) {
      const cardHtml = `
      <!-- CARD: ${title.toUpperCase()} -->
      <a href="./${slug}/" class="card-editorial group relative rounded-2xl p-6 sm:p-7 flex flex-col justify-between" data-category="${category}" data-title="${title} ${tags.join(' ')}">
        <div class="space-y-4">
          <!-- Top Row: Icon & Status -->
          <div class="flex items-center justify-between">
            <div class="w-14 h-14 rounded-2xl bg-cobalt-50 border-[1.5px] border-paper-800 flex items-center justify-center text-3xl shadow-editorial-sm group-hover:scale-105 transition duration-200">
              ${emoji}
            </div>
            <span class="px-3 py-1 rounded-full bg-cobalt-100 text-cobalt-900 border-[1.5px] border-paper-800 text-xs font-extrabold flex items-center gap-1.5 shadow-editorial-sm">
              <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Playable
            </span>
          </div>

          <!-- Title & Description -->
          <div>
            <h3 class="text-xl font-extrabold text-paper-900 group-hover:text-cobalt-700 transition flex items-center gap-1.5 mb-2">
              ${title}
              <i data-lucide="arrow-up-right" class="w-4 h-4 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition"></i>
            </h3>
            <p class="text-xs sm:text-sm text-zinc-600 leading-relaxed font-normal">
              ${summary}
            </p>
          </div>
        </div>

        <!-- Card Footer: Feature Badges & Launch CTA -->
        <div class="pt-5 mt-4 border-t-[1.5px] border-paper-200 flex items-center justify-between gap-2">
          <div class="flex items-center gap-1.5 flex-wrap">
            ${tags.map(t => `<span class="px-2.5 py-0.5 rounded-md bg-paper-200 border border-paper-800 text-paper-900 text-[11px] font-bold">${t}</span>`).join('\n            ')}
          </div>
          <span class="font-extrabold text-xs text-cobalt-700 group-hover:translate-x-0.5 transition flex items-center gap-1 shrink-0">
            Launch &rarr;
          </span>
        </div>
      </a>
`;
      // Inject before closing </div> of projects-grid (preceding Empty Search State)
      if (indexHtml.includes('<!-- Empty Search State -->')) {
        indexHtml = indexHtml.replace(
          /\n\s*<\/div>\s*\n\s*<!-- Empty Search State -->/,
          `\n${cardHtml}    </div>\n\n    <!-- Empty Search State -->`
        );
      } else {
        // Fallback: inject at end of projects-grid container
        indexHtml = indexHtml.replace('</div>\n\n  </main>', `\n${cardHtml}    </div>\n  </main>`);
      }

      // Update total count badge if present e.g. "All (2)" -> "All (3)"
      indexHtml = indexHtml.replace(/All \((\d+)\)/g, (match, count) => `All (${parseInt(count, 10) + 1})`);

      await fs.writeFile(indexPath, indexHtml, 'utf-8');
      console.log(`   🗂️ Updated index.html with new project card.`);
    }
  } catch (err) {
    console.warn('Could not update index.html:', err.message);
  }

  // 7. Update README.md
  try {
    const readmePath = path.join(ROOT_DIR, 'README.md');
    let readme = await fs.readFile(readmePath, 'utf-8');
    if (!readme.includes(`[${title}](./${slug}/)`)) {
      const liveProjectEntry = `\n### [${title}](./${slug}/)\n${summary}\n- **Tags**: ${tags.join(', ')}\n- **Zero Dependencies**: Pure HTML, Tailwind CSS, Lucide icons.\n`;
      readme = readme.replace('## 🛠️ How to Add a New Project', `${liveProjectEntry}\n---\n\n## 🛠️ How to Add a New Project`);
      await fs.writeFile(readmePath, readme, 'utf-8');
      console.log(`   📖 Updated README.md with project overview.`);
    }
  } catch (err) {
    console.warn('Could not update README.md:', err.message);
  }

  // 8. Git Operations & Pull Request Creation
  if (process.env.GITHUB_ACTIONS) {
    try {
      run('git config user.name "github-actions[bot]"');
      run('git config user.email "github-actions[bot]@users.noreply.github.com"');

      const branchName = `feat/${slug}${issueNumber ? `-issue-${issueNumber}` : ''}`;
      console.log(`🌿 Creating/Switching to branch: ${branchName}`);
      run(`git checkout -B ${branchName}`);
      run('git add .');
      run(`git commit -m "feat(${slug}): ${title} ${issueNumber ? `(closes #${issueNumber})` : ''}"`);
      run(`git push -u origin ${branchName} --force`);

      const repoOwner = GITHUB_REPOSITORY?.split('/')[0] || '';
      const repoName = GITHUB_REPOSITORY?.split('/')[1] || '';
      const previewUrl = `https://${repoOwner}.github.io/${repoName}/${slug}/`;

      const prBody = `## 🤖 Gemini IssueOps Generator (${GEMINI_MODEL})\n\n${issueNumber ? `Closes #${issueNumber}\n\n` : ''}${summaryMessage}\n\n---\n🌐 **Live App Preview**: [${title}](${previewUrl})\n\n*Built automatically via mobile IssueOps trigger.*`;

      const pr = await createPullRequest(branchName, 'main', `feat(${slug}): ${title}`, prBody, issueNumber);

      const commentBody = `### 🚀 Mini-App Generated: **${title}** (${emoji})

I've built the **${title}** app according to your specification and our Editorial Paper design system!

- 📁 **Files**: \`/${slug}/index.html\`
- 🌐 **Live Preview**: [Launch ${title}](${previewUrl})
${pr?.html_url ? `- 🔀 **Pull Request**: ${pr.html_url}` : ''}

${summaryMessage}

---
*Review the code in the PR above and tap **Merge** on your phone when ready!*`;

      if (issueNumber) {
        await postGitHubComment(issueNumber, commentBody);
      }
    } catch (err) {
      console.error('Git/PR operation failed:', err.message);
      if (issueNumber) {
        await postGitHubComment(issueNumber, `⚠️ **Git/PR Error**: ${err.message}`);
      }
    }
  }

  console.log('\n🎉 Gemini IssueOps Builder run completed successfully!');
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
