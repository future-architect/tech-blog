function scrapeImg() {
  const page  = this;
  const content  = page;

  let images = [];
  if (!images.length && content) {
    images = images.slice();

    if (content.includes('<img')) {
      let img;
      const imgPattern = /<img [^>]*src=['"]([^'"]+)([^>]*>)/gi;
      while ((img = imgPattern.exec(content)) !== null) {
        images.push(img[1]);
      }
    }

  }
  console.log("scrapeImg")

  return images.filter(path => !path.endWith(".svg"));
}
