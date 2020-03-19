/*
 * SPDX-License-Identifier: MIT
 * Copyright (c) 2016-2020 Michael Purcaro, Henry Pratt, Zhiping Weng
 */

import React from 'react'
import $ from 'jquery';

export const ZHelpTooltip = (globals, helpkey, color = "#0000EE") => {
    let data = null;
    if(helpkey in globals.helpKeys){
	data = globals.helpKeys[helpkey];
    } else {
	console.log("help missing", helpkey);
	return "";
    }
    let content = data.title + '\n' + data.summary.replace(/\n\n/g, '\n');

    return (
	<span
            className="glyphicon glyphicon-info-sign has-tooltip"
            style={{color}}
            aria-hidden={"true"}
            data-toggle={"tooltip"}
            data-html={"true"}
	    data-delay={'{"show": 10, "hide": 3000}'}
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
	let data = null

	let helpKeys = this.props.globals.helpKeys;
	if(this.props.helpkey in helpKeys){
	    data = helpKeys[this.props.helpkey];
	} else {
	    console.log("help missing", this.props.helpkey);
	    return false;
	}
	
        let content = data.summary.replace(/\n\n/g, '\n').split('\n');

	return (
            <span style={{fontSize: "14pt"}}>
                <a ref="aicon">
                    <span ref="icon"
                          className="glyphicon glyphicon-info-sign"
                          style={{marginLeft: "5px", color}}
                          aria-hidden="true"
                    />
                </a>
		<div className="popover bs-tether-element bs-tether-element-attached-middle bs-tether-element-attached-left bs-tether-target-attached-middle bs-tether-target-attached-right fade bs-tether-enabled in popover-div"
	 	     role="tooltip" ref="tt">

                    <h3 className="popover-title">
                        {data.title}
                    </h3>
                    <div className="popover-content">
                        {content.map((e, i) => <span key={i}>{e}</span>)}
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
