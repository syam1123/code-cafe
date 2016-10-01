import gulp from 'gulp';
import gulpLoadPlugins from 'gulp-load-plugins';
import browserSync from 'browser-sync';
import del from 'del';
import {
  stream as wiredep
}
from 'wiredep';
var historyApiFallback = require('connect-history-api-fallback')
const $ = gulpLoadPlugins();
const reload = browserSync.reload;

gulp.task('styles', () => {
  return gulp.src('app/styles/scss/*.scss')
    .pipe($.plumber())
    .pipe($.sourcemaps.init())
    .pipe($.sass.sync({
      outputStyle: 'expanded',
      precision: 10,
      includePaths: ['.']
    }).on('error', $.sass.logError))
    .pipe($.autoprefixer({
      browsers: ['last 1 version']
    }))
    .pipe($.sourcemaps.write())
    .pipe(gulp.dest('.tmp/styles/css'))
    .pipe(reload({
      stream: true
    }));
});

function lint(files, options) {
  return () => {
    return gulp.src(files)
      .pipe(reload({
        stream: true,
        once: true
      }))
      .pipe($.eslint(options))
      .pipe($.eslint.format())
      .pipe($.if(!browserSync.active, $.eslint.failAfterError()));
  };
}
const testLintOptions = {
  env: {
    mocha: true
  }
};

gulp.task('lint', lint('app/scripts/**/*.js'));
gulp.task('lint:test', lint('test/spec/**/*.js', testLintOptions));

gulp.task('html', ['styles'], () => {
  const assets = $.useref.assets({
    searchPath: ['.tmp', 'app', '.']
  });

  return gulp.src('app/*.html')
    .pipe(assets)
    .pipe($.if('*.js', $.uglify()))
    .pipe($.if('*.css', $.minifyCss({
      compatibility: '*'
    })))
    .pipe(assets.restore())
    .pipe($.useref())
    .pipe($.if('*.html', $.minifyHtml({
      conditionals: true,
      loose: true
    })))
    .pipe(gulp.dest('dist'));
});

gulp.task('images', () => {
  return gulp.src('app/images/**/*')
    .pipe($.if($.if.isFile, $.cache($.imagemin({
        optimizationLevel: 4,
        progressive: true,
        interlaced: true,
        multipass: true,
        svgoPlugins: [{
          cleanupIDs: false
        }]
      }))
      .on('error', function (err) {
        console.log(err);
        this.end();
      })))
    .pipe(gulp.dest('dist/images'));
});

gulp.task('fonts', () => {
  return gulp.src(require('main-bower-files')({
      filter: '**/*.{eot,svg,ttf,woff,woff2}'
    }).concat('app/fonts/**/*'))
    .pipe(gulp.dest('.tmp/fonts'))
    .pipe(gulp.dest('dist/fonts'));
});

gulp.task('rev', () => {
  var revAll = require('gulp-rev-all'),
      rev = new revAll({dontRenameFile: [/^\/favicon.ico$/g, /^\/index.html/g]}),
      revision = require('gulp-rev');
  return gulp.src('dist/**')
    .pipe(rev.revision())
    .pipe(gulp.dest('www'))
    .pipe(revision.manifest())
    .pipe(gulp.dest('manifest'));
});

gulp.task('extras', () => {
  return gulp.src([
    'app/*.*',
    'app/views/*.html',
    '!app/*.html'
  ], {
    dot: true,
    base: 'app/'
  }).pipe(gulp.dest('dist'));
});

gulp.task('clean', del.bind(null, ['.tmp', 'dist', 'www']));

gulp.task('serve', ['styles', 'setenv:local'], () => {
  browserSync({
    notify: false,
    port: 8000,
    server: {
      baseDir: ['.tmp', 'app'],
      middleware: [historyApiFallback()],
      routes: {
        '/bower_components': 'bower_components'
      }
    }
  });

  gulp.watch([
    'app/*.html',
    'app/views/*.html',
    'app/scripts/**/*.js',
    'app/images/**/*',
    '.tmp/fonts/**/*'
  ]).on('change', reload);

  gulp.watch('app/styles/**/*.scss', ['styles']);
  gulp.watch('app/fonts/**/*', ['fonts']);
  gulp.watch('bower.json', ['wiredep', 'fonts']);
});

gulp.task('serve:dist', () => {
  browserSync({
    notify: false,
    port: 9000,
    server: {
      baseDir: ['dist'],
      middleware: [historyApiFallback()]
    }
  });
});

gulp.task('serve:www', () => {
  browserSync({
    notify: false,
    port: 9000,
    server: {
      baseDir: ['www'],
      middleware: [historyApiFallback()]
    }
  });
});

