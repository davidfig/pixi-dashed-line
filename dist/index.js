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
exports.__esModule = true;
exports.DashLine = void 0;
var PIXI = require("pixi.js");
var dashLineOptionsDefault = {
    dash: [10, 5],
    width: 1,
    color: 0xffffff,
    alpha: 1,
    scale: 1,
    useTexture: false
};
var DashLine = /** @class */ (function () {
    /**
     * Create a DashLine
     * @param graphics
     * @param [options]
     * @param [options.useTexture=false] - use the texture based render (useful for very large or very small dashed lines)
     * @param [options.dashes=[10,5] - an array holding the dash and gap (eg, [10, 5, 20, 5, ...])
     * @param [options.width=1] - width of the dashed line
     * @param [options.alpha=1] - alpha of the dashed line
     * @param [options.color=0xffffff] - color of the dashed line
     * @param [options.cap] - add a PIXI.LINE_CAP style to dashed lines (only works for useTexture: false)
     * @param [options.join] - add a PIXI.LINE_JOIN style to the dashed lines (only works for useTexture: false)
     */
    function DashLine(graphics, options) {
        if (options === void 0) { options = {}; }
        /** cursor location */
        this.cursor = new PIXI.Point();
        /** desired scale of line */
        this.scale = 1;
        this.graphics = graphics;
        options = __assign(__assign({}, dashLineOptionsDefault), options);
        this.dash = options.dash;
        this.dashSize = this.dash.reduce(function (a, b) { return a + b; });
        this.useTexture = options.useTexture;
        if (this.useTexture) {
            var texture = DashLine.getTexture(options, this.dashSize);
            graphics.lineTextureStyle({
                width: options.width * options.scale,
                color: options.color,
                alpha: options.alpha,
                texture: texture
            });
            this.activeTexture = texture;
        }
        else {
            this.graphics.lineStyle({
                width: options.width * options.scale,
                color: options.color,
                alpha: options.alpha,
                cap: options.cap,
                join: options.join
            });
        }
        this.scale = options.scale;
    }
    DashLine.distance = function (x1, y1, x2, y2) {
        return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
    };
    DashLine.prototype.moveTo = function (x, y) {
        this.lineLength = 0;
        this.cursor.set(x, y);
        this.start = new PIXI.Point(x, y);
        this.graphics.moveTo(this.cursor.x, this.cursor.y);
        return this;
    };
    DashLine.prototype.lineTo = function (x, y, closePath) {
        if (typeof this.lineLength === undefined) {
            this.moveTo(0, 0);
        }
        var length = DashLine.distance(this.cursor.x, this.cursor.y, x, y);
        var angle = Math.atan2(y - this.cursor.y, x - this.cursor.x);
        var closed = closePath && x === this.start.x && y === this.start.y;
        if (this.useTexture) {
            this.graphics.moveTo(this.cursor.x, this.cursor.y);
            this.adjustLineStyle(angle);
            if (closed && this.dash.length % 2 === 0) {
                var gap = this.dash[this.dash.length - 1];
                this.graphics.lineTo(x - Math.cos(angle) * gap, y - Math.sin(angle) * gap);
            }
            else {
                this.graphics.lineTo(x, y);
            }
        }
        else {
            var cos = Math.cos(angle);
            var sin = Math.sin(angle);
            var x0 = this.cursor.x;
            var y0 = this.cursor.y;
            // find the first part of the dash for this line
            var place = this.lineLength % (this.dashSize * this.scale);
            var dashIndex = 0, dashStart = 0;
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
            // let count = 0
            while (remaining > 0) { // && count++ < 1000) {
                var dashSize = this.dash[dashIndex] * this.scale - dashStart;
                var dist = remaining > dashSize ? dashSize : remaining;
                if (closed) {
                    var remainingDistance = DashLine.distance(x0 + cos * dist, y0 + sin * dist, this.start.x, this.start.y);
                    if (remainingDistance <= dist) {
                        if (dashIndex % 2 === 0) {
                            var lastDash = DashLine.distance(x0, y0, this.start.x, this.start.y) - this.dash[this.dash.length - 1] * this.scale;
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
            // if (count >= 1000) console.log('failure', this.scale)
        }
        this.lineLength += length;
        this.cursor.set(x, y);
        return this;
    };
    DashLine.prototype.closePath = function () {
        this.lineTo(this.start.x, this.start.y, true);
    };
    DashLine.prototype.drawCircle = function (x, y, radius, points) {
        if (points === void 0) { points = 80; }
        var interval = Math.PI * 2 / points;
        var angle = 0;
        var first = [x + Math.cos(angle) * radius, y + Math.sin(angle) * radius];
        this.moveTo(first[0], first[1]);
        angle += interval;
        for (var i = 1; i < points + 1; i++) {
            var next = i === points ? first : [x + Math.cos(angle) * radius, y + Math.sin(angle) * radius];
            this.lineTo(next[0], next[1]);
            angle += interval;
        }
        return this;
    };
    DashLine.prototype.drawEllipse = function (x, y, radiusX, radiusY, points) {
        if (points === void 0) { points = 80; }
        var interval = Math.PI * 2 / points;
        var first;
        for (var i = 0; i < Math.PI * 2; i += interval) {
            var x0 = x - radiusX * Math.sin(i);
            var y0 = y - radiusY * Math.cos(i);
            if (i === 0) {
                this.moveTo(x0, y0);
                first = { x: x0, y: y0 };
            }
            else {
                this.lineTo(x0, y0);
            }
        }
        this.lineTo(first.x, first.y, true);
        return this;
    };
    DashLine.prototype.drawPolygon = function (points) {
        if (typeof points[0] === 'number') {
            this.moveTo(points[0], points[1]);
            for (var i = 2; i < points.length; i += 2) {
                this.lineTo(points[i], points[i + 1], i === points.length - 2);
            }
        }
        else {
            var point = points[0];
            this.moveTo(point.x, point.y);
            for (var i = 1; i < points.length; i++) {
                var point_1 = points[i];
                this.lineTo(point_1.x, point_1.y, i === points.length - 1);
            }
        }
        return this;
    };
    DashLine.prototype.drawRect = function (x, y, width, height) {
        this.moveTo(x, y)
            .lineTo(x + width, y)
            .lineTo(x + width, y + height)
            .lineTo(x, y + height)
            .lineTo(x, y, true);
        return this;
    };
    // adjust the matrix for the dashed texture
    DashLine.prototype.adjustLineStyle = function (angle) {
        var lineStyle = this.graphics.line;
        lineStyle.matrix = new PIXI.Matrix();
        if (angle) {
            lineStyle.matrix.rotate(angle);
        }
        if (this.scale !== 1)
            lineStyle.matrix.scale(this.scale, this.scale);
        var textureStart = -this.lineLength;
        lineStyle.matrix.translate(this.cursor.x + textureStart * Math.cos(angle), this.cursor.y + textureStart * Math.sin(angle));
        this.graphics.lineStyle(lineStyle);
    };
    // creates or uses cached texture
    DashLine.getTexture = function (options, dashSize) {
        var key = options.dash.toString();
        if (DashLine.dashTextureCache[key]) {
            return DashLine.dashTextureCache[key];
        }
        var canvas = document.createElement("canvas");
        canvas.width = dashSize;
        canvas.height = Math.ceil(options.width);
        var context = canvas.getContext("2d");
        if (!context) {
            console.warn('Did not get context from canvas');
            return;
        }
        context.strokeStyle = "white";
        context.globalAlpha = options.alpha;
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
        var texture = DashLine.dashTextureCache[key] = PIXI.Texture.from(canvas);
        texture.baseTexture.scaleMode = PIXI.SCALE_MODES.NEAREST;
        return texture;
    };
    // cache of PIXI.Textures for dashed lines
    DashLine.dashTextureCache = {};
    return DashLine;
}());
exports.DashLine = DashLine;
//# sourceMappingURL=index.js.map