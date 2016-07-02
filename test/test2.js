describe("SVGRenderer-T2", function () {

    //TEST2: CLOCK (one minute)
    beforeAll(function (done) {
        test2 = new SVGRender();
        expect(test2.getErrorMessage()).toEqual("");

        var xhr = new XMLHttpRequest();
        xhr.open("GET", 'base/test/svg/test2.svg');

        xhr.onreadystatechange = function () {
            if (xhr.readyState === XMLHttpRequest.DONE && xhr.status === 200) {

                var svgData = xhr.responseText;
                test2.load(svgData,
                        function () {
                            test2.render({begin: 0, FPS: 60, time: 1}, function (err, renderingResult) {
                                expect(err).toBe(null);
                                expect(renderingResult.length).toBe(60);
                                done();
                            });
                        });
            }
        };
        xhr.send();
    }, 120000);

    var myFrames = ["00", "07", "30", "47", "59"];
    for (var i in myFrames) {
        it("frame " + myFrames[i], function (done) {
            expect(test2).not.toBeUndefined();
            expect(test2.images).not.toBeUndefined();
            resemble("base/test/img/test2_" + myFrames[i] + ".png").compareTo("data:image/png;base64," + test2.images[parseInt(myFrames[i])]).onComplete(function (data) {
                expect(data).not.toBe(null);
                expect(data.misMatchPercentage).toBeLessThan(0.05);
                done();
            });
        });

    }

});