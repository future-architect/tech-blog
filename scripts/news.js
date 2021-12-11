'use strict';

const RssParser = require('rss-parser');

let qiitaFeed = [];
const qiitaOrgParser = new RssParser();
qiitaOrgParser.parseURL('https://qiita.com/organizations/future/activities.atom')
.then((feed) => {
  qiitaFeed = feed.items;
})
.catch((error) => {
  console.error('Qiita Organization RSS 取得失敗', error);
});

let connpassFeed = [];
const connpassFeedParser = new RssParser();
connpassFeedParser.parseURL('https://future.connpass.com/ja.atom')
.then((feed) => {
  connpassFeed = feed.items;
})
.catch((error) => {
  console.error('Connpass RSS 取得失敗', error);
});

hexo.extend.helper.register('generate_qiita_orgs', function() {

  const feeds = qiitaFeed.concat(connpassFeed);
  feeds.sort((a, b) => {
    if (a.pubDate < b.pubDate) {
      return 1;
    } else if (a.pubDate > b.pubDate) {
      return -1;
    } else {
      return 0;
    }
  });

  const newsCategory = item => {
    if (item.link.includes("qiita")) {
      return "【Qiita】"
    } else {
      return "【勉強会】"
    }
  }

  const newsDate = item => {
    return item.isoDate.split("T")[0];
  }

  const feedHTML = feeds.slice(0, 5).map(item => `<li><span class="news-date">${newsDate(item)}</span> <span class="news-category">${newsCategory(item)}</span> <a href="${item.link}" title="${item.title}" target="_blank" rel="noopener" class="news-title">${item.title}</a></li>`).join("\n");

  return `
  <div class="class="widget-wrap">
  <div class="widget">
    <ul class="news">
      ${feedHTML}
    </ul>
  </div>
  </div>
  `
});

