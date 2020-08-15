# service stack

* ホスティング : Github Pages
* 静的サイトジェネレータ：Hexo
* 分析：Google Analytics

# Hexo 環境構築手順

## Node.jsインストール

HexoはNode.js製なので、未インストールな方は下記を参考にして下さい。
http://qiita.com/taipon_rock/items/9001ae194571feb63a5e

## Node.jsプロキシ設定

```
$ npm config set proxy http://proxy.future.co.jp:8000
```

## setup

```
# install hexo
  $ npm install hexo-cli -g --save
  $ hexo init blog
  $ cd blog
  $ npm install
  
# run sever(`ctrl * C` で停止)
  $ hexo server
  
# browser
  $ http://localhost:4000
```


## techblog sources

```
$ cd ../
$ git clone https://github.com/future-architect/tech-blog.git
$ cd tech-blog
$ npm install
$ npm install hexo-generator-feed --save
$ npm install hexo-generator-seo-friendly-sitemap --save
$ npm install hexo-footnotes --save
$ npm install hexo-math --save

$ hexo server
 --> http://localhost:4000 にページが表示されたら完了
```
