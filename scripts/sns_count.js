const fetch = require('sync-fetch');
const {pocket, hatebu, fb, tw, getSNSCnt} = require('./lib/sns');

const beforeDate = 3; // N日前までさかのぼってキャッシュ更新

let [currentPocket, currentHatebu, currentFb, currentTw] = [{}, {}, {}, {}];

hexo.extend.helper.register("get_pocket_count", (url) => {
  if (currentPocket[url]) {
    return currentPocket[url];
  }

  if (!fetchableDate(url)) {
    const cnt = pocket[url];
    if (cnt > 0) {
      return cnt
    } else if (cnt == 0) {
      return "Pocket"
    }
  }

  const apiURL = `https://widgets.getpocket.com/api/saves?url=${url}`
  const respCnt = fetch(apiURL).json().saves;
  pocket[url] = respCnt;
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
    const cnt = hatebu[url];
    if (cnt > 0) {
      return cnt
    } else if (cnt == 0) {
      return "はてな";
    }
  }

  const apiURL = `https://bookmark.hatenaapis.com/count/entry?url=${encodeURI(url)}`
  const respCnt = fetch(apiURL).json();
  hatebu[url] = respCnt;
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
    const cnt = fb[url];
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
  fb[url] = respCnt;
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
    const cnt = tw[url];
    if (cnt == 0) {
      return "ツイート";
    } else if (cnt > 0) {
      return cnt;
    }
  }

  const apiURL = `https://jsoon.digitiminimi.com/twitter/count.json?url=${encodeURI(url)}`
  const resp = fetch(apiURL).json();
  const respCnt = resp.count + resp.likes;

  tw[url] = respCnt;
  currentTw[url] = respCnt;

  if (respCnt == 0) {
    return "ツイート"
  }

  return respCnt;
});

// http://cloud.feedly.com/v3/feeds/feed%2Fhttps%3A%2F%2Ffuture-architect.github.io%2Fatom.xml
hexo.extend.helper.register("get_feedly_count", (url) => {
  const apiURL = `http://cloud.feedly.com/v3/feeds/feed%2Fhttps%3A%2F%2Ffuture-architect.github.io%2Fatom.xml`
  const resp = fetch(apiURL).json();
  return resp.subscribers ?? "Follow";
});

hexo.extend.helper.register("totalSNSCnt", (url) => {
  return getSNSCnt(url);
});

// url example: https://future-architect.github.io/articles/20210519a/
const fetchableDate = (url)=> {
  if (url && url.indexOf("/articles/") > 0) {
    const path = url.split("/articles/")[1];
    const ymd = path.replace("/", "").substring(0, 9);

    let dt = new Date();
    var pastDate = dt.getDate() - beforeDate;
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
