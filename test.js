const test = require('qtest')
const assert = test.assert

test('basic', async (ctx) => {
  const my = test.runner()

  my.add('t1', async (ctx) => {
    ctx.log('loggy', 'log')
    assert.equal(1, 1)
  })

  let results = await my.run()

  ctx.log(JSON.stringify(results))

  assert.equal(results.passed, 1)
  assert.equal(results.tests.t1.ok, true)
  assert.equal(results.tests.t1.log[0][1], 'loggy')
})
