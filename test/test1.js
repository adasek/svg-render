

describe("SVGRenderer", function () {
    it("constructs", function () {
        svgrender = new SVGRender();
        expect(svgrender.getErrorMessage()).toEqual("");
    });


    beforeEach(function (done) {
        svgrender = new SVGRender();
        svgrender.load('<?xml version="1.0" encoding="UTF-8" standalone="no"?><svg xmlns:cc = "http://creativecommons.org/ns#" xmlns:svg = "http://www.w3.org/2000/svg" xmlns = "http://www.w3.org/2000/svg" width = "100" height = "100" id = "svg" version = "1.1"><rect x = "10" y="10" width="90" height="90"></rect></svg>',
                done
                );
    });

    it("loads sample SVG from string", function () {
        expect(svgrender.loaded).toBe(true);
    });

});