export const maxSkillLength = 64_000;

export type ImportedSkill = {
  source: string;
  title: string;
  content: string;
};

type SkillFile = { source: string; path: string };

const github = 'https://github.com';
const rawGitHub = 'https://raw.githubusercontent.com';
const skillFileName = 'SKILL.md';

function parseGitHubUrl(value: string) {
  let url: URL;
  try { url = new URL(value.trim()); }
  catch { throw new Error('请输入有效的 GitHub 链接。'); }
  if (![github, rawGitHub].includes(url.origin) || url.username || url.password) {
    throw new Error('请使用公开 GitHub 仓库或 SKILL.md 链接。');
  }
  const [owner, repo, ...rest] = url.pathname.split('/').filter(Boolean);
  if (!/^[\w-]+$/.test(owner ?? '') || !/^[\w.-]+$/.test(repo ?? '')) {
    throw new Error('GitHub 链接需要包含仓库所有者和仓库名。');
  }
  return { owner, repo: repo.replace(/\.git$/, ''), rest, raw: url.origin === rawGitHub };
}

export function canonicalSkillSource(value: string) {
  const { owner, repo, rest, raw } = parseGitHubUrl(value);
  const [kind, ...path] = raw ? ['blob', ...rest] : rest;
  if (!['blob', 'tree'].includes(kind) || !path.length) throw new Error('请选择具体的 SKILL.md 文件。');
  if (kind === 'tree') path.push(skillFileName);
  if (path.length < 2 || path.at(-1) !== skillFileName) throw new Error('请选择具体的 SKILL.md 文件。');
  const safePath = path.map(segment => encodeURIComponent(decodeURIComponent(segment))).join('/');
  return `${github}/${owner.toLowerCase()}/${repo.toLowerCase()}/blob/${safePath}`;
}

async function requestGitHub(url: string) {
  const response = await fetch(url, { credentials: 'omit', signal: AbortSignal.timeout(15_000) })
    .catch(() => { throw new Error('无法连接 GitHub，请检查网络后重试。'); });
  if (response.status === 403 || response.status === 429) throw new Error('GitHub 暂时限制请求，请稍后重试。');
  if (!response.ok) throw new Error('未找到公开仓库或 SKILL.md，请核对链接。');
  return response;
}

export async function findGitHubSkills(value: string): Promise<SkillFile[]> {
  const { owner, repo, rest, raw } = parseGitHubUrl(value);
  if (raw || rest.length) {
    const source = canonicalSkillSource(value);
    return [{ source, path: decodeURIComponent(new URL(source).pathname.split('/').slice(4).join('/')) }];
  }
  const response = await requestGitHub(`https://api.github.com/repos/${owner}/${repo}/git/trees/HEAD?recursive=1`);
  const data = await response.json() as { tree: { path: string; mode: string; type: string }[]; truncated?: boolean };
  const files = data.tree.filter(item => item.type === 'blob' && item.mode !== '120000' && item.path.split('/').at(-1) === skillFileName);
  if (!files.length) {
    throw new Error(data.truncated ? '仓库较大，请直接粘贴 SKILL.md 文件链接。' : '仓库中没有找到 SKILL.md。');
  }
  return files.map(({path}) => ({
    path, source: canonicalSkillSource(`${github}/${owner}/${repo}/blob/HEAD/${path.split('/').map(encodeURIComponent).join('/')}`),
  }));
}

export async function readGitHubSkill(source: string): Promise<ImportedSkill> {
  source = canonicalSkillSource(source);
  const [owner, repo, , ...path] = new URL(source).pathname.slice(1).split('/');
  const response = await requestGitHub(`${rawGitHub}/${owner}/${repo}/${path.join('/')}`);
  if (Number(response.headers.get('content-length')) > maxSkillLength * 4) throw new Error('SKILL.md 文件过大。');
  const content = (await response.text()).trim();
  if (!content || content.length > maxSkillLength) throw new Error('SKILL.md 为空或超过 64,000 字符。');
  const header = content.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/)?.[1];
  const name = header?.match(/^name:[ \t]*([^\r\n]+)$/m)?.[1].trim().replace(/^["']|["']$/g, '');
  const title = name || content.match(/^#\s+(.+)$/m)?.[1].trim() || decodeURIComponent(path.at(-2) ?? repo);
  return { source, title: title.slice(0, 100), content };
}
