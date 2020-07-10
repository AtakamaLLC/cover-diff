const fs = require('fs')
const util = require('util')
const findUp = require('find-up');
const getStdin = require('get-stdin');
const parseDiff = require('parse-diff');
const parseLcov = util.promisify(require('lcov-parse'));
const readFile = util.promisify(fs.readFile);
const path = require('path');


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

const SECTIONS = ["lines", "branches", "functions"]

class CoverDiff {
    constructor() {
        this.defaultOpts = {lcovFile: "coverage/lcov.info", diffFile: null, fixPathSep: process.platform === "win32"}
    }
    
    normalPath(filePath, opts) {
        filePath = path.normalize(filePath)
        if (opts.fixPathSep) {
            filePath = filePath.replace(/\\/g, '/')
        }
        return filePath
    }

    stripPath(filePath, opts) {
        let stripRoot = opts.stripRoot
        if (!Array.isArray(stripRoot)) {
            stripRoot = stripRoot ? [stripRoot] : []
        }
       
        for (let strip of stripRoot) {
            const newPath = path.relative(strip, filePath)
            if (newPath.slice(0,2) === "..")
                continue
            filePath = newPath
        }
        filePath = this.normalPath(filePath, opts)
        return filePath
     }

    summarizeCov(lcov) {
        let summary = SECTIONS.reduce((a,b)=>(a[b]={hit:0, found:0}, a),{})     // eslint-disable-line no-sequences
        for (const ent of lcov) {
            for (const sec of SECTIONS) {
                if (ent[sec]) {
                    summary[sec].hit += ent[sec].hit
                    summary[sec].found += ent[sec].found
                }
            }
        }
        return summary
    }

    checkCov(summ, opts) {
        for (const sec of SECTIONS) {
            if (opts[sec] > 0 && summ[sec].found > 0) {
                const pct = 100 * summ[sec].hit/summ[sec].found
                const expected = opts[sec]
                if (pct < expected) {
                    process.exitCode = 1
                    if (!opts.quiet) 
                        console.error("# cover-diff:", sec, pct, "<", expected)
                }
            }
        }
    }

    async run() {
        try {
            const opts = await this.getOpts()
            if (!opts.quiet)
                console.error("# cover-diff:", JSON.stringify(opts))
            const diffs = await this.getDiff(opts)
            if (!diffs.length) {
                console.error("# cover-diff: invalid/empty diff")
                process.exitCode = 1 
                return
            }
            const lcov = await this.getLcov(opts)
            const newCov = this.trimLcov(diffs, lcov, opts)
            const summary = this.summarizeCov(newCov)
            this.checkCov(summary, opts)
            const outF = this.toLcov(newCov)
            process.stdout.write(outF)
        } catch (e) {
            console.error("# cover-diff: ERROR", e)
        }
    }

    async getOpts() {
        const fil = await findUp('package.json')
        if (!fil) return {}
        const pkg = JSON.parse(await readFile(fil))
        const opts = pkg["@atakama/cover-diff"] || {}
        const stripRoot = path.dirname(fil)
        return {stripRoot, ...this.defaultOpts, ...opts}
    }

    async getDiff(opts) {
        const diff = opts.diffFile ? await readFile(opts.diffFile, {encoding: "utf-8"}) : await getStdin()
        const res = await parseDiff(diff)
        return res
    }

    async getLcov(opts) {
        try {
            return await parseLcov(opts.lcovFile)
        } catch (e) {
            console.error("# cover-diff: coverage parser failed")
            throw(e)
        }
    }

    diffMap(diffs, opts) {
        const ret = new Map()
        for (let diff of diffs) {
            const fname = this.normalPath(diff.to, opts)
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
                for (const ln of ent.functions.details) {
                    print("FN:", ln.line, ",", ln.name)
                    print("FNDA:", ln.hit, ",", ln.name)
                }
                print("FNF:", ent.functions.found)
                print("FNH:", ent.functions.hit)
            }
            if (ent.branches && ent.branches.details.length) {
                for (const ln of ent.branches.details) {
                    print("BRDA:", ln.line, ",", ln.block, ",", ln.branch, ",", ln.taken?ln.taken:"-")
                }
                print("BRF:", ent.branches.found)
                print("BRH:", ent.branches.hit)
            }
            for (const ln of ent.lines.details) {
                print("DA:", ln.line, ",", ln.hit)
            }
            print("FNF:", ent.lines.found)
            print("FNH:", ent.lines.hit)
            print("end_of_record")
        }
        if (lcov.length === 0) {
            print("end_of_record")
        }
        return out
    }

    trimLcov(diffs, lcov, opts) {
        const dmap = this.diffMap(diffs, opts)
        let newCov = []
        for (const ent of lcov) {
            diffs = dmap[this.stripPath(ent.file, opts)]
            if (!diffs) continue
            let newDeets
            for (const section of SECTIONS) {
                newDeets = []
                let hits = 0, tots = 0
                for (const deet of ent[section].details) {
                    if (diffs.isIn(deet.line)) {
                        newDeets.push(deet)
                        if (deet.hit || deet.taken > 0) {
                            hits += 1
                        }
                        tots += 1
                    }
                }
                ent[section].hit = hits
                ent[section].found = tots
                ent[section].details = newDeets
            }
            if (ent.lines.details.length) {
                newCov.push(ent)
            }
        }
        return newCov
    }
}

module.exports = CoverDiff
