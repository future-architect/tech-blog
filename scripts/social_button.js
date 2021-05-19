const fetch = require('sync-fetch');
const fs = require("fs");

let pocketCnt = {};
let hatebuCnt = {};

if (fs.existsSync("cache_pocket.json")) {
  let pocketCache = fs.readFileSync("cache_pocket.json", 'utf-8');
  if (pocketCache) {
    console.log(`cache reuse: cache_pocket.json`);
    pocketCnt = JSON.parse(pocketCache);
  }
}

if (fs.existsSync("cache_hatebu.json")) {
  let hatebuCache = fs.readFileSync("cache_hatebu.json", 'utf-8');
  if (hatebuCache) {
    console.log(`cache reuse: cache_hatebu.json`);
    hatebuCnt = JSON.parse(hatebuCache);
  }
}

process.on('exit', function() {
  fs.writeFileSync("cache_pocket.json", JSON.stringify(pocketCnt, null, 2));
  fs.writeFileSync("cache_hatebu.json", JSON.stringify(hatebuCnt, null, 2));
});

// url example: https://future-architect.github.io/articles/20210519a/
const fetchableDate = (url)=> {
  if (url.indexOf("/articles/") > 0) {
    const path = url.split("/articles/")[1];
    const ymd = path.replace("/", "").substring(0, 9);

    let dt = new Date();
    var pastDate = dt.getDate() - 10;
    dt.setDate(pastDate);

    const y = dt.getFullYear();
    const m = ('00' + (dt.getMonth()+1)).slice(-2);
    const d = ('00' + dt.getDate()).slice(-2);
    const before = y + m + d;

    if (before <= ymd) {
      return true;
    }
  }

  // 2%
  if (Math.random() * 100 <= 2) {
    return true;
  }

  return false;
}

hexo.extend.helper.register("get_pocket_count", (url) => {
  if (!fetchableDate(url)) {
    const count = pocketCnt[url];
    if (count >= 0) {
      return count
    }
  }

  let pocketURL = `https://widgets.getpocket.com/api/saves?url=${url}`
  const saveCnt = fetch(pocketURL).json().saves;
  pocketCnt[url] = saveCnt;

  console.log(`finish pocket ${url}`);

  return saveCnt;
});

hexo.extend.helper.register("get_hatebu_count", (url) => {
  if (!fetchableDate(url)) {
    const count = hatebuCnt[url];
    if (count >= 0) {
      return count
    }
  }

  let hatebuURL = `https://bookmark.hatenaapis.com/count/entry?url=${encodeURI(url)}`
  const bookmarkCnt = fetch(hatebuURL).json();
  hatebuCnt[url] = bookmarkCnt;

  console.log(`finish hatebu ${url}`);

  return bookmarkCnt;
});

