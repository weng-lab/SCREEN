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
    }
    
    componentDidMount(){
	this.setState({width: this.refs.bar.clientWidth,
		       lvalue: this.props.start[0],
		       rvalue: this.props.start[1]});
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
		const ls = linearScale([0, this.state.width], this.props.range);
		const dxPixels = ui.deltaX;
		const dx = ls(dxPixels);
		console.log("left:", dxPixels, dx);
	    }

	    const handleDragRight = (e, ui) => {
		const dx = ui.deltaX;
		console.log("right:", dx);
	    }

	    const lsP = (r, w) => (v) => (linearScale(r, [0, w])(v) / w * 100.0);
	    const ls = lsP(this.props.range, this.state.width);
	    const lhLeft = ls(this.state.lvalue);
	    const rhLeft = ls(this.state.rvalue);
	    const cRight = 100.0 - rhLeft;
	    const strP = (v) => (v.toString() + '%');
	    return (
		<div className={"sliderBase"}>
		    <Draggable axis="x" bounds='parent' {...dragHandlers}
			       onDrag={handleDragLeft} >
			<div className={"sliderLeft"} style={{"left": strP(lhLeft)}}>
			</div>
		    </Draggable>
		    <div className={"sliderConnect"} style={{"left": strP(lhLeft),
							     "right": strP(cRight)}}>
		    </div>
		    <Draggable axis="x" bounds='parent' {...dragHandlers}
			       onDrag={handleDragRight}>
			<div className={"sliderRight"} style={{"left": strP(rhLeft)}}>
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
