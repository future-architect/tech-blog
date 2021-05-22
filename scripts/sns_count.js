const fetch = require('sync-fetch');
const fs = require("fs");

let [pocketCnt, hatebuCnt, fbCnt, twCnt] = [{}, {}, {}, {}];
let [currentPocket, currentHatebu, currentFb, currentTw] = [{}, {}, {}, {}];

const cacheFiles = ["cache_pocket.json", "cache_hatebu.json", "cache_facebook.json", "cache_twitter.json"];

cacheFiles.forEach((path, i) => {
  if (!fs.existsSync(path)) {
    return;
  }

  let cache = fs.readFileSync(path, 'utf-8');
  if (cache) {
    if (i == 0) {
      pocketCnt = JSON.parse(cache);
    } else if (i == 1) {
      hatebuCnt = JSON.parse(cache);
    } else if (i == 2) {
      fbCnt = JSON.parse(cache);
    } else if (i == 3) {
      twCnt = JSON.parse(cache);
    }
  }
});

process.on('exit', function() {
  fs.writeFileSync("cache_pocket.json", JSON.stringify(pocketCnt, null, 2));
  fs.writeFileSync("cache_hatebu.json", JSON.stringify(hatebuCnt, null, 2));
  fs.writeFileSync("cache_facebook.json", JSON.stringify(fbCnt, null, 2));
  fs.writeFileSync("cache_twitter.json", JSON.stringify(twCnt, null, 2));
});

// url example: https://future-architect.github.io/articles/20210519a/
const fetchableDate = (url)=> {
  if (url.indexOf("/articles/") > 0) {
    const path = url.split("/articles/")[1];
    const ymd = path.replace("/", "").substring(0, 9);

    let dt = new Date();
    var pastDate = dt.getDate() - 5;
    dt.setDate(pastDate);

    const y = dt.getFullYear();
    const m = ('00' + (dt.getMonth()+1)).slice(-2);
    const d = ('00' + dt.getDate()).slice(-2);
    const before = y + m + d;

    if (before <= ymd) {
      return true;
    }
  }

  // 1%
  if (Math.random() * 100 < 1) {
    return true;
  }

  return false;
}

hexo.extend.helper.register("get_pocket_count", (url) => {
  if (currentPocket[url]) {
    return currentPocket[url];
  }

  if (!fetchableDate(url)) {
    const cnt = pocketCnt[url];
    if (cnt > 0) {
      return cnt
    } else if (cnt == 0) {
      return "Pocket"
    }
  }

  const apiURL = `https://widgets.getpocket.com/api/saves?url=${url}`
  const respCnt = fetch(apiURL).json().saves;
  pocketCnt[url] = respCnt;
  currentPocket[url] = respCnt;

  if (respCnt == 0) {
    return "Pocket";
  }

  return respCnt;
});

hexo.extend.helper.register("get_hatebu_count", (url) => {
  if (currentHatebu[url]) {
    return currentHatebu[url];
  }

  if (!fetchableDate(url)) {
    const cnt = hatebuCnt[url];
    if (cnt > 0) {
      return cnt
    } else if (cnt == 0) {
      return "はてな";
    }
  }

  const apiURL = `https://bookmark.hatenaapis.com/count/entry?url=${encodeURI(url)}`
  const respCnt = fetch(apiURL).json();
  hatebuCnt[url] = respCnt;
  currentHatebu[url] = respCnt;

  if (respCnt == 0) {
    return "はてな";
  }

  return respCnt;
});

hexo.extend.helper.register("get_fb_count", (url) => {
  if (currentFb[url]) {
    return currentFb[url];
  }

  if (!fetchableDate(url)) {
    const cnt = fbCnt[url];
    if (cnt > 0) {
      return cnt;
    } else if(cnt == 0) {
      return "シェア";
    }
  }

  const token = process.env.FB_TOKEN;
  const apiURL = `https://graph.facebook.com/v10.0/?fields=og_object{engagement}&id=${encodeURI(url)}&access_token=${token}`
  const resp = fetch(apiURL).json();

  if (resp?.error) {
    /* response example:
      {
        "error": {
          "message": "(#4) Application request limit reached",
          "type": "OAuthException",
          "is_transient": true,
          "code": 4,
          "fbtrace_id": "A0LtXEmI9dFA9DpCPbEx8wC"
          }
        }
   */
    // 制限にかかった場合は、キャッシュを再利用
    const cnt = fbCnt[url];
    if (cnt > 0) {
      return cnt;
    }
    return "シェア";
  }

  const respCnt = resp?.og_object?.engagement?.count || 0;
  fbCnt[url] = respCnt;
  currentFb[url] = respCnt;

  console.log(`finish facebook ${url} ${respCnt}`);

  if (respCnt == 0) {
    return "シェア";
  }

  return respCnt;
});

hexo.extend.helper.register("get_tw_count", (url) => {
  if (currentTw[url]) {
    return currentTw[url];
  }

  if (!fetchableDate(url)) {
    const cnt = twCnt[url];
    if (cnt == 0) {
      return "ツイート";
    } else if (cnt > 0) {
      return cnt;
    }
  }

  const apiURL = `https://jsoon.digitiminimi.com/twitter/count.json?url=${encodeURI(url)}`
  const resp = fetch(apiURL).json();
  const respCnt = resp.count + resp.likes;

  twCnt[url] = respCnt;
  currentTw[url] = respCnt;

  if (respCnt == 0) {
    return "ツイート"
  }

  return respCnt;
});

hexo.extend.helper.register("totalSNSCnt", (url) => {
  const pocket = pocketCnt[url] || 0;
  const hatebu = hatebuCnt[url] || 0;
  const fb = fbCnt[url] || 0;
  const tw = twCnt[url] || 0;

  return pocket + hatebu + fb + tw;
});
