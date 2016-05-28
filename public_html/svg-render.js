/* 
 * @copyright Adam Benda, 2016
 * 
 */


/* global Blob, File, SVGSVGElement, EventTarget */

/**
 * @classdesc SVG Rendering library
 * @class
 */
var SVGRender = function () {


};


/**
 * Loads one SVG image from various source.
 * Will wipe out previously loaded image
 * @param {SVGSVGElement |  Blob | File | String} svg - svg element or its source
 * @returns {undefined}
 * 
 * @public
 **/
SVGRender.prototype.load = function (svg) {
    /**
     * Loading from a file is asynchronous = do not call render() untill file is loaded.
     * @type {Boolean}
     * @private
     */
    this.loaded = false;

    /**
     * Signalizes that computation was interrupted/paused
     * @type Boolean
     */
    this.interrupted = false;

    /**
     * Signalizes that computation finished sucessfully
     * @type Boolean
     */
    this.finished = false;


    if (Blob.prototype.isPrototypeOf(svg) || File.prototype.isPrototypeOf(svg)) {
//to be read with FileReader
        if (!svg.type || svg.type !== "image/svg+xml") {
            throw "Wrong file/blob type, should be image/svg+xml, is " + svg.type;
        }

        /**
         * File reader of input File / Blob
         * @type {FileReader}
         * @private
         */
        this.reader = new FileReader();
        this.reader.readAsDataURL(svg);
        this.reader.onload = function () {
            //File was loaded from input to dataURI

            //http://stackoverflow.com/questions/11335460/how-do-i-parse-a-data-url-in-node
            var svgCodeB64 = this.reader.result;
            var regex = /^data:.+\/(.+);base64,(.*)$/;
            var matches = svgCodeB64.match(regex);
            var data = matches[2];
            var svgCode = atob(data);
            this.load.bind(this)(svgCode);
            //Call load function again - but with svg source loaded from file
            return;
        }.bind(this);
        return;

    } else if (typeof svg === "string") {
        //svg xml code
        var svgCode = svg;
        //var svgCode = this.result.replace(/<?xml[^>]*/,"").replace(/<!DOCTYPE[^>]*/,"");

        //We are using document from global namespace
        //todo: cleanup afterwards
        this.svgDivElement = document.createElement('div');
        this.svgDivElement.innerHTML = svgCode;
        var svgElement = this.svgDivElement.children[0];
        document.body.appendChild(this.svgDivElement);
        //this.svgDivElement.style.visibility = 'hidden';
        this.svgDivElement.style.border = '2px solid black';
        this.load(svgElement);
        return;
    } else if (SVGSVGElement.prototype.isPrototypeOf(svg)) {

        /**
         * SVG element present in document.
         * @type {SVGSVGElement}
         * @private
         */
        this.svgElement = svg;
        this.loaded = true;
        return;
    } else {
        throw "Unknown svg type in svg-render!";
    }
};

/**
 * Start rendering
 * @param {Object} options - contains numbers FPS, time, imagesCount and function progressSignal
 * @param {function} callback
 * @returns {undefined}
 * 
 * @public
 */
SVGRender.prototype.render = function (options, callback) {
    if (!options) {
        options = {};
    }

    /**
     * Will be called after rendering is finished
     * @type {function}
     */
    this.callback = callback;
    if (!this.callback) {
        this.callback = function () {};
    }

    if (!this.loaded) {
        //todo: more elegant solution
        setTimeout(this.render.bind(this, options, callback), 100);
        return;
    }

    /**
     * Function to be called repeatedly when frame is rendered.
     * has two parameters; count(total #frames) and doneCount(#frames rendered) 
     * @type {function}
     * @private
     */
    this.progressSignal = (options.progressSignal || function () {});


    /**
     * begin time (seconds)
     * @type {number}
     * @private
     */
    this.beginMS = (options.begin * 1000 || 0); //default begin time


    /**
     * Frames per Second
     * @type {number}
     * @private
     */
    this.FPS = (options.FPS || 60); //default FPS


    /**
     * total time in miliseconds
     * @type {number}
     * @private
     */
    this.timeMS = (options.time * 1000 || 1000);


    /**
     * Number of frames to render
     * @type {number}
     * @private
     */
    this.imagesCount = Math.round(this.FPS * this.timeMS / 1000);

    if (options.imagesCount && options.imagesCount !== this.imagesCount) {
        //imagesCount was given
        if (options.time && options.FPS) {
            //FPS+time were also given and the tree given parameters are contradicting
            throw "Conflicting parameters FPS,time,imagesCount";
        } else if (options.time) {
            this.FPS = this.imagesCount * 1000 / this.timeMS;
        } else if (options.FPS) {
            this.timeMS = this.imagesCount * 1000 / this.FPS;
        }
    }

    /**
     * Time in miliseconds from the animation start time.
     * @type {int}
     * @private
     */
    this.SVGtime = 0; //in miliseconds

    /**
     * Number of already rendered images
     * @type {int}
     * @public
     */
    this.imagesDoneCount = 0;


    /**
     * Array of all rendered images in png format
     * @type {base64}
     * @public
     */
    this.images = [];


    /**
     * Array of all rendered images in png format
     * @type {number}
     * @private
     */
    this.nextFrame = setTimeout(this.renderNextFrame.bind(this), 0);


    /**
     * Canvas to draw on (optional - drawing is invisible if not provided)
     * @type {HTMLCanvasElement}
     * @private
     */
    this.canvas = (options.canvas || document.createElement('canvas')); //default begin time

};

