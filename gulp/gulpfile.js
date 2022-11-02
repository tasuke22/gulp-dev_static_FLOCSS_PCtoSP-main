// gulpのメソッド呼び出し
// src：参照元指定、dest：出力先指定、watch：ファイル監視、series：直列処理、parallel：並列処理
const { src, dest, watch, series, parallel } = require("gulp");
const rename = require("gulp-rename");
const ejs = require("gulp-ejs");
const fs = require('fs');


// 入出力先指定
const srcBase = '../src';
const distBase = '../dist';
const srcPath = {
  css: srcBase + '/sass/**/*.scss',
  img: srcBase + '/images/**/*',
  ejs: srcBase + '/ejs/**/*.ejs'
}
const distPath = {
  css: distBase + '/css/',
  img: distBase + '/images/',
  html: distBase + '/**/*.html',
  js: distBase + '/js/**/*.js'
}


// ローカルサーバー立ち上げ
const browserSync = require("browser-sync");
const browserSyncOption = {
  server: distBase, // dist直下をルートとする
  notify: false // 通知を消す
}
const browserSyncFunc = () => {
    browserSync.init(browserSyncOption);
}
const browserSyncReload = (done) => {
    browserSync.reload();
    done();
}

// Sassコンパイル
const sass = require('gulp-sass')(require('sass')); // sassコンパイル（DartSass対応）
const sassGlob = require('gulp-sass-glob-use-forward'); // globパターンを使用可にする
const plumber = require("gulp-plumber"); // エラーが発生しても強制終了させない
const notify = require("gulp-notify"); // エラー発生時のアラート出力
const postcss = require("gulp-postcss"); // PostCSS利用
const cssnext = require("postcss-cssnext"); // 最新CSS使用を先取り
const sourcemaps = require("gulp-sourcemaps"); // ソースマップ生成
const browsers = [ // 対応ブラウザの指定
  'last 2 versions',
  '> 5%',
  'ie = 11',
  'not ie <= 10',
  'ios >= 8',
  'and_chr >= 5',
  'Android >= 5',
]
const cssSass = () => {
  return src(srcPath.css)
    .pipe(sourcemaps.init()) // ソースマップの初期化
    .pipe(
      plumber({ // エラーが出ても処理を止めない
          errorHandler: notify.onError('Error:<%= error.message %>')
      }))
    .pipe(sassGlob()) // globパターンを使用可にする
    .pipe(sass.sync({ // sassコンパイル
      includePaths: ['src/sass'], // 相対パス省略
      outputStyle: 'expanded' // 出力形式をCSSの一般的な記法にする
    }))
    .pipe(postcss([cssnext({
      features: {
        rem: false
      }
    },browsers)])) // 最新CSS使用を先取り
    .pipe(sourcemaps.write('./')) // ソースマップの出力先をcssファイルから見たパスに指定
    .pipe(dest(distPath.css)) // 
    .pipe(notify({ // エラー発生時のアラート出力
      message: 'scss has been compiled.✨',
      onLast: true
    }))
}

// 画像圧縮
const imagemin = require("gulp-imagemin"); // 画像圧縮
const imageminMozjpeg = require("imagemin-mozjpeg"); // jpgの高圧縮に必要
const imageminPngquant = require("imagemin-pngquant"); // pngの高圧縮に必要
const imageminSvgo = require("imagemin-svgo");  // svgの高圧縮に必要
const imgImagemin = () => {
  return src(srcPath.img)
  .pipe(imagemin([
    imageminMozjpeg({
      quality: 80
    }),
    imageminPngquant(),
    imageminSvgo({
      plugins: [{
        removeViewbox: false // viewBox属性を削除しない
      }]
    })],
    {
      verbose: true
    }
  ))
  .pipe(dest(distPath.img))
}

// EJS
const Ejs = () => {
  const data = JSON.parse(fs.readFileSync(srcBase + '/json/data.json'));
  return src(srcBase + '/ejs/**/!(_)*.ejs')
    .pipe(ejs(data))
    .pipe(rename({ extname: ".html" }))
    .pipe(dest(distBase))
    .pipe(notify({ // エラー発生時のアラート出力
      message: 'ejs has been compiled.✨',
      onLast: true
    }))
};

// ファイルの変更を検知
const watchFiles = () => {
  watch(srcPath.css, series(cssSass, browserSyncReload))
  watch(srcPath.img, series(imgImagemin, browserSyncReload))
  watch([srcPath.ejs, srcBase + '/json/**/*.json'], series(Ejs,browserSyncReload))
  watch(distPath.js, series(browserSyncReload))
}


// clean
const del = require('del');
const delPath = {
	css: distBase + '/css/style.css',
	cssMap: distBase + '/css/style.css.map',
  img: distBase + '/images/',
  html: distBase + '/*.html',
}
const clean = (done) => {
  del(delPath.css, { force: true });
  del(delPath.cssMap, { force: true });
  del(delPath.img, { force: true });
  del(delPath.html, { force: true });
  done();
};




// 実行
exports.default = series(series(clean,imgImagemin,cssSass,Ejs), parallel(watchFiles, browserSyncFunc));