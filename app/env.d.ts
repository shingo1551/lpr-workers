import 'hono'

declare global {
  const __APP_VERSION__: string
}

declare module 'hono' {
  interface ContextRenderer {
    (content: string | Promise<string>, props: { title: string }): Response | Promise<Response>
  }
}
