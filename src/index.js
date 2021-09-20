var WIN = window
var REGEXP_IMAGE_TYPE = /^image\//
var REGEXP_EXTENSION = /\.\w+$/
var util = {}
var defaultOptions = {
  file: null,
  quality: 0.8,
  convertSize: 2048000,
  loose: true,
  redressOrientation: true,
}

/**
 * 判断是否为函数
 * @param {Any} value 任意值
 * @returns {Boolean} 判断结果
 */
var isFunc = function (value) {
  return typeof value === 'function'
}

/**
 * 判断是否为图片类型
 * @param {String} value 类型字符串
 * @returns {Boolean} 判断结果
 */
var isImageType = function (value) {
  return REGEXP_IMAGE_TYPE.test(value)
}

/**
 * 图片类型转化为文件拓展名
 * @param {String} value
 */
var imageTypeToExtension = function (value) {
  var extension = isImageType(value) ? value.substr(6) : ''
  if (extension === 'jpeg') {
    extension = 'jpg'
  }
  return '.' + extension
}

/**
 * 图片压缩构造函数
 * @param {Object} options 相关参数
 */
function ImageCompressor(options) {
  options = Object.assign({}, defaultOptions, options)
  this.options = options
  this.file = options.file
  this.image = null
  this.ParsedOrientationInfo = null
  this.init()
}

var _proto = ImageCompressor.prototype
// WIN.ImageCompressor = ImageCompressor;
export default ImageCompressor

/**
 * 初始化
 */
_proto.init = function () {
  var _this = this
  var file = this.file
  var options = this.options

  if (!file || !isImageType(file.type)) {
    _this.error('请上传图片文件!')
    return
  }

  if (!isImageType(options.mimeType)) {
    options.mimeType = file.type
  }

  util.file2Image(
    file,
    function (img) {
      if (isFunc(_this.beforeCompress)) {
        _this.image = img
        file.width = img.naturalWidth
        file.height = img.naturalHeight
        _this.beforeCompress(file)
      }

      if (file.type === 'image/jpeg' && options.redressOrientation) {
        _this.getParsedOrientationInfo(function (info) {
          _this.parsedOrientationInfo = info
          _this.rendCanvas()
        })
      } else {
        _this.parsedOrientationInfo = {
          rotate: 0,
          scaleX: 1,
          scaleY: 1,
        }
        _this.rendCanvas()
      }
    },
    _this.error
  )
}

/**
 * `Canvas` 渲染模块
 */
_proto.rendCanvas = function () {
  var _this = this
  var options = this.options
  var image = this.image
  var edge = this.getExpectedEdge()
  var dWidth = edge.dWidth
  var dHeight = edge.dHeight
  var width = edge.width
  var height = edge.height

  var canvas = util.image2Canvas(
    image,
    dWidth,
    dHeight,
    _this.beforeDraw.bind(_this),
    _this.afterDraw.bind(_this),
    width,
    height
  )

  util.canvas2Blob(
    canvas,
    function (blob) {
      if (blob) {
        blob.width = canvas.width
        blob.height = canvas.height
      }
      _this.success(blob)
    },
    options.quality,
    options.mimeType
  )
}

/**
 * 压缩之前，读取图片之后钩子函数
 */
_proto.beforeCompress = function () {
  if (isFunc(this.options.beforeCompress)) {
    this.options.beforeCompress(this.file)
  }
}

/**
 * 获取用户想要输出的边（宽高）
 */
