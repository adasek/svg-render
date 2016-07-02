

module.exports = function (config) {
    config.set({
        basePath: './',
        frameworks: ['jasmine'],
        files: [
            'public_html/svg-render.js',
            'test/*.js'
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
