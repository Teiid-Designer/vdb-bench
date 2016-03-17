var gulp = require('gulp'),
    wiredep = require('wiredep').stream,
    eventStream = require('event-stream'),
    gulpLoadPlugins = require('gulp-load-plugins'),
    map = require('vinyl-map'),
    fs = require('fs'),
    path = require('path'),
    size = require('gulp-size'),
    uri = require('URIjs'),
    s = require('underscore.string'),
    hawtio = require('hawtio-node-backend'),
    childProc = require('child_process');

var plugins = gulpLoadPlugins({});
var pkg = require('./package.json');

var config = {
  main: '.',
  js: 'plugins/**/*.js',
  less: ['./less/**/*.less', 'plugins/**/*.less'],
  templates: ['plugins/**/*.html'],
  templateModule: pkg.name + '-templates',
  pkgJs: pkg.name + '.js',
  testPkgJs: pkg.name + '-test.js',
  dist: './dist/',
  css: pkg.name + '.css',
};

gulp.task('bower', function() {
  return gulp.src('index.html')
    .pipe(wiredep({}))
    .pipe(gulp.dest('.'));
});
gulp.task('less', function () {
  return gulp.src(config.less)
    .pipe(plugins.less({
      paths: [ path.join(__dirname, 'less', 'includes') ]
    }))
    .pipe(plugins.concat(config.css))
    .pipe(gulp.dest('./dist'));
});
        .pipe(gulp.dest('.'));
});

});


gulp.task('clean', ['concat'], function() {
  return gulp.src(['templates.js', 'compiled.js'], { read: false })
    .pipe(plugins.clean());
});

gulp.task('watch', ['build', 'build-test'], function() {
  plugins.watch(['libs/**/*.js', 'libs/**/*.css', 'index.html', config.dist + '/' + config.pkgJs], function() {
    gulp.start('reload');
  });
  plugins.watch(['libs/**/*.d.ts', config.ts, config.js, config.templates], function() {
    gulp.start(['tsc', 'template', 'concat', 'clean']);
  });
  plugins.watch([config.testTs, config.testTemplates], function() {
    gulp.start(['test-tsc', 'test-template', 'test-concat', 'test-clean']);
  });
  plugins.watch(config.less, function(){
    gulp.start('less', 'reload');
  })
});


gulp.task('connect', ['watch'], function() {
  /*
   * Example of fetching a URL from the environment, in this case for kubernetes
  var kube = uri(process.env.KUBERNETES_MASTER || 'http://localhost:8080');
  console.log("Connecting to Kubernetes on: " + kube);
  */

  hawtio.setConfig({
    port: 2772,
    staticProxies: [
    {
      proto: 'http',
      port: 8080,
      hostname: 'localhost',
      path: '/hawtio/jolokia',
      targetPath: '/jolokia'
    }
    ],
    staticAssets: [{
      path: '/vdb-bench',
      dir: '.'

    }],
    fallback: 'index.html',
    liveReload: {
      enabled: true
    }
  });

  hawtio.listen(function(server) {
    var host = server.address().address;
    var port = server.address().port;
    console.log("started from gulp file at ", host, ":", port);
  });
});

gulp.task('reload', function() {
  gulp.src('.')
    .pipe(hawtio.reload());
});

gulp.task('site-fonts', function() {
  return gulp.src(['libs/**/*.woff', 'libs/**/*.woff2', 'libs/**/*.ttf'], { base: '.' })
    .pipe(plugins.flatten())
    .pipe(plugins.debug({title: 'site font files'}))
    .pipe(gulp.dest('target/site/fonts'));
});

gulp.task('tweak-open-sans', ['site-fonts'], function() {
  return gulp.src('target/site/fonts/OpenSans*')
    .pipe(plugins.flatten())
    .pipe(gulp.dest('target/site/fonts'));
});

gulp.task('tweak-droid-sans-mono', ['site-fonts'], function() {
  return gulp.src('target/site/fonts/DroidSansMono*')
    .pipe(plugins.flatten())
    .pipe(gulp.dest('target/site/fonts'));
});

gulp.task('site-files', ['tweak-open-sans', 'tweak-droid-sans-mono'], function() {
  return gulp.src(['images/**', 'img/**', 'libs/**/*.swf'], {base: '.'})
    .pipe(plugins.debug({title: 'site files'}))
    .pipe(gulp.dest('target/site'));
});

gulp.task('usemin', ['site-files'], function() {
  return gulp.src('index.html')
    .pipe(plugins.usemin({
      css: [plugins.minifyCss(), 'concat'],
      js: [plugins.uglify(), plugins.rev()]
    }))
    .pipe(plugins.debug({title: 'usemin'}))
    .pipe(gulp.dest('target/site'));
});

gulp.task('site', ['usemin'], function() {
  gulp.src('target/site/index.html')
    .pipe(plugins.rename('404.html'))
    .pipe(gulp.dest('target/site'));
  gulp.src(['img/**'], { base: '.' })
    .pipe(gulp.dest('target/site'));

  gulp.src(['plugins/**/img/**'], { base: '.' })
    .pipe(gulp.dest('target/site/'));

  var dirs = fs.readdirSync('./libs');
  var patterns = [];
  dirs.forEach(function(dir) {
    var path = './libs/' + dir + "/img";
    try {
      if (fs.statSync(path).isDirectory()) {
        console.log("found image dir: " + path);
        var pattern = 'libs/' + dir + "/img/**";
        patterns.push(pattern);
      }
    } catch (e) {
      // ignore, file does not exist
    }
  });
  return gulp.src(patterns).pipe(plugins.debug({ title: 'img-copy' })).pipe(gulp.dest('target/site/img'));
});

gulp.task('test-server', function (cb) {
    function fork() {
        var spawn = childProc.spawn;
        var spawned = spawn('node', ['dev-server/server.js']);

        spawned.stdout.on('data', function (data) {
            console.log('' + data);
        });

        spawned.stderr.on('data', function (data) {
            console.log('err: ' + data);
        });

        return spawned;
    }

    var proc = fork();
    plugins.watch(['dev-server/**/*'], function () {
            if (proc) {
                proc.kill();
                proc = fork();
            }
    });
});

gulp.task('mvn', ['build', 'build-test', 'site']);

gulp.task('build', ['bower', 'path-adjust', 'tsc', 'less', 'template', 'concat', 'clean']);

gulp.task('build-test', ['test-tsc', 'test-template', 'test-concat', 'test-clean']);

gulp.task('default', ['test-server', 'connect']);



