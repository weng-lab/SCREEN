import React from 'react';

import DualSlider from './slider';
import HistogramSlider from './histogram_slider';

import {chain_functions} from '../common';

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
		       numDecimals: this.props.numDecimals || 2};
    }

    updateSelectionLeft(e){
	const lvalue = e.target.value;
	if(!isNaN(lvalue) && this.props.range[0] <= lvalue){
	    this.setState({lvalue: e.target.value});
	}
    }

    updateSelectionRight(e){
	const rvalue = e.target.value;
	if(!isNaN(rvalue) && this.props.range[1] >= rvalue){
	    this.setState({rvalue: e.target.value});
	}
    }
    
    updateSelection(lvalue, rvalue){
	this.setState({lvalue, rvalue});
    }

    doChange(lvalue, rvalue){
	this.setState({lvalue, rvalue});
	if(this.props.onChange){
	    console.log("RangeFacet: calling: onChange:", lvalue, rvalue);
	    this.props.onChange(lvalue, rvalue);
	}
    }

    doChangeLeft(e){
	let lvalue = +((+e.target.value).toFixed(this.state.numDecimals));
	if(isNaN(lvalue)){
	    return false;
	}
	if(lvalue >= this.state.rvalue){
	    lvalue = this.state.rvalue - Math.pow(10, -this.state.numDecimals);
	}
	this.doChange(lvalue, this.state.rvalue);
    }

    doChangeRight(e){
	let rvalue = +((+e.target.value).toFixed(this.state.numDecimals));
	if(isNaN(rvalue)){
	    return false;
	}
	if(rvalue <= this.state.lvalue){
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
		    connect
		/>
		<div style={{textAlign: "center", paddingTop: "10px"}}>
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

const zeros = (range, interval) => {
    var bins = [];
    for (var i = range[0]; i < range[1]; i += interval) {
	bins.push([i, 0]);
    }
    return {"bins" : bins,
            "numBins" : bins.lengths,
            "binMax" : 0}
};

class RangeFacet extends React.Component {
    render() {
	var h_data = (this.props.h_data === null
		      ? zeros(this.props.range, this.props.h_interval)
		    : this.props.h_data);
	return (<div>
		<RangeSlider
		    nohistogram={this.props.nohistogram}
		    range={this.props.range}
                    lvalue={this.props.lvalue}
		    rvalue={this.props.rvalue}
		    interval={this.props.h_interval}
		    data={h_data}
                    margin={this.props.h_margin}
		    onChange={this.props.onChange}
                    title={this.props.title}
		    updateWidth={this.props.updateWidth}
		    rendervalue={this.props.rendervalue}
		    reversevalue={this.props.reversevalue}
		/>
	</div>);
    }

}

export default RangeFacet;
