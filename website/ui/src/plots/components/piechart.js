var React = require('react');
import ScaledPlot from './scaledplot';

const ccoords = r => pct => [
    (1 + Math.sin(2 * Math.PI * pct)) * r,
    (1 - Math.cos(2 * Math.PI * pct)) * r
];

class PieChart extends ScaledPlot {

    constructor(props) {
	super(props);
	this.componentWillReceiveProps(props);
    }

    componentWillReceiveProps(props) {
	super.componentWillReceiveProps(props, [0, 0]);
	this._coord = ccoords(props.radius);
    }

    render() {
	let ipct = 0;
	return super.render(
	    <g>
		{this.props.slices.map( (s, i) => {
		    let start = this._coord(ipct);
		    ipct += s.pct;
		    let end = this._coord(ipct);
		    let M = "M " + start[0] + " " + start[1];
		    let A = "A " + this.props.radius + " " + this.props.radius + " 0 " + (s.pct > .5 ? 1 : 0) + " 1 " + end[0] + " " + end[1];
		    let L = "L " + this.props.radius + " " + this.props.radius;
		    return <path fill={s.fill} stroke={this.props.stroke}
		               d={[M, A, L].join(" ")} />;   
		} )}
	    </g>
	);
    }

}
export default PieChart;
