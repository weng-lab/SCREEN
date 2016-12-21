//var d3 = require('d3');

const CRADIUS = 10; // radius of curvature in pixels
const _color = d3.scale.linear().domain([0.0, 1.0]).range(["#ffffff", "#000000"]);

/*
 *  returns a path for drawing a p arm
 *
 *  end: coordinate of the arm's end, bp
 *  height: height of the diagram, pixels
 *  clen: length of the centromere on this arm, bp
 *  _x: scale function to convert bp to pixels
 */
export const parm = (end, height, clen, _x) => (
    "M" + _x(end) + "," + (height / 2)
	+ "L" + _x(end - clen) + "," + height
	+ "H" + CRADIUS
	+ "A" + CRADIUS + "," + CRADIUS + " 0 0 1 " + _x(0) + "," + (height - CRADIUS)
	+ "V" + CRADIUS
	+ "A" + CRADIUS + "," + CRADIUS + " 0 0 1 " + CRADIUS + ",0"
	+ "H" + _x(end - clen)
	+ "L" + _x(end) + "," + (height / 2)
);

/*
 *  returns a path for hiding any rectangle corners drawn outside the curvature of the p arm
 *
 *  end: coordinate of the arm's end, bp
 *  height: height of the diagram, pixels
 *  clen: length of the centromere on this arm, bp
 *  _x: scale function to convert bp to pixels
 */
export const inv_parm = (end, height, clen, _x) => (
    "M" + _x(end) + ",0"
	+ "V" + height
	+ "H" + _x(end - clen)
	+ "L" + _x(end) + "," + (height / 2)
	+ "L" + _x(end - clen) + ",0"
	+ "H0"
	+ "V" + height
	+ "H" + CRADIUS
	+ "A" + CRADIUS + "," + CRADIUS + " 0 0 1 " + _x(0) + "," + (height - CRADIUS)
	+ "V" + CRADIUS
	+ "A" + CRADIUS + "," + CRADIUS + " 0 0 1 " + CRADIUS + ",0"
	+ "H" + _x(end)
);

/*
 *  returns a path for drawing a q arm
 *
 *  length: length of the arm, bp
 *  height: height of the diagram, pixels
 *  clen: length of the centromere on this arm, bp
 *  _x: scale function to convert bp to pixels
 */
export const qarm = (length, height, clen, _x) => (
    "M" + _x(0) + "," + (height / 2)
	+ "L" + _x(clen) + "," + height
	+ "H" + (_x(length) - CRADIUS)
	+ "A" + CRADIUS + "," + CRADIUS + " 0 0 0 " + _x(length) + "," + (height - CRADIUS)
	+ "V" + CRADIUS
	+ "A" + CRADIUS + "," + CRADIUS + " 0 0 0 " + (_x(length) - CRADIUS) + ",0"
	+ "H" + _x(clen)
	+ "L" + _x(0) + "," + (height / 2)
);

/*
 *  returns a path for hiding any rectangle corners drawn outside the curvature of the q arm
 *
 *  length: length of the arm, bp
 *  height: height of the diagram, pixels
 *  clen: length of the centromere on this arm, bp
 *  _x: scale function to convert bp to pixels
 */
export const inv_qarm = (length, height, clen, _x) => (
    "M" + _x(0) + ",0"
	+ "H" + _x(clen)
	+ "L" + _x(0) + "," + (height / 2)
	+ "L" + _x(clen) + "," + height
	+ "H" + _x(0)
	+ "V0"
	+ "H" + _x(length)
	+ "V" + height
	+ "H" + (_x(length) - CRADIUS)
	+ "A" + CRADIUS + "," + CRADIUS + " 0 0 0 " + _x(length) + "," + (height - CRADIUS)
	+ "V" + (height - CRADIUS)
	+ "A" + CRADIUS + "," + CRADIUS + " 0 0 0 " + (_x(length) - CRADIUS) + ",0"
	+ "H" + _x(0)
);

/*
 *  draws a chromosome in a g element
 * 
 *  g: the g element in which to draw
 *  size: size of the drawing; format {height, width}
 *  features: list containing cytobands and centromeres; format {start, end, feature[, color]}, 0.0 <= color <= 1.0
 *  _f: function for drawing features; returns false if the feature should be drawn by the default function
 */
export const draw_chromosome = (g, size, features, _f = null) => {
    
    // get chr length, scale
    var end = d3.max(features, (d) => (d.end));
    var _x = d3.scale.linear().domain([0, end]).range([0, size.width]);

    // get centromeres, draw cytobands
    var cens = [];
    features.map((f) => {
	if (f.feature == "acen") {
	    cens.push(f);
	} else if (_f && _f(f, g, size, _x)) {
	} else if (f.color > 0.0) {
	    g.append("rect")
		.attr("x", _x(f.start))
		.attr("width", _x(f.end - f.start))
		.attr("fill", _color(f.color))
		.attr("height", size.height);
	} else if (f.feature == "stalk") {
	    g.append("rect")
		.attr("x", _x(f.start))
		.attr("width", _x(f.end - f.start))
		.attr("fill", "#880000")
		.attr("height", size.height);
	}
    });

    if(0 == cens.length){
	return;
    }
    
    if(cens[0].start > cens[1].start) {
	cens.reverse();
    }

    // draw p arm
    g.append("path").attr("d", inv_parm(cens[0].end, size.height,
				    cens[0].end - cens[0].start, _x))
	.attr("stroke", "#ffffff").attr("fill", "#ffffff");
    g.append("path").attr("d", parm(cens[0].end, size.height,
				    cens[0].end - cens[0].start, _x))
	.attr("stroke", "#000000").attr("fill", "transparent");

    // get q arm scale, draw q arm
    var _qx = d3.scale.linear()
	.domain([0, cens[1].end - cens[0].end])
	.range([0, _x(cens[1].end - cens[0].end)]);
    g.append("path").attr("d", inv_qarm(end - cens[0].end, size.height,
					cens[1].end - cens[1].start, _qx))
	.attr("fill", "#ffffff").attr("stroke", "#ffffff")
    	.attr("transform", "translate(" + _x(cens[1].start) + ",0)");
    g.append("path").attr("d", qarm(end - cens[0].end, size.height,
				    cens[1].end - cens[1].start, _qx))
	.attr("stroke", "#000000").attr("fill", "transparent")
	.attr("transform", "translate(" + _x(cens[1].start) + ",0)");
    
};
