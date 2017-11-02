const fastify = require('fastify')()

fastify.get('/', (req, rep) => {
  rep.send('😋')
})

fastify.get('/statusnotifier', async(req, rep) => {
  const token = req.query.token
  if (token) {
    if (token === process.env.CGP_TOKEN || require('./.env').SERVER_TOKEN) {
      delete require.cache[require.resolve('./notify')]
      await require('./notify')()
      rep.send('maru')
    }
  }
  else {
    rep.send('batu')
  }
})

fastify.listen(process.env.PORT || 8000, (err) => {
  if (err) throw err
  console.log(`server listening on ${fastify.server.address().port}`)
})
