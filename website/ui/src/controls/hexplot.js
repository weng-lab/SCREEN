(function() {

    d3.hexbin = function() {
	var width = 1,
	    height = 1,
	    r,
	    x = d3_hexbinX,
	    y = d3_hexbinY,
	    dx,
	    dy;

	function hexbin(points) {
	    var binsById = {};

	    points.forEach(function(point, i) {
		var py = y.call(hexbin, point, i) / dy, pj = Math.round(py),
		    px = x.call(hexbin, point, i) / dx - (pj & 1 ? .5 : 0), pi = Math.round(px),
		    py1 = py - pj;

		if (Math.abs(py1) * 3 > 1) {
		    var px1 = px - pi,
			pi2 = pi + (px < pi ? -1 : 1) / 2,
			pj2 = pj + (py < pj ? -1 : 1),
			px2 = px - pi2,
			py2 = py - pj2;
		    if (px1 * px1 + py1 * py1 > px2 * px2 + py2 * py2) pi = pi2 + (pj & 1 ? 1 : -1) / 2, pj = pj2;
		}

		var id = pi + "-" + pj, bin = binsById[id];
		if (bin) bin.push(point); else {
		    bin = binsById[id] = [point];
		    bin.i = pi;
		    bin.j = pj;
		    bin.x = (pi + (pj & 1 ? 1 / 2 : 0)) * dx;
		    bin.y = pj * dy;
		}
	    });

	    return d3.values(binsById);
	}

	function hexagon(radius) {
	    var x0 = 0, y0 = 0;
	    return d3_hexbinAngles.map(function(angle) {
		var x1 = Math.sin(angle) * radius,
		    y1 = -Math.cos(angle) * radius,
		    dx = x1 - x0,
		    dy = y1 - y0;
		x0 = x1, y0 = y1;
		return [dx, dy];
	    });
	}

	hexbin.x = function(_) {
	    if (!arguments.length) return x;
	    x = _;
	    return hexbin;
	};

	hexbin.y = function(_) {
	    if (!arguments.length) return y;
	    y = _;
	    return hexbin;
	};

	hexbin.hexagon = function(radius) {
	    if (arguments.length < 1) radius = r;
	    return "m" + hexagon(radius).join("l") + "z";
	};

	hexbin.centers = function() {
	    var centers = [];
	    for (var y = 0, odd = false, j = 0; y < height + r; y += dy, odd = !odd, ++j) {
		for (var x = odd ? dx / 2 : 0, i = 0; x < width + dx / 2; x += dx, ++i) {
		    var center = [x, y];
		    center.i = i;
		    center.j = j;
		    centers.push(center);
		}
	    }
	    return centers;
	};

	hexbin.mesh = function() {
	    var fragment = hexagon(r).slice(0, 4).join("l");
	    return hexbin.centers().map(function(p) { return "M" + p + "m" + fragment; }).join("");
	};

	hexbin.size = function(_) {
	    if (!arguments.length) return [width, height];
	    width = +_[0], height = +_[1];
	    return hexbin;
	};

	hexbin.radius = function(_) {
	    if (!arguments.length) return r;
	    r = +_;
	    dx = r * 2 * Math.sin(Math.PI / 3);
	    dy = r * 1.5;
	    return hexbin;
	};

	return hexbin.radius(1);
    };

    var d3_hexbinAngles = d3.range(0, 2 * Math.PI, Math.PI / 3),
	d3_hexbinX = function(d) { return d[0]; },
	d3_hexbinY = function(d) { return d[1]; };

})();

function create_hexplot(destination_div, data_path)
{

    var data;
    $.get(data_path, function(text) {finish_hexplot(destination_div, $.parseJSON(text));});

}

function finish_hexplot(destination_div, data)
{
    
    var ddiv = document.getElementById(destination_div);
    ddiv.innerText = "";
    
    var margin = {top: 20, right: 20, bottom: 30, left: 40},
	width = ddiv.style.width.replace("px", "") - margin.left - margin.right,
	height = ddiv.style.height.replace("px", "") - margin.top - margin.bottom;
    
    var max_x = d3.max(data, function(d) {return d[0];});
    var max_y = d3.max(data, function(d) {return d[1];});
    
    var color = d3.scale.linear()
	.domain([0, 2000])
	.range(["white", "steelblue"])
	.interpolate(d3.interpolateLab);

    var hexbin = d3.hexbin()
	.size([max_x, max_y])
	.radius(20);

    var x = d3.scale.linear()
	.domain([0, max_x])
        .range([0, width]);

    var y = d3.scale.linear()
	.domain([0, max_y])
	.range([0, height]);

    var xAxis = d3.svg.axis()
	.scale(x)
	.orient("bottom")
	.tickSize(6, -height);

    var yAxis = d3.svg.axis()
	.scale(y)
	.orient("left")
	.tickSize(6, -width);

    var svg = d3.select("#" + destination_div).append("svg")
	.attr("width", width + margin.left + margin.right)
	.attr("height", height + margin.top + margin.bottom)
	.append("g")
	.attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    svg.append("clipPath")
	.attr("id", "clip")
	.append("rect")
	.attr("class", "mesh")
	.attr("width", width)
	.attr("height", height);

    svg.append("g")
	.attr("clip-path", "url(#clip)")
	.selectAll(".hexagon")
	.data(hexbin(data))
	.enter().append("path")
	.attr("class", "hexagon")
	.attr("d", hexbin.hexagon())
	.attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; })
	.style("fill", function(d) { return color(d.length); });

    svg.append("g")
	.attr("class", "y hexaxis")
	.call(yAxis);

    svg.append("g")
	.attr("class", "x hexaxis")
	.attr("transform", "translate(0," + height + ")")
	.call(xAxis);

}
