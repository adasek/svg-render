/* 
 * @copyright Adam Benda, 2016
 * 
 */


/* global Blob, File, SVGSVGElement, EventTarget */

/**
 * @classdesc SVG Rendering library
 * @class
 */
var SVGRender = function () {};


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
	this.progressSignal = (options.processSignal || function () {});
	
	
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
            throw("Conflicting parameters FPS,time,imagesCount");
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


    this.SVGtime = this.beginMS + Math.round(1000 * this.imagesDoneCount) / (this.FPS);
	
    this.svgElement.pauseAnimations();
    this.svgElement.setCurrentTime(this.SVGtime / 1000);
    this.svgElement.forceRedraw();
    //Do deep copy of svgElement!
    var svgElementNew = this.svgElement.cloneNode(true);
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

        var tmpCanvas = document.getElementById('renderArea');
        tmpCanvasx = tmpCanvas.getContext('2d');
        tmpCanvas.width = this.svgImage.width;
        tmpCanvas.height = this.svgImage.height;
        tmpCanvasx.drawImage(this.svgImage, 0, 0);
        //image now in tmpCanvas

        //signalize progress 
        if (this.progressSignal && typeof this.progressSignal === "function") {
            this.progressSignal(this.imagesDoneCount, this.imagesCount);
        }

        // console.log("Out " + this.imagesDoneCount);
        this.images[this.imagesDoneCount++] = tmpCanvas.toDataURL("image/png").replace(/^data:.+\/(.+);base64,/, "");
        if (this.imagesDoneCount < this.imagesCount) {
            nextFrame = setTimeout(this.renderNextFrame.bind(this), 0);
        } else {
            this.callback();
        }
    }.bind(this);

    this.svgImage.src = "data:image/svg+xml;base64," + btoa("<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"no\"?>\n\
        <!DOCTYPE svg PUBLIC \"-//W3C//DTD SVG 1.1//EN\" \"http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd\">" + svgString);
};