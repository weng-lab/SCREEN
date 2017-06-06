var React = require('react');

const viewbox_text = v => ["0", "0", v.width, v.height].join(" ");

class ScaledPlot extends React.Component {

    constructor(props) {
	super(props);
    }

    componentWillReceiveProps(props, axis_padding) {
	this._viewsize = [props.viewBox.width - axis_padding[0],
			  props.viewBox.height - axis_padding[1]];
    }

    render(elem) {
	return (<div style={{position: "relative", height: "100%", width: "100%"}}>
	            <svg viewBox={viewbox_text(this.props.viewBox)} style={{position: "absolute", width: "100%", height: "100%"}}>
		        {elem}
		    </svg>
		</div>);
    }
    
};
export default ScaledPlot;
