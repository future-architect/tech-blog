---
title: "Go Conference Online 2021 Autumnが開催されました＆作って学ぶシェル"
date: 2021/11/18 00:00:00
postid: a
tag:
  - Go
  - GoConference
  - 登壇レポート
  - ShellScript
  - システムプログラム
  - カンファレンス
category:
  - Programming
thumbnail: /images/20211118a/thumbnail.png
author: 澁川喜規
featured: false
lede: "Go Conference Online 2021 Autumnが開催されました。スタッフのみなさん、登壇者、参加者のみなさん、お疲れ様でした。フューチャーは今回もブロンズスポンサーでした。、渋川の発表内容を紹介します。タイトルは「Learning Computer Systems by Crafting: Shell 〜作って学ぶシェル〜」で、シェルの動作の紹介をしつつ、自分で実装してみるには、という感じの解説でした。"
---
Go Conference Online 2021 Autumnが開催されました。スタッフのみなさん、登壇者、参加者のみなさん、お疲れ様でした。フューチャーは今回もブロンズスポンサーでした。また、フューチャーからは伊藤（真）、辻、渋川の三人が登壇しました。

<img src="/images/20211118a/3I3nVBN6Jla9J7j1636787586_1636787641.png" alt="3I3nVBN6Jla9J7j1636787586_1636787641.png" width="1000" height="514" loading="lazy">

