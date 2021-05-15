const fetch = require('sync-fetch');
const fs = require("fs");

let pocketCnt = {};
let hatebuCnt = {};

if (fs.existsSync("cache_pocket.json")) {
  let pocketCache = fs.readFileSync("cache_pocket.json", 'utf-8');
  if (pocketCache) {
    pocketCnt = JSON.parse(pocketCache);
  }
}

if (fs.existsSync("cache_hatebu.json")) {
  let hatebuCache = fs.readFileSync("cache_hatebu.json", 'utf-8');
  if (hatebuCache) {
    hatebuCnt = JSON.parse(hatebuCache);
  }
}

process.on('exit', function() {
  fs.writeFileSync("cache_pocket.json", JSON.stringify(pocketCnt, null, 2));
  fs.writeFileSync("cache_hatebu.json", JSON.stringify(hatebuCnt, null, 2));
});

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

