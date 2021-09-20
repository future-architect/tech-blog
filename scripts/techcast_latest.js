'use strict';

const RssParser = require('rss-parser');

let feedItems = [];

const rssParser = new RssParser();
rssParser.parseURL('https://anchor.fm/s/2890e980/podcast/rss')
.then((feed) => {
  feedItems = feed.items;
})
.catch((error) => {
  console.error('RSS 取得失敗', error);
});


hexo.extend.helper.register('generate_techcast_post', function() {

  const feedHTML = feedItems.slice(0, 2).map(item => `<li><a href="${item.link}" title="フューチャーがお届けするポッドキャストです。${item.title}" target="_blank" rel="noopener">${item.title}</a></li>`).join("\n");

  return `
  <div class="class="widget-wrap">
  <div class="widget">
    <ul class="nav">
      ${feedHTML}
    <li><a href="https://anchor.fm/futuretechcast/" title="Future Tech Castホーム" target="_blank" rel="noopener">...</a></li>
    </ul>
  </div>
  </div>
  `
});

