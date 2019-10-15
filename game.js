const canvas = wx.createCanvas()
const context = canvas.getContext('2d')
const fs = wx.getFileSystemManager();
const {
  windowWidth,
  windowHeight
} = wx.getSystemInfoSync()

context.fillStyle = '#FFFFFF'

context.fillRect(0, 0, windowWidth, windowHeight)
const imgPath = "images"
const plusPath = "btn/plus_72.png"
const spt = 5 //小图间隔像素px
const sn = 4 //小图数量
const sw = Math.floor((windowWidth - (sn - 1) * spt) / sn) //小图宽度
const sh = sw * 4 / 3 //小图高度

//大图起始位置以及宽高
const bh = (windowHeight - sh) * 0.8
const bw = bh * 3 / 4
const bx = (windowWidth - bw) / 2
const by = (windowHeight - bh - sh) / 2

let imgs = fs.readdirSync(imgPath);
var images = []
for (let i = 0,len = imgs.length; i < sn; i++) {
  let image = wx.createImage()
  image.onload = function() {
    if(i == sn -1){
      context.drawImage(image, (sw + spt) * i + (sw - 72) / 2, windowHeight - sh + (sh-72)/2, 72, 72)
    }else{
      context.drawImage(image, (sw + spt) * i, windowHeight - sh, sw, sh)
    }
  }

  if (i == sn - 1) {
    image.src = plusPath;
    images.push(plusPath)
    break;
  }
  image.src = imgPath + '/' + imgs[i];
  images.push(imgPath + '/' + imgs[i])
}
var areaPoint = []
var oldData
wx.onTouchMove(function(e) {
  let x = e.touches[0].clientX
  let y = e.touches[0].clientY
  if (x < bx || x > bx + bw || y < by || y > by + bh) {
    return;
  }
  areaPoint.push({
    x: x,
    y: y
  })
  if (!oldData) {
    oldData = context.getImageData(0, 0, windowWidth, windowHeight)
  } else {
    context.clearRect(0, 0, windowWidth, windowHeight)
    context.putImageData(oldData, 0, 0)
  }
  if(areaPoint.length>1){
    let x1 = areaPoint[0].x
    let y1 = areaPoint[0].y
    let w = Math.abs(x - x1)
    let h = Math.abs(y - y1)
    context.strokeStyle = "#0000ff";
    context.setLineDash([5, 5]);
    context.strokeRect(x1, y1, w, h)
  }
})

wx.onTouchEnd(function(e) {
  if (areaPoint.length > 1) {
    let x1 = areaPoint[0].x
    let y1 = areaPoint[0].y
    let x = areaPoint[areaPoint.length - 1].x
    let y = areaPoint[areaPoint.length - 1].y
    areaPoint = []
    let w = Math.abs(x - x1)
    let h = Math.abs(y - y1)
    let px = x,
      py = y
    if (x1 < x) {
      px = x1
      py = y1
    }
    context.clearRect(0, 0, windowWidth, windowHeight)
    context.putImageData(oldData, 0, 0)
    oldData = undefined
    mosaics({
      resolution: 10,
      width:w,
      height:h,
      pointX:px,
      pointY:py
    })
  }
})
wx.onTouchStart(function(e) {
  let x = e.touches[0].clientX
  let y = e.touches[0].clientY

  let index = Math.floor(x / sw)
  if (0 < ((sw + spt) * index - x) && spt > ((sw + spt) * index - x)) {
    return;
  }
  if (((sw + spt) * index - x) >= spt) {
    index--;
  }
  if(index == images.length - 1){
     //plus
    wx.chooseImage({
      count: 1,
      sizeType: ["compressed"],
      success: function (res) {
        var filePath = res.tempFilePaths[0];
        var image = wx.createImage()
        image.onload = function () {
          context.clearRect(0, 0, windowWidth, bh + by);
          context.drawImage(image, bx, by, bw, bh)
        }
        image.src = filePath
      },

      fail: function (error) {
        console.error("调用本地相册文件时出错");

        console.warn(error);
      },

      complete: function () {
        console.warn("调用本地相册文件完成");
      }
    })
    return;
  }
  if (y > windowHeight - sh && index < images.length) {
    var image = wx.createImage()
    image.onload = function() {
      context.clearRect(0, 0, windowWidth, bh + by);
      context.drawImage(image, bx, by, bw, bh)
    }
    image.src = images[index]
  }
})

function isArray(obj) {
  return Object.prototype.toString.call(obj) === "[object Array]"
}

function isObject(obj) {
  return Object.prototype.toString.call(obj) === "[object Object]"
}
const TWO_PI = Math.PI * 2
const QUARTER_PI = Math.PI * 0.25

function mosaics(opts) {

  var w = Math.floor(opts.width || 0)
  var h = Math.floor(opts.height || 0)
  var mx = opts.pointX || 0,
    my = opts.pointY || 0
  var ctx = context
  var imgData = context.getImageData(mx, my, w, h).data
  // console.log(imgData)

  // option defaults
  var res = opts.resolution || 16
  var size = opts.size || res
  var alpha = opts.alpha || 1
  var offset = opts.offset || 0
  var offsetX = 0
  var offsetY = 0
  var cols = Math.floor(w / res) + 1
  var rows = Math.floor(h / res) + 1
  var halfSize = size / 2
  var diamondSize = size / Math.SQRT2
  var halfDiamondSize = diamondSize / 2

  if (isObject(offset)) {
    offsetX = offset.x || 0
    offsetY = offset.y || 0
  } else if (isArray(offset)) {
    offsetX = offset[0] || 0
    offsetY = offset[1] || 0
  } else {
    offsetX = offsetY = offset
  }

  let row, col, x, y, pixelY, pixelX, pixelIndex, red, green, blue, pixelAlpha;

  for (row = 0; row < rows; row++) {
    y = (row - 0.5) * res + offsetY

    pixelY = Math.max(Math.min(y, h - 1), 0)

    for (col = 0; col < cols; col++) {
      x = (col - 0.5) * res + offsetX

      pixelX = Math.max(Math.min(x, w - 1), 0)
      pixelIndex = (pixelX + pixelY * w) * 4
      // console.log(pixelIndex)
      red = imgData[pixelIndex + 0]
      green = imgData[pixelIndex + 1]
      blue = imgData[pixelIndex + 2]
      pixelAlpha = alpha * (imgData[pixelIndex + 3] / 255)

      ctx.fillStyle = 'rgba(' + red + ',' + green + ',' + blue + ',' + pixelAlpha + ')'
      x = Math.max(x, 0);
      y = Math.max(y, 0);

      switch (opts.shape) {
        case 'circle':
          ctx.beginPath()
          ctx.arc(mx + x, my + y, halfSize, 0, TWO_PI, true)
          ctx.fill()
          ctx.closePath()
          break
        case 'diamond':
          ctx.save()
          ctx.translate(mx + x, my + y)
          ctx.rotate(QUARTER_PI)
          ctx.fillRect(-halfDiamondSize, -halfDiamondSize, diamondSize, diamondSize)
          ctx.restore()
          break
        default:
          // square
          ctx.fillRect(mx + x - halfSize, my + y - halfSize, size, size)
      } // switch
    } // col
  } // row
}