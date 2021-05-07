
hexo.extend.helper.register('featured_posts', function(rate) {
  let count = 0;
  const featureds = this.site.posts.reverse()
    .filter(post => post.featured == true && Math.round(Math.random()*100) < rate)
    .filter(_  => count++ < this.theme.featured_count)
    ;

  const links = featureds.map(post => `
    <li><a href="${post.permalink}">${post.title}</a></li>`).join("\n")

  return `
  <div class="widget">
    <ul class="nav">
      ${links}
    </ul>
  </div>
  `
});
