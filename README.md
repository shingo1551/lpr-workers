# Plate Lens

ブラウザカメラの映像からフレームを切り出し、Cloudflare Workers AI の Vision モデルで自動車ナンバープレートを認識する HonoX アプリです。

## 公開 URL

[https://plate-reader.shingo1551.workers.dev](https://plate-reader.shingo1551.workers.dev)

iPhone では Safari で URL を開き、「カメラを起動」をタップしてカメラの使用を許可してください。

## 開発

```sh
npm install
npm run dev
```

カメラを使うには HTTPS または localhost が必要です。ブラウザでカメラの利用を許可してください。

## Cloudflare にデプロイ

```sh
npm run deploy
```

`wrangler.jsonc` に Workers AI binding を設定済みです。初回利用時には Cloudflare ダッシュボードで Workers AI を有効にしてください。現在の Vision モデルは `@cf/meta/llama-3.2-11b-vision-instruct` です。初回は Meta のライセンス同意が必要です。Cloudflare の案内に従い、モデルに `prompt: "agree"` を一度送ってください。

## 動作

- カメラ映像から約2.2秒ごとに JPEG フレームを生成して `/api/recognize` に送信します。
- Worker は Workers AI に画像を渡して、日本語ナンバーの読み取り結果を返します。
- 画像はアプリ側で保存しません。カメラ映像は利用者が「停止」を押すまで送信されます。

本アプリは認識支援の試作です。照明、距離、角度、モデルの特性により誤認識することがあります。
