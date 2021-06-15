'use strict';

const fetch = require('sync-fetch');
const {saveCache, pocket, hatebu, fb, tw, setTwitterCnt, setFacebookCnt, setHatebuCnt, setPocketCnt, getSNSCnt} = require('./lib/sns');
const BEFORE_DATE = 14; // N日前までさかのぼってキャッシュ更新
let [currentPocket, currentHatebu, currentFb, currentTw] = [{}, {}, {}, {}];

// キャッシュ永続化
process.on('exit', saveCache);

hexo.extend.helper.register("get_pocket_count", url => {
  if (!(currentPocket[url] ?? true) ) {
    return currentPocket[url];
  }
  if (!fetchableDate(url)) {
    return pocket[url] ||  "Pocket";
  }

  const respCnt = fetch(`https://widgets.getpocket.com/api/saves?url=${url}`).json().saves;
  currentPocket[url] = respCnt;
  setPocketCnt(url, respCnt)

  return respCnt || "Pocket";
});

hexo.extend.helper.register("get_hatebu_count", url => {
  if (!(currentHatebu[url] ?? true)) {
    return currentHatebu[url];
  }
  if (!fetchableDate(url)) {
    return hatebu[url] || "はてな";
  }

  const respCnt = fetch(`https://bookmark.hatenaapis.com/count/entry?url=${encodeURI(url)}`).json();
  currentHatebu[url] = respCnt;
  setHatebuCnt(url, respCnt);

  return respCnt || "はてな";
});

hexo.extend.helper.register("get_fb_count", url => {
  if (!(currentFb[url] ?? true)) {
    return currentFb[url];
  }
  if (!fetchableDate(url)) {
    return fb[url] || "シェア";
  }

  const resp = fetch(`https://graph.facebook.com/v10.0/?fields=og_object{engagement}&id=${encodeURI(url)}&access_token=${process.env.FB_TOKEN}`).json();
  if (resp?.error) {
    /* {
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
    return fb[url] || "シェア";
  }

  const respCnt = resp?.og_object?.engagement?.count || 0;
  currentFb[url] = respCnt;
  setFacebookCnt(url, respCnt);

  console.log(`finish facebook ${url} ${respCnt}`);
  return respCnt || "シェア";
});

hexo.extend.helper.register("get_tw_count", url => {
  if (!(currentTw[url] ?? true)) {
    return currentTw[url];
  }
  if (!fetchableDate(url)) {
    return tw[url] ||  "ツイート";
  }

  const resp = fetch(`https://jsoon.digitiminimi.com/twitter/count.json?url=${encodeURI(url)}`).json();
  const respCnt = resp.count + resp.likes;

  currentTw[url] = respCnt;
  setTwitterCnt(url, respCnt);

  return respCnt || "ツイート";
});

hexo.extend.helper.register("get_feedly_count", url => {
  const resp = fetch(`http://cloud.feedly.com/v3/feeds/feed%2Fhttps%3A%2F%2Ffuture-architect.github.io%2Fatom.xml`).json();
  return resp.subscribers ?? "Follow";
});

hexo.extend.helper.register("totalSNSCnt", url => {
  return getSNSCnt(url);
});

// url example: https://future-architect.github.io/articles/20210519a/
const fetchableDate = url => {
  if (url && url.indexOf("/page/") > 0) {
    // ページングのSNS数は常に取得しない
    return false;
  }

  if (url && url.indexOf("/articles/") > 0) {
    const path = url.split("/articles/")[1];
    const ymd = path.replace("/", "").substring(0, 9);

    let dt = new Date();
    var pastDate = dt.getDate() - BEFORE_DATE;
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
