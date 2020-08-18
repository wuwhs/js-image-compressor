var BTN_OK = '确定';

new Vue({
  el: '#app',
  data: function () {
    return {
      file: null,
      btnText: BTN_OK,
      imgName: '',
      originImgUrl: '',
      originMimeType: 'auto',
      originSize: 0,
      originImgWidth: 'auto',
      originImgHeight: 'auto',
      outputImgUrl: '',
      outputMimeType: 'auto',
      outputImgWidth: 'auto',
      outputImgHeight: 'auto',
      outputSize: 0,
      compressRatio: 0,
      quality: 0.6,
      watermarkText: 'watermark'
    }
  },

  methods: {
    /**
     * 拖拽文件进入元素
     * @param {Event} ev 事件
     */
    dragFileEnter: function (ev) {
      ev.preventDefault();
      ev.stopPropagation();
    },

    /**
     * 拖拽文件在元素上
     * @param {Event} ev 事件
     */
    drageFileOver: function (ev) {
      ev.preventDefault();
      ev.stopPropagation();
    },

    /**
     * 放开文件拖拽
     * @param {Event} ev 事件
     */
    dropFile: function (ev) {
      ev.preventDefault();
      ev.stopPropagation();

      var dt = ev.dataTransfer;
      var file = dt.files[0];
      this.file = file;
      this.compressImage(file);
    },

    /**
     * 上传文件改变事件
     * @param {Event} ev 事件
     */
    inputChange: function (ev) {
      var file = ev.target.files[0];
      this.file = file;
      this.compressImage(file);
    },

    /**
     * 确定提交
     */
    submit: function () {
      this.compressImage(this.file);
    },

    /**
     * 压缩图片
     * @param {File} file `File` 对象
     */
    compressImage: function (file) {
      var vm = this;
      vm.btnText = '读取中...';
      var options = {
        file: file,
        quality: this.quality,

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

        // 图片绘画后
        afterDraw: function (ctx, canvas) {
          ctx.restore();
          vm.btnText = '绘图完成...';
          console.log('绘图完成...');
          ctx.fillStyle = '#fff';
          ctx.font = (canvas.width * 0.1) + 'px microsoft yahei';
          ctx.fillText(vm.watermarkText, 10, canvas.height - 20);
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
        }
      };

      new ImageCompressor(options);
    }
  }
})