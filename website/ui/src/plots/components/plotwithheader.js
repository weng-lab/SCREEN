var React = require('react');

const header = (text, size) => {
    if (size == 1) return <h1>{text}</h1>;
    if (size == 2) return <h2>{text}</h2>;
    if (size == 3) return <h3>{text}</h3>;
    return <h4>{text}</h4>;
};

class PlotWithHeader extends React.Component {

    constructor(props) {
	super(props);
    }

    render() {
	return (
	    <div className={"col-md-" + this.props.colspan}>
	        {header(this.props.text, this.props.headersize)}
		<div style={{position: "relative", "height": this.props.height + "px", width: "100%"}}>
		    {this.props.children}
	        </div>
	    </div>
	);
    }

}
export default PlotWithHeader;
