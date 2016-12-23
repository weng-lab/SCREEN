var React = require('react');

class TRBars extends React.Component {

    constructor(props) {
	super(props);
    }

    render() {
	if (!this.props.items) return;
	var items = this.props.items.sort((a, b) => (a.left - a.right - (b.left - b.right)));
	return (<svg width="500" height={this.props.items.length * 30 + 30}>
		<rect height={this.props.items.length * 30 + 30} width={1} fill="#000000" transform="translate(250,0)" />
		{items.map((item, i) => {
		    var _size = (item.left - item.right) * 100;
		    var size = _size < 0 ? -_size : _size;
		    var x = (_size < 0 ? 250 - size : 251);
		    return (<g>
   			    <text transform={"translate(" + (_size < 0 ? 250 - size - 10 : 250 + size + 10) + "," + (i * 30 + 38) + ")"}
			       style={{textAnchor: (_size < 0 ? "end" : "start")}}>{item.key}</text>
			    <rect width={size} height="10" fill="#000000" transform={"translate(" + x + "," + (i * 30 + 30) + ")"} />
			    </g>
			   )})}
		</svg>);
    }
    
}

class TFDisplay extends React.Component {

    constructor(props) {
	super(props);
    }

    render() {
	return (<table>
		   <tr><td><b>top</b></td><td><b>bottom</b></td></tr>
		<tr style={{"vertical-align": "top"}}><td style={{"vertical-align": "top"}}><TRBars items={[...this.props.left, ...this.props.right]} /></td><td style={{"vertical-align": "top"}}><TRBars items={this.props.right} /></td></tr>
		</table>);
    }
    
}
export default TFDisplay;
