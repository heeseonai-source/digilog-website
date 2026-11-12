// GET /api/blog?limit=6&category=출강후기 → 네이버 블로그 최신글 (RSS)
const { send } = require('./_lib/http');
const RSS = 'https://rss.blog.naver.com/heeseon_ai.xml';

const decode = s => s
  .replace(/<!\[CDATA\[|\]\]>/g, '')
  .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;|&#x27;/g, "'").replace(/&amp;/g, '&')
  .trim();
const tag = (xml, name) => { const m = xml.match(new RegExp(`<${name}>([\\s\\S]*?)</${name}>`)); return m ? decode(m[1]) : ''; };

module.exports = async (req, res) => {
  const url = new URL(req.url, 'http://localhost');
  const limit = Math.min(Number(url.searchParams.get('limit')) || 6, 20);
  const category = url.searchParams.get('category') || '';
  try {
    const r = await fetch(RSS, { headers: { 'User-Agent': 'Mozilla/5.0 (digilog-website)' } });
    if (!r.ok) throw new Error('rss ' + r.status);
    const xml = await r.text();
    let posts = [...xml.matchAll(/<item>([\s\S]*?)<\/item>/g)].map(([, it]) => {
      const desc = tag(it, 'description');
      const img = desc.match(/src="([^"]+)"/);
      const d = new Date(tag(it, 'pubDate'));
      return {
        title: tag(it, 'title'),
        link: tag(it, 'link').split('?')[0],
        category: tag(it, 'category'),
        date: isNaN(d) ? '' : `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`,
        thumbnail: img ? img[1].replace(/^http:/, 'https:') : '',
      };
    });
    if (category) posts = posts.filter(p => p.category === category);
    send(res, 200, { posts: posts.slice(0, limit) }, { 'Cache-Control': 's-maxage=1800, stale-while-revalidate=86400' });
  } catch (e) {
    send(res, 502, { error: 'blog unavailable', posts: [] });
  }
};
