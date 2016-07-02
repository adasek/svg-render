

describe("SVGRenderer", function () {
    it("constructs", function () {
        svgrender = new SVGRender();
        expect(svgrender.getErrorMessage()).toEqual("");
    });
    beforeEach(function (done) {
        svgrender = new SVGRender();
        svgrender.load('<?xml version="1.0" encoding="UTF-8" standalone="no"?><svg xmlns:cc="http://creativecommons.org/ns#" xmlns:svg="http://www.w3.org/2000/svg" xmlns="http://www.w3.org/2000/svg" width="100" height="100" id="svg" version="1.1" style="background: white"><rect x="10" y="10" width="80" height="80" fill="#ff0000"></rect></svg>',
                function () {
                    svgrender.render({begin: 0, FPS: 1, time: 1}, function (err, renderingResult) {
                        if (err) {
                            throw "nope";
                        }
                        expect(err === null);
                        done(renderingResult);
                    });
                });
    });

    it("loads sample SVG from string", function (done) {
        expect(svgrender.loaded).toBe(true);
        done();
    });

    it("is a red rectangle", function (done) {
        resemble("base/test/img/test1_1.png").compareTo("data:image/png;base64," + svgrender.images[0]).onComplete(function (data) {
            expect(data.isSameDimensions).toBe(true);
            expect(data.misMatchPercentage).toBeLessThan(1);
            done();
        });
    });

    it("is not a green rectangle", function (done) {
        resemble("base/test/img/test1_1n.png").compareTo("data:image/png;base64," + svgrender.images[0]).onComplete(function (data) {
            expect(data).not.toBe(null);
            console.log(JSON.stringify(data));
            expect(data.misMatchPercentage).toBeGreaterThan(60);
            done();
        });
    });


});