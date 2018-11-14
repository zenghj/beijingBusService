function errorResponse (data = {}) {
  let ctx = this;
  let result = Object.assign({
    state: -1,
    msg: 'something error',
    error: null,
  }, data);
  ctx.body = result;
}

function successResponse (data = {}) {
  let ctx = this;
  ctx.body = {
    state: 1,
    result: data
  };
}

module.exports = {
  successResponse,
  errorResponse,
}