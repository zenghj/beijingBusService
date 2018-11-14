const Koa = require('koa');
const app = new Koa();

const contextMixins = require('./contextMixins');
const router = require('./router')
const PORT = 7777
Object.assign(app.context, contextMixins);

app.use(router.routes())

app.listen(7777, err => {
  if(err) {
    console.error(err);
  } else {
    console.log(`listening on http://127.0.0.1:${PORT}`)
  }
})