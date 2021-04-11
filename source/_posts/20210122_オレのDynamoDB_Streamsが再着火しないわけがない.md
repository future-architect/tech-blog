title: "オレのDynamoDB Streamsが再着火しないわけがない"
date: 2021/01/22 00:00:00
postid: ""
tag:
  - AWS
  - DynamoDB
  - DynamoDBStream
  - Go
  - トラブルシュート
category:
  - Programming
thumbnail: /images/20210122/thumbnail.png
author: 真野隼記
featured: false
lede: "DynamoDB Streamsは、DynamoDBに対する項目の追加、変更、削除をイベントとして検出できる機能です。テーブルの項目が変更されるとすぐに、新しいレコードがテーブルのストリームに表示されます"
---


# はじめに

こんにちは、TIG DXユニット真野です。

タイトルのみで内容にあたりがつく、AWSお兄さんな方も多いかと思いますが、内容サマリです。

* 一度着火済みであるDynamoDB Streamsイベントを再着火させる公式機能は存在しない（管理コンソールでボタンポチではできないという意図です）
* 何かしらのスクリプトでGet（Scan） + Put（Update）して、再度データ編集する必要がある
* この時、Get（Scan）した内容をそのままPutしてもDynamoDB Streamsは起動せず、何かしらの項目変更や項目追加が必要

..です。

興味がある方向けに説明を続けます。

## DynamoDB Streamsとは

![](/images/20210122/1_isSK76wQioKx8k3dXrDrZA.png)

DynamoDB Streamsは、DynamoDBに対する項目の追加、変更、削除をイベントとして検出できる機能です。テーブルの項目が変更されるとすぐに、新しいレコードがテーブルのストリームに表示されます。AWS Lambda はストリームをポーリングし、新しいストリームレコードを検出すると、Lambda 関数を同期的に呼び出します。

参考: https://docs.aws.amazon.com/ja_jp/amazondynamodb/latest/developerguide/Streams.html

この手のAWSサービスに珍しくAt Least Onceだったり、順序制御がされていたりと何かと助かるサービスです。ストリームレコードは 24 時間後に自動的に削除されるので、ストリームのコンシューマ側のアプリの処理が追いつかない場合はデータロストする可能性があるので注意すべき、ってところが見落としやすいポイントでしょうか。


## DynamoDB Streamsをリラン（再実行）したい時

DynamoDB StreamsはAWSのサービスだと珍しく `Exactly Once` [^1] の実行保証で、通常は後続にLambdaを呼び出します。

[^1]: https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/Streams.html に Each stream record appears exactly once in the stream. とある

起動が保証されているとはいえ、アプリケーションが不具合を起こしたり、外部連携先のシステム都合でリランしてほしいという要望もあるかと思います（ありました）。

DynamoDB StreamsはKinesis Data Streamsのように、ストリームの開始位置を水平トリムや日付指定で行なうことができず、有効・無効の切り替えのみ可能です。

参考: https://docs.aws.amazon.com/ja_jp/amazondynamodb/latest/developerguide/Streams.html#Streams.Enabling

そのため、ある日時から再度DynamoDB Streamsを再実行したい場合は、自前のスクリプトで対応する必要があります。


## イベントが再着火しない

しかし、以下1~2のようなスクリプトを作っても上手くDynamoDB Streamsが起動せず、後続のLambdaが動いてくれませんでした😭

1. ストリームを再読み取りさせたい、DynamoDBの項目をScan
2. Scanして取得したItemをそのまま同じテーブルにPut

ScanもPutも正しく成功しているのでなんでだろうって思ってましたが、ドキュメントを見返すと答えが出ていました。


## 解決策

原因はドキュメントに書いてあるとおり、そのままでした。

> DynamoDB Streamsは、DynamoDBに対する項目の追加、変更、削除をイベントとして検出できる機能です

とある通りです。**項目の追加、変更、削除を検出する機能**と書いていますね。Scanした項目をそのままPutするだけでは、追加、編集、削除ではないのでDynamoDB Streamsは起動しないのです。

何となくDynamoDB Streamsは、Put、Update、DeleteといったAPIアクションをキャプチャしてくれるイメージがありましたが、あくまで項目に対する書き換え操作が行われた場合のみに起動する機能が正しかったです。この仕様自体はOracleDBのCDC（チェンジデータキャプチャ）そのままなので違和感は無いので、そうだよね～って感じです。


そのため、以下のようなコードに書き換えました。

1. ストリームを再読み取りさせたい、DynamoDBの項目をScan
2. ItemにRevisionといったフィールドを新規追加（存在すれば＋１する）
3. 書き換えたItemを同じテーブルにPut

上記でDynamoDB Streamsを再度して無事後続のLambdaまでデータを渡して再着火させることに成功しました✨