gulp.task('s3', () => {
  var fs = require('fs'),
    aws = JSON.parse(fs.readFileSync('aws.json'));

  return gulp.src('dist/**')
    .pipe($.gzip({
      gzipOptions: {
        level: 9
      }
    }))
    .pipe(gulp.dest('dist'))
    .pipe($.s3(aws, {
      gzippedOnly: true
    }));
});

gulp.task('zip', () => {
  return gulp.src('www/**/**')
    .pipe($.zip('dist.zip'))
    .pipe(gulp.dest('.'));
});

gulp.task('s3upload', () => {
  var fs = require('fs'),
    zip = require('gulp-zip'),
    exec = require('gulp-exec'),
    deploy = JSON.parse(fs.readFileSync('deploy.json'));

  return gulp.src('www/**/**')
    .pipe(zip('dist.zip'))
    .pipe(gulp.dest('.'))
    .pipe($.s3(deploy))
    .pipe(exec.reporter());
});

gulp.task('copy:dev', (cb) => {
  var exec = require('child_process').exec;

  exec('scp dist.zip dev:/home/tarun/', function (err, stdout) {
    cb()
  })
});

gulp.task('copy:prod', (cb) => {
  var exec = require('child_process').exec;

  exec('scp dist.zip taxy:/home/tarun/', function (err, stdout) {
    cb()
  })
});

gulp.task('execute:dev', (cb) => {
  var exec = require('child_process').exec;

  exec('ssh dev "./deploy.sh"', function (err, stdout) {
    console.log(stdout);
    cb()
  })
});

gulp.task('execute:prod', (cb) => {
  var exec = require('child_process').exec;

  exec('ssh taxy "./deploy.sh"', function (err, stdout) {
    console.log(stdout);
    cb()
  })
});

gulp.task('setenv:local', () => {
  return gulp.src('taxyEnv.svc.json')
    .pipe($.ngConfig('taxyApp', {
      environment: 'local',
      createModule: false,
      wrap: true
    }))
    .pipe($.useref())
    .pipe(gulp.dest('app/scripts/services'))
});

gulp.task('setenv:dev', () => {
  return gulp.src('taxyEnv.svc.json')
    .pipe($.ngConfig('taxyApp', {
      environment: 'dev',
      createModule: false,
      wrap: true
    }))
    .pipe($.useref())
    .pipe(gulp.dest('app/scripts/services'))
});

gulp.task('setenv:prod', () => {
  return gulp.src('taxyEnv.svc.json')
    .pipe($.ngConfig('taxyApp', {
      environment: 'prod',
      createModule: false,
      wrap: true
    }))
    .pipe($.useref())
    .pipe(gulp.dest('app/scripts/services'))
});

gulp.task('deploy:dev', (cb) => {
  var runSequence = require('run-sequence');
  runSequence('setenv:dev', 'clean', 'build', 'rev', 's3upload', 'execute:dev', cb);
});

gulp.task('deploy:prod', (cb) => {
  var runSequence = require('run-sequence');
  runSequence('setenv:prod', 'clean', 'build', 'rev', 's3upload', 'execute:prod', cb);
});

gulp.task('jenkins-build-dev', function (cb) {
  var runSequence = require('run-sequence');
	runSequence('setenv:dev', 'clean', 'build', 'rev', 'zip', cb);
});

gulp.task('jenkins-build-prod', function (cb) {
  var runSequence = require('run-sequence');
	runSequence('setenv:prod', 'clean', 'build', 'rev', 'zip', cb);
});

gulp.task('serve:test', () => {
  browserSync({
    notify: false,
    port: 9000,
    ui: false,
    server: {
      baseDir: 'test',
      routes: {
        '/bower_components': 'bower_components'
      }
    }
  });

  gulp.watch('test/spec/**/*.js').on('change', reload);
  gulp.watch('test/spec/**/*.js', ['lint:test']);
});

// inject bower components
gulp.task('wiredep', () => {
  gulp.src('app/styles/scss/*.scss')
    .pipe(wiredep({
      ignorePath: /^(\.\.\/)+/
    }))
    .pipe(gulp.dest('app/styles/css'));

  gulp.src('app/*.html')
    .pipe(wiredep({
      ignorePath: /^(\.\.\/)*\.\./
    }))
    .pipe(gulp.dest('app'));
});

gulp.task('build', ['html', 'images', 'fonts', 'extras'], () => {
  return gulp.src('dist/**/*').pipe($.size({
    title: 'build',
    gzip: true
  }));
});

gulp.task('default', ['clean'], () => {
  gulp.start('build');
});
