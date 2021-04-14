# LightHouseTool

Lighthouse through the implementation of a website performance testing tool.

It's very simple to do. You only use replace url in the urlList.js.

It's also very simple to implement.
1. Run chorme with --headless and get some parameters.
2. Get performance information through Lighthouse.
3. Write information into html.
4. After file stream close, launch it with chrome. 

## The main module
```
const gulp = require('gulp');
const lighthouse = require('lighthouse');
const chromeLaumcher = require('chrome-launcher');
const printer = require('lighthouse/lighthouse-cli/printer');
const Reporter = require('lighthouse/lighthouse-core/report/report-generator');
const fs = require('fs-extra');
const del = require('del');
const urls = require('./urlList');
const path = require('path');
```

## How to use


```
git clone https://github.com/conantime/LighthouseTool.git

npm install 
```
- PC
    
```
npm run desktop
```

- Mobile
```
npm run mobile
```


Thanks https://juejin.cn/post/6950543696567730206

