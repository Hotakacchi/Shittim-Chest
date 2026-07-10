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

iPad（タブレット）専用。iOS/iPadOSでの動作を想定しています。

## インストール方法（AltStoreでのサイドロード）

本アプリはApple Developer Program（有料）を利用せず、無料のApple IDで動作する[AltStore](https://faq.altstore.io/) を使ってサイドロードする形で配布しています。

1. 自分のiPadにAltStore（Classic）をインストール
2. AltStoreの「Sources」タブで以下のURLを追加

   ```
   https://raw.githubusercontent.com/Hotakacchi/Shittim-Chest/main/altstore-source.json
   ```

3. 一覧に表示される「シッテムの箱」からインストール
4. 初回のみ、自分のPCでAltServerを起動し、自分のApple IDでペアリングが必要

新しいバージョンが公開されると、AltStore上でアップデート通知が届きます。

## 開発

```bash
npm install
npx expo start
```

Expo SDK 54を使用しています。iOS実機ビルドはGitHub Actions（`.github/workflows/build-ios-unsigned.yml`）でmacOSランナー上でビルドし、未署名の `.ipa` をアーティファクト/Releaseとして出力しています。
