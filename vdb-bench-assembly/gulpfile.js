/*
 * Build file for the web application.
 * Executed by 'gulp'
 */

/*
 * Libraries required
 */
var gulp = require('gulp'),
    wiredep = require('wiredep').stream,
    eventStream = require('event-stream'),
    gulpLoadPlugins = require('gulp-load-plugins'),
    map = require('vinyl-map'),
    jshint = require('gulp-jshint'),
    cleanCss = require('gulp-clean-css'),
    ngAnnotate = require('gulp-ng-annotate'),
    fs = require('fs'),
    path = require('path'),
    size = require('gulp-size'),
    uri = require('URIjs'),
    s = require('underscore.string'),
    hawtio = require('hawtio-node-backend'),
    childProc = require('child_process'),
    logger = require('js-logger')

// Load all the gulp plugins
var plugins = gulpLoadPlugins({});

// Grab the content of package.json
var pkg = require('./package.json');

// Configure some regularly used config variables
var config = {
    main: '.',
    app: {
        name: 'app',
        root: 'app/',
        js: 'app/**/*.js',
        less: 'app/**/content/**/*.less',
        html: ['app/**/*.html'],
        templateModule: pkg.name + '-app-templates',
    },
    plugins: {
        name: 'plugins',
        root: 'plugins/',
        js: 'plugins/**/*.js',
        less: 'plugins/**/content/**/*.less',
        html: ['plugins/**/*.html'],
        templateModule: pkg.name + '-templates',
    },
    css: 'styles.css',
    libFiles: 'libs/**/*.{png,gif,jpg,svg,woff,woff2,eot,ttf,otf,css}',
    releaseDest: 'target/site'
};

/*
 * Task for automatically inserting dependencies
 * into the index.html file when they are installed
 * by bower.
 *
 * == Disabled by annotation comments removed ==
 * Seems some css, js paths are getting removed, eg.
 * patternfly and bootstrap
 *
 * See https://www.npmjs.com/package/wiredep
 */
gulp.task('bower', function () {
    return gulp.src('index.html')
        .pipe(wiredep({}))
        .pipe(gulp.dest('.'));
});

/*
 * Task for checking js syntax in source file
 */
gulp.task('jshint', function () {
    return gulp.src([config.app.js, config.plugins.js])
        .pipe(jshint())
        .pipe(jshint.reporter('jshint-stylish'));
});

/*
 * Task that finds all .less files and converts
 * then into a single .css file at css/styles.css
 */
gulp.task('less', function () {
    gulp.src([config.app.less, config.plugins.less])
        .pipe(plugins.less({
            paths: [path.join(__dirname, 'less', 'includes')]
        }))
        .pipe(plugins.concat(config.css))
        .pipe(gulp.dest('css'));
});

/*
 * Task that finds all html files being used as
 * angular templates, concatenates them into
 * a single angular module which adds them to
 * the internal angular template cache.
 *
 * This is performance efficient since it avoids
 * downloading multiple html files but also
 * necessary since the hawtio-template-cache
 * requires these files to be in the cache.
 */
gulp.task('plugin-templates', function () {
    return gulp.src(config.plugins.html)
        .pipe(plugins.angularTemplatecache({
            filename: config.plugins.templateModule + '.js',
            root: config.plugins.root,
            standalone: true,
            module: config.plugins.templateModule,
            templateFooter: '}]); hawtioPluginLoader.addModule("' + config.plugins.templateModule + '");'
        }))
        .pipe(gulp.dest(config.plugins.name));
});

gulp.task('app-templates', function () {
    return gulp.src(config.app.html)
        .pipe(plugins.angularTemplatecache({
            filename: config.app.templateModule + '.js',
            root: config.app.root,
            standalone: true,
            module: config.app.templateModule,
            templateFooter: '}]); hawtioPluginLoader.addModule("' + config.app.templateModule + '");'
        }))
        .pipe(gulp.dest(config.app.name));
});

/*
 * Task to watch files likely to be modified
 * and call other tasks if they do change.
 */
gulp.task('watch', ['build'], function () {
    plugins.watch(['libs/**/*.{js, css}', 'index.html',
                            config.app.root + '**/*.js',
                            config.app.root + '**/*.html',
                            config.app.root + '**/*.less',
                            config.plugins.root + '**/*.js',
                            config.plugins.root + '**/*.less',
                            config.plugins.root + '**/*.html',
                            '!' + config.plugins.root + config.plugins.templateModule + '.js',
                            '!' + config.app.root + config.app.templateModule + '.js'
                         ], function () {
                            gulp.start('reload', ['jshint', 'less', 'plugin-templates', 'app-templates']);
                         });
});

/*
 * Task to bring up a hawtio-node-backend
 * server that serves out the project's source
 * for testing and developing.
 */
gulp.task('connect', ['watch'], function () {
    hawtio.setConfig({
        logLevel: logger.DEBUG,
        port: 2772,
        fallback: 'index.html',
        staticAssets: [{
            path: '/ds-builder',
            dir: '.'
    }],
        liveReload: {
            enabled: false
        }
    });

    hawtio.listen(function (server) {
        var host = server.address().address;
        var port = server.address().port;
        console.log("hawtio node backend started from gulp file at ", host, ":", port);
    });
});

/*
 * Task to reload the hawtio-node-backend
 * server.
 */
gulp.task('reload', function () {
    gulp.src('.')
        .pipe(hawtio.reload());
});

/*
 * === For production build ===
 *
 * Task to copy all non-source files
 * to the release destination.
 */
gulp.task('site-files', function () {
    // Copy images and lib artifacts to site
    return gulp.src(['favicon.ico', 'img/**',
                            config.app.root + '**/content/img/**',
                            config.app.root + '**/i18n/**',
                            config.plugins.root + '**/content/img/**',
                            config.libFiles], {
            base: '.'
        })
        .pipe(plugins.debug({
            title: 'site files'
        }))
        .pipe(gulp.dest(config.releaseDest));
});

/*
 * === For production build ===
 *
 * Task to minify/uglify source files
 * to compress files for quicker download.
 *
 * cleanCss(): minify css
 * uglify(): uglifies js
 * ngAnnotate(): ensures all angular injections are explicit
 */
gulp.task('usemin', ['site-files'], function () {
    //
    // minifies both the css and js located in the
    // index file
    //
    return gulp.src('index.html')
        .pipe(plugins.usemin({
            css: [plugins.cleanCss(), 'concat'],
            libsJs: [plugins.uglify(), plugins.rev()],
            pluginsJs: [plugins.ngAnnotate(), plugins.uglify(), plugins.rev()],
            appJs: [plugins.ngAnnotate(), plugins.uglify(), plugins.rev()]
        }))
        .pipe(plugins.debug({
            title: 'usemin'
        }))
        .pipe(gulp.dest(config.releaseDest));
});

/*
 * Task to move any old index.html files
 * to 404.html
 */
gulp.task('site', ['usemin'], function () {
    return gulp.src('target/site/index.html')
        .pipe(plugins.rename('404.html'))
        .pipe(gulp.dest(config.releaseDest));
});

/*
 * Task to run a Rest test server.
 */
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

/*
 * Task to be executed by maven.
 * Builds the project for release deployment
 * in target directory.
 */
gulp.task('mvn', ['build', 'site']);

/*
 * Task to build the project
 */
gulp.task('build', ['bower', 'jshint', 'less', 'app-templates', 'plugin-templates']);

/*
 * Task to build, launch the Rest test server and
 * bring up the application using the hawtio-node-backend
 */
gulp.task('default', ['test-server', 'connect']);