[![Build Status](https://travis-ci.com/AtakamaLLC/cover-diff.svg?branch=master)](https://travis-ci.com/AtakamaLLC/cover-diff)
[![codecov](https://codecov.io/gh/AtakamaLLC/cover-diff/branch/master/graph/badge.svg)](https://codecov.io/gh/AtakamaLLC/cover-diff)

# cover-diff

Report & enforce diff coverage on diffs only.


### Install:

```
npm install @atakama/cover-diff
```


### Use:

```bash
git diff origin/master | cover-diff > diff-cover.lcov
genhtml diff-cover.lcov -o diff-cover
```

### Options:

```bash
"cover-diff" : {
    "lines" : 80,
    "branches" : 70,
    "lcovFile" : "coverage/lcov.info",
    "diffFile" : \<stdin\>,
}
```

### [Changelog](./CHANGELOG.md)

