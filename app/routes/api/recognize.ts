import { createRoute } from 'honox/factory'

type Env = { AI: Ai }

const MAX_IMAGE_CHARS = 5_000_000
const MODEL = '@cf/meta/llama-3.2-11b-vision-instruct'

function extractPlateText(value: unknown): string | null {
  if (typeof value === 'string') {
    const text = value.trim().replace(/^```(?:json)?\s*|\s*```$/gi, '').trim()
    let jsonText = text
    try {
      return extractPlateText(JSON.parse(jsonText))
    } catch {
      const start = text.indexOf('{')
      const end = text.lastIndexOf('}')
      if (start < 0 || end <= start) return null
      jsonText = text.slice(start, end + 1)
      try {
        return extractPlateText(JSON.parse(jsonText))
      } catch {
        return null
      }
    }
  }

  if (!value || typeof value !== 'object') return null
  const record = value as Record<string, unknown>
  if (Object.prototype.hasOwnProperty.call(record, 'plate')) {
    if (typeof record.plate !== 'string') return null
    const plateText = record.plate.trim()
    const normalized = plateText.replace(/[\s\-‐‑‒–—]/g, '')
    const looksLikeJapanesePlate = /^[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}]{1,8}\d{2,3}[\p{Script=Hiragana}\p{Script=Katakana}]\d{1,4}$/u.test(normalized)
    return looksLikeJapanesePlate ? plateText : null
  }
  for (const key of ['response', 'plateText', 'text', 'output']) {
    if (key in record) return extractPlateText(record[key])
  }
  return null
}

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
        '画像に写っている自動車のナンバープレートを読み取ってください。',
        '日本のナンバープレートを優先し、地名、分類番号、ひらがな、一連指定番号をできるだけ正確に読み取ってください。',
        'plate の文字列は地域名、分類番号、ひらがな、一連指定番号の順に並べ、要素の間を空白で区切ってください。',
        'プレートが見つからない場合は plate を null にし、読めない文字を推測で補わないでください。',
        '説明文を加えず、plate と confidence (high, medium, low) の2項目を持つ JSON オブジェクトだけを返してください。plate には画像で読み取った文字列を入れてください。',
      ].join('\n'),
      image: body.image,
      max_tokens: 120,
      temperature: 0,
    })
    return c.json({ plateText: extractPlateText(result.response ?? result) })
  } catch (error) {
    console.error('Workers AI recognition failed', error)
    return c.json({ error: 'Vision AI の呼び出しに失敗しました。少し待ってから再度お試しください。' }, 502)
  }
})

export default createRoute((c) => c.text('Method Not Allowed', 405))
