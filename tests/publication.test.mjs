import test from 'node:test';
import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Check every public JSON field, including historical references and retired
// recognition questions, rather than checking only the rendered study answer.
const privateMarkers = new Set(JSON.parse(fs.readFileSync(
  new URL('../scripts/private-markers.json', import.meta.url))));
const forbidden = [
  /https?:\/\/(?:app\.)?notion\.(?:com|so)\//i,
  /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/,
  /\b(?:gh[pousr]_[A-Za-z0-9]{30,}|github_pat_[A-Za-z0-9_]{40,}|AKIA[A-Z0-9]{16})\b/,
];
const root = new URL('../public/', import.meta.url);
function files(dir) {
  return fs.readdirSync(dir, {withFileTypes: true}).flatMap(entry => {
    const name = path.join(dir, entry.name);
    return entry.isDirectory() ? files(name) : [name];
  });
}
test('publication assets exclude private project evidence and common secret formats', () => {
  for (const file of files(fileURLToPath(root))) {
    assert(!/\.(?:md|pdf|env|pem|key)$/i.test(file), `Unexpected source asset: ${file}`);
    if (!/\.(?:json|txt|svg|html|js|css)$/i.test(file)) continue;
    const content = fs.readFileSync(file, 'utf8');
    for (const token of content.match(/[A-Za-z][A-Za-z0-9_-]*/g) ?? []) {
      const digest = createHash('sha256').update(token.toLowerCase()).digest('hex');
      assert(!privateMarkers.has(digest), `Private identifier in ${path.basename(file)}`);
    }
    for (const pattern of forbidden) {
      assert(!pattern.test(content), `Publication review required for ${path.basename(file)} (${pattern})`);
    }
  }
});
test('public schemas and team context are explicitly fictional', () => {
  const library = JSON.parse(fs.readFileSync(new URL('data/library.json', root)));
  assert.equal(library.revision, 3);
  const source = id => library.sources.find(item => item.id === id);
  assert.match(source('y26-projects').body, /allocation team/);
  assert.match(source('y26-projects').body, /outbound team/);
  assert.match(source('y26-projects').body, /fictional/i);
  assert.match(source('y26-3.11').body, /CREATE TABLE customers/);
  assert.match(source('y26-3.11').body, /Alex Example/);
  assert.match(source('y26-4.25').body, /CREATE TABLE demo_outbox/);
  assert.match(source('y26-1.47').body, /class Product/);
});
