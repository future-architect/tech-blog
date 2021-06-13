'use strict';

const fs = require("fs");

let [pocket, hatebu, fb, tw] = [{}, {}, {}, {}];

const cacheFiles = ["cache_pocket.json", "cache_hatebu.json", "cache_facebook.json", "cache_twitter.json"];
cacheFiles.forEach((path, i) => {
  if (!fs.existsSync(path)) {
    return;
  }

  let cache = fs.readFileSync(path, 'utf-8');
  if (cache) {
    if (i == 0) {
      pocket = JSON.parse(cache);
    } else if (i == 1) {
      hatebu = JSON.parse(cache);
    } else if (i == 2) {
      fb = JSON.parse(cache);
    } else if (i == 3) {
      tw = JSON.parse(cache);
    }
  }
});

const saveCache = () => {
  fs.writeFileSync("cache_pocket.json", JSON.stringify(pocket, null, 2));
  fs.writeFileSync("cache_hatebu.json", JSON.stringify(hatebu, null, 2));
  fs.writeFileSync("cache_facebook.json", JSON.stringify(fb, null, 2));
  fs.writeFileSync("cache_twitter.json", JSON.stringify(tw, null, 2));
}

const getSNSCnt = url => {
  const p = pocket[url] || 0;
  const h = hatebu[url] || 0;
  const f = fb[url] || 0;
  const t = tw[url] || 0;
  return p + h + f + t;
}

const getTwitterCnt = url => tw[url] || 0;
const getFacebookCnt = url => fb[url] || 0;
const getHatebuCnt = url => hatebu[url] || 0;
const getPocketCnt = url => pocket[url] || 0;
const setTwitterCnt = (url, cnt) => {tw[url] = cnt;}
const setFacebookCnt = (url, cnt) => {fb[url] = cnt;}
const setHatebuCnt = (url, cnt) => {hatebu[url] = cnt;}
const setPocketCnt = (url, cnt) => {pocket[url] = cnt;}

module.exports = {
  saveCache:saveCache,
  pocket: pocket,
  hatebu: hatebu,
  fb: fb,
  tw: tw,
  getSNSCnt: getSNSCnt,
  getTwitterCnt:getTwitterCnt,
  getFacebookCnt: getFacebookCnt,
  getHatebuCnt:getHatebuCnt,
  getPocketCnt : getPocketCnt,
  setTwitterCnt:setTwitterCnt,
  setFacebookCnt: setFacebookCnt,
  setHatebuCnt:setHatebuCnt,
  setPocketCnt : setPocketCnt
};
