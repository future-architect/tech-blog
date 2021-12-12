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
  const currentTime = new Date();
  var pastDate = currentTime.getDate() - 7; // 1week
  currentTime.setDate(pastDate);

  const label = item => {
    if (currentTime.toISOString() <= item.isoDate) {
      return `<span class="techcast-newitem">NEW</span>`;
    }
    return "";
  }

  const feedHTML = feedItems.slice(0, 3).map(item => `<li><a href="${item.link}" title="フューチャーがお届けするポッドキャストです。${item.title}" target="_blank" rel="noopener">${label(item)} ${item.title}</a></li>`).join("\n");

  return `
  <div class="class="widget-wrap">
  <div class="widget">
    <ul class="nav techcast">
      ${feedHTML}
    </ul>
  </div>
  </div>
  `
});

