

module.exports = function (config) {
    config.set({
        basePath: './',
        frameworks: ['jasmine'],
        files: [
            'node_modules/resemblejs/resemble.js',
            'public_html/svg-render.js',
            'test/*.js',
            {pattern: 'test/img/*.png', watched: false, included: false, served: true, nocache: false}
        ],
        exclude: [
        ],
        autoWatch: true,
        browsers: [
            "Chrome"
        ],
        plugins: [
            "karma-jasmine",
            "karma-chrome-launcher"
        ]
    });
};
