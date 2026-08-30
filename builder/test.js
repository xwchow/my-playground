#!/usr/bin/env node

/**
 * Verification Test Suite for Vercel Builder Studio
 * 
 * Tests design tokens, card injection logic, and API route syntax.
 */

import assert from 'assert';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { generateProjectCardHtml, injectCardIntoIndexHtml, injectEntryIntoReadme, validateAppDataSecurity } from '../api/commit.js';
import { parseModelOutput } from '../api/generate.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '../');

async function runTests() {
  console.log('🧪 Running Vercel Builder Studio Verification Suite...\n');

  // Test 1: Verify builder/index.html design system compliance & secure sandbox
  console.log('Test 1: Verifying builder/index.html design system tokens & secure sandbox...');
  const builderHtml = await fs.readFile(path.join(ROOT_DIR, 'builder/index.html'), 'utf-8');
  assert(builderHtml.includes('card-editorial'), 'Builder UI must use card-editorial');
  assert(builderHtml.includes('btn-editorial'), 'Builder UI must use btn-editorial');
  assert(builderHtml.includes('shadow-editorial'), 'Builder UI must use shadow-editorial');
  assert(builderHtml.includes('JetBrains Mono'), 'Builder UI must include JetBrains Mono font');
  assert(builderHtml.includes('Plus Jakarta Sans'), 'Builder UI must include Plus Jakarta Sans font');
  assert(!builderHtml.includes('allow-same-origin'), 'Iframe sandbox MUST NOT have allow-same-origin');
  assert(builderHtml.includes('sandbox="allow-scripts allow-modals allow-forms"'), 'Iframe sandbox must allow scripts, modals, and forms');
  console.log('  ✅ builder/index.html design system & sandbox isolation verified.');

  // Test 2: Verify parseModelOutput with XML delimiter tags
  console.log('\nTest 2: Verifying parseModelOutput with raw unescaped code...');
  const sampleModelOutput = `
Here is your mini-app!

<meta>
{
  "slug": "reaction-timer",
  "title": "Reaction Time Tester",
  "category": "games",
  "emoji": "⚡",
  "summary": "Test your visual reflex speed in milliseconds with sound alerts.",
  "tags": ["Reaction", "Speed Test", "Sound FX"]
}
</meta>

<file path="reaction-timer/index.html">
<!DOCTYPE html>
<html lang="en">
<head>
  <title>Reaction Time</title>
</head>
<body>
  <h1>Test "Double Quotes" and 'Single Quotes' & template \${literals}</h1>
  <script>
    const regex = /[a-z]+/gi;
    const msg = "Don't break JSON parsing!";
  </script>
</body>
</html>
</file>
`;
  const parsed = parseModelOutput(sampleModelOutput);
  assert.strictEqual(parsed.slug, 'reaction-timer');
  assert.strictEqual(parsed.title, 'Reaction Time Tester');
  assert.strictEqual(parsed.category, 'games');
  assert.strictEqual(parsed.files.length, 1);
  assert(parsed.files[0].content.includes('<h1>Test "Double Quotes"'), 'HTML content must be unescaped');
  assert(parsed.files[0].content.includes('const msg = "Don\'t break JSON parsing!"'), 'JS code must be intact');

  // Test 2b: Verify parseModelOutput with headless raw scripts (from screenshot)
  const rawScriptOutput = `
<meta>
{
  "slug": "pomodoro-focus",
  "title": "Pomodoro Focus",
  "category": "tools",
  "emoji": "⏱️",
  "summary": "Focus timer.",
  "tags": ["Timer"]
}
</meta>

<!-- Tailwind CSS CDN -->
<script src="https://cdn.tailwindcss.com"></script>
<!-- Google Fonts: Plus Jakarta Sans & JetBrains Mono -->
<link rel="preconnect" href="https://fonts.googleapis.com">
<script>
  tailwind.config = { theme: { extend: {} } };
</script>
<div class="p-6">
  <h1>Focus Timer</h1>
</div>
`;
  const parsedHeadless = parseModelOutput(rawScriptOutput);
  assert.strictEqual(parsedHeadless.slug, 'pomodoro-focus');
  assert.strictEqual(parsedHeadless.files.length, 1);
  assert(parsedHeadless.files[0].content.includes('<!DOCTYPE html>'), 'Must wrap in valid HTML document');
  assert(parsedHeadless.files[0].content.includes('tailwind.config'), 'Must retain scripts');
  console.log('  ✅ parseModelOutput successfully handled headless script payloads.');

  // Test 3: Verify project card generator
  console.log('\nTest 3: Verifying generateProjectCardHtml helper...');
  const mockApp = {
    slug: 'focus-clock',
    title: 'Focus Clock',
    category: 'tools',
    emoji: '⏱️',
    summary: 'A clean 25-minute Pomodoro timer with ambient sounds.',
    tags: ['Timer', 'Productivity', 'Audio']
  };
  const cardSnippet = generateProjectCardHtml(mockApp);
  assert(cardSnippet.includes('href="./focus-clock/"'), 'Card must link to ./focus-clock/');
  assert(cardSnippet.includes('Focus Clock'), 'Card must contain app title');
  assert(cardSnippet.includes('⏱️'), 'Card must contain emoji');
  assert(cardSnippet.includes('Productivity'), 'Card must render feature badges');
  console.log('  ✅ Project card snippet generated correctly.');

  // Test 4: Verify index.html injection
  console.log('\nTest 4: Testing card injection into root index.html...');
  const sampleIndexHtml = `
    <button data-filter="all" class="btn-editorial">All (2)</button>
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto" id="projects-grid">
      <!-- EXISTING CARD -->
    </div>

    <!-- Empty Search State -->
    <div id="empty-state"></div>
  `;
  const injectedIndex = injectCardIntoIndexHtml(sampleIndexHtml, mockApp);
  assert(injectedIndex.includes('href="./focus-clock/"'), 'Injected index must contain new card');
  assert(injectedIndex.includes('All (3)'), 'Injected index must increment All counter');
  assert(injectedIndex.includes('<!-- Empty Search State -->'), 'Injected index must preserve structure');
  console.log('  ✅ Card injection into index.html verified.');

  // Test 5: Verify README.md injection
  console.log('\nTest 5: Testing README.md project entry injection...');
  const sampleReadme = `# Playground\n\n## 🚀 Live Projects\n\n### 1. Existing App\n\n---\n\n## 🛠️ How to Add a New Project\n`;
  const injectedReadme = injectEntryIntoReadme(sampleReadme, mockApp);
  assert(injectedReadme.includes('### [Focus Clock](./focus-clock/)'), 'README must contain new project heading');
  assert(injectedReadme.includes('## 🛠️ How to Add a New Project'), 'README must retain structure');
  console.log('  ✅ README injection verified.');

  // Test 6: Verify validateAppDataSecurity prevents path traversal
  console.log('\nTest 6: Testing validateAppDataSecurity path traversal prevention...');
  assert.throws(() => {
    validateAppDataSecurity({
      slug: 'bad-app',
      files: [{ path: '../../etc/passwd', content: 'hack' }]
    });
  }, /Illegal path traversal/, 'Must reject .. in file path');

  assert.throws(() => {
    validateAppDataSecurity({
      slug: 'bad-app',
      files: [{ path: 'other-app/index.html', content: 'hack' }]
    });
  }, /must start with "bad-app\/"/, 'Must reject files outside app slug');

  assert.throws(() => {
    validateAppDataSecurity({
      slug: 'bad-app',
      files: [{ path: 'bad-app/malicious.exe', content: 'hack' }]
    });
  }, /unauthorized file extension/, 'Must reject non-web file extensions');

  assert(validateAppDataSecurity({
    slug: 'good-app',
    files: [{ path: 'good-app/index.html', content: '<h1>Safe</h1>' }]
  }), 'Must accept valid file paths');
  console.log('  ✅ Path traversal & extension validation verified.');

  // Test 7: Verify API route files exist, parse, and enforce STUDIO_SECRET
  console.log('\nTest 7: Verifying api/generate.js and api/commit.js...');
  const generateJs = await fs.readFile(path.join(ROOT_DIR, 'api/generate.js'), 'utf-8');
  const commitJs = await fs.readFile(path.join(ROOT_DIR, 'api/commit.js'), 'utf-8');
  assert(generateJs.includes('export default async function handler'), 'api/generate.js must export handler');
  assert(commitJs.includes('export default async function handler'), 'api/commit.js must export handler');
  assert(generateJs.includes('STUDIO_SECRET'), 'api/generate.js must check STUDIO_SECRET');
  assert(commitJs.includes('STUDIO_SECRET'), 'api/commit.js must check STUDIO_SECRET');
  assert(builderHtml.includes('id="passcode-modal"'), 'builder/index.html must include passcode modal');
  console.log('  ✅ API routes and passcode authorization verified.');

  console.log('\n🎉 ALL BUILDER STUDIO TESTS PASSED!\n');
}

runTests().catch(err => {
  console.error('❌ Builder test failed:', err);
  process.exit(1);
});