その中の、渋川の発表内容を紹介します。タイトルは「Learning Computer Systems by Crafting: Shell 〜作って学ぶシェル〜」で、シェルの動作の紹介をしつつ、自分で実装してみるには、という感じの解説でした。[Goならわかるシステムプログラミング](https://ascii.jp/serialarticles/1235262/)（書籍は[こちら](https://www.lambdanote.com/products/go))では詳しく触れていなかったシェルについて詳しく説明する追加コンテンツです。

<img src="/images/20211118a/image_(15).png" alt="image_(15).png" width="1200" height="646" loading="lazy">

発表資料はこちらです。

<iframe src="https://docs.google.com/presentation/d/e/2PACX-1vTjNhH-Fh3WwUe-hLT777OI4YOAxtG5YUqIfEzt63nwyvzNra-7leKPz4YcwWSuHt-jBJxAbuPliWXg/embed?start=false&loop=false&delayms=3000" frameborder="0" width="95%" height="569" allowfullscreen="true" mozallowfullscreen="true" webkitallowfullscreen="true"></iframe>

Twitter等でたまに話題になるのは、次のようなことです。

> 「若い人の中にはシェルの概念をあまり知らない人もいる」
> 「はたしてそのような人はどのようなきっかけ（経路）でシェルを知るようになるのか」

踏み台へのsshなど、現在でもシェル操作そのものが要求されますし、コードを書いているとgo mod initなりnpm installなりのいくつかの操作が必要となります。中には、flutterコマンドとか、Gitのように優秀なIDEプラグインやGUIツールのおかげで、「GUIツールだけで済ます」ということも可能な領域もありますが、まだまだそうでない領域もあります。

シェルを使うにあたっては、いくつものコマンド以外に、内部状態や、裏でシェルがやってくれることを知る必要があります。

* PATH
* 環境変数＆変数展開
* ワイルドカード
* パイプ＆リダイレクト　etc...

今日のセッションでは、この「シェルが何者か」という説明をします。このページに検索して辿り着いた人はシェルが何かがわかっている人の方が多いかもしれませんが、もし周りにシェルがよくわからん、という人がいればこのブログのリンクを送ってもらうような使い方をしてもらえたらな、と思っています。

# シェルとは何か？

* どんなソフトウェアを思い浮かべますか？
  * bash、zsh、fish、黒い怖い画面（コマンドプロンプト）、PowerShell
* WindowsのGUI（Explorer.exe）もシェルと呼ばれることもある
  * キオスクモードだと、そこで起動されるアプリケーションも[シェル](https://docs.microsoft.com/ja-jp/windows/configuration/kiosk-shelllauncher)
* PythonやNode.js、Rubyのirbなど、多くのプログラミング言語が備えるREPL（Read-Eval-Print Loop）画面もシェルと呼ばれることもある
  * →Interactive Shell


もともとの意味は人間とコンピュータの境界となるソフトウェアという意味なので、幅広いソフトウェアがシェルと呼ばれます。

# より狭い意味で使われるシェル＝コマンドシェル

「外部コマンド実行でシェルを利用する」、「シェルを/bin/falseにして、ログインできないシステムユーザーを作る」などの文脈で使われる、開発者がよく目にするCUIのプログラムランチャーがコマンドシェルです。

いわゆる黒い画面でファイル操作をしたりプログラムを起動したりするソフトウェア（bashとかzsh）。

Unix系のシェルではファイル管理のコマンド群は外部の独立したコマンドであるが、MS-DOSのcommand.comは内部コマンドでそのような機能も持っています。

いわゆる「黒い画面」はターミナルエミュレータと呼ばれる別のソフトウェアで、シェルに対してキーボードの入力や画面（文字描画）を提供するものです。「人とソフトウェアの境界」というと、こちらの方がシェルなのでは、という気がしないでもないですが、昔はここは専用のハードウェア(vt100とか)だったこともあり、「本来はハードウェアだが、ソフトウェアでエミュレーションしている」という扱いです。

# もっと狭い定義のシェル=POSIXシェル

[Single UNIX Specification](https://pubs.opengroup.org/onlinepubs/9699919799/)(SUS)とも呼ばれる、UNIXを名乗るために必要な規格があります。

* 標準準拠のシステムで提供されるべきC言語のヘッダーファイルの一覧
* シェルのコマンド（ユーティリティ）および、シェルの言語仕様
* OSとのやりとりに利用するシステムコールやライブラリ関数の定義

シェルは人間の入力で動かすものではありますが、この規格の中には、コマンド実行文をテキストファイルに並べて、連続実行するシェルスクリプトやその文法（制御構文など）も定義されています。「シェルスクリプト」と呼ばれるときの「シェル」はこちらです。

bash/zshなどは「互換シェル」ではあるが、大きく拡張している部分もあれば、非互換なところもあります。

だいたい、いままで紹介してきたものを並べると以下のような感じになるでしょう。

<img src="/images/20211118a/スクリーンショット_2021-11-13_16.10.13.png" alt="スクリーンショット_2021-11-13_16.10.13.png" width="1200" height="635" loading="lazy">

このエントリーでは主にコマンドシェルとPOSIXシェルについて紹介します。

# コマンドシェルがコマンドを実行するまで

だいたいこんな感じで処理されているでしょう。

1. ユーザーが入力したテキストを取り出す
2. コマンドの文字列をパースして、コマンドと引数に分ける
3. 環境変数参照があれば展開する
4. ファイルのワイルドカードがあれば展開する
5. コマンドをPATH環境変数で指定されているフォルダから探し出す
6. 見つけたコマンドに引数を渡して実行する

まずはユーザーがキーボードからコマンドを入力します。改行が入力されたらそこで1行取り込みます。

その後、文字列をパースして、コマンドと引数に分けていきます。必要に応じて（エスケープとかに注意しながら）、環境変数があれば展開します。ワイルドカード（`*`とか`？`とか)も展開します。展開されるとマッチするファイルのリストに置き換えられます。なお、Windowsのシェルはワイルドカードの展開はシェルは行わず、各プログラムが行います。

環境変数はマップのような文字列がキーで文字列を値として持つデータ構造で、親プロセスで定義したものが子プロセスに伝搬していきます。あえて子プロセス起動時にリセットしない限りは自動で伝搬していきます。プログラムやシェルスクリプトなどは固定されたままで、外部から必要な設定を差し込むことができるため、今時のクラウド系のシステムでは設定の手段としてかなり活用されています。コンテナの定義時に設定したり、クラウドへのアプリケーションのデプロイ時やインフラの構成時に環境変数が設定できるようになっています。コマンド実行ログにも表示されないため、クレデンシャルを設定する手段としても活用されています。

PATH環境変数はコロン区切り（Windows以外）、セミコロン区切りでフォルダのパスを列挙して格納します。シェルはこの ``PATH``に登録されているフォルダを先頭から順番に探索して実行を再開します。

PATH環境変数にフォルダを追加して、実行したいプログラムが発見できるようにすることを「パスを通す」と呼びます。

それ以外にもいろいろな仕事をしています。

* パイプやリダイレクトの場合、パイプやファイルを開いてファイルディスクリプタをOSに作ってもらい、起動するプロセスに設定する
* ワークフォルダをプロセスに設定する
* 環境変数はプロセス起動時のオプションとして設定する

Goのコードを見ると、gidとかchrootの設定とか、ホストとコンテナ内のUIDとGIDのマッピングとか、プロセスをフォワードに持ってくるとか、いろいろやっていますね。

https://github.com/golang/go/blob/master/src/syscall/exec_linux.go のforkAndExecInChild1()

# ちょっと裏方っぽいシェルのお仕事

自作のプログラムから外部プロセスを呼び出すには、「シェルを経由する実行」と、「シェルを経由しない実行」の2つの実行形態があります。プログラミング言語のライブラリをみると、だいたいこっそり書かれています。

シェル経由で実行の場合、コマンドライン引数の分解はシェルがやってくれるので、パラメータこみで丸ごと起動したいコマンドを単一の文字列を引数として取ります。

シェルを経由しない実行の場合、直接コマンドを実行します。引数の分解とかはしてくれないため、呼び出し側のプログラムで行う必要があります、引数を文字列の配列として渡す。ただし、コマンドをPATHからの探索はどの言語のライブラリもやってくれそう（Goも）。

C言語は標準ライブラリの``system()``はシェル経由、POSIXのunistd.hの``exec()``ファミリーはシェルを経由しない外部プロセス実行です。Pythonの``subprocess.run()``とかPHPの``proc_open()``にはシェルを経由するかどうかのフラグがあります。RubyやDockerは文字列でコマンドを渡すか、配列で渡すかでシェル経由かシェルを経由しないかの動作が変わります。

Goの``os/exec``はシェルを経由しない実行のみをサポートしています。シェル経由の実行をエミュレーションするには、次のようにします。

```go
var cmd *exec.Cmd
if runtime.GOOS == "windows" {
	cmd = exec.Command("cmd.exe", "/C", "timeout 5")
} else {
	cmd = exec.Command(os.Getenv("SHELL"), "-c", "sleep 5")
}
cmd.Run()
```

PATH環境変数の中のコマンドの探索は裏で自動でやってくれますし、独立した関数（``os/exec``パッケージの``LookPath()``関数)としても利用できます。

# コマンドシェルを作ってみよう

シェルがどのような仕事をしているか説明してきました。それぞれの項目は、次のように実現できます。

* **ループでユーザーの入力を受ける**
* **コマンドと引数を分解**
* **環境変数を展開**
* **ワイルドカードを展開**
* **リダイレクトとパイプ**
* **環境変数とワークフォルダを設定して実行**

カレントディレクトリや環境変数は子プロセスに渡すものを設定できるが親プロセスの持っている状態は変更できません。シェルから子プロセスを呼び出すときにシェル側の状態を変えることはできないので、カレントディレクトリと環境変数の変更（``cd``と``export``)は「内部コマンド」として実装する必要があります。

