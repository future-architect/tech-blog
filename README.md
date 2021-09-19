# service stack

* ホスティング : Github Pages
* 静的サイトジェネレータ：Hexo
* 分析：Google Analytics

## SNSカウントを表示させるために、Facebook開発者用のトークンが必要

1. 開発者キーが必要
    * https://developers.facebook.com/apps/576262853337658/settings/basic/

2. アクセストークンを取得
    * https://graph.facebook.com/oauth/access_token?client_id=xxx&client_secret=xxx&grant_type=client_credentials
    * 次のようなJSONが取得できるので、このaccess tokenの値を取得
{
"access_token": "xxx|xxx",
"token_type": "bearer"
}

3. アクセストークンが正常か確認
https://graph.facebook.com?id=https%3A%2F%2Ffuture-architect.github.io%2Farticles%2F20210313%2F&fields=engagement&access_token=xxx|xxx

4. 環境変数に設定
    * export FB_TOKEN=xxx|xxx

## 人気の記事を表示させるためGOOGLE_APPLICATION_CREDENTIALSが必要

> set GOOGLE_APPLICATION_CREDENTIALS キーパス

## techblog sources

```
$ cd ../
$ git clone --depth 1 https://github.com/future-architect/tech-blog.git
$ cd tech-blog
$ npm install

$ hexo server
 --> http://localhost:4000 にページが表示されたら完了
```
