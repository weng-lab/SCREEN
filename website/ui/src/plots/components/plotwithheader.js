import React from 'react';

class PlotWithHeader extends React.Component {

    constructor(props) {
	super(props);
    }

    render() {
	return (
	    <div className={"col-md-" + this.props.colspan}>
	        <h3>{this.props.text}</h3>
		<div style={{position: "relative", "height": this.props.height + "px", width: "100%"}}>
		    {this.props.children}
	        </div>
	    </div>
	);
    }

}
export default PlotWithHeader;
