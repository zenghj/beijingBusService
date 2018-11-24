const Koa = require('koa');
var cors = require('koa-cors');
const app = new Koa();

const contextMixins = require('./contextMixins');
const router = require('./router')
const PORT = 7001
Object.assign(app.context, contextMixins);

app.use(cors());
app.use(router.routes())

app.listen(PORT, err => {
  if(err) {
    console.error(err);
  } else {
    console.log(`listening on http://127.0.0.1:${PORT}`)
  }
})