Goで書いたコードは以下のイメージです。簡易のため対象テーブルは指定されたハッシュキーでスキャン（正確にはクエリ）しています。

```go main.go(サンプルコード)
package main

import (
	"context"
	"fmt"
	"os"

	"github.com/aws/aws-sdk-go/aws"
	"github.com/aws/aws-sdk-go/aws/session"
	"github.com/aws/aws-sdk-go/service/dynamodb"
	"github.com/aws/aws-sdk-go/service/dynamodb/dynamodbattribute"
	"github.com/rs/zerolog/log"
)

var (
	db = dynamodb.New(session.Must(session.NewSessionWithOptions(session.Options{
		SharedConfigState: session.SharedConfigEnable,
	})))
	tableName    = os.Getenv("DynamoTable")  // リラン対象のテーブル
	hashKeyName  = os.Getenv("HashKeyName")  // リラン対象のハッシュキー名
	hashKeyValue = os.Getenv("HashKeyValue") // リラン対象のハッシュキー値
)

func main() {
	if err := scanAndPut(context.Background()); err != nil {
		log.Error().Msgf("%v", err)
	}
	fmt.Println("finished")
}

func scanAndPut(ctx context.Context) error {
	var startKey map[string]*dynamodb.AttributeValue
	for {
		resp, err := scan(ctx, startKey)
		if err != nil {
			return fmt.Errorf("failed to scan: %w", err)
		}
		log.Info().Msgf("scanCount: %v", len(resp.Items))

		for _, v := range resp.Items {

			var revision int64
			if err := dynamodbattribute.Unmarshal(v["revision"], &revision); err != nil {
				return fmt.Errorf("unmarshal: %v", err)
			}

			revision++
			marshal, _ := dynamodbattribute.Marshal(revision)
			v["revision"] = marshal
			if err := put(ctx, v); err != nil {
				return fmt.Errorf("failed to put: %w", err)
			}
		}

		startKey = resp.LastEvaluatedKey
		if len(startKey) == 0 {
			break
		}
	}
	return nil
}

func scan(ctx context.Context, startKey map[string]*dynamodb.AttributeValue) (*dynamodb.QueryOutput, error) {
	return db.QueryWithContext(ctx, &dynamodb.QueryInput{
		TableName:         aws.String(tableName),
		ExclusiveStartKey: startKey,
		ExpressionAttributeNames: map[string]*string{
			"#Hash": aws.String(hashKeyName),
		},
		ExpressionAttributeValues: map[string]*dynamodb.AttributeValue{
			":hash": {
				S: aws.String(hashKeyValue),
			},
		},
		KeyConditionExpression: aws.String("#Hash = :hash"),
	})
}

func put(ctx context.Context, v map[string]*dynamodb.AttributeValue) error {
	_, err := db.PutItemWithContext(ctx, &dynamodb.PutItemInput{
		TableName: aws.String(tableName),
		Item:      v,
	})
	return err
}
```

サンプルコードは、3つの環境変数を持ってます。
利用する場合には環境変数の設定を忘れないようにしてください。

```sh
export DynamoTable=<Your Table Name>
export HashKeyName=<Hash Key Name fo Your Table>
export DynamoTable=<Hash Key Value fo Your Table>
go run main.go
```

## 注意

DynamoDB StreamsからLambdaにわたす項目には、編集前の`OldImage`と 編集後の`NewImage` が存在します。

今回のリラン方法だと、OldImageは初回実行時と差分が生じるので、OldImageを利用したLambdaのリランは上手く行えません。DynamoDB Streamsで渡される項目については、Goであれば https://github.com/aws/aws-lambda-go/blob/master/events/dynamodb.go#L78 あたりを確認ください。

## 指定した日付のみをリランしたい場合のインデックス設計

ある日付からといった指定がすでにハッシュキー・ソートキーの構造で可能であれば良いですが、そうでない限りはGSIでcreated_ymdといった日付を示す項目をもたせることが多いのではないでしょうか？

このGSIをDynamoDBのScanで読み取り＋Putすれば、日付単位のストリームの再実行ができそうです。

DynamoDB Streamsを利用したシステム設計を行う場合は、リランのしやすさも意識して、予めGSIを追加しておくのも良いかも知れません（費用とのトレードオフになりますが、いざという時に構えておくと良いかなと思います）


## まとめ

* DynamoDB Streamsを同じデータで再実行させたい場合は、何かしらの項目を**編集して**再度Putする必要がある
* リランのしやすさも設計時に織り込んでおき、必要に応じてGSIに日付項目などを追加しておくと良い
* DynamoDB Streamsをイベントソースとして起動するLambdaが、OldImage（編集前の項目）を利用する設計になっていると、単純リランができなくなるので、別途考慮が必要


