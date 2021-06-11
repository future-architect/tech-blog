var gen = require('random-seed');
const {getSNSCnt} = require('./lib/sns');

hexo.extend.helper.register('featured_posts', function(url, rate, limit) {
  url = url || 'future'; // seed value

  const postsLimit = limit ?? this.theme.featured_count;
  let count = 0;

  var rand = gen.create(url);

  const featureds = this.site.posts.reverse()
    .filter(post => post.featured == true && rand(100) < rate)
    .filter(post => post.permalink !== url) // その記事自身は除く
    .filter(_  => count++ < postsLimit)
    ;

  const links = featureds.map(post => `
    <li><span>${post.date.format('YYYY.MM.DD')}</span><span class="snscount">&#9825;${getSNSCnt(post.permalink)}</span> <a href="/${post.path}" title="${post.lede}">${post.title}</a></li>`).join("\n")

  return `
  <div class="widget">
    <ul class="nav featured-post-link">
      ${links}
    </ul>
  </div>
  `
});
