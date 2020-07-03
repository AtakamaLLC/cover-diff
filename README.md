[![Build Status](https://travis-ci.com/AtakamaLLC/cover-diffs.svg?branch=master)](https://travis-ci.com/AtakamaLLC/cover-diffs)
[![codecov](https://codecov.io/gh/AtakamaLLC/cover-diffs/branch/master/graph/badge.svg)](https://codecov.io/gh/AtakamaLLC/cover-diffs)

# cover-diffs

Report & enforce diff coverage on diffs only.


### Install:

```
npm install @atakama/cover-diffs
```


### Use:

```bash
git diff origin/master | cover-diffs
```

### Options:

```bash
"cover-diffs" : {
    "lines" : 80,
    "branches" : 70,
}
```

### [Changelog](./CHANGELOG.md)

