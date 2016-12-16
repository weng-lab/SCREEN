var React = require('react');

class TRBars extends React.Component {

    constructor(props) {
	super(props);
    }

    render() {
	return (<svg width="500" height={this.props.items.length * 30 + 30}>
		{this.props.items.map((item, i) => (
		      <g transform={"translate(0," + (i * 30 + 30) + ")"}>
		      <text transform="translate(0,15)">{item.key}</text>
		      <g transform="translate(75,0)">
			<rect width={item.left * 450} height="10" fill="#0000ff" />
			<rect width={item.right * 450} height="10" transform="translate(0,10)" fill="#00ff00" />
		      </g>
	           </g>
		))}
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
		   <tr style={{"vertical-align": "top"}}><td style={{"vertical-align": "top"}}><TRBars items={this.props.left} /></td><td style={{"vertical-align": "top"}}><TRBars items={this.props.right} /></td></tr>
		</table>);
    }
    
}
export default TFDisplay;
