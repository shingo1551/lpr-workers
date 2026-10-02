import { createRoute } from 'honox/factory'

type Env = { AI: Ai }

const MAX_IMAGE_CHARS = 5_000_000
const MODEL = '@cf/meta/llama-3.2-11b-vision-instruct'

export const POST = createRoute(async (c) => {
  let body: { image?: unknown }
  try {
    body = await c.req.json()
  } catch {
    return c.json({ error: '画像データを読み取れませんでした。' }, 400)
  }

  if (typeof body.image !== 'string' || !body.image.startsWith('data:image/')) {
    return c.json({ error: 'JPEG または PNG 画像を送信してください。' }, 400)
  }
  if (body.image.length > MAX_IMAGE_CHARS) {
    return c.json({ error: '画像サイズが大きすぎます。カメラを少し離して再度お試しください。' }, 413)
  }

  try {
    const result = await (c.env as Env).AI.run(MODEL, {
      prompt: [
        '画像に写っている日本の自動車ナンバープレートから、一連指定番号の数字4桁だけを読み取ってください。',
        'ハイフンは無視して数字だけを返します。4桁すべてをはっきり確認できない場合は digits を null にし、推測で補わないでください。',
        '説明文や推測を加えず、次のJSONだけを返してください: {"digits":"1234","confidence":"high|medium|low"}',
      ].join('\n'),
      image: body.image,
      max_tokens: 120,
      temperature: 0,
    })
    return c.json({ result })
  } catch (error) {
    console.error('Workers AI recognition failed', error)
    return c.json({ error: 'Vision AI の呼び出しに失敗しました。少し待ってから再度お試しください。' }, 502)
  }
})

export default createRoute((c) => c.text('Method Not Allowed', 405))
