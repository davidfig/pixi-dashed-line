"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DashLine = void 0;
var PIXI = require("pixi.js");
var dashLineOptionsDefault = {
    dash: [10, 5],
    dashOffset: 0,
    width: 1,
    color: 0xffffff,
    alpha: 1,
    scale: 1,
    useTexture: false,
    cap: "butt",
    join: "miter",
    alignment: 0.5,
};
var tempPoint = new PIXI.Point();
var DashLine = /** @class */ (function () {
    /**
     * Create a DashLine
     * @param graphics
     * @param [options]
     * @param [options.useTexture=false] - use the texture based render (useful for very large or very small dashed lines)
     * @param [options.dash=[10,5]] - an array holding the dash and gap (eg, [10, 5, 20, 5, ...])
     * @param [options.dashOffset=0] - where the line starts in the dash pattern (change and redraw to animate)
     * @param [options.width=1] - width of the dashed line
     * @param [options.alpha=1] - alpha of the dashed line
     * @param [options.color=0xffffff] - color of the dashed line
     * @param [options.scale=1] - scale of the dashes and width (eg, 1 / viewport.scale.x keeps the line the same size when zooming)
     * @param [options.cap=butt] - line cap style for the dashes (only works for useTexture: false)
     * @param [options.join=miter] - line join style for the dashes (only works for useTexture: false)
     * @param [options.alignment=0.5] - alignment of the line (pixi.js v8: 0.5 = middle, 1 = inside, 0 = outside)
     */
    function DashLine(graphics, options) {
        if (options === void 0) { options = {}; }
        /** current length of the line */
        this.lineLength = 0;
        /** cursor location */
        this.cursor = new PIXI.Point();
        /** desired scale of line */
        this.scale = 1;
        this.start = new PIXI.Point(0, 0);
        // offset into the dash pattern at this.start (used to decide whether a closed path needs a final gap)
        this.startPlace = 0;
        this.graphics = graphics;
        this.options = __assign(__assign({}, dashLineOptionsDefault), options);
        this.dash = this.options.dash;
        this.dashSize = this.dash.reduce(function (a, b) { return a + b; });
        this.dashOffset = this.options.dashOffset;
        this.useTexture = Boolean(this.options.useTexture);
        this.scale = this.options.scale;
        if (this.useTexture) {
            this.texture = DashLine.getTexture(this.options, this.dashSize);
        }
        this.setStrokeStyle();
    }
    /** sets the graphics element's stroke style to this dashed line's style (so graphics.stroke() draws with it) */
    DashLine.prototype.setStrokeStyle = function () {
        this.graphics.setStrokeStyle(this.getStrokeStyle());
        return this;
    };
    /**
     * Strokes the dashed path drawn since the last stroke (like PIXI.Graphics.stroke()).
     * Lines drawn with useTexture: true are stroked as they are drawn, so this is only required for useTexture: false.
     */
    DashLine.prototype.stroke = function () {
        if (!this.useTexture) {
            this.graphics.stroke(this.getStrokeStyle());
        }
        return this;
    };
    DashLine.prototype.getStrokeStyle = function () {
        var options = this.options;
        return {
            width: options.width * this.scale,
            color: options.color,
            alpha: options.alpha,
            cap: options.cap,
            join: options.join,
            alignment: options.alignment,
        };
    };
    DashLine.distance = function (x1, y1, x2, y2) {
        return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
    };
    // place within the (scaled) dash pattern for a given line length
    DashLine.prototype.getPlace = function (lineLength) {
        var size = this.dashSize * this.scale;
        return ((lineLength % size) + size) % size;
    };
    DashLine.prototype.moveTo = function (x, y) {
        this.lineLength = this.dashOffset * this.scale;
        this.startPlace = this.getPlace(this.lineLength);
        this.cursor.set(x, y);
        this.start.set(x, y);
        this.graphics.moveTo(this.cursor.x, this.cursor.y);
        return this;
    };
    DashLine.prototype.lineTo = function (x, y, closePath) {
        var length = DashLine.distance(this.cursor.x, this.cursor.y, x, y);
        var angle = Math.atan2(y - this.cursor.y, x - this.cursor.x);
        var cos = Math.cos(angle);
        var sin = Math.sin(angle);
        // leaving a gap before the start only makes sense if the pattern starts with a dash
        var closed = closePath &&
            this.startPlace === 0 &&
            x === this.start.x &&
            y === this.start.y;
        if (this.useTexture) {
            var x1 = x;
            var y1 = y;
            if (closed && this.dash.length % 2 === 0) {
                var gap = Math.min(this.dash[this.dash.length - 1] * this.scale, length);
                x1 -= cos * gap;
                y1 -= sin * gap;
            }
            // each segment needs its own stroke since the texture's matrix depends on the segment's angle
            this.graphics
                .moveTo(this.cursor.x, this.cursor.y)
                .lineTo(x1, y1)
                .stroke(this.getTextureStyle(angle));
        }
        else {
            var x0 = this.cursor.x;
            var y0 = this.cursor.y;
            // find the first part of the dash for this line
            var place = this.getPlace(this.lineLength);
            var dashIndex = 0;
            var dashStart = 0;
            var dashX = 0;
            for (var i = 0; i < this.dash.length; i++) {
                var dashSize = this.dash[i] * this.scale;
                if (place < dashX + dashSize) {
                    dashIndex = i;
                    dashStart = place - dashX;
                    break;
                }
                else {
                    dashX += dashSize;
                }
            }
            var remaining = length;
            while (remaining > 0) {
                var dashSize = this.dash[dashIndex] * this.scale - dashStart;
                var dist = remaining > dashSize ? dashSize : remaining;
                if (closed) {
                    var remainingDistance = DashLine.distance(x0 + cos * dist, y0 + sin * dist, this.start.x, this.start.y);
                    if (remainingDistance <= dist) {
                        if (dashIndex % 2 === 0) {
                            var lastDash = DashLine.distance(x0, y0, this.start.x, this.start.y) -
                                this.dash[this.dash.length - 1] * this.scale;
                            x0 += cos * lastDash;
                            y0 += sin * lastDash;
                            this.graphics.lineTo(x0, y0);
                        }
                        break;
                    }
                }
                x0 += cos * dist;
                y0 += sin * dist;
                if (dashIndex % 2) {
                    this.graphics.moveTo(x0, y0);
                }
                else {
                    this.graphics.lineTo(x0, y0);
                }
                remaining -= dist;
                dashIndex++;
                dashIndex = dashIndex === this.dash.length ? 0 : dashIndex;
                dashStart = 0;
            }
        }
        this.lineLength += length;
        this.cursor.set(x, y);
        return this;
    };
    DashLine.prototype.closePath = function () {
        return this.lineTo(this.start.x, this.start.y, true);
    };
    /**
     * Draws a dashed quadratic curve from the cursor
     * @param [points=20] - number of line segments used to draw the curve
     */
    DashLine.prototype.quadraticCurveTo = function (cpx, cpy, x, y, points) {
        if (points === void 0) { points = 20; }
        var x0 = this.cursor.x;
        var y0 = this.cursor.y;
        for (var i = 1; i <= points; i++) {
            var t = i / points;
            var mt = 1 - t;
            this.lineTo(mt * mt * x0 + 2 * mt * t * cpx + t * t * x, mt * mt * y0 + 2 * mt * t * cpy + t * t * y);
        }
        return this;
    };
    /**
     * Draws a dashed cubic bezier curve from the cursor
     * @param [points=20] - number of line segments used to draw the curve
     */
    DashLine.prototype.bezierCurveTo = function (cp1x, cp1y, cp2x, cp2y, x, y, points) {
        if (points === void 0) { points = 20; }
        var x0 = this.cursor.x;
        var y0 = this.cursor.y;
        for (var i = 1; i <= points; i++) {
            var t = i / points;
            var mt = 1 - t;
            var a = mt * mt * mt;
            var b = 3 * mt * mt * t;
            var c = 3 * mt * t * t;
            var d = t * t * t;
            this.lineTo(a * x0 + b * cp1x + c * cp2x + d * x, a * y0 + b * cp1y + c * cp2y + d * y);
        }
        return this;
    };
    // applies the optional matrix to a point (returns a shared point)
    DashLine.transform = function (x, y, matrix) {
        tempPoint.set(x, y);
        if (matrix) {
            matrix.apply(tempPoint, tempPoint);
        }
        return tempPoint;
    };
    /**
     * Draws a dashed arc (starts a new line at the start of the arc)
     * @param startAngle - in radians
     * @param endAngle - in radians (if smaller than startAngle, the arc is drawn counterclockwise)
     * @param [points=80] - number of line segments used to draw the arc
     */
    DashLine.prototype.arc = function (cx, cy, radius, startAngle, endAngle, points, matrix) {
        if (points === void 0) { points = 80; }
        var p = DashLine.transform(cx + Math.cos(startAngle) * radius, cy + Math.sin(startAngle) * radius, matrix);
        this.moveTo(p.x, p.y);
        return this.arcTo(cx, cy, radius, startAngle, endAngle, points, matrix);
    };
    // draws the arc from the cursor (which should be at startAngle)
    DashLine.prototype.arcTo = function (cx, cy, radius, startAngle, endAngle, points, matrix) {
        var interval = (endAngle - startAngle) / points;
        for (var i = 1; i <= points; i++) {
            var angle = startAngle + i * interval;
            var p = DashLine.transform(cx + Math.cos(angle) * radius, cy + Math.sin(angle) * radius, matrix);
            this.lineTo(p.x, p.y);
        }
        return this;
    };
    DashLine.prototype.circle = function (x, y, radius, points, matrix) {
        if (points === void 0) { points = 80; }
        var interval = (Math.PI * 2) / points;
        var first = DashLine.transform(x + radius, y, matrix).clone();
        this.moveTo(first.x, first.y);
        for (var i = 1; i < points; i++) {
            var angle = i * interval;
            var p = DashLine.transform(x + Math.cos(angle) * radius, y + Math.sin(angle) * radius, matrix);
            this.lineTo(p.x, p.y);
        }
        this.lineTo(first.x, first.y, true);
        return this;
    };
    DashLine.prototype.ellipse = function (x, y, radiusX, radiusY, points, matrix) {
        if (points === void 0) { points = 80; }
        var interval = (Math.PI * 2) / points;
        var first = DashLine.transform(x, y - radiusY, matrix).clone();
        this.moveTo(first.x, first.y);
        for (var i = 1; i < points; i++) {
            var angle = i * interval;
            var p = DashLine.transform(x - radiusX * Math.sin(angle), y - radiusY * Math.cos(angle), matrix);
            this.lineTo(p.x, p.y);
        }
        this.lineTo(first.x, first.y, true);
        return this;
    };
    DashLine.prototype.poly = function (points, matrix) {
        if (typeof points[0] === "number") {
            var numbers = points;
            var first = DashLine.transform(numbers[0], numbers[1], matrix);
            this.moveTo(first.x, first.y);
            for (var i = 2; i < numbers.length; i += 2) {
                var p = DashLine.transform(numbers[i], numbers[i + 1], matrix);
                this.lineTo(p.x, p.y, i === numbers.length - 2);
            }
        }
        else {
            var pointData = points;
            var first = DashLine.transform(pointData[0].x, pointData[0].y, matrix);
            this.moveTo(first.x, first.y);
            for (var i = 1; i < pointData.length; i++) {
                var p = DashLine.transform(pointData[i].x, pointData[i].y, matrix);
                this.lineTo(p.x, p.y, i === pointData.length - 1);
            }
        }
        return this;
    };
    DashLine.prototype.rect = function (x, y, width, height, matrix) {
        return this.poly([x, y, x + width, y, x + width, y + height, x, y + height, x, y], matrix);
    };
    /**
     * Draws a dashed rectangle with rounded corners
     * @param [radius=10] - corner radius (limited to half the smaller side)
     * @param [points=10] - number of line segments used to draw each corner
     */
    DashLine.prototype.roundRect = function (x, y, width, height, radius, points, matrix) {
        if (radius === void 0) { radius = 10; }
        if (points === void 0) { points = 10; }
        radius = Math.max(0, Math.min(radius, Math.min(width, height) / 2));
        var half = Math.PI / 2;
        var start = DashLine.transform(x + radius, y, matrix).clone();
        this.moveTo(start.x, start.y);
        var p = DashLine.transform(x + width - radius, y, matrix);
        this.lineTo(p.x, p.y);
        this.arcTo(x + width - radius, y + radius, radius, -half, 0, points, matrix);
        p = DashLine.transform(x + width, y + height - radius, matrix);
        this.lineTo(p.x, p.y);
        this.arcTo(x + width - radius, y + height - radius, radius, 0, half, points, matrix);
        p = DashLine.transform(x + radius, y + height, matrix);
        this.lineTo(p.x, p.y);
        this.arcTo(x + radius, y + height - radius, radius, half, Math.PI, points, matrix);
        p = DashLine.transform(x, y + radius, matrix);
        this.lineTo(p.x, p.y);
        // the last corner ends exactly at the start so the path closes properly
        this.arcTo(x + radius, y + radius, radius, Math.PI, Math.PI + half - half / points, points - 1, matrix);
        this.lineTo(start.x, start.y, true);
        return this;
    };
    // creates the stroke style (with the texture's matrix) for a segment of the line with useTexture: true
    DashLine.prototype.getTextureStyle = function (angle) {
        var matrix = new PIXI.Matrix();
        if (angle) {
            matrix.rotate(angle);
        }
        if (this.scale !== 1) {
            matrix.scale(this.scale, this.scale);
        }
        var textureStart = -this.lineLength;
        matrix.translate(this.cursor.x + textureStart * Math.cos(angle), this.cursor.y + textureStart * Math.sin(angle));
        var options = this.options;
        return {
            width: options.width * this.scale,
            color: options.color,
            alpha: options.alpha,
            alignment: options.alignment,
            texture: this.texture,
            matrix: matrix,
            textureSpace: "global",
        };
    };
    // creates or uses cached texture
    DashLine.getTexture = function (options, dashSize) {
        var key = "".concat(options.dash.toString(), "-").concat(options.width);
        if (DashLine.dashTextureCache[key]) {
            return DashLine.dashTextureCache[key];
        }
        var canvas = document.createElement("canvas");
        canvas.width = dashSize;
        canvas.height = Math.ceil(options.width);
        var context = canvas.getContext("2d");
        if (!context) {
            console.warn("Did not get context from canvas");
            return undefined;
        }
        // color and alpha are applied by the stroke
        context.strokeStyle = "white";
        context.lineWidth = options.width;
        var x = 0;
        var y = options.width / 2;
        context.moveTo(x, y);
        for (var i = 0; i < options.dash.length; i += 2) {
            x += options.dash[i];
            context.lineTo(x, y);
            if (options.dash.length !== i + 1) {
                x += options.dash[i + 1];
                context.moveTo(x, y);
            }
        }
        context.stroke();
        var texture = (DashLine.dashTextureCache[key] =
            PIXI.Texture.from(canvas));
        texture.source.scaleMode = "nearest";
        return texture;
    };
    // cache of PIXI.Textures for dashed lines
    DashLine.dashTextureCache = {};
    return DashLine;
}());
exports.DashLine = DashLine;
//# sourceMappingURL=index.js.map