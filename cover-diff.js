const fs = require('fs')
const util = require('util')
const findUp = require('find-up');
const getStdin = require('get-stdin');
const parseDiff = require('parse-diff');
const parseLcov = util.promisify(require('lcov-parse'));
const readFile = util.promisify(fs.readFile);

class Diff {
    constructor(chunks) {
        this.chunks = chunks.map((val)=>{return {lineStart: val.newStart, lineCount: val.newLines}})
    }

    isIn(line) {
        for (const c of this.chunks) {
            if (line >= c.lineStart && line < c.lineStart + c.lineCount) {
                return true
            }
        }
        return false
    }
}

class Main {
    constructor() {
        this.opts = {}
        this.defaultOpts = {lcovFile: "coverage/lcov.info", diffFile: null}
    }

    async run() {
        try {
            const opts = await this.getOpts()
            console.error("# cover-diff", opts)
            const diffs = await this.getDiff(opts)
            const lcov = await this.getLcov(opts)
            const newCov = this.trimLcov(diffs, lcov)
            const outF = this.toLcov(newCov)
            process.stdout.write(outF)
        } catch (e) {
            console.error("# error:", e)
        }
    }

    async getOpts() {
        const fil = await findUp('package.json')
        if (!fil) return {}
        const pkg = JSON.parse(await readFile(fil))
        const opts = pkg["@atakama/cover-diff"] || {}
        return {...this.defaultOpts, ...opts}
    }

    async getDiff(opts) {
        try {
            const diff = opts.diffFile ? await readFile(opts.diffFile, {encoding: "utf-8"}) : await getStdin()
            return await parseDiff(diff)
        } catch (e) {
            console.error("#CD: diff parser failed")
            throw(e)
        }
    }
    async getLcov(opts) {
        try {
            return await parseLcov(opts.lcovFile)
        } catch (e) {
            console.error("#CD: coverage parser failed")
            throw(e)
        }
    }

    diffMap(diffs) {
        const ret = new Map()
        for (let diff of diffs) {
            const fname = diff.to
            ret[fname] = new Diff(diff.chunks)
        }
        return ret
    }

    toLcov(lcov) {
        let out = ""
        const print = (...stuff) => {out += stuff.join("") + "\n"}

        for (const ent of lcov) {
            print("TN:", ent.title)
            if (ent.file) {
                print("SF:", ent.file)
            }
            if (ent.functions && ent.functions.details.length) {
                let hitf = 0
                let totf = 0
                for (const ln of ent.functions.details) {
                    print("FN:", ln.line, ",", ln.name)
                    print("FNDA:", ln.hit, ",", ln.name)
                    if (ln.hit) hitf += 1
                    totf += 1
                }
                print("FNF:", totf)
                print("FNH:", hitf)
            }
            if (ent.branches && ent.branches.details.length) {
                let hitf = 0
                let totf = 0
                for (const ln of ent.branches.details) {
                    print("BRDA:", ln.line, ",", ln.block, ",", ln.branch, ",", ln.taken?ln.taken:"-")
                    if (ln.hit) hitf += 1
                    totf += 1
                }
                print("BRF:", totf)
                print("BRH:", hitf)
            }
            let hitf = 0
            let totf = 0
            for (const ln of ent.lines.details) {
                print("DA:", ln.line, ",", ln.hit)
                if (ln.hit) hitf += 1
                totf += 1
            }
            print("FNF:", totf)
            print("FNH:", hitf)
        }
        print("end_of_record")
        return out
    }

    trimLcov(diffs, lcov) {
        const dmap = this.diffMap(diffs)
        let newCov = []
        for (const ent of lcov) {
            diffs = dmap[ent.file]
            if (!diffs) continue
            let newDeets
            for (const section of ["lines", "functions", "branches"]) {
                newDeets = []
                for (const deet of ent[section].details) {
                    if (diffs.isIn(deet.line)) {
                        newDeets.push(deet)
                    }
                }
                ent[section].details = newDeets
            }
            if (ent.lines.details.length) {
                newCov.push(ent)
            }
        }
        return newCov
    }
}

module.exports = Main
