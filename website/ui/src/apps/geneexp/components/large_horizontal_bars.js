import React from 'react'

import loading from '../../../common/components/loading'
import ScaledHorizontalBar from '../../../plots/components/scaledhorizontalbar';

class LargeHorizontalBars extends React.Component {

    constructor(props) {
	super(props);
	this.doRender = this.doRender.bind(this);
    }

    doRender({isFetching, hasData, width}){
        if(isFetching){
            return loading(this.props);
        }
	if (!hasData){
	    return (
                <div>
                    <br />
		    <h4>No expression data available.</h4>
		</div>);
	}

	let format = {
	    value: d => d[this.props.dataScale],
	    label: d => {
		if(d.ageTitle){
		    return d.cellType + ' ' + d.ageTitle;
		}
		return d.cellType},
	    grouplabel: d => d.displayName
	};

	const items = this.props.items[this.props.sortOrder];
	
	return (
            <div>
		<span className="geTissueOfOrigin">Tissue of origin</span>
		<ScaledHorizontalBar itemsets={items}
				     width={width}
				     barheight={this.props.barheight}
				     format={format} />
	    </div>
	);
    }
    

    render() {
	return (
            <div>
		{this.doRender(this.props)}
	    </div>);
    }

}

export default LargeHorizontalBars;
