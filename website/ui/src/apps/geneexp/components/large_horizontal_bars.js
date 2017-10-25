import React from 'react'

import loading from '../../../common/components/loading'
import ScaledHorizontalBar from '../../../plots/components/scaledhorizontalbar';

class LargeHorizontalBars extends React.Component {
    render(){
        if(this.props.isFetching){
            return loading(this.props);
        }

	if("hasData" in this.props && !this.props.hasData){
	    // TODO: does this really mean the gene was not found?
	    return (
                <div>
                    <br />
		    <h4>No expression data available.</h4>
		</div>);
	}
	
	const ds = this.props.isSingle ? this.props.single : this.props.mean;
	if(!ds.hasData){
	    return (
                <div>
                    <br />
		    <h4>No expression data available.</h4>
		</div>);
	}

	const format = {
	    value: d => d[this.props.dataScale],
	    label: d => {
		if(d.ageTitle){
		    return d.cellType + ' ' + d.ageTitle;
		}
		return d.cellType},
	    grouplabel: d => d.displayName
	};

	const items = ds.items[this.props.sortOrder];
	
	return (
            <div>
		<span className="geTissueOfOrigin">Tissue of origin</span>
		<ScaledHorizontalBar itemsets={items}
				     width={this.props.width}
				     barheight={this.props.barheight}
				     format={format} />
	    </div>
	);
    }
}

export default LargeHorizontalBars;
