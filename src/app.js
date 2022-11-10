const express = require('express')

const app = express()
const router = express.Router()

router.use(require('./health'))
router.use(require('./trends'))

app.set('x-powered-by', false)
app.use(router)

app.start = function start() {
  app.listen(3000, (err) => {
    if (err) {
      return (err)
    }
    console.log('App running on port 3000.') // eslint-disable-line no-console
    return 0
  })
}

module.exports = app
