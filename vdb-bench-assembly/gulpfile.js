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
    tslint = require('gulp-tslint'),
    tslintRules = require('./tslint.json'),
    childProc = require('child_process');

var plugins = gulpLoadPlugins({});
var pkg = require('./package.json');

var config = {
  main: '.',
  ts: ['plugins/**/*.ts'],
  js: 'plugins/**/*.js',
  testTs: ['test-plugins/**/*.ts'],
  less: ['./less/**/*.less', 'plugins/**/*.less'],
  templates: ['plugins/**/*.html'],
  testTemplates: ['test-plugins/**/*.html'],
  templateModule: pkg.name + '-templates',
  testTemplateModule: pkg.name + '-test-templates',
  pkgJs: pkg.name + '.js',
  testPkgJs: pkg.name + '-test.js',
  dist: './dist/',
  css: pkg.name + '.css',
  tsProject: plugins.typescript.createProject({
    target: 'ES5',
    module: 'commonjs',
    declarationFiles: true,
    noExternalResolve: false,
    removeComments: true
  }),
  testTsProject: plugins.typescript.createProject({
    target: 'ES5',
    module: 'commonjs',
    declarationFiles: false,
    noExternalResolve: false
  }),
  tsLintOptions: {
    rulesDirectory: './tslint-rules/'
  }
};

var normalSizeOptions = {
    showFiles: true
}, gZippedSizeOptions  = {
    showFiles: true,
    gzip: true
};


gulp.task('bower', function() {
  return gulp.src('index.html')
    .pipe(wiredep({}))
    .pipe(gulp.dest('.'));
});

/** Adjust the reference path of any typescript-built plugin this project depends on */
gulp.task('path-adjust', function() {
  return gulp.src('libs/**/includes.d.ts')
    .pipe(map(function(buf, filename) {
      var textContent = buf.toString();
      var newTextContent = textContent.replace(/"\.\.\/libs/gm, '"../../../libs');
      // console.log("Filename: ", filename, " old: ", textContent, " new:", newTextContent);
      return newTextContent;
    }))
    .pipe(gulp.dest('libs'));
});

gulp.task('clean-defs', function() {
  return gulp.src('defs.d.ts', { read: false })
    .pipe(plugins.clean());
});

gulp.task('less', function () {
  return gulp.src(config.less)
    .pipe(plugins.less({
      paths: [ path.join(__dirname, 'less', 'includes') ]
    }))
    .pipe(plugins.concat(config.css))
    .pipe(gulp.dest('./dist'));
});

gulp.task('tsc', ['clean-defs'], function() {
  var cwd = process.cwd();
  var tsResult = gulp.src(config.ts)
    .pipe(plugins.sourcemaps.init())
    .pipe(plugins.typescript(config.tsProject))
    .on('error', plugins.notify.onError({
      message: '#{ error.message }',
      title: 'Typescript compilation error'
    }));

    return eventStream.merge(
      tsResult.js
        .pipe(plugins.concat('compiled.js'))
        .pipe(plugins.sourcemaps.write())
        .pipe(gulp.dest('.')),
      tsResult.dts
        .pipe(gulp.dest('d.ts')))
        .pipe(map(function(buf, filename) {
          if (!s.endsWith(filename, 'd.ts')) {
            return buf;
          }
          var relative = path.relative(cwd, filename);
          fs.appendFileSync('defs.d.ts', '/// <reference path="' + relative + '"/>\n');
          return buf;
        }));
});

gulp.task('test-tsc', ['tsc'], function() {
  var tsResult = gulp.src(config.testTs)
    .pipe(plugins.typescript(config.testTsProject))
    .on('error', plugins.notify.onError({
      message: '#{ error.message }',
      title: 'Typescript compilation error - test'
    }));

    return tsResult.js
        .pipe(plugins.concat('test-compiled.js'))
        .pipe(gulp.dest('.'));
});

gulp.task('test-template', ['test-tsc'], function() {
  return gulp.src(config.testTemplates)
    .pipe(plugins.angularTemplatecache({
      filename: 'test-templates.js',
      root: 'test-plugins/',
      standalone: true,
      module: config.testTemplateModule,
      templateFooter: '}]); hawtioPluginLoader.addModule("' + config.testTemplateModule + '");'
    }))
    .pipe(gulp.dest('.'));
});

gulp.task('test-concat', ['test-template'], function() {
  return gulp.src(['test-compiled.js', 'test-templates.js'])
    .pipe(plugins.concat(config.testPkgJs))
    .pipe(gulp.dest(config.dist));
});

gulp.task('test-clean', ['test-concat'], function() {
  return gulp.src(['test-templates.js', 'test-compiled.js'], { read: false })
    .pipe(plugins.clean());
});

gulp.task('template', ['tsc'], function() {
  return gulp.src(config.templates)
    .pipe(plugins.angularTemplatecache({
      filename: 'templates.js',
      root: 'plugins/',
      standalone: true,
      module: config.templateModule,
      templateFooter: '}]); hawtioPluginLoader.addModule("' + config.templateModule + '");'
    }))
    .pipe(gulp.dest('.'));
});

gulp.task('concat', ['template'], function() {
  var gZipSize = size(gZippedSizeOptions);
  var license = tslintRules.rules['license-header'][1];
  return gulp.src([config.js, 'compiled.js', 'templates.js'])
    .pipe(plugins.concat(config.pkgJs))
    .pipe(plugins.header(license))
    .pipe(size(normalSizeOptions))
    .pipe(gZipSize)
    .pipe(gulp.dest(config.dist));
});

gulp.task('clean', ['concat'], function() {
  return gulp.src(['templates.js', 'compiled.js'], { read: false })
    .pipe(plugins.clean());
});

gulp.task('watch', ['build', 'built-test'], function() {
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

gulp.task('mvn', ['build', 'site']);

gulp.task('build', ['bower', 'path-adjust', 'tsc', 'less', 'template', 'concat', 'clean']);

gulp.task('built-test', ['test-tsc', 'test-template', 'test-concat', 'test-clean']);

gulp.task('default', ['test-server', 'connect']);



