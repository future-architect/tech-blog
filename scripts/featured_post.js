var gen = require('random-seed');

hexo.extend.helper.register('featured_posts', function(seed, rate) {
  let count = 0;

  var rand = gen.create(seed);

  const featureds = this.site.posts.reverse()
    .filter(post => post.featured == true && rand(100) < rate)
    .filter(_  => count++ < this.theme.featured_count)
    ;

  const links = featureds.map(post => `
    <li>${post.date.format('YYYY.MM.DD')}<a href="/${post.path}" title="${post.lede}">${post.title}</a></li>`).join("\n")

  return `
  <div class="widget">
    <ul class="nav">
      ${links}
    </ul>
  </div>
  `
});
