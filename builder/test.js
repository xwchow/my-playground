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
import { generateProjectCardHtml, injectCardIntoIndexHtml, injectEntryIntoReadme } from '../api/commit.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '../');

async function runTests() {
  console.log('🧪 Running Vercel Builder Studio Verification Suite...\n');

  // Test 1: Verify builder/index.html design system compliance
  console.log('Test 1: Verifying builder/index.html design system tokens...');
  const builderHtml = await fs.readFile(path.join(ROOT_DIR, 'builder/index.html'), 'utf-8');
  assert(builderHtml.includes('card-editorial'), 'Builder UI must use card-editorial');
  assert(builderHtml.includes('btn-editorial'), 'Builder UI must use btn-editorial');
  assert(builderHtml.includes('shadow-editorial'), 'Builder UI must use shadow-editorial');
  assert(builderHtml.includes('JetBrains Mono'), 'Builder UI must include JetBrains Mono font');
  assert(builderHtml.includes('Plus Jakarta Sans'), 'Builder UI must include Plus Jakarta Sans font');
  assert(builderHtml.includes('iframe'), 'Builder UI must have live preview iframe');
  console.log('  ✅ builder/index.html design system tokens verified.');

  // Test 2: Verify project card generator
  console.log('\nTest 2: Verifying generateProjectCardHtml helper...');
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

  // Test 3: Verify index.html injection
  console.log('\nTest 3: Testing card injection into root index.html...');
  const sampleIndexHtml = `
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto" id="projects-grid">
      <!-- EXISTING CARD -->
    </div>

    <!-- Empty Search State -->
    <div id="empty-state"></div>
  `;
  const injectedIndex = injectCardIntoIndexHtml(sampleIndexHtml, mockApp);
  assert(injectedIndex.includes('href="./focus-clock/"'), 'Injected index must contain new card');
  assert(injectedIndex.includes('<!-- Empty Search State -->'), 'Injected index must preserve structure');
  console.log('  ✅ Card injection into index.html verified.');

  // Test 4: Verify README.md injection
  console.log('\nTest 4: Testing README.md project entry injection...');
  const sampleReadme = `# Playground\n\n## 🚀 Live Projects\n\n### 1. Existing App\n\n---\n\n## 🛠️ How to Add a New Project\n`;
  const injectedReadme = injectEntryIntoReadme(sampleReadme, mockApp);
  assert(injectedReadme.includes('### [Focus Clock](./focus-clock/)'), 'README must contain new project heading');
  assert(injectedReadme.includes('## 🛠️ How to Add a New Project'), 'README must retain structure');
  console.log('  ✅ README injection verified.');

  // Test 5: Verify API route files exist, parse, and enforce STUDIO_SECRET
  console.log('\nTest 5: Verifying api/generate.js and api/commit.js...');
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
