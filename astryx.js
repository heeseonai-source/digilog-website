// Astryx 디자인 시스템(@astryxdesign/core, neutral 테마) 컴포넌트를 빌드 때 정적 HTML로 렌더링
// 사이트는 React 없이 돌아가는 정적 페이지라서, 버튼·카드를 React로 미리 그려 문자열로 넣는다.
const fs = require('fs');
const path = require('path');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
const { Button } = require('@astryxdesign/core/Button');
const { Card } = require('@astryxdesign/core/Card');
const { ClickableCard } = require('@astryxdesign/core/ClickableCard');

const THEME = 'neutral';
const h = React.createElement;
const SLOT = '\u0000ASTRYX_SLOT\u0000';

// 컴포넌트를 그린 뒤 맨 바깥 태그에 테마 속성을 달고, 자리표시자에 기존 HTML 조각을 끼운다
function render(el, inner = '') {
  const html = renderToStaticMarkup(el).replace(/^<([a-z]+)/, `<$1 data-astryx-theme="${THEME}"`);
  return html.split(SLOT).join(inner);
}

/** 버튼: href가 있으면 링크(<a>), 없으면 <button> */
const button = ({ label, href, variant = 'primary', size = 'lg', type, width, className }) =>
  render(h(Button, { label, href, variant, size, type, width, className }));

/** 카드: 안쪽은 기존 HTML 문자열 그대로 */
const card = (inner, { className, padding = 6, variant = 'default', elevation = 'low', id } = {}) =>
  render(h(Card, { className, padding, variant, elevation }, SLOT), inner).replace(/^<div /, id ? `<div id="${id}" ` : '<div ');

/** 누르면 이동하는 카드 */
const clickableCard = (inner, { label, href, target, className, padding = 6, elevation = 'low' }) =>
  render(h(ClickableCard, { label, href, target, className, padding, elevation }, SLOT), inner);

const CSS_FILES = [
  ['astryx.css', require.resolve('@astryxdesign/core/astryx.css')],
  ['theme-neutral.css', require.resolve('@astryxdesign/theme-neutral/theme.css')],
];

/** dist/assets/astryx/ 로 CSS 복사 */
function copyCss(outDir) {
  const dir = path.join(outDir, 'assets', 'astryx');
  fs.mkdirSync(dir, { recursive: true });
  for (const [name, src] of CSS_FILES) fs.copyFileSync(src, path.join(dir, name));
}
const CSS_LINKS = CSS_FILES.map(([name]) => `<link rel="stylesheet" href="/assets/astryx/${name}">`).join('');

module.exports = { button, card, clickableCard, copyCss, CSS_LINKS, THEME };