_proto.getExpectedEdge = function () {
  var image = this.image
  var parsedOrientationInfo = this.parsedOrientationInfo
  var rotate = parsedOrientationInfo.rotate
  var options = this.options
  var naturalWidth = image.naturalWidth
  var naturalHeight = image.naturalHeight

  var is90DegreesRotated = Math.abs(rotate) % 180 === 90
  var temp

  if (is90DegreesRotated) {
    temp = naturalHeight
    naturalHeight = naturalWidth
    naturalWidth = temp
  }

  var aspectRatio = naturalWidth / naturalHeight
  var maxWidth = Math.max(options.maxWidth, 0) || Infinity
  var maxHeight = Math.max(options.maxHeight, 0) || Infinity
  var minWidth = Math.max(options.minWidth, 0) || 0
  var minHeight = Math.max(options.minHeight, 0) || 0
  var width = Math.max(options.width, 0) || naturalWidth
  var height = Math.max(options.height, 0) || naturalHeight

  if (maxWidth < Infinity && maxHeight < Infinity) {
    if (maxHeight * aspectRatio > maxWidth) {
      maxHeight = maxWidth / aspectRatio
    } else {
      maxWidth = maxHeight * aspectRatio
    }
  } else if (maxWidth < Infinity) {
    maxHeight = maxWidth / aspectRatio
  } else if (maxHeight < Infinity) {
    maxWidth = maxHeight * aspectRatio
  }

  if (minWidth > 0 && minHeight > 0) {
    if (minHeight * aspectRatio > minWidth) {
      minHeight = minWidth / aspectRatio
    } else {
      minWidth = minHeight * aspectRatio
    }
  } else if (minWidth > 0) {
    minHeight = minWidth / aspectRatio
  } else if (minHeight > 0) {
    minWidth = minHeight * aspectRatio
  }

  if (height * aspectRatio > width) {
    height = width / aspectRatio
  } else {
    width = height * aspectRatio
  }

  width = Math.floor(Math.min(Math.max(width, minWidth), maxWidth))
  height = Math.floor(Math.min(Math.max(height, minHeight), maxHeight))

  var dWidth = width
  var dHeight = height

  if (is90DegreesRotated) {
    temp = dHeight
    dHeight = dWidth
    dWidth = temp
  }

  return {
    dWidth: dWidth,
    dHeight: dHeight,
    width: width,
    height: height,
  }
}

/**
 * 获取转化后的方向信息
 * @param {Function} callback 回调函数
 */
_proto.getParsedOrientationInfo = function (callback) {
  var _this = this
  this.getOrientation(function (orientation) {
    if (isFunc(callback)) {
      callback(_this.parseOrientation(orientation))
    }
  })
}

/**
 * 获取方向
 * @param {Function} callback 回调函数
 */
_proto.getOrientation = function (callback) {
  var _this = this
  util.file2ArrayBuffer(this.file, function (result) {
    if (isFunc(callback)) {
      callback(_this.resetAndGetOrientation(result))
    }
  })
}

/**
 * 从 `array buffer` 提取 `orientation` 值
 * @param {ArrayBuffer} arrayBuffer - array buffer
 * @returns {number} `orientation` 值
 */
_proto.resetAndGetOrientation = function (arrayBuffer) {
  var dataView = new DataView(arrayBuffer)
  var orientation

  // 当图像没有正确的 Exif 信息时忽略 range error
  try {
    var littleEndian
    var app1Start
    var ifdStart

    // JPEG 图片 (以 0xFFD8 开头)
    if (dataView.getUint8(0) === 0xff && dataView.getUint8(1) === 0xd8) {
      var length = dataView.byteLength
      var offset = 2

      while (offset + 1 < length) {
        if (
          dataView.getUint8(offset) === 0xff &&
          dataView.getUint8(offset + 1) === 0xe1
        ) {
          app1Start = offset
          break
        }

        offset += 1
      }
    }

    if (app1Start) {
      var exifIDCode = app1Start + 4
      var tiffOffset = app1Start + 10

      if (util.getStringFromCharCode(dataView, exifIDCode, 4) === 'Exif') {
        var endianness = dataView.getUint16(tiffOffset)

        littleEndian = endianness === 0x4949

        if (littleEndian || endianness === 0x4d4d) {
          if (dataView.getUint16(tiffOffset + 2, littleEndian) === 0x002a) {
            var firstIFDOffset = dataView.getUint32(
              tiffOffset + 4,
              littleEndian
            )

            if (firstIFDOffset >= 0x00000008) {
              ifdStart = tiffOffset + firstIFDOffset
            }
          }
        }
      }
    }

    if (ifdStart) {
      var length = dataView.getUint16(ifdStart, littleEndian)
      var offset
      var i

      for (i = 0; i < length; i += 1) {
        offset = ifdStart + i * 12 + 2

        if (
          dataView.getUint16(offset, littleEndian) === 0x0112 /* Orientation */
        ) {
          // 8 是当前标签值的偏移
          offset += 8

          // 获取原始方向值
          orientation = dataView.getUint16(offset, littleEndian)

          // 以其默认值覆盖方向
          dataView.setUint16(offset, 1, littleEndian)
          break
        }
      }
    }
  } catch (e) {
    console.error(e)
    orientation = 1
  }
  return orientation
}