## ループでユーザーの入力を受ける

``github.com/peterh/liner``を使いました。"tui golang"あたりでググればいろいろライブラリが出てくるのでお好きなものを選ぶと良いです。``fmt.Scanf``とかでもいいですが、コード補完とかヒストリーとかいろいろ機能があるのでこの手のライブラリの方が良いです。

```go
import (
	"github.com/peterh/liner"
)

func main() {
	line := liner.NewLiner()
	line.SetCtrlCAborts(true)
	for {
		if cmd, err := line.Prompt(" "); err == nil {
			if cmd == "" {
				continue
			}
			// ここでコマンドを処理する
		} else if errors.Is(err, io.EOF) {
			break
		} else if err == liner.ErrPromptAborted {
			log.Print("Aborted")
			break
		} else {
			log.Print("Error reading line: ", err)
		}
	}
}
```

## コマンドと引数を分解

コードの分解には``github.com/google/shlex``を使います。Pythonの標準ライブラリにshlexがあり、どの言語でもたいてい、同様のライブラリはこれの移植で、この名前であることが多いです。大雑把にはこんな感じで使います。自分でパースするのも良いですが、ダブルクオートのエスケープみたいなややこしいものをやってくれるので、使った方が楽ですね。

```go
import (
	"github.com/google/shlex"
)

func parseCmd(cmdStr) (cmd string, args []string, err error) {
	l := shlex.NewLexer(strings.NewReader(cmdStr))
	cmd, err = l.Next()
	if err != nil {
		return
	}
	for ; token, err := l.Next(); err != nil {
		args = append(args, token)
	}
	return
}
```

ただし、バッククオート（別のコマンドを実行して、その結果を文字列として引数などに設定する）の中をさらにパースしたり、POSIXシェルのリダイレクトやらパイプをフルサポートするために、次のような記号で文字列を複数のコマンドに分割すると言った処理は頑張る必要があります。オライリーの「Go言語でつくるインタプリタ」を読んで、ステートマシンを作る練習に最適です。

* `|` `;` `||` `&&` `<` `>` `>>` `2>` `2>>` `&>` `&>>`

## 環境変数を展開

