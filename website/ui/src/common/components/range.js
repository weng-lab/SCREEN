import React from 'react';

import DualSlider from './dual_slider';
import HistogramSlider from './histogram_slider';

//import * as Render from '../zrenders';

class RangeSlider extends React.Component {
    constructor(props) {
	super(props);
	this.updateSelection = this.updateSelection.bind(this);
	this.updateSelectionLeft = this.updateSelectionLeft.bind(this);
	this.updateSelectionRight = this.updateSelectionRight.bind(this);
	this.doChange = this.doChange.bind(this);
	this.doChangeLeft = this.doChangeLeft.bind(this);
	this.doChangeRight = this.doChangeRight.bind(this);
	this.state = { lvalue: props.lvalue, rvalue: props.rvalue,
		       numDecimals: props.numDecimals || 2};
    }

    // show transient changes, from slider
    updateSelection(lvalue, rvalue){
	this.setState({lvalue, rvalue});
    }

    // show transient changes, from left text box move
    updateSelectionLeft(e){
	const lvalue = e.target.value;
	if(!isNaN(lvalue) && this.props.range[0] <= lvalue){
	    this.setState({lvalue});
	}
    }

    // show transient changes, from right text box move
    updateSelectionRight(e){
	const rvalue = e.target.value;
	if(!isNaN(rvalue) && this.props.range[1] >= rvalue){
	    this.setState({rvalue});
	}
    }
    
    // call parent onChange() action, from slider move
    doChange(lvalue, rvalue){
	this.setState({lvalue, rvalue});
	if(this.props.onChange){
	    this.props.onChange(lvalue, rvalue);
	}
    }

    // call parent onChange() action, from left text box change
    doChangeLeft(e){
	let lvalue = +((+e.target.value).toFixed(this.state.numDecimals));
	if(isNaN(lvalue)){
	    return false;
	}
	if(lvalue >= this.state.rvalue){ // pad with episilon
	    lvalue = this.state.rvalue - Math.pow(10, -this.state.numDecimals);
	}
	this.doChange(lvalue, this.state.rvalue);
    }

    // call parent onChange() action, from right text box change
    doChangeRight(e){
	let rvalue = +((+e.target.value).toFixed(this.state.numDecimals));
	if(isNaN(rvalue)){
	    return false;
	}
	if(rvalue <= this.state.lvalue){ // pad with episilon
	    rvalue = this.state.lvalue + Math.pow(10, -this.state.numDecimals);
	}
	this.doChange(this.state.lvalue, rvalue);
    }
    
    render() {
	return (
	    <div>
		<div style={{fontWeight: "bold"}}>{this.props.title}</div>
	        {!this.props.nohistogram && <HistogramSlider
					    	range={this.props.range}
						lvalue={this.state.lvalue}
						rvalue={this.state.rvalue}
					    />}
		<DualSlider
		    range={this.props.range}
		    lvalue={this.state.lvalue}
		    rvalue={this.state.rvalue}
		    dragLeft={this.updateSelection}
		    dragRight={this.updateSelection}
		    onStop={this.doChange}
		    numDecimals={this.state.numDecimals}
		    connect
		/>
		<div style={{paddingTop: "10px"}}>
		    <input type="text"
			   value={this.state.lvalue}
			   onChange={this.updateSelectionLeft}
			   onBlur={this.doChangeLeft}
			   onKeyPress={this.updateSelectionLeft}
	 	           style={{textAlign: "center", width: "40%",
				   position: "relative", fontWeight: "bold"}}
		    /> -&nbsp;
		    <input type="text"
			   value={this.state.rvalue}
			   onChange={this.updateSelectionRight}
			   onBlur={this.doChangeRight}
			   onKeyPress={this.updateSelectionRight}
	 	           style={{textAlign: "center", width: "40%",
				   position: "relative", fontWeight: "bold"}}
		    />
		</div>
	    </div>);
    }
}

class RangeFacet extends React.Component {
    render() {
	return (<div>
		<RangeSlider
		    nohistogram={this.props.nohistogram}
		    range={this.props.range}
                    lvalue={this.props.lvalue}
		    rvalue={this.props.rvalue}
		    interval={this.props.h_interval}
		    data={this.props.h_data}
                    margin={this.props.h_margin}
		    onChange={this.props.onChange}
                    title={this.props.title}
		    updateWidth={this.props.updateWidth}
		    numDecimals={this.props.numDecimals}
		/>
	</div>);
    }

}

export default RangeFacet;
