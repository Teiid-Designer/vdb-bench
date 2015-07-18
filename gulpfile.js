var gulp = require('gulp'),
    wiredep = require('wiredep').stream,
    gulpLoadPlugins = require('gulp-load-plugins'),
    uri = require('URIjs'),
    s = require('underscore.string'),
    hawtio = require('hawtio-node-backend');

var plugins = gulpLoadPlugins({ lazy: false });
var pkg = require('./package.json');

var config = {
  src: 'plugins/**/*.js',
  templates: 'plugins/**/*.html',
  js: pkg.name + '.js',
  template: pkg.name + '-template.js',
  templateModule: pkg.name + '-template'
};

gulp.task('bower', function() {
  gulp.src('index.html')
    .pipe(wiredep({
    }))
    .pipe(gulp.dest('.'));
});

gulp.task('templates', function() {
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

gulp.task('concat', ['templates'], function() {
  return gulp.src([config.src, './templates.js'])
    .pipe(plugins.concat(config.js))
    .pipe(gulp.dest('./dist/'));
});

gulp.task('clean', ['concat'], function() {
  return gulp.src('./templates.js', { read: false })
    .pipe(plugins.clean());
});

gulp.task('connect', function() {
  plugins.watch([config.src, config.templates], function() {
    gulp.start('build');
  });
  plugins.watch(['libs/**/*.js', 'libs/**/*.css', 'index.html', 'dist/' + config.js], function() {
    gulp.start('reload');
  });
  /*
   * Example of fetching a URL from the environment, in this case for kubernetes
  var kube = uri(process.env.KUBERNETES_MASTER || 'http://localhost:8080');
  console.log("Connecting to Kubernetes on: " + kube);
  */

  hawtio.setConfig({
    port: 2772,
    staticProxies: [
    /*  
    // proxy to a service, in this case kubernetes
    {
      proto: kube.protocol(),
      port: kube.port(),
      hostname: kube.hostname(),
      path: '/services/kubernetes',
      targetPath: kube.path()
    },
    // proxy to a jolokia instance
    {
      proto: kube.protocol(),
      hostname: kube.hostname(),
      port: kube.port(),
      path: '/jolokia',
      targetPath: '/hawtio/jolokia'
    }
    */
    ],
    staticAssets: [{
      path: '/',
      dir: '.'
   
    }],
    fallback: 'index.html',
    liveReload: {
      enabled: true
    }
  });
  /*
   * Example middleware that returns a 404 for templates
   * as they're already embedded in the js
  hawtio.use('/', function(req, res, next) {
          var path = req.originalUrl;
          // avoid returning these files, they should get pulled from js
          if (s.startsWith(path, '/plugins/') && s.endsWith(path, 'html')) {
            console.log("returning 404 for: ", path);
            res.statusCode = 404;
            res.end();
          } else {
            console.log("allowing: ", path);
            next();
          }
        });
        */
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

gulp.task('build', ['templates', 'concat', 'clean']);
gulp.task('default', ['build', 'connect']);