通常のプログラムであれば、``os.ExpandEnv()``を使えば文字列中の環境変数（`${ENV}`)を環境変数の値に置き換えてくれます。しかし、これはGoのプログラムのプロセス自体が持っている環境変数をもとにしてしまいます。シェルは自分の子プロセスのための環境変数を持つものなのでこれは使えません。``os.ExpandEnv()``の低レベル版の``os.Expand()``であれば、変換するキーと値の交換を関数で指定するのでこれが使えます。

```go
var args []string
var env map[string]string // ←ここに環境変数が入っているものとする

for _, arg := range origArgs {
	p.Args = append(p.Args, os.Expand(arg, func(key string) string {
		return env[key]
	}))
}
```

## ワイルドカードを展開

``path/filepath``か、``io/fs``の``Glob()``関数でワイルドカード(`*`, `?`, `[]`)展開ができます。シェルはマッチするファイルのリストに展開するので、引数の数が膨れることがあります。Globでマッチする前に、パスを絶対パスにしておきます。そうでないと、作業フォルダが現在のシェル自身の作業フォルダとずれている場合に、相対パスでマッチするファイルが変わってしまうので要注意です。

```go
func expandPath(dir, workDir string) string {
	if filepath.IsAbs(path) {
		return path
	}
	return filepath.Join(workDir, path)
}

func expandWildcard(arg, workDir string) ([]string, error) {
	if !strings.ContainsAny(arg, "*?[") {
		return []string{arg}, nil
	}
	files, err := filepath.Glob(expandPath(arg, workDir))
	if len(files) == 0 {
		return nil, ErrWildcardNoMatchError
	}
	return files, err
}
```

## リダイレクトとパイプ

パイプ(`|`)がコマンド列にあったら、前のコマンドの標準出力の結果を、次のコマンドの標準入力に直接流し込む指定になります。

```go
reader, writer := io.Pipe()
c1.Stdout = writer
c2.Stdin = reader

var wg sync.WaitGroup
wg.Add(2)

go func() {
	c1.Start()
	c1.Wait()
	writer.Close()
	wg.Done()
}()
go func() {
	c2.Start()
	c2.Wait()
	wg.Done()
}()
wg.Wait()
```

標準出力のリダイレクトの場合、ファイルを開いて、標準出力につなげます。``> FILE``という形式であれば上書きなので``O_TRUNC``フラグをつけます。``>> FILE``という形式であれば、``O_APPEND``をつけます。

```go

flag := os.O_CREATE | os.O_WRONLY
if append {
	flag += os.O_APPEND
} else {
	flag += os.O_TRUNC
}
f, err := os.OpenFile(p.Shell.ExpandPath(path), flag, 0o777)
defer f.Close()
if err != nil {
	return err
}
c.Stdout = f
c.Start()
c.Wait()
```

## 環境変数とワークフォルダを設定して実行

これは通常の``os/exec``の`Cmd`構造体（`exec.CommandContext()`のレスポンス)の`Dir`と`Env`に格納してあげると、実行時に考慮されます。`Start()`を呼ぶ前に設定しましょう。

```go
cmd.Dir = workDir
var env []string
for key, value := range envs {
	env = append(env, key + "=" + value)
}
cmd.Env = env
```

# まとめ

これらのコーディングの要素を駆使すればコマンドシェルが実装できるでしょう。コマンドをパースしたタイミングで、内部コマンドとして実装したコマンドがあればそれを、なければ外部コマンドの実行をするようにすることになるでしょう。内部コマンドが充実すればするほど、OS間のポータビリティもあがると思います。

一年ぐらい前に、Markdownに書かれているコード片をパースして処理する処理系作れば、Go関連のタスク実行の手段でmakeを使っている代わりが作れるのではないか、ということで、ぼちぼち調べたりしていました。Markdownなら、文芸的プログラミング的だし、きっとメンテナンス性も良いだろうと。ただし作るからにはある程度インストール系のタスクで使われるコマンドをいろいろ内部コマンドとして作り込もうとしたり、リダイレクトとかバッククオートとかいろいろ対応しなきゃ、ということで長らくのんびり作業をしておりました。

それはそうと、「シェルをどう学べばいいか」というTwitterで話題になることについて、「内部の挙動を知れば解になるだろう」ということでシェルっぽいものを作っていた知識を書き出してみたのが今回の発表です。もちろん、トップダウンで使い方から学ぶ方が良い人もいれば、今回のようにボトムアップで学んだ方がイメージがつきやすい人もいるはずで、後者の人のヒントになれば、と思っています。


