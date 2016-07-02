describe("SVGRenderer-T3", function () {

    //TEST3: four rectangles animation
    beforeAll(function (done) {
        test = new SVGRender();
        expect(test.getErrorMessage()).toEqual("");

        var xhr = new XMLHttpRequest();
        xhr.open("GET", 'base/test/svg/test3.svg');

        xhr.onreadystatechange = function () {
            if (xhr.readyState === XMLHttpRequest.DONE && xhr.status === 200) {

                var svgData = xhr.responseText;
                test.load(svgData,
                        function () {
                            test.render({begin: 0, FPS: 3, time: 10}, function (err, renderingResult) {
                                expect(err).toBe(null);
                                expect(renderingResult.length).toBe(30);
                                done();
                            });
                        });
            }
        };
        xhr.send();
    }, 120000);

    var myFrames = ["00", "03", "06", "10", "16", "22", "25", "29"];
    for (var i in myFrames) {
        it("frame " + myFrames[i], function (done) {
            expect(test).not.toBeUndefined();
            expect(test.images).not.toBeUndefined();
            resemble("base/test/img/test3_" + myFrames[i] + ".png").compareTo("data:image/png;base64," + test.images[parseInt(myFrames[i])]).onComplete(function (data) {
                expect(data).not.toBe(null);
                expect(data.isSameDimensions).toBe(true);
                expect(data.misMatchPercentage).toBeLessThan(0.5);
                done();
            });
        });

    }

});