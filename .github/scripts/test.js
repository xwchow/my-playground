#!/usr/bin/env node

/**
 * Test Suite for Gemini IssueOps Builder
 * 
 * Verifies payload parsing, context loading, mock code generation,
 * card injection into index.html, and README updates without leaving artifacts.
 */

import assert from 'assert';
import { promises as fs } from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '../../');

async function runTests() {
  console.log('🧪 Starting IssueOps Test Suite...\n');

  // Test 1: Design System & Context Files exist and are non-empty
  console.log('Test 1: Verifying repo context files...');
  const agentsMd = await fs.readFile(path.join(ROOT_DIR, 'AGENTS.md'), 'utf-8');
  assert(agentsMd.includes('Editorial Paper Design System'), 'AGENTS.md must reference design system');
  const designSystemMd = await fs.readFile(path.join(ROOT_DIR, 'docs/design-system/DESIGN_SYSTEM.md'), 'utf-8');
  assert(designSystemMd.includes('shadow-editorial'), 'DESIGN_SYSTEM.md must define shadow-editorial');
  const indexHtml = await fs.readFile(path.join(ROOT_DIR, 'index.html'), 'utf-8');
  assert(indexHtml.includes('id="projects-grid"'), 'index.html must have #projects-grid container');
  console.log('  ✅ Repo context files present and valid.');

  // Test 2: Verify Workflow YAML syntax and permissions
  console.log('\nTest 2: Verifying .github/workflows/gemini-issueops.yml...');
  const workflowYaml = await fs.readFile(path.join(ROOT_DIR, '.github/workflows/gemini-issueops.yml'), 'utf-8');
  assert(workflowYaml.includes('pull-requests: write'), 'Workflow must have pull-requests write permission');
  assert(workflowYaml.includes('issues: write'), 'Workflow must have issues write permission');
  assert(workflowYaml.includes('gemini-3.7-flash'), 'Workflow should default to gemini-3.7-flash');
  console.log('  ✅ Workflow configuration verified.');

  // Test 3: Run Gemini Builder in mock mode and verify output
  console.log('\nTest 3: Testing Gemini Builder execution in mock mode...');
  
  // Backup index.html and README.md
  const indexBackup = await fs.readFile(path.join(ROOT_DIR, 'index.html'), 'utf-8');
  const readmeBackup = await fs.readFile(path.join(ROOT_DIR, 'README.md'), 'utf-8');

  try {
    const output = execSync('node .github/scripts/gemini-builder.mjs --prompt "build: Reaction Time Tester" --mock', {
      cwd: ROOT_DIR,
      encoding: 'utf-8',
    });
    assert(output.includes('Generated mini-app: "Reaction Time Tester"'), 'Output should confirm app generation');

    // Verify generated file exists
    const generatedHtmlPath = path.join(ROOT_DIR, 'reaction-timer/index.html');
    const generatedHtml = await fs.readFile(generatedHtmlPath, 'utf-8');
    assert(generatedHtml.includes('<!DOCTYPE html>'), 'Generated app must be valid HTML');
    assert(generatedHtml.includes('card-editorial'), 'Generated app must include design system card classes');
    assert(generatedHtml.includes('btn-editorial'), 'Generated app must include design system button classes');
    console.log('  ✅ Mini-app HTML file generated with design system styling.');

    // Verify index.html was updated
    const updatedIndex = await fs.readFile(path.join(ROOT_DIR, 'index.html'), 'utf-8');
    assert(updatedIndex.includes('href="./reaction-timer/"'), 'index.html must include link to new project');
    assert(updatedIndex.includes('Reaction Time Tester'), 'index.html must include project title');
    console.log('  ✅ index.html project grid updated.');

    // Verify README.md was updated
    const updatedReadme = await fs.readFile(path.join(ROOT_DIR, 'README.md'), 'utf-8');
    assert(updatedReadme.includes('### [Reaction Time Tester](./reaction-timer/)'), 'README.md must include new project entry');
    console.log('  ✅ README.md live projects updated.');

  } finally {
    // Cleanup generated mock files and restore backups
    await fs.rm(path.join(ROOT_DIR, 'reaction-timer'), { recursive: true, force: true });
    await fs.writeFile(path.join(ROOT_DIR, 'index.html'), indexBackup, 'utf-8');
    await fs.writeFile(path.join(ROOT_DIR, 'README.md'), readmeBackup, 'utf-8');
    console.log('  🧹 Cleaned up test artifacts and restored original state.');
  }

  console.log('\n🎉 ALL ISSUE-OPS TESTS PASSED!\n');
}

runTests().catch(err => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