/**
 * Goes through DOM tree of given HTMLElement and removes specific tags 
 * @param {HTMLElement} htmlElement
 * @param {String[]} tags
 * @return {integer} - number of elements removed
 * 
 * @private
 */
SVGRender.prototype.filterOut = function (htmlElement, tags) {
    var ret = 0;
    if (tags.indexOf(htmlElement.tagName) >= 0) {
        htmlElement.parentNode.removeChild(htmlElement);
        return 1;
    } else {
        //call filterOut recursively
        for (var i = 0; i < htmlElement.children.length; i++) {
            ret += this.filterOut(htmlElement.children[i], tags);
        }
    }
    return ret;
};

/**
 * Render next frame and schedule next run of render next frame
 * @returns {undefined}
 * @private
 */
SVGRender.prototype.renderNextFrame = function () {
    if (!this.svgElement) {
        throw "Cannot render - no svgElement loaded!";
    }

    if (this.interrupted) {
        //rendering was stopped
        //(this.nextFrame timeout should have been removed already!)
        throw "this.nextFrame timeout should have been removed already!";
        return;
    }


    this.SVGtime = this.beginMS + Math.round(1000 * this.imagesDoneCount) / (this.FPS);

    this.svgElement.pauseAnimations();
    this.svgElement.setCurrentTime(this.SVGtime / 1000);
    this.svgElement.forceRedraw();

    SVGElement.prototype.getTransformAnim = function () {
        var matrix = document.createElementNS("http://www.w3.org/2000/svg", "svg").createSVGMatrix();
        if (!this.transform || !this.transform.animVal) {
            return matrix;
        }
        for (var i = 0; i < this.transform.animVal.length; i++) {
            matrix = matrix.multiply(this.transform.animVal[i].matrix);
        }
        return matrix;
    };

    //copy style: http://stackoverflow.com/questions/2087778/javascript-copy-style
    //also copy out transformMatrix
    function exportStyle(el) {
        var ret = {};
        ret.children = [];
        for (var i = 0; i < el.children.length; i++) {
            ret.children[i] = exportStyle(el.children[i]);
        }
        var transformAnim = el.getTransformAnim();
        if (transformAnim) {
            ret.transformAnim = transformAnim;
        }

        ret.value = [];
        var styles = window.getComputedStyle(el);

        for (var i = styles.length; i-- > 0; ) {
            var name = styles[i];
            if (!name.match(/^height$/) && !name.match(/^width$/) && !name.match(/^visibility/)) {
                ret.value.push({
                    "name": name,
                    "value": styles.getPropertyValue(name),
                    "priority": styles.getPropertyPriority(name)
                });
            }
        }
        return ret;
    }

    function importStyle(el, data) {
        if (el.transform && Array.isArray(el.transform.animVal)) {
            el.transform.animVal.push(data.transformAnim);
        }

        for (var i = 0; i < el.children.length; i++) {
            //recursive
            importStyle(el.children[i], data.children[i]);
        }
        for (var n = 0; n < data.value.length; n++) {
            el.style.setProperty(data.value[n].name,
                    data.value[n].value,
                    data.value[n].priority
                    );
        }
    }

    //Do deep copy of svgElement!
    var svgElementNew = this.svgElement.cloneNode(true);
    //Copy styles
    var styles = exportStyle(this.svgElement);
    importStyle(svgElementNew, styles);

    //maybe unnescessary
    svgElementNew.pauseAnimations();
    svgElementNew.setCurrentTime(this.SVGtime / 1000);
    svgElementNew.forceRedraw();



    this.filterOut(svgElementNew, "animate");
    this.filterOut(svgElementNew, "animateTransform");
    this.filterOut(svgElementNew, "animateMotion");
    this.filterOut(svgElementNew, "animateColor");


    var svgString = new XMLSerializer().serializeToString(svgElementNew);
    this.svgImage = new Image();
    this.svgImage.onload = function () {

        tmpCanvasx = this.canvas.getContext('2d');
        this.canvas.width = this.svgImage.width;
        this.canvas.height = this.svgImage.height;
        tmpCanvasx.clearRect(0, 0, this.svgImage.width, this.svgImage.height);
        tmpCanvasx.drawImage(this.svgImage, 0, 0);
        //image now in tmpCanvas

        //signalize progress 
        if (this.progressSignal && typeof this.progressSignal === "function") {
            this.progressSignal(this.imagesDoneCount, this.imagesCount);
        }

        this.images[this.imagesDoneCount++] = this.canvas.toDataURL("image/png").replace(/^data:.+\/(.+);base64,/, "");
        if (this.imagesDoneCount < this.imagesCount) {
            this.nextFrame = setTimeout(this.renderNextFrame.bind(this), 0);
        } else {
            this.finished = true;
            this.callback();
        }
    }.bind(this);

    this.svgImage.src = "data:image/svg+xml;base64," + btoa("<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"no\"?>\n\
        <!DOCTYPE svg PUBLIC \"-//W3C//DTD SVG 1.1//EN\" \"http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd\">" + svgString);
};

/**
 * Pause rendering
 * @returns {undefined}
 */
SVGRender.prototype.pause = function () {
    this.interrupted = true;
    clearTimeout(this.nextFrame);
    this.nextFrame = null;
};

/**
 * Resumes rendering
 * @returns {undefined}
 */
SVGRender.prototype.resume = function () {
    if (this.finished || !this.interrupted) {
        //not needed
        return;
    }

    this.interrupted = false;
    if (!this.nextFrame) {
        //next frame is not scheduled
        this.nextFrame = setTimeout(this.renderNextFrame.bind(this), 0);
    }
};

