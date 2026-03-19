import express from 'express'
import cors from 'cors'

const app = express()
const PORT = 9000

app.use(cors())
app.use(express.json())

app.get('/health', (_req, res) => {
  res.json({ ok: true, port: PORT })
})

app.listen(PORT, () => {
  console.log(`Backend running at http://localhost:${PORT}`)
})