/**
 * 逆向转化Exif获取到图片的方向信息
 * @param {Number} orientation 方向标识
 * @returns {Object} 转化结果
 */
_proto.parseOrientation = function (orientation) {
  var rotate = 0
  var scaleX = 1
  var scaleY = 1

  switch (orientation) {
    // 水平翻转
    case 2:
      scaleX = -1
      break
    // 向左旋转180°
    case 3:
      rotate = -180
      break
    // 垂直翻转
    case 4:
      scaleY = -1
      break
    // 垂直翻转并且向右旋转90°
    case 5:
      rotate = 90
      scaleY = -1
      break
    // 向右旋转90°
    case 6:
      rotate = 90
      break
    // 水平翻转并且向右旋转90°
    case 7:
      rotate = 90
      scaleX = -1
      break
    // 向左旋转90°
    case 8:
      rotate = -90
      break
    default:
      break
  }

  return {
    rotate: rotate,
    scaleX: scaleX,
    scaleY: scaleY,
  }
}

/**
 * 画布上绘制图片前的一些操作：设置画布一些样式，支持用户自定义
 * @param {CanvasRenderingContext2D} ctx Canvas 对象的上下文
 * @param {HTMLCanvasElement} canvas Canvas 对象
 */
_proto.beforeDraw = function (ctx, canvas) {
  var parsedOrientationInfo = this.parsedOrientationInfo
  var rotate = parsedOrientationInfo.rotate
  var scaleX = parsedOrientationInfo.scaleX
  var scaleY = parsedOrientationInfo.scaleY
  var file = this.file
  var options = this.options
  var fillStyle = 'transparent'
  var width = canvas.width
  var height = canvas.height

  // `png` 格式图片大小超过 `convertSize`, 转化成 `jpeg` 格式
  if (file.size > options.convertSize && options.mimeType === 'image/png') {
    fillStyle = '#fff'
    options.mimeType = 'image/jpeg'
  }

  // 覆盖默认的黑色填充色
  ctx.fillStyle = fillStyle
  ctx.fillRect(0, 0, width, height)

  // 用户自定义画布样式
  if (isFunc(options.beforeDraw)) {
    options.beforeDraw.call(this, ctx, canvas)
  }

  ctx.save()

  switch (rotate) {
    case 90:
      ctx.translate(width, 0)
      break
    case -90:
      ctx.translate(0, height)
      break
    case -180:
      ctx.translate(width, height)
      break
  }

  ctx.rotate((rotate * Math.PI) / 180)
  ctx.scale(scaleX, scaleY)
}

/**
 * 画布上绘制图片后的一些操作：支持用户自定义
 * @param {CanvasRenderingContext2D} ctx Canvas 对象的上下文
 * @param {HTMLCanvasElement} canvas Canvas 对象
 */
_proto.afterDraw = function (ctx, canvas) {
  var options = this.options
  // 用户自定义画布样式
  if (isFunc(options.afterDraw)) {
    options.afterDraw.call(this, ctx, canvas)
  }
}

/**
 * 错误触发函数
 * @param {String} msg 错误消息
 */
_proto.error = function (msg) {
  var options = this.options
  if (isFunc(options.error)) {
    options.error.call(this, msg)
  } else {
    throw new Error(msg)
  }
}

/**
 * 成功触发函数
 * @param {File|Blob} result `Blob` 对象
 */
