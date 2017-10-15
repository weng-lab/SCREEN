import React from 'react';
import Draggable from 'react-draggable';

import {linearScale} from '../utility';
import {chain_functions} from '../common';

class DualSlider extends React.Component {
    constructor(props){
	super(props);
	this.updateDimensions = this.updateDimensions.bind(this);
	this.updateWithProps = this.updateWithProps.bind(this);
	this.makeBars = this.makeBars.bind(this);
	this.state = {width: 0, lvalue: 0, rvalue: 0,
		      buttonWidth: props.buttonWidth || 34};
	window.onresize = chain_functions(window.onresize, this.updateDimensions);
    }

    componentDidMount(){
	this.updateWithProps(this.props);
    }

    componentWillReceiveProps(nextProps){
	this.updateWithProps(nextProps);
    }

    updateDimensions(){
	// tighten width by button slider icon width, else button will overhang slider bar
	if(this.refs.bar){
	    const width = this.refs.bar.clientWidth - this.state.buttonWidth;
	    const ls = linearScale(this.props.range, [0, width]);
	    const lpixels = ls(this.state.lvalue);
	    const rpixels = ls(this.state.rvalue);
	    this.setState({width, lpixels, rpixels});
	}
    }

    updateWithProps(p){
	// tighten width by button slider icon width, else button will overhang slider bar
	if(this.refs.bar){
	    const width = this.refs.bar.clientWidth - this.state.buttonWidth;
	    const ls = linearScale(p.range, [0, width]);
	    const lpixels = ls(p.lvalue);
	    const rpixels = ls(p.rvalue);
	    this.setState({width, lpixels, rpixels, lvalue: p.lvalue, rvalue: p.rvalue});
	}
    }

    makeBars(){
	const onStart = () => {
	    if(this.props.onStart){
		this.props.onStart(this.state.lvalue, this.state.rvalue);
	    }
	}
	const onStop = () => {
	    if(this.props.onStop){
		this.props.onStop(this.state.lvalue, this.state.rvalue);
	    }
	}
	const dragHandlers = {onStart, onStop};

	const handleDragLeft = (e, ui) => {
	    const dxPixels = ui.deltaX;
	    const ls = linearScale([0, this.state.width], this.props.range);
	    const lpixels = this.state.lpixels + dxPixels;
	    const lvalue = +(ls(lpixels).toFixed(this.props.numDecimals));
	    if(lvalue >= this.state.rvalue){
		return false;
	    }
	    if(this.props.dragLeft){
		this.props.dragLeft(lvalue, this.state.rvalue);
	    }
	    this.setState({lpixels, lvalue});
	    return true;
	}

	const handleDragRight = (e, ui) => {
	    const dxPixels = ui.deltaX;
	    const ls = linearScale([0, this.state.width], this.props.range);
	    const rpixels = this.state.rpixels + dxPixels;
	    const rvalue = +(ls(rpixels).toFixed(this.props.numDecimals));
	    if(this.state.lvalue >= rvalue){
		return false;
	    }
	    if(this.props.dragRight){
		this.props.dragRight(this.state.lvalue, rvalue);
	    }
	    this.setState({rpixels, rvalue});
	    return true;
	}

	const perc = (v) => (v / this.state.width * 100.0);
	const lhLeft = perc(this.state.lpixels);
	const rhLeft = perc(this.state.rpixels);
	const cRight = 100.0 - rhLeft;
	const strP = (v) => (v.toString() + '%');

	return (
	    <div className={"sliderBase"}>
		<Draggable axis="x" bounds='parent' {...dragHandlers}
			   position={{x: this.state.lpixels, y: 0}}
			   onDrag={handleDragLeft} >
		    <div className={"sliderLeft"} />
		</Draggable>
		<div className={"sliderConnect"} style={{"left": strP(lhLeft),
							 "right": strP(cRight)}} />
		<Draggable axis="x" bounds='parent' {...dragHandlers}
			   position={{x: this.state.rpixels, y: 0}}
			   onDrag={handleDragRight}>
		    <div className={"sliderRight"} />
		</Draggable>
	    </div>);
    }

    render() {
	return (
	    <div className={"sliderBar"} ref="bar">
		{this.state.width > 0 && this.makeBars()}
	    </div>
	);
    }
}

export default DualSlider;
