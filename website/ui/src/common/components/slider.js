import React from 'react';
import PropTypes from 'prop-types';
import Draggable from 'react-draggable';

import {linearScale} from '../utility';

require('nouislider/distribute/nouislider.min.css');

class Slider extends React.Component {
    // based off https://github.com/algolia/react-nouislider/blob/master/index.js

    constructor(props){
	super(props);
	this.state = {width: 0, lvalue: 0, rvalue: 0};
	//this.calcBarState = this.calcBarState.bind(this);
    }
    
    componentDidMount(){
	const width = this.refs.bar.clientWidth;
	const lvalue = this.props.start[0];
	const rvalue = this.props.start[1];

	const ls = linearScale(this.props.range, [0, width]);
	const lpixels = ls(lvalue);
	const rpixels = ls(rvalue);
	
	this.setState({width, lvalue, rvalue, lpixels, rpixels});
    }

    
    render() {
	const makeBars = () => {
	    const onStart = () => {
		console.log("onStart");
	    }
	    
	    const onStop= () => {
		console.log("onStop");
	    }

	    const dragHandlers = {onStart, onStop};

	    const handleDragLeft = (e, ui) => {
		const dxPixels = ui.deltaX;
		const ls = linearScale([0, this.state.width], this.props.range);
		const lpixels = this.state.lpixels + dxPixels;
		const lvalue = ls(lpixels)
		this.setState({lpixels, lvalue});
	    }

	    const handleDragRight = (e, ui) => {
		const dxPixels = ui.deltaX;
		const ls = linearScale([0, this.state.width], this.props.range);
		const rpixels = this.state.rpixels + dxPixels;
		const rvalue = ls(rpixels)
		this.setState({rpixels, rvalue});
	    }

	    console.log("state:", this.state);
	    const perc = (v) => (v / this.state.width * 100.0);
	    const lhLeft = perc(this.state.lpixels);
	    const rhLeft = perc(this.state.rpixels);
	    const cRight = 100.0 - rhLeft;
	    const strP = (v) => (v.toString() + '%');

	    // left: -17px;
	    
	    return (
		<div className={"sliderBase"}>
		    <Draggable axis="x" bounds='parent' {...dragHandlers}
			       defaultPosition={{x: Math.max(0, this.state.lpixels - 34),
						 y: 0}}
			       onDrag={handleDragLeft} >
			<div className={"sliderLeft"}>
			</div>
		    </Draggable>
		    <div className={"sliderConnect"} style={{"left": strP(lhLeft),
							     "right": strP(cRight)}}>
		    </div>
		    <Draggable axis="x" bounds='parent' {...dragHandlers}
			       defaultPosition={{x: this.state.rpixels - 34,
						y: 0}}
			       onDrag={handleDragRight}>
			<div className={"sliderRight"}>
			</div>
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

Slider.propTypes = {
    // http://refreshless.com/nouislider/slider-options/#section-animate
    animate: PropTypes.bool,
    // http://refreshless.com/nouislider/behaviour-option/
    behaviour: PropTypes.string,
    // http://refreshless.com/nouislider/slider-options/#section-Connect
    connect: PropTypes.oneOfType([PropTypes.arrayOf(PropTypes.bool), PropTypes.bool]),
    // http://refreshless.com/nouislider/slider-options/#section-cssPrefix
    cssPrefix: PropTypes.string,
    // http://refreshless.com/nouislider/slider-options/#section-orientation
    direction: PropTypes.oneOf(['ltr', 'rtl']),
    // http://refreshless.com/nouislider/more/#section-disable
    disabled: PropTypes.bool,
    // http://refreshless.com/nouislider/slider-options/#section-limit
    limit: PropTypes.number,
    // http://refreshless.com/nouislider/slider-options/#section-margin
    margin: PropTypes.number,
    // http://refreshless.com/nouislider/events-callbacks/#section-change
    onChange: PropTypes.func,
    // http://refreshless.com/nouislider/events-callbacks/
    onEnd: PropTypes.func,
    // http://refreshless.com/nouislider/events-callbacks/#section-set
    onSet: PropTypes.func,
    // http://refreshless.com/nouislider/events-callbacks/#section-slide
    onSlide: PropTypes.func,
    // http://refreshless.com/nouislider/events-callbacks/
    onStart: PropTypes.func,
    // http://refreshless.com/nouislider/events-callbacks/#section-update
    onUpdate: PropTypes.func,
    // http://refreshless.com/nouislider/slider-options/#section-orientation
    orientation: PropTypes.oneOf(['horizontal', 'vertical']),
    // http://refreshless.com/nouislider/pips/
    pips: PropTypes.object,
    // http://refreshless.com/nouislider/slider-values/#section-range
    range: PropTypes.arrayOf(PropTypes.number).isRequired,
    // http://refreshless.com/nouislider/slider-options/#section-start
    start: PropTypes.arrayOf(PropTypes.number).isRequired,
    // http://refreshless.com/nouislider/slider-options/#section-step
    step: PropTypes.number,
    // http://refreshless.com/nouislider/slider-options/#section-tooltips
    tooltips: PropTypes.oneOfType([
	PropTypes.bool,
	PropTypes.arrayOf(
	    PropTypes.shape({
		to: PropTypes.func
	    })
	)
    ])
};

export default Slider;
