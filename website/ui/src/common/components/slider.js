import React from 'react';
import Draggable from 'react-draggable';

import {linearScale} from '../utility';

class DualSlider extends React.Component {
    // based off https://github.com/algolia/react-nouislider/blob/master/index.js

    constructor(props){
	super(props);
	this.updateWithProps = this.updateWithProps.bind(this);
	this.state = {width: 0, lvalue: 0, rvalue: 0,
		      numDecimals: this.props.numDecimals || 2,
		      buttonWidth: this.props.buttonWidth || 34};
    }
    
    componentDidMount(){
	this.updateWithProps(this.props, this.state.buttonWidth);
    }

    componentWillReceiveProps(nextProps){
	this.updateWithProps(nextProps);
    }

    updateWithProps(p, offset = 0){
	const width = this.refs.bar.clientWidth;
	const lvalue = p.lvalue;
	const rvalue = p.rvalue;

	const ls = linearScale(p.range, [0, width]);
	const lpixels = Math.max(0, ls(lvalue) - offset);
	const rpixels = ls(rvalue) - offset;
		    
	this.setState({width, lvalue, rvalue, lpixels, rpixels});
    }
    
    render() {
	const makeBars = () => {
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
		const lvalue = +(ls(lpixels).toFixed(this.state.numDecimals));
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
		const rvalue = +(ls(rpixels).toFixed(this.state.numDecimals));
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
	
	return (
	    <div className={"sliderBar"} ref="bar">
		{this.state.width > 0 && makeBars()}
	    </div>
	);
    }
}

export default DualSlider;
