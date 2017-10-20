import React from 'react';
import HorizontalBar, {compute_offsets} from './horizontalbar';

class ScaledHorizontalBar extends React.Component {
    render() {
	const format = this.props.format.value ? this.props.format.value : x => x;
	const offsets = compute_offsets(
	    Object.keys(this.props.itemsets),
	    this.props.itemsets, format
	);
	const viewBox = {width: +this.props.width,
			 height: offsets.total * this.props.barheight};

	return (
	    <div style={{width: viewBox.width + "px",
			 height: viewBox.height + "px"}}>
		<HorizontalBar format={this.props.format}
			       viewBox={viewBox}
			       itemsets={this.props.itemsets}
			       axis_offsets={[viewBox.width * 0.5, 0]} />
	    </div>
	);
    }
    
};
export default ScaledHorizontalBar;
