'use strict';

const fs = require("fs");
const {getSNSCnt} = require('./lib/sns');

let gaCache = {data:[]};
const cachePath = "cache_ga.json";

if (fs.existsSync(cachePath)) {
  let cache = fs.readFileSync(cachePath, 'utf-8');
  if (cache) {
    gaCache = JSON.parse(cache);
  }
}

process.on('exit', function () {
  fs.writeFileSync("cache_ga.json", JSON.stringify(gaCache, null, 2));
});

hexo.extend.helper.register('popular_posts', function(term='weekly') {
  const popularPost = gaCache[term].filter(gaPage => gaPage.path.indexOf("articles") > 0)
    .flatMap(gaPage => this.site.posts.data.filter(post => post.permalink.indexOf(gaPage.path) > 0).slice(0, 1))
    .slice(0, 15);

  const links = popularPost.map(post => `<li><span>${post.date.format('YYYY.MM.DD')}</span><span class="snscount">&#9825;${getSNSCnt(post.permalink)}</span> <a href="/${post.path}" title="${post.lede}">${post.title}</a></li>`).join("\n")

  return `
  <div class="widget">
    <ul class="nav featured-post-link">
      ${links}
    </ul>
  </div>
  `
});

const { google } = require('googleapis');

const auth = new google.auth.GoogleAuth({
  scopes: 'https://www.googleapis.com/auth/analytics.readonly',
});

const analyticsreporting = google.analyticsreporting({
  version: 'v4',
  auth: auth,
})

async function fetchGoogleAnalytics(term, start, end) {
  const res = await analyticsreporting.reports.batchGet({
    requestBody: {
      reportRequests: [
        {
          viewId: '117039269',
          dateRanges: [
            {
              startDate: start,
              endDate: end,
            },
          ],
          metrics: [
            {
              expression: 'ga:pageviews',
            },
          ],
          dimensions: [{ name: 'ga:pagePath' }, { name: 'ga:pageTitle' }],
          orderBys: [{ fieldName: 'ga:pageviews', sortOrder: 'DESCENDING' }],
          pageSize: 30 // レスポンス件数
        },
      ],
    },
  });

  // hold cache
  let data = [];
  res.data.reports[0].data.rows.forEach(row => {
    data.push({
      path: row.dimensions[0],
      pv: row.metrics[0].values[0],
      title: row.dimensions[1]
    })
  });
  gaCache[term] = data;
}

// call google analytics api
fetchGoogleAnalytics('weekly', '7daysAgo', '1daysAgo');
fetchGoogleAnalytics('monthly', '30daysAgo', '1daysAgo');
fetchGoogleAnalytics('yearly', '365daysAgo', '1daysAgo');
