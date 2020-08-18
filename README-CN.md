## 简介

`js-image-compressor` 是一个实现轻量级图片压缩的 `javascript` 库，压缩后仅有 `5kb`，在前端页面即可实现对图片的压缩。在提供基本图片压缩功能同时，还暴露出图片处理相关公用方法，以及进行边界情况处理：

- 可以对待转化图片大小设置一定的阈值，使得图片转化成 `png` 格式在不理想情况下不至于过大，同时大于这个阈值则可以自动转化成 `jpeg` 格式，实现更优压缩；
- 可以限制输出图片宽高大小，从而防止意外情况发生，比如压缩运算过大使得浏览器奔溃；
- 默认对 `png` 输出图片添加透明底色，其他格式设为白色，避免“黑屏”发生；
- 读取 `jpeg` 格式图片的 `EXIF` 信息，矫正图片方位；
- 提供一些图片处理的常用工具函数（`image2Canvas`、`canvas2Blob` 和 `canvas2DataUrl` 等），用户还可以自定义图片输出的样式特征（比如可以灰度处理、加水印）。

文档语言：

- [英文](./README.md)
- [中文](./README-CN.md)

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

### 简单使用

你可以只传入待压缩图片对象，其他参数都是非必须的，插件按照默认参数自动完成图片压缩处理。不过这样输出的压缩图片符合以下特征：

- 默认按照 `0.8` 压缩率配置；
- 输出图片宽/高维持源图片宽/高；
- 一般的，输出图片格式保持源图片格式；
- 当 `png` 图片的 `size` 大于 `2m` 时，默认转化成 `jpeg` 格式图片；
- 给 `png` 图片填充透明色；
- 当输出图片 `size` 大于源图片时，将源图片当作输出图片返回；
- `jpeg` 格式图片，矫正翻转/旋转方向；

如果这些默认配置不能满足你的需求，可能需要其他参数配置。以下是一个简单使用配置：

```js
var options = {
  file: file,

  // 压缩前回调
  beforeCompress: function (result) {
    console.log('压缩之前图片尺寸大小: ', result.size);
    console.log('mime 类型: ', result.type);
  },

  // 压缩成功回调
  success: function (result) {
    console.log('result: ', result)
    console.log('压缩之后图片尺寸大小: ', result.size);
    console.log('mime 类型: ', result.type);
    console.log('实际压缩率： ', ((file.size - result.size) / file.size * 100).toFixed(2) + '%');
  }
};

new ImageCompressor(options);
```

其中，钩子函数 `beforeCompress` 发生在读取图片之后，创建画布之前；钩子函数 `success` 函数发生在压缩完成生成图片之后。它们回调参数 `result` 是整合来尺寸、图片类型和大小等相关信息的 `blob` 对象。

### 标准使用

在标准使用中，我们可以根据自身需求自定义配置压缩比（`quality`）、输出图片类型（`mimeType`）、宽（`width`）、高（`height`）、最大宽（`maxWidth`）、最大高（`maxHeight`）、最小宽（`minWidth`）、最大高（`minHeight`）、png转jpeg阈值（`convertSize`）、是否矫正jpeg方向（`redressOrientation`）和是否宽松模式（`loose`）。

- 是否矫正jpeg方向（`redressOrientation`），`jpeg` 格式图片在某些iOS浏览器会按其方向呈现图像，这个选项可以控制恢复初始方向，默认为 `true`；
- 是否宽松模式（`loose`）、的意思是控制当压缩的图片 `size` 大于源图片，输出源图片，否则输出压缩后图片，默认是 `true`。

以下是标准配置：

```js
var options = {
  file: file,
  quality: 0.6,
  mimeType: 'image/jpeg',
  maxWidth: 2000,
  maxHeight: 2000,
  width: 1000,
  height: 1000,
  minWidth: 500,
  minHeight: 500,
  convertSize: Infinity,
  loose: true,
  redressOrientation: true,

  // 压缩前回调
  beforeCompress: function (result) {
    console.log('压缩之前图片尺寸大小: ', result.size);
    console.log('mime 类型: ', result.type);
  },

  // 压缩成功回调
  success: function (result) {
    console.log('压缩之后图片尺寸大小: ', result.size);
    console.log('mime 类型: ', result.type);
    console.log('实际压缩率： ', ((file.size - result.size) / file.size * 100).toFixed(2) + '%');
  },

  // 发生错误
  error: function (msg) {
    console.error(msg);
  }
};

new ImageCompressor(options);
```

`error` 钩子函数是图片压缩过程中错误回调，没有这个回调错误则会在插件中 `throw new Error(msg)` 形式抛出。

### 其他钩子函数

在压缩输出图片之前，我们还可以对画布进行一些自定义处理，融入元素。

以下是对图片进行灰度和加水印处理：

```js
var options = {
  file: file,

  // 图片绘画前
  beforeDraw: function (ctx) {
    vm.btnText = '准备绘图...';
    console.log('准备绘图...');
    ctx.filter = 'grayscale(100%)';
  },

  // 图片绘画后
  afterDraw: function (ctx, canvas) {
    ctx.restore();
    vm.btnText = '绘图完成...';
    console.log('绘图完成...');
    ctx.fillStyle = '#fff';
    ctx.font = (canvas.width * 0.1) + 'px microsoft yahei';
    ctx.fillText(vm.watermarkText, 10, canvas.height - 20);
  },
};

new ImageCompressor(options);
```

`beforeDraw` 是在画布创建后，图片绘画前的钩子函数，`afterDraw` 是在图绘画后的钩子函数。

### 工具函数

下图归纳了 `js-image-compressor` 插件从用户图片通过 `input` 的 `file` 本地上传到对图片压缩的详细过程，同时暴露出这些工具方法供用户使用。

![js-image-compressor](./relation-chart.jpg)
