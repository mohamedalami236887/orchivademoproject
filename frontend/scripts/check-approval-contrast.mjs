import { readFileSync } from 'node:fs';

const theme = readFileSync(new URL('../src/orchiva.scss', import.meta.url), 'utf8');
const blocks = [...theme.matchAll(/:root(\[data-theme="dark"\])?\{([^}]+)\}/g)];
const tokenSets = new Map([['light', {}], ['dark', {}]]);
for (const match of blocks) {
  const tokens = Object.fromEntries([...match[2].matchAll(/(--[\w-]+):(#[0-9a-fA-F]{3,8})/g)].map(value => [value[1], value[2]]));
  Object.assign(tokenSets.get(match[1] ? 'dark' : 'light'), tokens);
}
function luminance(hex) {
  const digits = hex.length === 4 ? hex.slice(1).split('').map(value => value + value).join('') : hex.slice(1);
  const values = digits.match(/.{2}/g).slice(0, 3).map(value => parseInt(value, 16) / 255);
  return values.map(value => value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4).reduce((sum, value, index) => sum + value * [0.2126, 0.7152, 0.0722][index], 0);
}
function contrast(first, second) {
  const a = luminance(first), b = luminance(second);
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
}
const pairs = [
  ['--ink', '--bg'], ['--ink', '--surface'], ['--ink', '--surface-2'], ['--ink-2', '--surface'],
  ['--muted', '--bg'], ['--muted', '--surface'], ['--muted', '--surface-2'], ['--brand-ink', '--brand-soft'],
  ['--primary-action-ink', '--brand'],
  ['--danger', '--danger-soft'], ['--warning', '--warning-soft'], ['--success', '--success-soft']
];
let failed = false;
for (const [name, tokens] of tokenSets) {
  const palette = { ...tokenSets.get('light'), ...tokens };
  for (const [text, background] of pairs) {
    const value = contrast(palette[text], palette[background]);
    console.log(`${name}: ${text} on ${background} = ${value.toFixed(2)}:1`);
    if (value < 4.5) failed = true;
  }
}
const sidebarMatch = theme.match(/body:has\(\.requests-workspace\) \.workspace \.sidebar\{([^}]+)\}/);
if (!sidebarMatch) throw new Error('Requests sidebar palette is missing');
const sidebarTokens = Object.fromEntries([...sidebarMatch[1].matchAll(/(--[\w-]+):(#[0-9a-fA-F]{3,8})/g)].map(value => [value[1], value[2]]));
for (const foreground of ['--ink', '--ink-2', '--muted']) {
  const value = contrast(sidebarTokens[foreground], '#112632');
  console.log(`Requests sidebar: ${foreground} on sidebar = ${value.toFixed(2)}:1`);
  if (value < 4.5) failed = true;
}
const activeValue = contrast(sidebarTokens['--brand-ink'], sidebarTokens['--brand-soft']);
console.log(`Requests sidebar: active text = ${activeValue.toFixed(2)}:1`);
if (activeValue < 4.5) failed = true;
if (failed) process.exitCode = 1;

