import React from 'react'

import loading from '../../../common/components/loading'
import ScaledHorizontalBar from '../../../plots/components/scaledhorizontalbar';

class LargeHorizontalBars extends React.Component {
    render(){
        if(this.props.isFetching){
            return loading(this.props);
        }

	const ds = this.props.isSingle ? this.props.single : this.props.mean;
	if(!ds){
	    return (
                <div>
                    <br />
		    <h4>No expression data available.</h4>
		</div>);
	}

	const itemsByRID = this.props.itemsByRID;

	const format = {
	    value: rid => {
		const d = itemsByRID[rid];
		return d[this.props.dataScale] && d[this.props.dataScale].toFixed ? d[this.props.dataScale].toFixed(2) : '--'},
	    label: rid => {
		const d = itemsByRID[rid];
		if(d.ageTitle){
		    return d.expID + ' ' + d.cellType + ' ' + d.ageTitle;
		}
		return d.expID + ' ' + d.cellType},
	    grouplabel: d => d.displayName
	};

	const items = ds[this.props.sortOrder];
	
	return (
            <div>
		<span className="geTissueOfOrigin">Tissue of origin</span>
		<ScaledHorizontalBar itemsets={items}
				     width={this.props.width}
	                             barheight={this.props.barheight}
	                             downloadfilename={this.props.gene + "_expression.svg"}
				     format={format} />
	    </div>
	);
    }
}

export default LargeHorizontalBars;
