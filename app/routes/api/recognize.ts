import { createRoute } from 'honox/factory'

type Env = { AI: Ai }

const MAX_IMAGE_CHARS = 5_000_000
const MODEL = '@cf/moondream/moondream3.1-9B-A2B'

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
      task: 'query',
      image: body.image,
      question: '日本の自動車ナンバープレートの一連指定番号にある数字4桁だけを読み取ってください。画像上で読める数字だけをそのまま返してください。4桁すべてを読み取れない場合は UNREADABLE とだけ返し、絶対に推測しないでください。',
      reasoning: false,
      max_tokens: 24,
      temperature: 0,
    })
    const answer = typeof result.answer === 'string' ? result.answer : ''
    const match = answer.match(/(?:^|\D)(\d(?:[\s-]?\d){3})(?:\D|$)/)
    const digits = match?.[1].replace(/\D/g, '')
    return c.json({ digits: digits?.length === 4 ? digits : null })
  } catch (error) {
    console.error('Workers AI recognition failed', error)
    return c.json({ error: 'Vision AI の呼び出しに失敗しました。少し待ってから再度お試しください。' }, 502)
  }
})

export default createRoute((c) => c.text('Method Not Allowed', 405))
