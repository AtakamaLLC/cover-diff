const test = require('@atakama/qtest')
const assert = test.assert
const coverDiff = require('./cover-diff')
const fs = require('fs')
const util = require('util')

test.before = (ctx) => {
    ctx.cd = new coverDiff()
}

test('opts', async (ctx) => {
    const opts = await ctx.cd.getOpts()
    ctx.log("opts:", opts)
    assert.equal(opts.lines, 95)
    assert.ok(opts.lcovFile)
})

test('diff', async (ctx) => {
    const diff = await ctx.cd.getDiff({diffFile: "./test-data/diffs"})
    ctx.log("diff:", diff[0])
    assert.equal(diff[0].to, ".eslintrc")
})

test('lcov', async (ctx) => {
    const lcov = await ctx.cd.getLcov({lcovFile: "./test-data/coverage/lcov.info"})
    ctx.log("lcov:", lcov[0])
    assert.equal(lcov[0].lines.details.length, 11)
    assert.equal(lcov[0].file, "lib/Constants.js")
})

test('trim', async (ctx) => {
    const diff = await ctx.cd.getDiff({diffFile: "./test-data/diffs"})
    const lcov = await ctx.cd.getLcov({lcovFile: "./test-data/coverage/lcov.info"})
    const trim = await ctx.cd.trimLcov(diff, lcov)
    ctx.log("trim:", trim)
    assert.equal(trim[0].lines.details.length, 1)
    assert.equal(lcov[0].file, "lib/Constants.js")
})

test('out', async (ctx) => {
    const diff = await ctx.cd.getDiff({diffFile: "./test-data/diffs"})
    const lcov = await ctx.cd.getLcov({lcovFile: "./test-data/coverage/lcov.info"})
    const trim = await ctx.cd.trimLcov(diff, lcov)
    const out = await ctx.cd.toLcov(trim)
    const expect = await util.promisify(fs.readFile)("./test-data/expected", "utf-8")
    assert.equal(out, expect)
})

var cli = test.scope(null, {parallel: false})

cli.beforeAll = () => {
    process.chdir("./test-data")
}

cli.afterAll = () => {
    process.chdir("..")
}

cli('basic', async () => {
    const cp = require('child_process');
    const diffs = await util.promisify(fs.readFile)("./diffs", "utf-8")
    const out = cp.execFileSync(process.execPath, ['../cli.js'], {
        input: diffs 
    })
    const expect = await util.promisify(fs.readFile)("./expected", "utf-8")
    assert.equal(out, expect)
})

test.run()
