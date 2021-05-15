const fetch = require('sync-fetch')

let pocketCnt = {};
let hatebuCnt = {};


hexo.extend.helper.register("get_pocket_count", (url) => {
  const count = pocketCnt[url];
  if (count >= 0) {
    return count
  }
  console.log("start fetch pocket count");

  let pocketURL = `https://widgets.getpocket.com/api/saves?url=${url}`
  const saveCnt = fetch(pocketURL).json().saves;
  pocketCnt[url] = saveCnt;

  console.log(`finish pocket ${url}`);

  return saveCnt;
});

hexo.extend.helper.register("get_hatebu_count", (url) => {
  const count = hatebuCnt[url];
  if (count >= 0) {
    return count
  }
  console.log("start fetch hatebu count");

  let hatebuURL = `https://bookmark.hatenaapis.com/count/entry?url=${encodeURI(url)}`
  const bookmarkCnt = fetch(hatebuURL).json();
  hatebuCnt[url] = bookmarkCnt;

  console.log(`finish hatebu ${url}`);

  return bookmarkCnt;
});
