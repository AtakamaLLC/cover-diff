[![Build Status](https://travis-ci.com/AtakamaLLC/cover-diff.svg?branch=master)](https://travis-ci.com/AtakamaLLC/cover-diff)
[![codecov](https://codecov.io/gh/AtakamaLLC/cover-diff/branch/master/graph/badge.svg)](https://codecov.io/gh/AtakamaLLC/cover-diff)

# cover-diff

Report & enforce diff coverage on diffs only.

### Install:

```
npm install @atakama/cover-diff
```

### Use:

Pipe in diffs, get an lcov file out.

```bash
git diff origin/master | cover-diff > diff-cover.lcov
genhtml diff-cover.lcov -o diff-cover
```

### Options:

Options are located in the `package.json` for your project.  The default lcov path is the same as the istanbul default output path.

```bash
"@atakama/cover-diff" : {
    "lines" : 80,
    "branches" : 70,
    "functions" : 100,
    "lcovFile" : "coverage/lcov.info",
    "diffFile" : \<stdin\>,
}
```

### [Changelog](./CHANGELOG.md)
