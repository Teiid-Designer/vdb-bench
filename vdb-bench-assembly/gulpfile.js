var gulp = require('gulp'),
    wiredep = require('wiredep').stream,
    eventStream = require('event-stream'),
    gulpLoadPlugins = require('gulp-load-plugins'),
    map = require('vinyl-map'),
    jshint = require('gulp-jshint'),
    fs = require('fs'),
    path = require('path'),
    size = require('gulp-size'),
    uri = require('URIjs'),
    s = require('underscore.string'),
    hawtio = require('hawtio-node-backend'),
    childProc = require('child_process'),
    logger = require('js-logger');

var plugins = gulpLoadPlugins({});
var pkg = require('./package.json');

var config = {
    main: '.',
    js: 'plugins/**/*.js',
    less: ['plugins/**/content/**/*.less'],
    html: ['plugins/**/*.html'],
    css: 'styles.css',
    templateModule: pkg.name + '-templates'
};

gulp.task('bower', function () {
    return gulp.src('index.html')
        .pipe(wiredep({}))
        .pipe(gulp.dest('.'));
});

gulp.task('jshint', function () {
    return gulp.src(config.js)
        .pipe(jshint())
        .pipe(jshint.reporter('jshint-stylish'));
});

gulp.task('less', function () {
    return gulp.src(config.less)
        .pipe(plugins.less({
            paths: [path.join(__dirname, 'less', 'includes')]
        }))
        .pipe(plugins.concat(config.css))
        .pipe(gulp.dest('css'));
});

gulp.task('template', function () {
    return gulp.src(config.html)
        .pipe(plugins.angularTemplatecache({
            filename: config.templateModule + '.js',
            root: 'plugins/',
            standalone: true,
            module: config.templateModule,
            templateFooter: '}]); hawtioPluginLoader.addModule("' + config.templateModule + '");'
        }))
        .pipe(gulp.dest('plugins'));
});

gulp.task('watch', ['build'], function () {
    plugins.watch(['libs/**/*.js', 'libs/**/*.css', 'index.html', config.less, config.html, config.js, '!plugins/' + config.templateModule + '.js'], function () {
        gulp.start('reload', ['jshint', 'less', 'template']);
    });
});

gulp.task('connect', ['watch'], function () {
    hawtio.setConfig({
        logLevel: logger.DEBUG,
        port: 2772,
        fallback: 'index.html',
        staticAssets: [{
            path: '/vdb-bench',
            dir: '.'
    }],
        liveReload: {
            enabled: true
        }
    });

    hawtio.listen(function (server) {
        var host = server.address().address;
        var port = server.address().port;
        console.log("hawtio node backend started from gulp file at ", host, ":", port);
    });
});

gulp.task('reload', function () {
    gulp.src('.')
        .pipe(hawtio.reload());
});

gulp.task('site-fonts', function () {
    return gulp.src(['libs/**/*.woff', 'libs/**/*.woff2', 'libs/**/*.ttf'], {
            base: '.'
        })
        .pipe(plugins.flatten())
        .pipe(plugins.debug({
            title: 'site font files'
        }))
        .pipe(gulp.dest('target/site/fonts'));
});

gulp.task('tweak-open-sans', ['site-fonts'], function () {
    return gulp.src('target/site/fonts/OpenSans*')
        .pipe(plugins.flatten())
        .pipe(gulp.dest('target/site/fonts'));
});

gulp.task('tweak-droid-sans-mono', ['site-fonts'], function () {
    return gulp.src('target/site/fonts/DroidSansMono*')
        .pipe(plugins.flatten())
        .pipe(gulp.dest('target/site/fonts'));
});

gulp.task('site-files', ['tweak-open-sans', 'tweak-droid-sans-mono'], function () {
    return gulp.src(['content/images/**', 'img/**', 'libs/**/*.swf'], {
            base: '.'
        })
        .pipe(plugins.debug({
            title: 'site files'
        }))
        .pipe(gulp.dest('target/site'));
});

gulp.task('usemin', ['site-files'], function () {
    return gulp.src('index.html')
        .pipe(plugins.usemin({
            css: [plugins.minifyCss(), 'concat'],
            js: [plugins.uglify(), plugins.rev()]
        }))
        .pipe(plugins.debug({
            title: 'usemin'
        }))
        .pipe(gulp.dest('target/site'));
});

gulp.task('site', ['usemin'], function () {
    gulp.src('target/site/index.html')
        .pipe(plugins.rename('404.html'))
        .pipe(gulp.dest('target/site'));
    gulp.src(['img/**'], {
            base: '.'
        })
        .pipe(gulp.dest('target/site'));

    gulp.src(['plugins/**/images/**'], {
            base: '.'
        })
        .pipe(gulp.dest('target/site/'));

    var dirs = fs.readdirSync('./libs');
    var patterns = [];
    dirs.forEach(function (dir) {
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
    return gulp.src(patterns).pipe(plugins.debug({
        title: 'img-copy'
    })).pipe(gulp.dest('target/site/img'));
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

gulp.task('build', ['bower', 'jshint', 'less', 'template']);

gulp.task('default', ['test-server', 'connect']);