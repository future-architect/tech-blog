'use strict';

const {getSNSCnt} = require('./lib/sns');

const fs = require("fs");
const gaCache = JSON.parse(fs.readFileSync("ga_cache.json", 'utf-8'));

hexo.extend.helper.register('popular_posts', function(term='weekly') {
  const monthAgo = new Date();
  monthAgo.setDate(monthAgo.getDate() - 30); // 4week
  const twoWeekAgo = new Date();
  twoWeekAgo.setDate(twoWeekAgo.getDate() - 15); // 2week
  const aWeekAgo = new Date();
  aWeekAgo.setDate(aWeekAgo.getDate() - 7); // 1week
  const threeDayAgo = new Date();
  threeDayAgo.setDate(threeDayAgo.getDate() - 3); // 3day

  const compareFunc = (a, b) => {
    return b.pv - a.pv;
  };

  let rate3d, rate1w, rate2w, rate4w = [12, 8, 5, 3];
  if (term === "yearly") {
    rate3d, rate1w, rate2w, rate4w = [5, 5, 5, 5];
  }

  const popularPost = gaCache[term].filter(gaPage => gaPage.path.indexOf("articles") > 0)
    .filter(gaPage => {
      return this.site.posts.data.some(post => post.permalink.indexOf(gaPage.path) > 0);
    })
    .flatMap(gaPage => {
      const post = this.site.posts.data.filter(post => post.permalink.indexOf(gaPage.path) > 0).slice(0, 1)
      if (post && post.length > 0) {
        post[0].pv = parseInt(gaPage.pv);
        return post;
      }
      return []; // もしpostがundefinedや空の配列なら空の配列を返す    
    })  
    .map(post => {
      if (post.date.toISOString() >= threeDayAgo.toISOString()) {
        post.pv = post.pv * rate3d;
      } else if (post.date.toISOString() >= aWeekAgo.toISOString()) {
        post.pv = post.pv * rate1w;
      } else if (post.date.toISOString() >= twoWeekAgo.toISOString()) {
        post.pv = post.pv * rate2w;
      } else if (post.date.toISOString() >= monthAgo.toISOString()) {
        post.pv = post.pv * rate4w;
      }
      return post;
    })
    .sort(compareFunc)
    .slice(0, 15);


  const label = post => {
    if (monthAgo.toISOString() <= post.date.toISOString()) {
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
