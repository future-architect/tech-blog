'use strict';

const maxNewsDisplayCount = 3;

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
  // connpassの場合はRSSを公開した日ではなく、イベントの開催日にしたい
  const eventDate = feedItem => {
    if (!feedItem.link.includes("connpass")) {
      return feedItem.pubDate;
    }
    // summary: '開催日時: 2021/05/21 19:00 ～ 20:00<br />開催場所: オンライン<br /> といった形式で格納される
    // eventDateStr is like format: 2021-09-03T19:00
    const eventDateStr = feedItem.summary.split(" ～ ")[0].replaceAll("開催日時: ", "").replaceAll(" ", "T").replaceAll("/", "-");
    return eventDateStr + ":00.000Z";
  }

  const feeds = qiitaFeed.concat(connpassFeed);
  feeds.sort((a, b) => {
    if (eventDate(a) < eventDate(b)) {
      return 1;
    } else if (eventDate(a) > eventDate(b)) {
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
    return eventDate(item).split("T")[0];
  }

  const feedHTML = feeds.slice(0, maxNewsDisplayCount).map(item => `<li><span class="news-date">${newsDate(item)}</span><span class="news-category">${newsCategory(item)}</span><a href="${item.link}" title="${item.title}" target="_blank" rel="noopener" class="news-title">${item.title}</a></li>`).join("\n");

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