_proto.success = function (result) {
  var options = this.options
  var file = this.file
  var image = this.image
  var edge = this.getExpectedEdge()
  var naturalHeight = image.naturalHeight
  var naturalWidth = image.naturalWidth

  if (result && result.size) {
    // 在非宽松模式下，用户期待的输出宽高没有大于源图片的宽高情况下，输出文件大小大于源文件，返回源文件
    if (
      !options.loose &&
      result.size > file.size &&
      !(edge.width > naturalWidth || edge.height > naturalHeight)
    ) {
      console.warn('当前设置的是非宽松模式，压缩结果大于源图片，输出源图片')
      result = file
    } else {
      var date = new Date()

      result.lastModified = date.getTime()
      result.lastModifiedDate = date
      result.name = file.name

      // 文件 `name` 属性中的后缀转化成实际后缀
      if (result.name && result.type !== file.type) {
        result.name = result.name.replace(
          REGEXP_EXTENSION,
          imageTypeToExtension(result.type)
        )
      }
    }
  } else {
    // 在某些情况下压缩后文件为 `null`，返回源文件
    console.warn('图片压缩出了点意外，输出源图片')
    result = file
  }

  if (isFunc(options.success)) {
    options.success.call(this, result)
  }
}

/**
 * 文件转化成 `data URL` 字符串
 * @param {File} file 文件对象
 * @param {Function} callback 成功回调函数
 * @param {Function} error 取消回调函数
 */
util.file2DataUrl = function (file, callback, error) {
  var reader = new FileReader()
  reader.onload = function () {
    callback(reader.result)
  }
  reader.onerror = function () {
    if (isFunc(error)) {
      error('读取文件失败！')
    }
  }
  reader.readAsDataURL(file)
}

/**
 * 文件转化成 `ArrayBuffer`
 * @param {File} file 文件对象
 * @param {Function} callback 成功回调函数
 * @param {Function} error 取消回调函数
 */
util.file2ArrayBuffer = function (file, callback, error) {
  var reader = new FileReader()
  reader.onload = function (ev) {
    callback(ev.target.result)
  }
  reader.onerror = function () {
    if (isFunc(error)) {
      error('读取文件失败！')
    }
  }
  reader.readAsArrayBuffer(file)
}

/**
 * 从 data view 中的字符代码获取字符字符串
 * @param {DataView} dataView - The data view for read.
 * @param {number} start - 起始位置
 * @param {number} length - 读取长度
 * @returns {string} 读取结果
 */
util.getStringFromCharCode = function (dataView, start, length) {
  var str = ''
  var i

  length += start

  for (i = start; i < length; i += 1) {
    str += String.fromCharCode(dataView.getUint8(i))
  }

  return str
}

/**
 * 文件转化成 `Image` 对象
 * @param {File} file 文件对象
 * @param {Function} callback 成功回调函数
 * @param {Function} error 错误回调函数
 */
util.file2Image = function (file, callback, error) {
  var image = new Image()
  var URL = WIN.URL || WIN.webkitURL

  if (
    WIN.navigator &&
    /(?:iPad|iPhone|iPod).*?AppleWebKit/i.test(WIN.navigator.userAgent)
  ) {
    // 修复IOS上webkit内核浏览器抛出错误 `The operation is insecure` 问题
    image.crossOrigin = 'anonymous'
  }

  image.alt = file.name
  image.onerror = function () {
    if (isFunc(error)) {
      error('图片加载错误！')
    }
  }

  if (URL) {
    var url = URL.createObjectURL(file)
    image.onload = function () {
      callback(image)
      URL.revokeObjectURL(url)
    }
    image.src = url
  } else {
    this.file2DataUrl(
      file,
      function (dataUrl) {
        image.onload = function () {
          callback(image)
        }
        image.src = dataUrl
      },
      error
    )
  }
}

/**
 * `url` 转化成 `Image` 对象
 * @param {File} url `url`
 * @param {Function} callback 成功回调函数
 * @param {Function} error 失败回调函数
 */
util.url2Image = function (url, callback, error) {
  var image = new Image()
  image.src = url
  image.onload = function () {
    callback(image)
  }
  image.onerror = function () {
    if (isFunc(error)) {
      error('图片加载错误！')
    }
  }
}

/**
 * `Image` 转化成 `Canvas` 对象
 * @param {File} image `Image` 对象
 * @param {Number} dWidth 目标宽度
 * @param {Number} dHeight 目标高度
 * @param {Function} beforeDraw 在图片绘画之前的回调函数
 * @param {Function} afterDraw 在图片绘画之后的回调函数
 * @param {Number} width 宽
 * @param {Number} height 高
 * @return {HTMLCanvasElement} `Canvas` 对象
 */
