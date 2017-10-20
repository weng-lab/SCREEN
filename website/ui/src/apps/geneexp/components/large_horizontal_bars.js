import React from 'react'

import loading from '../../../common/components/loading'
import ScaledHorizontalBar from '../../../plots/components/scaledhorizontalbar';
import {panelize} from '../../../common/utility';

class LargeHorizontalBars extends React.Component {

    constructor(props) {
	super(props);
	this.state = {
	    sortorder: "byTissue",
	    datascale: "logTPM"
	};
    }

    sortSelect(){
         return (
	     <div className="col-md-3">
		 {panelize("Sort order",
			   <div>
			   <select ref="sortorder" defaultValue={this.state.sortorder}
			   onChange={() => {this.setState({sortorder: this.refs.sortorder.value})}}>
			   <option value="byExpressionTPM">
                           by expression &#40;TPM&#41;</option>
			   <option value="byExpressionFPKM">
                           by expression &#40;FPKM&#41;</option>
			   <option value="byTissue">
                           by tissue</option>
			   <option value="byTissueMaxTPM">
                           by tissue max &#40;TPM&#41;</option>
			   <option value="byTissueMaxFPKM">
                           by tissue max &#40;FPKM&#41;</option>
			   </select>
			   </div>)}
	     </div>);
     }

    dataScale(){
        return (
	    <div className="col-md-3">
		 {panelize("Data",
			   <div>
	        <select ref="datascale" defaultValue={"logTPM"}
	          onChange={() => {this.setState({datascale: this.refs.datascale.value})}}>
		    <option value="logTPM">log2&#40;TPM + 0.01&#41;</option>
		    <option value="rawTPM">TPM</option>
		    <option value="logFPKM">log2&#40;FPKM + 0.01&#41;</option>
		    <option value="rawFPKM">FPKM</option>
	        </select>
			   </div>)}
	    </div>);
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
	    value: d => d[this.state.datascale],
	    label: d => {
		if(d.ageTitle){
		    return d.cellType + ' ' + d.ageTitle;
		}
		return d.cellType},
	    grouplabel: d => d.displayName
	};

        return (
            <div style={{display: (isFetching ? "none" : "block")}}>
                <span className="geTissueOfOrigin">Tissue of origin</span>
		<ScaledHorizontalBar itemsets={this.props.items[this.state.sortorder]}
				     width={width}
				     barheight={this.props.barheight}
				     format={format} />
	    </div>
        );
    }
    
    render() {
	return (
            <div>
	        <div className="row">
                    {this.sortSelect()}
                    {this.dataScale()}
	        </div>

                {this.doRender(this.props)}
            </div>);
    }

}

export default LargeHorizontalBars;
