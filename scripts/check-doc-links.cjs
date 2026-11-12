const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

const root = path.resolve(__dirname, '..');
const tracked = execFileSync('git', ['-c', 'core.quotepath=false', 'ls-files', '--cached', '--others', '--exclude-standard', '-z'], { cwd: root, encoding: 'utf8' }).split('\0');
const files = [...new Set(tracked)].filter(file => file.endsWith('.md') && fs.existsSync(path.join(root, file)));
const issues = [];
let links = 0;
let images = 0;
const headings = new Map();
const missingReturns = [];
const formatIssues = [];
let tables = 0;

function prose(content) {
  return content.replace(/^(`{3,}|~{3,})[^\n]*\n[\s\S]*?^\1[^\n]*$/gm, block => block.replace(/[^\n]/g, ' ')).replace(/`[^`\n]+`/g, value => ' '.repeat(value.length));
}

function anchors(file) {
  if (headings.has(file)) return headings.get(file);
  const identifiers = new Set();
  const seen = new Map();
  const content = fs.readFileSync(file, 'utf8');
  for (const match of prose(content).matchAll(/^#{1,6}\s+(.+?)\s*#*$/gm)) {
    const slug = match[1].replace(/<[^>]*>/g, '').replace(/\[([^\]]*)\]\([^)]*\)/g, '$1').replace(/[\p{P}\p{S}]/gu, character => character === '-' || character === '_' ? character : '').toLowerCase().replace(/ /g, '-');
    const duplicate = seen.get(slug) || 0;
    identifiers.add(slug + (duplicate ? `-${duplicate}` : ''));
    seen.set(slug, duplicate + 1);
  }
  for (const match of content.matchAll(/\b(?:id|name)=["']([^"']+)["']/g)) identifiers.add(match[1]);
  headings.set(file, identifiers);
  return identifiers;
}

for (const file of files) {
  const content = prose(fs.readFileSync(path.join(root, file), 'utf8'));
  const lines = content.split('\n');
  const cells = line => line.replace(/\\\|/g, '').split('|').length - 2;
  for (let index = 1; index < lines.length; index += 1) {
    if (!/^\s*\|\s*:?-+:?\s*\|/.test(lines[index])) continue;
    tables += 1;
    const columns = cells(lines[index]);
    if (cells(lines[index - 1]) !== columns) formatIssues.push({ file, line: index, reason: 'table header' });
    for (let row = index + 1; row < lines.length && /^\s*\|/.test(lines[row]); row += 1) {
      if (cells(lines[row]) !== columns) formatIssues.push({ file, line: row + 1, reason: 'table columns' });
    }
  }
  if (file !== 'README.md' && ![...content.matchAll(/\]\(([^)\n]+)\)/g)].some(match => !/^[a-z][a-z0-9+.-]*:/i.test(match[1]) && path.resolve(path.dirname(path.join(root, file)), decodeURIComponent(match[1].split('#')[0])) === path.join(root, 'README.md'))) missingReturns.push(file);
  const references = [...content.matchAll(/(!?)\[[^\]\n]*\]\(\s*(<[^>\n]+>|[^)\n]+)\s*\)/g)].map(match => ({ image: Boolean(match[1]), target: match[2], index: match.index }));
  for (const match of content.matchAll(/^\s*\[[^\]\n]+\]:\s*(<[^>\n]+>|\S+)/gm)) references.push({ image: false, target: match[1], index: match.index });
  for (const match of content.matchAll(/\b(?:src|href)=["']([^"']+)["']/g)) references.push({ image: false, target: match[1], index: match.index });
  for (const reference of references) {
    let target = reference.target.trim().replace(/\s+["'][^"']*["']$/, '').replace(/^<|>$/g, '');
    if (/^(?:[a-z][a-z0-9+.-]*:|\/\/)/i.test(target)) continue;
    links += 1;
    if (reference.image) images += 1;
    const [rawPath, rawAnchor] = target.split('#');
    const destination = path.resolve(path.dirname(path.join(root, file)), decodeURIComponent(rawPath.split('?')[0]));
    const line = content.substring(0, reference.index).split('\n').length;
    if (!fs.existsSync(destination)) issues.push({ file, line, target, reason: 'missing' });
    else if (rawAnchor && destination.endsWith('.md') && !anchors(destination).has(decodeURIComponent(rawAnchor))) issues.push({ file, line, target, reason: 'anchor' });
  }
}

const result = { files: files.length, relativeLinks: links, images, tables, missingReturns, formatIssues, issues };
console.log(JSON.stringify(result, null, 2));
process.exitCode = issues.length || missingReturns.length || formatIssues.length ? 1 : 0;
