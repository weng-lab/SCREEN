var React = require('react');
import HorizontalBar, {compute_offsets} from './horizontalbar';

class ScaledHorizontalBar extends React.Component {

    constructor(props) {
	super(props);
    }

    render() {
	let format = this.props.format ? this.props.format : x => x;
	let offsets = compute_offsets(
	    Object.keys(this.props.itemsets),
	    this.props.itemsets, format
	);
	console.log(offsets);
	let viewBox = {width: +this.props.width, height: offsets.total * this.props.barheight};
	return (
	    <div style={{width: viewBox.width + "px", height: viewBox.height + "px"}}>
	       <HorizontalBar format={format}
	         viewBox={viewBox} itemsets={this.props.itemsets} axis_offsets={[viewBox.width * 0.5, 0]} />
	    </div>
	);
    }
    
};
export default ScaledHorizontalBar;
