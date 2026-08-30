/**
 * Vercel Serverless Handler: POST /api/commit
 * 
 * Atomically commits a new mini-app to the GitHub repository using the Git Database API.
 */

async function githubApi(endpoint, token, method = 'GET', body = null) {
  const res = await fetch(`https://api.github.com/${endpoint}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github.v3+json',
      'Content-Type': 'application/json',
      'User-Agent': 'Vercel-Playground-Builder',
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`GitHub API ${method} /${endpoint} failed (${res.status}): ${errorText}`);
  }
  return res.json();
}

/**
 * Generate Editorial Paper card snippet for index.html
 */
export function generateProjectCardHtml({ slug, title, category, emoji, summary, tags }) {
  return `
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
}

/**
 * Inject card into index.html
 */
export function injectCardIntoIndexHtml(indexHtml, appData) {
  if (indexHtml.includes(`href="./${appData.slug}/"`)) {
    return indexHtml; // Already present
  }
  const cardHtml = generateProjectCardHtml(appData);

  let updated = indexHtml;
  if (updated.includes('<!-- Empty Search State -->')) {
    updated = updated.replace(
      /\n\s*<\/div>\s*\n\s*<!-- Empty Search State -->/,
      `\n${cardHtml}    </div>\n\n    <!-- Empty Search State -->`
    );
  } else {
    updated = updated.replace('</div>\n\n  </main>', `\n${cardHtml}    </div>\n  </main>`);
  }

  // Update counter badge if present e.g. "All (2)" -> "All (3)"
  updated = updated.replace(/All \((\d+)\)/g, (_, count) => `All (${parseInt(count, 10) + 1})`);
  return updated;
}

/**
 * Append entry to README.md
 */
export function injectEntryIntoReadme(readme, appData) {
  if (readme.includes(`[${appData.title}](./${appData.slug}/)`)) {
    return readme;
  }
  const liveEntry = `\n### [${appData.title}](./${appData.slug}/)\n${appData.summary}\n- **Tags**: ${appData.tags.join(', ')}\n- **Zero Dependencies**: Single-file HTML, Tailwind CSS, Lucide icons.\n`;
  if (readme.includes('## 🛠️ How to Add a New Project')) {
    return readme.replace('## 🛠️ How to Add a New Project', `${liveEntry}\n---\n\n## 🛠️ How to Add a New Project`);
  }
  return readme + liveEntry;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Content-Type, x-studio-secret, Authorization'
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

  const { appData } = req.body || {};
  if (!appData || !appData.slug || !appData.files || !appData.files.length) {
    return res.status(400).json({ error: 'Missing valid appData with slug and files.' });
  }

  const token = process.env.GITHUB_TOKEN;
  const repo = process.env.GITHUB_REPO || 'xwchow/my-playground';

  if (!token) {
    return res.status(500).json({
      error: 'GITHUB_TOKEN is not configured in Vercel Environment Variables.'
    });
  }

  try {
    // 1. Get latest commit on main branch
    const refData = await githubApi(`repos/${repo}/git/ref/heads/main`, token);
    const latestCommitSha = refData.object.sha;
    const commitData = await githubApi(`repos/${repo}/git/commits/${latestCommitSha}`, token);
    const baseTreeSha = commitData.tree.sha;

    // 2. Fetch current index.html and README.md from GitHub
    const [indexRes, readmeRes] = await Promise.all([
      fetch(`https://raw.githubusercontent.com/${repo}/main/index.html`, {
        headers: { Authorization: `Bearer ${token}` }
      }),
      fetch(`https://raw.githubusercontent.com/${repo}/main/README.md`, {
        headers: { Authorization: `Bearer ${token}` }
      })
    ]);

    const currentIndexHtml = indexRes.ok ? await indexRes.text() : '';
    const currentReadme = readmeRes.ok ? await readmeRes.text() : '';

    const updatedIndexHtml = injectCardIntoIndexHtml(currentIndexHtml, appData);
    const updatedReadme = injectEntryIntoReadme(currentReadme, appData);

    // 3. Prepare Git Tree Items
    const treeItems = [];

    // Add generated app files
    for (const file of appData.files) {
      treeItems.push({
        path: file.path,
        mode: '100644',
        type: 'blob',
        content: file.content
      });
    }

    // Add index.html & README.md updates
    if (updatedIndexHtml && updatedIndexHtml !== currentIndexHtml) {
      treeItems.push({
        path: 'index.html',
        mode: '100644',
        type: 'blob',
        content: updatedIndexHtml
      });
    }

    if (updatedReadme && updatedReadme !== currentReadme) {
      treeItems.push({
        path: 'README.md',
        mode: '100644',
        type: 'blob',
        content: updatedReadme
      });
    }

    // 4. Create new Tree
    const newTree = await githubApi(`repos/${repo}/git/trees`, token, 'POST', {
      base_tree: baseTreeSha,
      tree: treeItems
    });

    // 5. Create new Commit
    const commitMessage = `feat(${appData.slug}): add ${appData.title}\n\nGenerated via Vercel Mobile Builder Studio.`;
    const newCommit = await githubApi(`repos/${repo}/git/commits`, token, 'POST', {
      message: commitMessage,
      tree: newTree.sha,
      parents: [latestCommitSha]
    });

    // 6. Update main branch reference to point to new commit
    await githubApi(`repos/${repo}/git/refs/heads/main`, token, 'PATCH', {
      sha: newCommit.sha,
      force: false
    });

    const commitUrl = `https://github.com/${repo}/commit/${newCommit.sha}`;
    const appUrl = `/${appData.slug}/`;

    return res.status(200).json({
      success: true,
      commitSha: newCommit.sha,
      commitUrl,
      appUrl
    });
  } catch (err) {
    console.error('Error committing to GitHub:', err);
    return res.status(500).json({ error: err.message || 'Failed to commit to GitHub' });
  }
}
