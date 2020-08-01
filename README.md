## 说明

`js-image-compressor` 是一个实现轻量级图片压缩的 `javascript` 库，压缩后仅有 `5KB`，在前端页面即可实现对图片的压缩。在提供基本图片压缩功能同时，还进行边界情况处理以及其他功能特色：

- 可以对待转化图片大小设置一定的阈值，使得图片转化成 `png` 格式在不理想情况下不至于过大，同时大于这个阈值则可以自动转化成 `jpeg` 格式，实现更优压缩；
- 可以限制输出图片宽高大小，从而防止意外情况发生，比如压缩运算过大使得浏览器奔溃；
- 默认对 `png` 输出图片添加透明底色，其他格式设为白色，避免“黑屏”发生；
- 提供一些图片处理的常用工具函数，用户还可以自定义图片输出的样式特征（比如可以灰度处理、加水印）。

## 使用

### 安装引入

你可以通过npm去安装依赖：

```js
npm install js-image-compressor --save-dev
```

也可以在下载后，在 `dist` 目录下找到 `image-compress.min.js` 文件在页面中通过 `script` 引入：

```html
<script src="../dist/image-compressor.js"></script>
```

### 案例

```js
var options = {
  file: file,
  quality: this.quality,
  mimeType: this.mimeType,
  maxWidth: this.maxWidth,
  maxHeight: this.maxHeight,
  width: this.width,
  height: this.height,
  minWidth: this.minWidth,
  minHeight: this.minHeight,
  convertSize: this.convertSize,
  loose: this.loose,

  // 压缩前回调
  beforeCompress: function (result) {
    vm.btnText = '处理中...';
    vm.imgName = result.name;
    vm.originImgWidth = result.width;
    vm.originImgHeight = result.height;
    vm.originSize = result.size;
    vm.originMimeType = result.type;
    console.log('压缩之前图片尺寸大小: ', result.size);
    console.log('mime 类型: ', result.type);
    // 将上传图片在页面预览
    ImageCompressor.file2DataUrl(result, function (url) {
      vm.originImgUrl = url;
    })
  },

  // 图片绘画前
  beforeDraw: function (ctx) {
    vm.btnText = '准备绘图...';
    console.log('准备绘图...');
    ctx.filter = 'grayscale(100%)';
  },

  // 图片绘画后
  afterDraw: function (ctx, canvas) {
    vm.btnText = '绘图完成...';
    console.log('绘图完成...');
    ctx.fillStyle = '#fff';
    ctx.font = (canvas.width * 0.1) + 'px microsoft yahei';
    ctx.fillText('wuwhs', 20, canvas.height - 20);
  },

  // 压缩成功回调
  success: function (result) {
    vm.btnText = BTN_OK;
    console.log('result: ', result)
    console.log('压缩之后图片尺寸大小: ', result.size);
    console.log('mime 类型: ', result.type);
    console.log('实际压缩率： ', ((file.size - result.size) / file.size * 100).toFixed(2) + '%');

    vm.outputImgWidth = result.width;
    vm.outputImgHeight = result.height;
    vm.outputSize = result.size;
    vm.outputMimeType = result.type;
    vm.compressRatio = ((file.size - result.size) / file.size * 100).toFixed(2) + '%';

    // 生成压缩后图片在页面展示
    ImageCompressor.file2DataUrl(result, function (url) {
      vm.outputImgUrl = url;
    })
    // 上传到远程服务器
    // util.upload('/upload.png', result);
  },

  // 发生错误
  error: function (msg) {
    vm.btnText = BTN_OK;
    console.error(msg);
  }
};

new ImageCompressor(options);
```


## API
