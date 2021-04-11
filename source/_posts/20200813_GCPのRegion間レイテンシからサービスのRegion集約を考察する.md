title: "GCPのRegion間レイテンシからサービスのRegion集約を考察する"
date: 2020/08/13 00:00:00
postid: ""
tag:
  - GCP
  - Network
  - 夏休み自由研究
  - Terraform
category:
  - Infrastructure
thumbnail: /images/20200813/thumbnail.png
author: 西田好孝
featured: false
lede: "フューチャー夏休みの自由研究連載の9回目です。こんにちは、TIG DXユニットの西田と申します。業務では `GCP` のインフラの設計/構築/運用を担当しております。私は前職でネットワーク領域のキャリアが長かった事もあり、現職では `GCP` の中でも特にネットワークに関する部分を見ています。今回の自由研究もそれに関連する考察をしていきます。クラウド上で、ワールドワイドのサービスを作るとき、『どれくらいの密度でどの Region にサーバを立てればよいのか？』って、悩みませんか？インターネット向けのWebサービスだったら `CDN` で対処すれば基本的にはOKですが、イントラネットだけからアクセスさせたい社内サービス、Backend 系のサービス、Webサービスではないアプリケーションなどはインスタンスを用意する必要が出てきますよね。"
---

[フューチャー夏休み自由研究連載](https://future-architect.github.io/articles/20200726/)の9回目です。

# はじめに

こんにちは、TIG DXユニットの西田と申します。

業務では `GCP` のインフラの設計/構築/運用を担当しております。私は前職でネットワーク領域のキャリアが長かった事もあり、現職では `GCP` の中でも特にネットワークに関する部分を見ています。今回の自由研究もそれに関連する考察をしていきます。

# 記事について

クラウド上で、ワールドワイドのサービスを作るとき、**『どれくらいの密度でどの Region にサーバを立てればよいのか？』**って、悩みませんか？インターネット向けのWebサービスだったら `CDN` で対処すれば基本的にはOKですが、イントラネットだけからアクセスさせたい社内サービス、Backend 系のサービス、Webサービスではないアプリケーションなどはインスタンスを用意する必要が出てきますよね。
選択肢としては以下です。

- 全リージョンにサーバを構築する
    - 日本の場合、東京、大阪にそれぞれ構築する
- 近傍の国を1つのリージョンにまとめる
    - 日本の場合、東京だけに集約する

今回は、自由研究という事で、日頃業務で使っている `GCP` を題材にして、ネットワークの観点から考察してみようと思います。先に申し上げておきますと、一観点からの考察なので、実際のサービスが提供しているSLAにマッチするかどうかは別問題なので、そこはご容赦ください🙇‍♂️

# 自由研究で考察する観点

ネットワークの観点と言っても、いくつかありますよね。

- スループット：`〇Gbps` などの帯域の話。『ギガがなくなった』とかのギガとは少し違います。
- レイテンシ：パケットの往復の時間
- ジッター：上記の時間の揺らぎ。早いときと遅いときのばらつき度合い

今回は、この中でレイテンシだけに注目して考察します。
（データ量がそこそこあるサービスの場合はスループットも気にするべきですが、本記事ではレイテンシのみに注目）

# GCP のリージョンとは？

こちらに世界地図とネットワークケーブルの概要が掲載されております。
https://cloud.google.com/about/locations?hl=ja#network
この線を通ってパケットがやり取りされるわけですが、近いところは早く応答が返ってくるし、遠いところは応答が遅いという事です。
では、サービス目線で言うと、どれくらい集約できるんでしょうかね？

# 集約する基準

まず、集約する基準を決めておきます。
かなり感覚論ですし、サービスの種類や作りにも当然依存しますが、大体私の経験上はこれくらいです。

|レイテンシ|日常使用で同程度なモノ|体感|
|:--|:--|:--|
|20ms 以下|固定の光回線|とても速い。さくさく|
|60ms 以下|スマホ4Gくらい|まぁこれくらいは我慢出来る|
|それ以上|4Gで遅い時/3G利用など|これは遅い…使いたくない|

なので、**`60ms` までは集約可能**と判断する事にします。
※重ねてになりますが、提供するサービスの種類/作りにこの基準は大きく依存します。音声系・映像系だと遅いと致命的な影響を受けますが、ファイルサーバの様なサービスだともう少し基準を下げられる、などはあり得ます。

# GCP の全 Region 間のレイテンシを計測する
### 計測対象

こちらの [Compute Engine リージョンとゾーン](https://cloud.google.com/compute/docs/regions-zones?hl=ja) に記載の全Region を対象にします。
※すいません、ムンバイだけ、QuotaがデフォルトでCPUS:0となっており、上げるリクエストを出したんですが、拒否されてしまいました。その関係で、ムンバイだけ計測が出来ませんでした🙇‍♂️
![](/images/20200813/2020-08-02_233921.png)

### 

- フルメッシュで計測
- Ping を 100ms 毎に 100 回打って、その返答の平均値

※インスタンス構築のための `Terraform` コード、計測のためのスクリプトはAppendixに載せておきます。
　スクリプトは並列処理をするべきでした。そこはちょっと作り足りない感があります。

### 計測結果

計測結果は以下です。

- 青：20ms。サクサク
- 黄：60ms。ギリギリ我慢できるレベル
- 赤：それ以上。これはサービスとしてはよろしくない
![](/images/20200813/2020-08-02_231622.jpg)

# 考察

考察に当たっては、少しを前提を置きます。

- 対象となる企業は、グローバル展開している日本企業（`Japanese Multinational Corporations`）であり、Japan に Global Headquarters(`GHQ`) が存在する。
    - 人数的には、Japan が最も従業員/顧客が多い。
- 各国の支社/支部がイントラネットを通じて社内向けのサービスにアクセスする。

割と現実的な前提ですよね。その前提を元に、考えると、以下の様になります。

- 東京：日本/韓国/台湾/香港を集約（台湾/香港は、香港に別だしでも良い秒数）
    - GHQがあるので、まずはココを起点に考えます。
- シンガポール：東南アジア地域をカバー
- オーストラリア：オセアニア地域。シンガポールまで結構遠いんですね。
- ドイツ：ヨーロッパ地域。（北欧だけは別だしでも良い秒数）
- 米国アイオワ：北アメリカ地域。（東西で分けても良い秒数）
- ブラジル

まぁ、なんていうか。。。『まぁそうだよね』感のある考察になりますね。。。
実際、これくらいをベースにリージョンを集約している事が多いんじゃないかと思います。そこに対して、レイテンシという観点での一つの裏付けにはなったかなと思います。

# 終わりに

今回は『自由研究』という事で、日頃使っているツールに関して、少し深掘ってみました。
他にもルーティングに関する考察や、Peering, HA VPN の使い分けに関する考察も自分の中ではあるので、どこかで深堀りしていければと思います。

# ついでに(GCPのスループットについて)

理論値というか、UDPベースではこの様になります。

- インスタンス間のスループットは、`2Gbps/CPU` となる。上限は 8CPU の `16Gbps`
    - n1-standard-1 : `2 Gbps`
    - n1-standard-4 : `8 Gbps`
    - n1-standard-8 : `16 Gbps`（以降、CPUを増やしてもスループットは増えない）

※TCP ベースだと、TCPのフロー制御の関係で上記ほどの数値を出すためにはOSのパラメータの調整が必要になります。

# Appendix

## Terraform コード

```sh gce.tf
resource "google_compute_instance" "GCE_instances" {
  count        = length(local.gce_instances_list)
  name         = local.gce_instances_list[count.index].name
  machine_type = "f1-micro"
  zone         = local.gce_instances_list[count.index].zone
  project      = local.project.id

  boot_disk {
    auto_delete = false
    source      = google_compute_disk.GCE_disks[count.index].self_link
  }

  network_interface {
    network = google_compute_network.test_network.name
    access_config {
      // Ephemeral IP
    }
  }

  service_account {
    email  = google_service_account.nw_tester.email
    scopes = ["cloud-platform"]
  }

  metadata = {
    enable-oslogin = "true"
  }
}

resource "google_compute_disk" "GCE_disks" {
  count   = length(local.gce_instances_list)
  name    = "${local.gce_instances_list[count.index].name}-disk"
  project = local.project.id
  zone    = local.gce_instances_list[count.index].zone
  type    = "pd-standard"
  size    = 20
  image   = "centos-cloud/centos-8"

  lifecycle {
    ignore_changes = [labels]
  }
}
```
```sh network.tf
resource "google_compute_network" "test_network" {
  project                 = local.project.id
  name                    = "test-network"
  auto_create_subnetworks = true
}

resource "google_compute_firewall" "ingress_test_network_iap" {
  project = local.project.id
  name    = "ingress-test-network-iap"
  network = google_compute_network.test_network.self_link

  direction = "INGRESS"
  priority  = 1000

  allow {
    protocol = "tcp"
    ports    = ["22"]
  }

  source_ranges = ["35.235.240.0/20"]
}

resource "google_compute_firewall" "ingress_test_network_internal" {
  project = local.project.id
  name    = "ingress-test-network-internal"
  network = google_compute_network.test_network.self_link

  direction = "INGRESS"
  priority  = 1000

  allow {
    protocol = "all"
  }

  source_ranges = ["10.0.0.0/8", "172.16.0.0/12", "192.168.0.0/16"]
}
```
```sh service_account.tf
resource "google_service_account" "nw_tester" {
  project      = local.project.id
  account_id   = "nw-tester"
  display_name = "nw-tester"
}

resource "google_project_iam_member" "nw_tester" {
  project = local.project.id
  member  = "serviceAccount:${google_service_account.nw_tester.email}"
  role    = "roles/compute.viewer"
}

```
```sh veriable.tf
locals {
  project = {
    id = "project_id"
  }

  // GCE Instances
  gce_instance_name = "instance-test-nsd"
  gce_instances_list = [
    { region = "asia-northeast1", zone = "asia-northeast1-a", name = "${local.gce_instance_name}-asia-northeast1-a" },
    { region = "asia-northeast1", zone = "asia-northeast1-b", name = "${local.gce_instance_name}-asia-northeast1-b" },
    { region = "asia-northeast1", zone = "asia-northeast1-c", name = "${local.gce_instance_name}-asia-northeast1-c" },
    { region = "asia-northeast2", zone = "asia-northeast2-a", name = "${local.gce_instance_name}-asia-northeast2-a" },
    { region = "asia-northeast3", zone = "asia-northeast3-a", name = "${local.gce_instance_name}-asia-northeast3-a" },
    { region = "asia-east1", zone = "asia-east1-b", name = "${local.gce_instance_name}-asia-east1-b" },
    { region = "asia-east2", zone = "asia-east2-a", name = "${local.gce_instance_name}-asia-east2-a" },
//    { region = "asia-south1", zone = "asia-south1-c", name = "${local.gce_instance_name}-asia-south1-c" }, 
    { region = "asia-southeast1", zone = "asia-southeast1-b", name = "${local.gce_instance_name}-asia-southeast1-b" },
    { region = "asia-southeast2", zone = "asia-southeast2-a", name = "${local.gce_instance_name}-asia-southeast2-a" },
    { region = "australia-southeast1", zone = "australia-southeast1-b", name = "${local.gce_instance_name}-australia-southeast1-b" },
    { region = "europe-north1", zone = "europe-north1-a", name = "${local.gce_instance_name}-europe-north1-a" },
    { region = "europe-west1", zone = "europe-west1-b", name = "${local.gce_instance_name}-europe-west1-b" },
    { region = "europe-west2", zone = "europe-west2-c", name = "${local.gce_instance_name}-europe-west2-c" },
    { region = "europe-west3", zone = "europe-west3-c", name = "${local.gce_instance_name}-europe-west3-c" },
    { region = "europe-west4", zone = "europe-west4-a", name = "${local.gce_instance_name}-europe-west4-a" },
    { region = "europe-west6", zone = "europe-west6-a", name = "${local.gce_instance_name}-europe-west6-a" },
    { region = "northamerica-northeast1", zone = "northamerica-northeast1-a", name = "${local.gce_instance_name}-northamerica-northeast1-a" },
    { region = "southamerica-east1", zone = "southamerica-east1-b", name = "${local.gce_instance_name}-southamerica-east1-b" },
    { region = "us-central1", zone = "us-central1-c", name = "${local.gce_instance_name}-us-central1-c" },
    { region = "us-east1", zone = "us-east1-b", name = "${local.gce_instance_name}-us-east1-b" },
    { region = "us-east4", zone = "us-east4-c", name = "${local.gce_instance_name}-us-east4-c" },
    { region = "us-west1", zone = "us-west1-b", name = "${local.gce_instance_name}-us-west1-b" },
    { region = "us-west2", zone = "us-west2-a", name = "${local.gce_instance_name}-us-west2-a" },
    { region = "us-west3", zone = "us-west3-a", name = "${local.gce_instance_name}-us-west3-a" },
    { region = "us-west4", zone = "us-west4-a", name = "${local.gce_instance_name}-us-west4-a" }
  ]
}
```
```sh versions.tf
terraform {
  required_version = ">= 0.12"
}
provider "google" {
  version = "~> 3.30.0"
}
```

## 各種script
```sh ping-all-instances-in-VPC.sh
#!/bin/bash

project_name=""
vpc_name="test-network"
ping_count=100
src_host=`hostname`
src_zone=`gcloud compute instances list --filter "NAME=${src_host}" --format="csv(ZONE)" | sed '1d'`

echo ${src_host} at `date +"%Y-%m-%d %H:%M:%S.%3N"`

gce_list=`gcloud compute instances list --filter "networkInterfaces[].network:${vpc_name}" --format="csv(NAME,ZONE,INTERNAL_IP)" | sed '1d'`

for gce in ${gce_list}
do
  dst_host=`echo ${gce} | cut -d ',' -f 1` 
  dst_zone=`echo ${gce} | cut -d ',' -f 2`
  dest_ip=`echo ${gce} | cut -d ',' -f 3`
  rs_ping=`sudo ping -i0.1 ${dest_ip} -c ${ping_count} -q`
  avg=`echo ${rs_ping} | sed -r 's/.*rtt min\/avg\/max\/mdev = (.+?)\/(.+?)\/(.+?)\/(.+?)$/\2/'`

  echo ${src_host},${src_zone},${dst_host},${dst_zone},${dest_ip},${avg}

done
```
```sh sh-exec.sh
#!/bin/bash

echo Started at `date +"%Y-%m-%d %H:%M:%S.%3N"`

project_name=""
vpc_name="test-network"
shell_file="ping-all-instances-in-VPC.sh"

format="csv(NAME,ZONE,INTERNAL_IP)"
gce_list=`gcloud compute instances list --filter "networkInterfaces[].network:${vpc_name}" --format="csv(NAME,ZONE)" | sed '1d'`

for gce in ${gce_list}
do
  host=`echo ${gce} | cut -d ',' -f 1` 
  zone=`echo ${gce} | cut -d ',' -f 2`

  gcloud compute scp ${shell_file} ${host}:~/${shell_file} --zone ${zone} --tunnel-through-iap
  wait
  gcloud compute ssh ${host} --command="sh ~/${shell_file}" --zone ${zone} --tunnel-through-iap
  wait
  gcloud compute ssh ${host} --command="rm ~/${shell_file}" --zone ${zone} --tunnel-through-iap
  wait

done
echo Finished at `date +"%Y-%m-%d %H:%M:%S.%3N"`
```

# 使い方
```sh
sh sh-exec.sh
```

