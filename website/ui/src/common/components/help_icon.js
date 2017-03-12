import React from 'react'
import ReactDOMServer from 'react-dom/server'

import {brJoin} from '../utility'

export const HelpIconActual = (helpkey, color = "#0000EE") => {
    let data = Globals.helpKeys[helpkey];
    let title = data.title;
    let content = data.summary;

    return (
	<span
            className="glyphicon glyphicon-info-sign rtTooltipIcon"
            style={{color}}
            aria-hidden={"true"}
            data-toggle={"tooltip"}
            data-html={"true"}
            title={content}
        />);
}

class HelpIcon extends React.Component {
    constructor(props) {
	super(props);
	this._set_tt_pos = this._set_tt_pos.bind(this);
    }

    render() {
	let color = (this.props.color ? this.props.color : "#0000EE");
        let data = Globals.helpKeys[this.props.helpkey];
        let title = data.title;
        let content = brJoin(data.summary.replace(/\n\n/g, '\n').split('\n'));

	return (
            <span ref="pspan" style={{fontSize: "14pt"}}>
                <a ref="aicon">
                    <span ref="icon"
                          className="glyphicon glyphicon-info-sign"
                          style={{marginLeft: "5px", color}}
                          aria-hidden="true"
                    />
                </a>
		<div className="popover bs-tether-element bs-tether-element-attached-middle bs-tether-element-attached-left bs-tether-target-attached-middle bs-tether-target-attached-right fade bs-tether-enabled in popover-div"
	 	     role="tooltip" ref="tt">

                    <h3 ref="tt_title" className="popover-title">
                        {title}
                    </h3>

                    <div ref="tt_content" className="popover-content">
                        {content}
                    </div>
		</div>
	    </span>);
    }

    _set_tt_pos() {
	var pos = $(this.refs.icon).offset();
	pos.left += $(this.refs.icon).width() + 10;
	$(this.refs.tt).appendTo(document.body);
	$(this.refs.tt).css(pos);
    }

    componentDidUpdate() {
	this._set_tt_pos();
    }

    componentDidMount() {
	var icon = this.refs.aicon;
	this._set_tt_pos();
    	$(icon).on("mouseover", () => {
	    $(this.refs.tt).css({
	        display: "block"
	    });
 	    $(icon).off()
		   .on("mouseover", () => {this.refs.tt.style.display = "block";})
		   .on("mouseout", () => {this.refs.tt.style.display = "none";});
        });
    }
}

export default HelpIcon;