util.image2Canvas = function (
  image,
  dWidth,
  dHeight,
  beforeDraw,
  afterDraw,
  width,
  height
) {
  var canvas = document.createElement('canvas')
  var ctx = canvas.getContext('2d')
  canvas.width = width || image.naturalWidth
  canvas.height = height || image.naturalHeight
  if (isFunc(beforeDraw)) {
    beforeDraw(ctx, canvas)
  }
  ctx.save()
  ctx.drawImage(image, 0, 0, dWidth, dHeight)
  ctx.restore()
  if (isFunc(afterDraw)) {
    afterDraw(ctx, canvas)
  }
  return canvas
}

/**
 * `Canvas` 转化成 `data URL` 对象
 * @param {File} file  `Canvas` 对象
 * @param {Float} quality 输出质量比例
 * @return {String} `data URL` 字符串
 */
util.canvas2DataUrl = function (canvas, quality, type) {
  return canvas.toDataURL(type || 'image/jpeg', quality)
}

/**
 * `data URL` 转化成 `Image` 对象
 * @param {File} dataUrl `data URL` 字符串
 * @param {Function} callback 成功回调函数
 * @param {Function} error 失败回调函数
 */
util.dataUrl2Image = function (dataUrl, callback, error) {
  var image = new Image()
  image.onload = function () {
    callback(image)
  }
  image.error = function () {
    if (isFunc(error)) {
      error('图片加载错误！')
    }
  }
  image.src = dataUrl
}

/**
 * `data URL` 转化成 `Blob` 对象
 * @param {File} dataUrl `data URL` 字符串
 * @param {String} type `mime`
 * @return {Blob} `Blob` 对象
 */
util.dataUrl2Blob = function (dataUrl, type) {
  var data = dataUrl.split(',')[1]
  var mimePattern = /^data:(.*?)(;base64)?,/
  var mime = dataUrl.match(mimePattern)[1]
  var binStr = atob(data)
  var len = data.length
  var arr = new Uint8Array(len)

  for (var i = 0; i < len; i++) {
    arr[i] = binStr.charCodeAt(i)
  }
  return new Blob([arr], { type: type || mime })
}

/**
 * `Blob` 对象转化成 `data URL`
 * @param {Blob} blob `Blob` 对象
 * @param {Function} callback 成功回调函数
 * @param {Function} error 失败回调函数
 */
util.blob2DataUrl = function (blob, callback, error) {
  this.file2DataUrl(blob, callback, error)
}

/**
 * `Blob`对象 转化成 `Image` 对象
 * @param {Blob} blob `Blob` 对象
 * @param {Function} callback 成功回调函数
 * @param {Function} callback 失败回调函数
 */
util.blob2Image = function (blob, callback, error) {
  this.file2Image(blob, callback, error)
}

/**
 * `Canvas` 对象转化成 `Blob` 对象
 * @param {HTMLCanvasElement} canvas `Canvas` 对象
 * @param {Function} callback 回调函数
 * @param {Float} quality 输出质量比例
 * @param {String} type `mime`
 */
util.canvas2Blob = function (canvas, callback, quality, type) {
  var _this = this
  if (!HTMLCanvasElement.prototype.toBlob) {
    Object.defineProperty(HTMLCanvasElement.prototype, 'toBlob', {
      value: function (callback, type, quality) {
        var dataUrl = this.toDataURL(type, quality)
        callback(_this.dataUrl2Blob(dataUrl))
      },
    })
  }
  canvas.toBlob(
    function (blob) {
      callback(blob)
    },
    type || 'image/jpeg',
    quality || 0.8
  )
}

/**
 * 文件上传
 * @param {String} url 上传路径
 * @param {File} file 文件对象
 * @param {Function} callback 回调函数
 */
util.upload = function (url, file, callback) {
  var xhr = new XMLHttpRequest()
  var fd = new FormData()
  fd.append('file', file)
  xhr.onreadystatechange = function () {
    if (xhr.readyState === 4 && xhr.status === 200) {
      // 上传成功
      callback && callback(xhr.responseText)
    } else {
      throw new Error(xhr)
    }
  }
  xhr.open('POST', url, true)
  xhr.send(fd)
}

for (var key in util) {
  if (util.hasOwnProperty(key)) {
    ImageCompressor[key] = util[key]
  }
}
