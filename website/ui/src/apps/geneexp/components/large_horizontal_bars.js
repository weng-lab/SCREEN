import React from 'react'

import loading from '../../../common/components/loading'
import ScaledHorizontalBar from '../../../plots/components/scaledhorizontalbar';
import ControlBar from './control_bar';

class LargeHorizontalBars extends React.Component {

    constructor(props) {
	super(props);
	this.doRender = this.doRender.bind(this);
	this.state = {
	    sortOrder: "byTissue",
	    dataScale: "logTPM"
	};
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
	    value: d => d[this.state.dataScale],
	    label: d => {
		if(d.ageTitle){
		    return d.cellType + ' ' + d.ageTitle;
		}
		return d.cellType},
	    grouplabel: d => d.displayName
	};

	const items = this.props.items[this.state.sortOrder];
	console.log("items", items, this.state.sortOrder, this.state.dataScale);
	
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
	const changeSortOrder = (e) => {
	    this.setState({sortOrder: e.target.value});
	}
	const changeDataScale = (e) => {
	    this.setState({dataScale: e.target.value});
	}

	return (
            <div>
		<ControlBar
		biosample_types_selected={this.props.biosample_types_selected}
		compartments_selected={this.props.compartments_selected}
		globals={this.props.globals}
		    useBoxes={this.props.useBoxes}
		    changeSortOrder={changeSortOrder}
		    changeDataScale={changeDataScale}
		dataScale={this.state.dataScale}
		sortOrder={this.state.sortOrder}
		/>
		{this.doRender(this.props)}
	    </div>);
    }

}

export default LargeHorizontalBars;
