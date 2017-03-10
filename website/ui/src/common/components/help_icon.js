import React from 'react'
import ReactDOMServer from 'react-dom/server'

export const HelpIconActual = (key, color = "#0000EE") => {
    let data = Globals.helpKeys[key];
    let title = data.title;
    let content = data.summary
		      .replace(/\n\n/g, "<br>")
		      .replace(/\n/g, "<br>")
		      .replace(/  /g, "");
    let dataID = key + "_tip";
    
    return (
	<span>
	    <div id={dataID} className={"hidden"}>
		<h3 className="popover-title">{title}</h3>
		<div className="popover-content">{content}</div>
	    </div>
	    <span
		className="glyphicon glyphicon-info-sign tooltipIcon"
		style={{color}}
		aria-hidden={"true"}
		data-toggle={"tooltip"}
		data-tip={dataID}>
	    </span>
	</span>);
}

class HelpIcon extends React.Component {
    render() {
	let color = (this.props.color ? this.props.color : "#0000EE");
	return HelpIconActual(this.props.helpkey, color);
    }
}

export default HelpIcon;
