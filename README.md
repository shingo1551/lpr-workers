# Plate Lens

ブラウザカメラの映像からガイド枠内を切り出し、Cloudflare Workers AI の Vision モデルで日本のナンバープレートの一連指定番号4桁を認識する HonoX アプリです。

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

`wrangler.jsonc` に Workers AI binding を設定済みです。初回利用時には Cloudflare ダッシュボードで Workers AI を有効にしてください。現在の Vision モデルは `@cf/meta/llama-3.2-11b-vision-instruct` です。Meta のライセンス同意が求められる場合は、Cloudflare の案内に従ってモデルに `prompt: "agree"` を一度送ってください。

## 動作

- カメラ映像のガイド枠内を約2.2秒ごとに JPEG 画像として `/api/recognize` に送信します。
- Worker は Workers AI に画像を渡して、ナンバープレートの一連指定番号4桁を読み取ります。
- 画像はアプリ側で保存しません。カメラ映像は利用者が「停止」を押すまで送信されます。

本アプリは認識支援の試作です。照明、距離、角度、モデルの特性により誤認識することがあります。
