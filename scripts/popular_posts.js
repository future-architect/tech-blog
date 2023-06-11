'use strict';

const {getSNSCnt} = require('./lib/sns');

const fs = require("fs");
const gaCache = JSON.parse(fs.readFileSync("ga_cache.json", 'utf-8'));

hexo.extend.helper.register('popular_posts', function(term='weekly') {
  const popularPost = gaCache[term].filter(gaPage => gaPage.path.indexOf("articles") > 0)
    .flatMap(gaPage => this.site.posts.data.filter(post => post.permalink.indexOf(gaPage.path) > 0).slice(0, 1))
    .slice(0, 15);

  const currentTime = new Date();
  const pastDate = currentTime.getDate() - 30; // 4week
  currentTime.setDate(pastDate);

  const label = post => {
    if (currentTime.toISOString() <= post.date.toISOString()) {
      return `<span class="newitem">NEW</span>`;
    }
    return "";
  }

  const links = popularPost.map(post => `<li><span>${post.date.format('YYYY.MM.DD')}</span><span class="snscount">&#9825;${getSNSCnt(post.permalink)}</span>${label(post)} <a href="/${post.path}" title="${post.lede}">${post.title}</a></li>`).join("\n")

  return `
  <div class="widget">
    <ul class="nav featured-post-link">
      ${links}
    </ul>
  </div>
  `
});

hexo.extend.helper.register('sns_popular_posts', function() {

  const allPosts = this.site.posts.data;
  allPosts.sort((a, b) => getSNSCnt(b.permalink) - getSNSCnt(a.permalink))
  const popularPost = allPosts.slice(0, 15)

  const label = post => {
    const currentTime = new Date();
    const pastDate = currentTime.getDate() - 30; // 4week
    currentTime.setDate(pastDate);

    if (currentTime.toISOString() <= post.date.toISOString()) {
      return `<span class="newitem">NEW</span>`;
    }
    return "";
  }

  const links = popularPost.map(post => `<li><span>${post.date.format('YYYY.MM.DD')}</span><span class="snscount">&#9825;${getSNSCnt(post.permalink)}</span>${label(post)} <a href="/${post.path}" title="${post.lede}">${post.title}</a></li>`).join("\n")

  return `
  <div class="widget">
    <ul class="nav featured-post-link">
      ${links}
    </ul>
  </div>
  `
});
