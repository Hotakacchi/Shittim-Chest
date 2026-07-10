# シッテムの箱 for Tablet

Blue Archive 風「タブレット専用OS」を模した個人用ダッシュボードアプリです。Expo (React Native) で構築されており、起動するとSchaleロゴのブートアニメーションを経て、独自のランチャー画面（アプリアイコングリッド）が立ち上がります。タブレット以外（スマートフォン）で起動すると、世界観に沿った拒否画面が表示されます。

## 主な機能

- **ブートアニメーション**: Schaleロゴのグリッチ演出付き起動画面。起動時にEAS Update経由でアップデートの自動確認・適用を行う
- **ホーム画面（ランチャー）**: 長押しでアイコンの並び替えが可能なタイルグリッド。配置は端末に保存され、縦横画面それぞれで独立したレイアウトを保持
- **CLOCK**: 時計アプリ
- **SCHEDULE**: カレンダー・予定管理アプリ
- **TASK**: ToDoリストアプリ
- **CAMERA**: カメラ撮影アプリ
- **GALLERY**: 撮影した写真の閲覧アプリ
- **SYSTEM**: アプリ情報・バージョン確認などの設定アプリ
- **タブレット専用ロック**: スマートフォンでの起動を検知し、専用の拒否画面を表示

## 対象デバイス

iPad（タブレット）専用。iOS/iPadOSでの動作を想定しています（Androidタブレットでもビルドは配布していますが、タブレット専用ロックの判定はiOS向け設計です）。

## インストール方法

本アプリはApple Developer Program（有料）を使わず、無料のApple IDで動作するサイドロードツールで配布しています。どちらも[Releases](https://github.com/Hotakacchi/Shittim-Chest/releases)から`.ipa`を入手して使います。

### iOS: Sideloadlyでのサイドロード

1. PCに以下をインストール
   - [iTunes（Apple公式サイト版。Microsoft Store版は不可）](https://www.apple.com/itunes/)
   - [Sideloadly](https://sideloadly.io/)
2. [Releases](https://github.com/Hotakacchi/Shittim-Chest/releases) から最新の `.ipa` をダウンロード
3. iPadをUSBケーブルでPCに接続し、「このコンピュータを信頼」を選択
4. Sideloadlyを起動し、上部の「iDevice」欄で自分のiPadが選択されていることを確認
5. ダウンロードした `.ipa` を中央のIPA欄にドラッグ＆ドロップ（またはクリックして選択）
6. 「Apple ID」欄に自分のApple IDを入力
7. 「Start」をクリックしてインストール開始
8. インストール後、iPad側で「設定 > 一般 > VPNとデバイス管理」から証明書を信頼する
9. iOS 16以降では「設定 > プライバシーとセキュリティ > デベロッパモード」を有効にして再起動

無料のApple IDによる署名は**7日ごとに期限切れ**になります。AltStoreのような自動再署名機能はSideloadly単体にはないため、期限が切れる前に同じ手順（3〜7）を繰り返して再インストールしてください。

### iOS: AltStoreでのサイドロード

自分だけでなく友達にも配りたい場合、AltStore（Classic）+ カスタムソースを使うと、`.ipa`を都度手渡す代わりに「ソースを1回登録するだけ」で済みます。

1. PCに[AltServer](https://faq.altstore.io/getting-started/installation)（+ iTunes）をインストールし、常駐させる
   - Windows環境では稀にAltServerが「iCloud」コンポーネントの検出に失敗して動かないことがあります。その場合は上記のSideloadly方式を使ってください
2. iPadにAltStoreをインストール（初回はAltServerとPCをUSB/同一Wi-Fiで接続して行う）
3. AltStoreの「Sources」タブで以下のURLを追加

   ```
   https://raw.githubusercontent.com/Hotakacchi/Shittim-Chest/main/altstore-source.json
   ```

4. 一覧に表示される「シッテムの箱」からインストール
5. AltStoreの「Background Refresh」を有効にし、AltServerが動くPCと定期的に同じWi-Fiに接続しておけば、7日ごとの再署名が自動化されます

新しいバージョンが出た場合、Releaseと`altstore-source.json`を更新すれば、AltStore側にアップデート通知が届きます（JS側だけの変更はアプリ内のEAS Updateで自動反映されます）。

### Android: APKを直接インストール

Androidは署名の縛りがなく、GitHub Actionsで作った`.apk`をそのままインストールできます。

1. [Releases](https://github.com/Hotakacchi/Shittim-Chest/releases) から最新の `.apk` をダウンロード
2. 端末の設定で「提供元不明のアプリ」のインストールを許可する
3. ダウンロードした`.apk`を開いてインストール

再署名や期限切れの概念自体がないため、一度インストールすればそのまま使い続けられます。新しいバージョンが出た場合は、同じ手順で`.apk`を上書きインストールしてください。

## 開発

```bash
npm install
npx expo start
```

Expo SDK 54を使用しています。iOS実機ビルドはGitHub Actions（`.github/workflows/build-ios-unsigned.yml`）でmacOSランナー上でビルドし、未署名の `.ipa` をアーティファクト/Releaseとして出力しています。
