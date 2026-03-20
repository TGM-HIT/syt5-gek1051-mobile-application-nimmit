import fs from 'node:fs/promises';

const STORIES_PATH = process.argv[2] ?? 'DOCS/STORIES.md';

const githubToken = process.env.GITHUB_TOKEN;
if (!githubToken) {
  console.error('GITHUB_TOKEN is required (set in GitHub Actions via ${{ github.token }}).');
  process.exit(1);
}

const repoSlug = process.env.GITHUB_REPOSITORY;
if (!repoSlug || !repoSlug.includes('/')) {
  console.error('GITHUB_REPOSITORY is required (expected "owner/repo").');
  process.exit(1);
}

const [owner, repo] = repoSlug.split('/');

function parseTableRow(line) {
  const trimmed = line.trim();
  if (!trimmed.startsWith('|')) return null;
  const rawCells = trimmed.split('|').slice(1, -1);
  return rawCells.map((c) => c.trim());
}

function formatTableRow(cells) {
  return `| ${cells.join(' | ')} |`;
}

function extractIssueNumber(cell) {
  if (!cell) return null;

  const issueUrlMatch = cell.match(/\b(?:issues|pull)\/(\d+)\b/i);
  if (issueUrlMatch) return Number(issueUrlMatch[1]);

  const hashMatch = cell.match(/\B#(\d+)\b/);
  if (hashMatch) return Number(hashMatch[1]);

  return null;
}

async function fetchIssueState({ owner, repo, issueNumber, token }) {
  const url = `https://api.github.com/repos/${owner}/${repo}/issues/${issueNumber}`;

  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
    },
  });

  if (res.status === 404) return 'Not Found';
  if (res.status === 410) return 'Gone';
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`GitHub API error ${res.status} for #${issueNumber}: ${text}`);
  }

  const data = await res.json();
  return data?.state ?? 'Unknown';
}

function toDisplayState(state) {
  const normalized = String(state ?? '').toLowerCase();
  if (normalized === 'open') return 'Open';
  if (normalized === 'closed') return 'Closed';
  return state;
}

const fileContent = await fs.readFile(STORIES_PATH, 'utf8');
const eol = fileContent.includes('\r\n') ? '\r\n' : '\n';
const lines = fileContent.split(/\r?\n/);

const headerLineIndex = lines.findIndex(
  (l) => l.trim().startsWith('| ID') && l.includes('| Status |') && l.includes('| Issue |'),
);

if (headerLineIndex === -1) {
  console.error(`Could not find stories table header in ${STORIES_PATH}.`);
  process.exit(1);
}

const headerCells = parseTableRow(lines[headerLineIndex]);
if (!headerCells) {
  console.error(`Could not parse stories table header in ${STORIES_PATH}.`);
  process.exit(1);
}

const statusColIndex = headerCells.findIndex((c) => c.toLowerCase() === 'status');
const issueColIndex = headerCells.findIndex((c) => c.toLowerCase() === 'issue');

if (statusColIndex === -1 || issueColIndex === -1) {
  console.error(`Could not find Status/Issue columns in ${STORIES_PATH}.`);
  process.exit(1);
}

// Data rows start after the separator row (header + separator).
const firstDataRowIndex = headerLineIndex + 2;

let changed = false;
let touchedRows = 0;

const stateCache = new Map();

for (let idx = firstDataRowIndex; idx < lines.length; idx++) {
  const line = lines[idx];
  const trimmed = line.trim();

  if (!trimmed.startsWith('|')) break; // end of table
  if (trimmed.startsWith('| ----')) continue; // separator row

  const cells = parseTableRow(line);
  if (!cells) continue;
  if (cells.length !== headerCells.length) continue;

  const issueNumber =
    extractIssueNumber(cells[issueColIndex]) ?? extractIssueNumber(cells[0]);

  if (!issueNumber || Number.isNaN(issueNumber)) continue;

  let issueState = stateCache.get(issueNumber);
  if (!issueState) {
    issueState = await fetchIssueState({
      owner,
      repo,
      issueNumber,
      token: githubToken,
    });
    stateCache.set(issueNumber, issueState);
  }

  const displayState = toDisplayState(issueState);

  if (cells[statusColIndex] !== displayState) {
    cells[statusColIndex] = displayState;
    lines[idx] = formatTableRow(cells);
    changed = true;
    touchedRows++;
  }
}

if (changed) {
  await fs.writeFile(STORIES_PATH, lines.join(eol), 'utf8');
}

console.log(
  `${changed ? 'Updated' : 'No changes'}: ${STORIES_PATH} (${touchedRows} row(s) touched).`,
);
