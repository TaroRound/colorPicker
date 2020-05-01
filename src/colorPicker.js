;(function(global, factory, exportName){
	
	if(typeof exports === 'object' && typeof module === 'object'){
		module.exports = factory();
	} else if (typeof define === 'function' && define.amd) {
		define([], factory);
	} else if (typeof exports === 'object' ){
		exports[exportName] = factory();
	} else {
		global[exportName] = factory();
	}
})(this, function () {
	
	// 基础点
	var Point = function (x, y) {
		this.x = x;
		this.y = y;
		this.points = [];
	};

	// 绘制圆弧路径
	function circle (canvas2dContext, ogriginX, ogriginY, radius, strokeStyle, fillStyle) {

		canvas2dContext.moveTo(ogriginX, ogriginY);
		canvas2dContext.arc(ogriginX, ogriginY, radius, 0, 2*Math.PI, false);
		canvas2dContext.strokeStyle = strokeStyle;
		canvas2dContext.fillStyle = fillStyle;
	}
	
	// 绘制带端点的线条;
	// {param.from: {x, y}, param.to: {x, y}}
	// {param.lineStyle: { lineWidth: Number, dash: Array, color: HSC }}
	// {param.lineEnd: {start: {}, end: {}}} 线的两端增加的形状;
	function fillLine (canvas2dContext, from, to, lineStyle, lineEnd) {
		lineStyle = lineStyle || {};

		canvas2dContext.beginPath();
		canvas2dContext.lineWidth = lineStyle.lineWidth || 1;
		canvas2dContext.strokeStyle = lineStyle.color || '#999';
		if (lineStyle.dash && Array.isArray(lineStyle.dash)) {
			canvas2dContext.setLineDash(lineStyle.dash);
		} else {
			canvas2dContext.setLineDash([]);
		}
		
		// 绘制带端点修饰的线条: 先画线, 再画起止点形状:
		if (lineEnd) {
			// 先画线
			canvas2dContext.lineWidth = lineStyle.lineWidth || 1;
			canvas2dContext.moveTo(from.x, from.y);
			canvas2dContext.lineTo(to.x, to.y);
			canvas2dContext.stroke();

			// 开始点
			if (lineEnd.start) {
				var polygon = null;
				
				canvas2dContext.moveTo(from.x, from.y);
				switch (lineEnd.start.shape) {
					case 'circle':
						
						circle(canvas2dContext, from.x, from.y, lineEnd.start.size, lineEnd.start.stroke, lineEnd.start.fill);
						lineEnd.start.stroke && canvas2dContext.stroke();
						lineEnd.start.fill && canvas2dContext.fill();
						break;
					case 'polygon':
						polygon = new Polygon(
							from.x, 
							from.y, 
							lineEnd.start.size, 
							lineEnd.start.shapeSides, 
							lineEnd.start.transform,
							lineEnd.start.stroke,
							lineEnd.start.fill
						);
						polygon.createPath(canvas2dContext, true);
						polygon.stroke(canvas2dContext);
						polygon.fill(canvas2dContext);
						lineEnd.start.fill && polygon.fill(canvas2dContext);
						break;
					default:
						break;
				}
			}

			if (lineEnd.end) {
				var polygon = null;

				switch (lineEnd.end.shape) {
					case 'circle':
						circle(canvas2dContext, to.x, to.y, lineEnd.end.size, lineEnd.end.stroke, lineEnd.end.fill);
						canvas2dContext.stroke();
						canvas2dContext.fill();
						break;
					case 'polygon':
						polygon = new Polygon(
							to.x, 
							to.y, 
							lineEnd.end.size, 
							lineEnd.end.shapeSides, 
							lineEnd.end.transform,
							lineEnd.end.stroke,
							lineEnd.end.fill
						);
						polygon.createPath(canvas2dContext, true);
						polygon.stroke(canvas2dContext);
						polygon.fill(canvas2dContext);
						lineEnd.end.fill && polygon.fill(canvas2dContext);
						break;
					default:
						break;
				}

				canvas2dContext.moveTo(from.x, from.y);
			}

			// for (var i=0; i < points.length; i++) {
			//     canvas2dContext[i === 0 ? 'moveTo' : 'lineTo'](points.x, points.y);
			// }
			
			// lineStyle.fill && canvas2dContext.fill();
		} else {
			canvas2dContext.moveTo(from.x, from.y);
			canvas2dContext.lineTo(to.x, to.y);
			canvas2dContext.stroke();
			lineStyle.fill && canvas2dContext.fill();
		}

		canvas2dContext.closePath();
	}
	// 绘制多边形;
	function Polygon (centerX, centerY, radius, sides, startAngle, strokeStyle, fillStyle, filled) {
		this.x = centerX;
		this.y = centerY;
		this.radius = radius;
		this.sides = sides;
		this.startAngle = startAngle;
		this.strokeStyle = strokeStyle;
		this.fillStyle = fillStyle;
		this.filled = filled;
	};

	/**
	 * 绘制多边形方法: 给定一个中心点, 半径, 旋转角度, 边数; 计算出多边形每一个点的坐标点, 然后依次链接两个点;
	 */
	Polygon.prototype = {
		getPoints: function () {
			var points = [],
				angle = this.startAngle || 0;

			for (var i=0; i < this.sides; i++) {
				points.push(new Point(this.x + this.radius * Math.sin(angle), this.y - this.radius * Math.cos(angle)));
				angle += 2*Math.PI/this.sides;
			}
			
			return points;
		},

		createPath: function (context, doNotIntercept) {
			var points = this.getPoints();
			if(!doNotIntercept) {
				context.beginPath();
			}

			if (points.length) {
				context.moveTo(points[0].x, points[0].y);
				for (var i=1; i<this.sides; i++) {
					context.lineTo(points[i].x, points[i].y);
				}
			}   
			

			if (!doNotIntercept) {
				context.closePath();
			}
		},

		stroke: function (context) {
			context.save();
			this.createPath(context);
			context.strokeStyle = this.strokeStyle;
			context.stroke();
			context.restore();
		},

		fill: function (context) {
			context.save();
			this.createPath(context);
			context.fillStyle = this.fillStyle;
			context.fill();
			context.restore();
		},

		move: function (x, y) {
			this.x = x;
			this.y = y;
		}
	}
	
	// 绘制一个支持渐变的矩形: 仅支持 canvas.2d 绘图对象
	// {param.x, param.y} 矩形左上角顶点的坐标 
	// {param background}: 可以是一个颜色值, 也可以是一段渐变描述(简化: 这里仅支持单一渐变), 如: to right: 0% #000: 50% #ccc: 100% #fff;
	function fillRect (canvas2dContext, x, y, width, height, background) {

		canvas2dContext.beginPath();
		var gradient = null;
		// 渐变
		if (background && background.indexOf(':') !== -1) {
			var gradientText = background.split(':'),
				colors = [],
				direction = null;

			try {
				gradientText.forEach((t,index) => {
					var tx = '';
					if (index === 0) {
						direction = t.split(' ')[1].trim();
					} else {
						tx = t.trim();
						var start = tx.match(/^[0-9.%]+/)[0];
						var color = tx.slice(start.length);

						start = start[start.length - 1] === '%' ? parseFloat(start)/100 : +start;
						colors.push({
							rate: start,
							color: color.trim()
						});
					}
				});
			} catch (e) { console.warn('绘制矩形错误 ', e) };

			switch (direction) {
				case 'top':
					gradient = canvas2dContext.createLinearGradient(x, y + height, x, y);
					break;
				case 'bottom':
					gradient = canvas2dContext.createLinearGradient(x, y, x, y + height);
					break;
				case 'left':
					gradient = canvas2dContext.createLinearGradient(x + width, y, x, y);
					break;
				case 'right':
					gradient = canvas2dContext.createLinearGradient(x, y, x + width, y);
					break;
				case 'topLeft':
					gradient = canvas2dContext.createLinearGradient(x + width, y + height, x, y);
					break;
				case 'topRight':
					gradient = canvas2dContext.createLinearGradient(x, y + height, x + width, y);
					break;
				case 'bottomLeft':
					gradient = canvas2dContext.createLinearGradient(x + width, x, y, y + height);
					break;
				case 'bottomRight':
					gradient = canvas2dContext.createLinearGradient(x, y, x + width, y + height);
					break;
				default:
					break;
			}

			if (direction && gradient) {
				colors.forEach(color => {
					gradient.addColorStop(+color.rate, color.color);
				});

				canvas2dContext.fillStyle = gradient;
			}
		}
		// 纯色 
		else {
			canvas2dContext.fillStyle = background || '#000';
		}

		canvas2dContext.rect(x, y, width, height);
		canvas2dContext.fill();
		canvas2dContext.closePath();
	}
	
	// 绘制文本
	function fillText (canvas2dContext, x, y, text, textStyle, isSave) {
		textStyle = Object.assign({fontSize: 12}, textStyle || {});

		canvas2dContext.beginPath();
		canvas2dContext.font = textStyle.fontSize + "px serif";
		canvas2dContext.fillStyle = textStyle.color || '#666';
		canvas2dContext.textAlign = textStyle.align || 'center';
		canvas2dContext.textBaseline = textStyle.verticle || 'alphabetic';
		canvas2dContext.fillText(text, x, y);
		canvas2dContext.closePath();
	}
	
	// 绘制圆
	function fillCircle (canvas2dContext, ogriginX, ogriginY, radius, strokeStyle, fillStyle) {
		canvas2dContext.beginPath();
		canvas2dContext.moveTo(ogriginX, ogriginY);
		canvas2dContext.arc(ogriginX, ogriginY, radius, 0, 2*Math.PI, false);
		canvas2dContext.strokeStyle = strokeStyle;
		canvas2dContext.fillStyle = fillStyle;
		
		if (fillStyle) {
			canvas2dContext.fill();
		}
		if (strokeStyle) {
			canvas2dContext.stroke();
		}
		canvas2dContext.closePath();
	}

	// 值是否包含于集合: [value], [value), (value], 这里取得全包含 []; 
	function isInRange (value, arr) {
		var min = arr[0],
			max = arr[1],
			r = min;
		if (min > max) { min = max; max = r };
		return value >= min && value <= max;
	}
	
	// 判断点是否在矩形块中
	function isPointInBlock (point, block) {
		var {x, y} = point;
		var _x1 = block.x;
		var _y1 = block.y;
		var {width, height} = block;

		return isInRange(x, [_x1, _x1 + width]) && isInRange(y, [_y1, _y1 + height]);
	}
	
	// 获取 canvas坐标点的颜色信息
	function getPixelcolor (canvas2dContext, x, y, imageData) {
		var pixel, index, r, g, b, a;

		if (imageData) {
			pixel = imageData.data;
			index = (y * imageData.width + x) * 4;
			r = pixel[index];
			g = pixel[index + 1];
			b = pixel[index + 2];
			a = pixel[index + 3] / 255;
		} else {
			// ???
			pixel = canvas2dContext.getImageData(x-1, y-1, 1, 1).data;
			r = pixel[0];
			g = pixel[1];
			b = pixel[2];
			a = pixel[3] / 255;
		}

		a = Math.round(a * 100) / 100;
		var rHex = r.toString(16),
			gHex = g.toString(16),
			bHex = b.toString(16),
			rgbaColor,
			rgbColor,
			hexColor;

		r < 16 && (rHex = "0" + rHex);
		g < 16 && (gHex = "0" + gHex);
		b < 16 && (bHex = "0" + bHex);
		
		rgbaColor = "rgba(" + r + "," + g + "," + b + "," + a + ")";
		rgbColor = "rgb(" + r + "," + g + "," + b + ")";
		hexColor = "#" + rHex + gHex + bHex;
		return {
			rgba : rgbaColor,
			rgb : rgbColor,
			hex : hexColor,
			r : r,
			g : g,
			b : b,
			a : a
		};
	}
	
	// 简单复制
	function copy(obj, unExcept) {
		var o = {};
		unExcept = unExcept || [];
		for (var key in obj) {
			if (unExcept.indexOf(key) === -1) {
				o[key] = obj[key];
			}
		}
		return o;
	}
	
	// 线性函数: y = kx + b; domain:定义域, range:值域
	function linear (domain, range) {
		if (domain[0] === domain[1]) {
			return {
				setX: function () {
					return range[0]
				},
				setY: function () {
					return domain[0]
				}
			}
		} else {
			var k = (range[1] - range[0]) / (domain[1] - domain[0]);
			var b = range[1] - k * domain[1];
			return {
				setX: function (x) {
					return k*x + b;
				},
				setY: function (y) {
					return (y - b)/k;
				}
			}
		}
	}
	
	var getUUid = (function () {
		var n = 1000;
		return function () {
			n++;
			return n
		}
	})();
	/*****************************************************************************/
	
	
	// 简陋版拾色器;
	function Picker (selector, option) {
		option = option || {};
		var wrap = document.querySelector(selector),
			bounding = wrap.getBoundingClientRect(),
			tipX = bounding.left,
			tipY = bounding.top + bounding.height,
			tipWidth = 400,
			tipHeight = 200,
			colorRange = option.colorRange || ['rgb(255,0,0)', 'rgb(255,0,255)', 'rgb(0,0,255)', 'rgb(0,255,255)', 'rgb(0,255,0)', 'rgb(255,255,0)', 'rgb(255,0,0)'],	// 色板取自
			colorRangeText,
			layout_range = {},
			layout_board = {},
			layout_indicator = {},
			defaultMargin = option.defaultMargin || 4,
			background = option.background || '#ccc',
			colorRangeIndicatorSize = option.colorRangeIndicatorSize || 4,
			mode = option.mode === 'dark' || option.mode === 'light' ? option.mode : 'dark',
			linearColor;

		this.$ = document.querySelector;
		this.canvas = document.createElement('canvas');
		this.selector = selector;
		this.wrap = wrap;
		this.uid = 'colorPicker-' + getUUid();
		this.colorRange = colorRange;
		this.baseColor = mode === 'dark' ? '#000' : '#fff';
		this.context = this.canvas.getContext('2d');

		this.color = {};
		this.visible = true;
		this.background = background;
		this.defaultMargin = defaultMargin;
		this.colorRangeIndicatorSize = colorRangeIndicatorSize;
		
		this.dragedShape = null;
		this.boardPoint = {x: 0, y: 0};
		this.rangePoint = {};
		this.callback = {};
		this.eventHandler = {};
		this.animation = {};
		this.imageData = null;
		this.layout = {
			range: layout_range,
			board: layout_board,
			indicator: layout_indicator
		}
	
		this.canvas.id = this.uid;
		this.canvas.width = tipWidth;
		this.canvas.height = tipHeight;
		this.canvas.style.position = 'absolute';
		this.canvas.style.left = tipX + 'px';
		this.canvas.style.top = tipY + 'px';
		this.canvas.style.boxShadow = '0 0 4px rgba(0,0,0,0.3)';
		this.canvas.style.cursor = 'crosshair';
		this.canvas.style.display = this.visible ? 'block' : 'none';
		
		layout_range.x = Math.round(tipWidth*0.9);
		layout_range.y = 0;
		layout_range.width = tipWidth - layout_range.x;
		layout_range.height = Math.round(tipHeight * 0.5);
		
		layout_board.x = 0;
		layout_board.y = 0;
		layout_board.width = Math.round(tipWidth - layout_range.width - defaultMargin);
		layout_board.height = tipHeight;
		
		layout_indicator.x = layout_range.x;
		layout_indicator.y = Math.round(tipHeight - layout_range.height + defaultMargin);
		layout_indicator.width = layout_range.width;
		layout_indicator.height = Math.round(tipHeight - layout_indicator.y); //  - defaultMargin
		
		this.rangePoint.y = layout_range.y;
		color = colorRange[0];
		linearColor = 'to bottom:'
		for(var i = 0; i < colorRange.length; i++) {
			linearColor += (i / (colorRange.length - 1) * 100).toFixed(2) + '% ' + colorRange[i] + (i === colorRange.length - 1 ? '' : ':')
		}

		// 色域面板
		fillRect(this.context, layout_range.x + this.colorRangeIndicatorSize * 2, layout_range.y, layout_range.width - this.colorRangeIndicatorSize * 4, layout_range.height, linearColor);
		this.colorRangeText = linearColor;
		
		// RGBA
		this.initIndicator();

		document.body.appendChild(this.canvas);
		
		var _this = this;
		setTimeout(function () {
			var boardInitColor;

			_this.imageData = _this.context.getImageData(0, 0, _this.canvas.width, _this.canvas.height);

			layout_board.color = getPixelcolor(_this.context, layout_range.x + layout_range.width / 2, layout_range.y, _this.imageData);
			boardInitColor = 'rgba(' + layout_board.color.r + ',' + layout_board.color.g + ',' + layout_board.color.b + ', {ALPHA})'

			// 色域面板指示器;
			_this.updateColorRange();
		
			// 颜色展示
			fillRect(_this.context, layout_board.x, layout_board.y, layout_board.width, layout_board.height, 'to topRight:0% ' + _this.baseColor + ':100% ' + boardInitColor.replace('{ALPHA}', 1));
			
			
			_this.color = getPixelcolor(_this.context, _this.boardPoint.x, _this.boardPoint.y);
			
			_this.initEvent();
		});
	}
	
	
	Picker.prototype = {
		constructor: Picker,
		selectColorRange: function () {
			
			var point = {
				x: Math.round(this.layout.range.x + this.layout.range.width/2),
				y: Math.round(this.rangePoint.y)
			};
			var color = getPixelcolor(this.context, point.x, point.y, this.imageData);
			
			this.updateColorRange();
			
			this.layout.board.color = color;
			
			this.context.clearRect(this.layout.board.x, this.layout.board.y, this.layout.board.width + 3, this.layout.board.height);
			
			fillRect(
				this.context, 
				this.layout.board.x, 
				this.layout.board.y, 
				this.layout.board.width, 
				this.layout.board.height, 
				'to topRight:0% ' + this.baseColor + ':100% rgba(' + + color.r + ',' + color.g + ',' + color.b + ',' + '1)'
			);

			fillCircle(
				this.context, 
				this.boardPoint.x,
				this.boardPoint.y,
				3,
				'#fff'
			);
			
			var _this = this;
			_this.color = getPixelcolor(_this.context, _this.boardPoint.x, _this.boardPoint.y);
			_this.updateIndicator();
		},
		selectColorBoard: function () {
			var boardColor = this.layout.board.color;

			this.context.clearRect(this.layout.board.x, this.layout.board.y, this.layout.board.width + 3, this.layout.board.height);
			fillRect(
				this.context, 
				this.layout.board.x, 
				this.layout.board.y, 
				this.layout.board.width, 
				this.layout.board.height, 
				'to topRight:0% ' + this.baseColor + ':100% rgba(' + + boardColor.r + ',' + boardColor.g + ',' + boardColor.b + ',' + '1)'
			);
			
			fillCircle(
				this.context, 
				this.boardPoint.x,
				this.boardPoint.y,
				3,
				'#fff'
			);
			
			this.color = getPixelcolor(this.context, this.boardPoint.x, this.boardPoint.y);
			this.updateIndicator();
		},
		updateColorRange: function () {
			var rangePoint = this.rangePoint.y,
				layout = this.layout.range,
				indicatorSize = this.colorRangeIndicatorSize,
				linearColor = this.colorRangeText;
			
			this.context.clearRect(layout.x, layout.y, layout.width, layout.height + indicatorSize);

			fillRect(this.context, layout.x + indicatorSize*2, layout.y, layout.width - indicatorSize * 4, layout.height, linearColor);
			fillLine(
				this.context,
				{x: layout.x + indicatorSize, y: rangePoint}, 
				{x: layout.x + layout.width - indicatorSize, y: rangePoint},
				{color: 'rgba(255,255,255,0.3)', lineWidth: 1},
				{
					start: { 
						size: indicatorSize, 
						fill: '#666', 
						stroke: null, 
						shape: 'polygon', 
						shapeSides: 3, 
						transform: Math.PI/2 
					},
					end: { 
						size: indicatorSize, 
						fill: '#666', 
						stroke: null, 
						shape: 'polygon', 
						shapeSides: 3, 
						transform: -Math.PI/2 
					}
				}
			);
		},
		clickHandler: function (e) {
			var _this = this;
			var domBounding = _this.canvas.getBoundingClientRect(),
				pX = e.x,
				pY = e.y,
				disX = pX - domBounding.x,
				disY = pY - domBounding.y,
				point = {},
				color,
				boardColor;
			
			point.x = disX
			point.y = disY
			
			if (isPointInBlock(point, _this.layout.range)) {
				this.rangePoint.y = point.y >= this.layout.range.y + this.layout.range.height ? this.layout.range.y + this.layout.range.height - 1 : point.y;
				this.selectColorRange();
			}
			else if (isPointInBlock(point, _this.layout.board)) {
				this.boardPoint.x = point.x >= this.layout.board.x + this.layout.board.width ? this.layout.board.x + this.layout.board.width - 1 : point.x;
				this.boardPoint.y = point.y >= this.layout.board.y + this.layout.board.height ? this.layout.board.y + this.layout.board.height - 1 : point.y;
				this.selectColorBoard();
			}
		},
		docClickHandler: function (e) {
			var target = e.target || e.srcElement;
			
			if (target.id !== this.uid && target !== this.wrap) {
				this.hide();
			}
		},
		mousedownHandler: function (e) {
			var domBounding = this.canvas.getBoundingClientRect(),
				pX = e.x,
				pY = e.y,
				disX = pX - domBounding.x,
				disY = pY - domBounding.y,
				point = {},
				shapes = ['board', 'range'];
				
			point.x = disX;
			point.y = disY;
			
			for (var i = 0; i < shapes.length; i++) {
				if (isPointInBlock(point, this.layout[shapes[i]])) {
					this.dragedShape = shapes[i];
					
					if (shapes[i] === 'range') {
						this.rangePoint.y = point.y >= this.layout.range.y + this.layout.range.height ? this.layout.range.y + this.layout.range.height - 1 : point.y;
						this.selectColorRange();
					} else if (shapes[i] === 'board') {
						this.boardPoint.x = point.x >= this.layout.board.x + this.layout.board.width ? this.layout.board.x + this.layout.board.width - 1 : point.x;
						this.boardPoint.y = point.y >= this.layout.board.y + this.layout.board.height ? this.layout.board.y + this.layout.board.height - 1 : point.y;
						this.selectColorBoard();
					}
					break;
				}
			}
		},
		mouseupHandler: function (e) {
			this.dragedShape = null;
		},
		mousemoveHandler: function (e) {
			var domBounding = this.canvas.getBoundingClientRect(),
				pX = e.x,
				pY = e.y,
				disX = pX - domBounding.x,
				disY = pY - domBounding.y,
				point = {x: disX, y: disY},
				shape,
				color;

			switch (this.dragedShape) {
				case 'range':
					this.canvas.style.cursor = 'crosshair';
					
					shape = this.layout[this.dragedShape];
					
					if (disY <= shape.y) {
						point.y = shape.y;
					} else if (disY >= shape.y + shape.height) {
						point.y = shape.y + shape.height;
					}
					
					this.rangePoint.y = point.y >= this.layout.range.y + this.layout.range.height ? this.layout.range.y + this.layout.range.height - 1 : point.y;
					this.selectColorRange();

					break;
				case 'board':

					this.canvas.style.cursor = 'crosshair';

					shape = this.layout[this.dragedShape];
					

					if (disX <= shape.x) {
						point.x = shape.x;
					} else if (disX >= shape.x + shape.width) {
						point.x = shape.x + shape.width;
					}
					if (disY <= shape.y) {
						point.y = shape.y;
					} else if (disY >= shape.y + shape.height) {
						point.y = shape.y + shape.height;
					}
					
					this.boardPoint.x = point.x >= this.layout.board.x + this.layout.board.width ? this.layout.board.x + this.layout.board.width - 1 : point.x;
					this.boardPoint.y = point.y >= this.layout.board.y + this.layout.board.height ? this.layout.board.y + this.layout.board.height - 1 : point.y;
				
					this.selectColorBoard();

					break;
				default:
					this.canvas.style.cursor = isPointInBlock(point, this.layout.board) || isPointInBlock(point, this.layout.range) ? 'crosshair' : 'default';
					break;
			}
		},
		initEvent: function () {
			var _this = this;
			/*this.eventHandler['clickHandler'] = {
				type: 'click',
				selector: this.seletor,
				callback: function (e) {
					_this.clickHandler(e);
				}
			};*/
			this.eventHandler['bodyClickHandler'] = {
				type: 'click',
				selector: 'body',
				callback: function (e) {
					_this.docClickHandler(e);
				}
			};
			this.eventHandler['mousedown'] = {
				type: 'mousedown',
				selector: this.seletor,
				callback: function (e) {
					_this.mousedownHandler(e);
				}
			};
			this.eventHandler['mouseup'] = {
				type: 'mouseup',
				selector: this.seletor,
				callback: function (e) {
					_this.mouseupHandler(e);
				}
			};
			this.eventHandler['mousemove'] = {
				type: 'mousemove',
				selector: this.seletor,
				callback: function (e) {
					if (_this.animation.moveHandler) {
						cancelAnimationFrame(_this.animation.moveHandler);
					}
					_this.animation.moveHandler = requestAnimationFrame(function () {
						_this.mousemoveHandler(e);
					}, 16);
				}
			};
			this.eventHandler['mouseout'] = {
				type: 'mouseout',
				selector: this.seletor,
				callback: function (e) {
					_this.mouseupHandler(e);
				}
			};

			// this.canvas.addEventListener('click', this.eventHandler['clickHandler'].callback);
			this.canvas.addEventListener('mousedown', this.eventHandler['mousedown'].callback);
			this.canvas.addEventListener('mouseup', this.eventHandler['mouseup'].callback);
			this.canvas.addEventListener('mousemove', this.eventHandler['mousemove'].callback);
			this.canvas.addEventListener('mouseout', this.eventHandler['mouseout'].callback);
			document.querySelector('body').addEventListener('click', this.eventHandler['bodyClickHandler'].callback);
		},
		initIndicator () {
			this.updateIndicator(false);
		},
		updateIndicator: function (stopDispatchEvent) {
			var color = this.color;
			var layout = this.layout.indicator;
			var _this = this;
			var defaultMargin = _this.defaultMargin;
			var scale = linear([0, 3], [layout.y + defaultMargin*2, layout.y + layout.height - defaultMargin*2]);
			
			_this.context.clearRect(layout.x, layout.y, layout.width, layout.height);

			['r', 'g', 'b', 'a'].forEach(function (text, index) {
				fillText(
					_this.context,
					Math.round(layout.x),
					Math.round(scale.setX(index)),
					text.toUpperCase() + ':' + (color[text]||0),
					{
						fontSize: 12,
						color: '#333',
						align: 'left'
					}
				);
			});
			
			if (!stopDispatchEvent) {
				this.dispatchEvent('change', color);
			}
		},
		show: function () {
			this.visible = true;
			this.canvas.style.display = 'block';
		},
		hide: function () {
			this.visible = false;
			this.canvas.style.display = 'none';
		},
		on: function (eventName, cb) {
			if (!cb) {
				return
			}
			
			cb.uid = cb.uid || getUUid();
			if (this.callback[eventName]) {
				if (!this.callback[eventName].some(function (fn) { return fn.uid === cb.uid })) {
					this.callback[eventName].push(cb);
				}
			} else {
				this.callback[eventName] = [cb];
			}
		},
		dispatchEvent: function (eventName) {
			var callback = this.callback[eventName],
				toBreak = false,
				args = [].slice.call(arguments, 1),
				_this = this;

			if (callback && callback.length) {
				for(var i = 0, len = callback.length; i < len; i++) {
					toBreak = toBreak | callback[i].apply(_this, args);
					if (toBreak) {
						break;
					}
				}
			}
		},
		destroy: function () {
			for (var key in this.callback) {
				if ( this.callback[key] ) {
					this.callback[key].length = 0;
				}
				this.callback[key] = null;
			}
			
			var cur;
			for (var key in this.eventHandler) {
				cur = this.eventHandler[key];
				document.querySelector(cur.selector).removeEventListener(cur.type, cur.callback);
			}
			
			for (var key in this) {
				this[key] = null;
				delete this[key];
			}
		}
	}
	
	return Picker;
}, 'ColorPicker');