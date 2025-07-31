import 'dotenv/config'
import { RPCHandler } from '@orpc/server/fetch'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import { auth } from './lib/auth'
import { createContext } from './lib/context'
import { appRouter } from './routers/index'
import { setupSSERoutes } from './routes/sse'

const app = new Hono()

app.use(logger())
app.use(
  '/*',
  cors({
    origin: (process.env.CORS_ORIGINS || '').split(',').filter(Boolean),
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization', 'x-requested-with'],
    credentials: true,
  })
)

app.on(['POST', 'GET', 'OPTIONS'], '/api/auth/**', (c) =>
  auth.handler(c.req.raw)
)

const handler = new RPCHandler(appRouter)
app.use('/rpc/*', async (c, next) => {
  const context = await createContext({ context: c })
  const { matched, response } = await handler.handle(c.req.raw, {
    prefix: '/rpc',
    context,
  })

  if (matched) {
    return c.newResponse(response.body, response)
  }
  await next()
})

app.get('/', (c) => {
  return c.text('OK')
})

// Setup SSE routes
setupSSERoutes(app)

import { serve } from '@hono/node-server'

serve(
  {
    fetch: app.fetch,
    port: 3000,
  },
  (info) => {
    console.log(`Server is running on http://localhost:${info.port}`)
  }
)
