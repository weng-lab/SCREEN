import React from 'react'

import loading from '../../../common/components/loading'

class BarPlot extends React.Component {

    constructor(props) {
	super(props);
    }

    render() {
	
	// sort items, prepare formatting functions
	let sorted_keys = Object.keys(this.props.itemsets).sort(
	    (a, b) => (a.toLowerCase().localeCompare(b.toLowerCase()))
	);
	let t0 = (x => (x > 0 ? x : 0));
	let value = (d) => (t0(d[this.props.datascale]));

	// compute bar and label offsets
	let labeloffsets = [];
	let yoffsets = {};
	let total_items = 0;
	let cmax = 0;
	let d = null;
	sorted_keys.map((k) => {
	    yoffsets[k] = total_items;
	    labeloffsets.push(total_items + (
 	        this.props.itemsets[k].items.length / 2.0
	    ) + 0.25);
	    total_items += this.props.itemsets[k].items.length;
	    d = Math.max(...this.props.itemsets[k].items.map(value));
	    if (d > cmax) cmax = d;
	})

	// for coordinate conversion
	let x = ((x) => (x / cmax * +this.props.width * 0.5));
	let y = ((y) => (y * +this.props.barheight))
	let fontsize = +this.props.barheight * 0.75;

	// elements for rendering
	let yaxis = <g transform="translate(200,0)"><path className="domain" d={"M-2,0H0V" + y(total_items) + "H-2"} /></g>;
	let bars = (sorted_keys.map((key, k) => (
	    this.props.itemsets[key].items.map((item, i) => (
		<g transform={"translate(200," + y(yoffsets[key]) + ")"}>
		    <rect height={+this.props.barheight} x="0" y={y(i)} strokeWidth="1" stroke="white"
		        width={x(value(item))} style={{fill: this.props.itemsets[key].color}} />
	            <text x={x(value(item)) + 5} y={y(i) + fontsize} style={{fill: "#000", fontSize: fontsize + "px"}}>{value(item) + " " + item.cellType}</text>
		</g>
	    ))
	)));
	let leftlabels = (sorted_keys.map((key, k) => (
            <text x="0" y={y(labeloffsets[k])} transform="translate(190, 0)"
	        style={{fill: "000", fontSize: +this.props.barheight + "px", textAnchor: "end"}}>{this.props.itemsets[key].displayName}</text>
	)));
	return (<svg width={+this.props.width + 200} height={y(total_items) + 10}>
		<g width={+this.props.width + 200} height={y(total_items) + 10}>
		    <g transform="translate(0,10)" height={y(total_items)} width={this.props.width}>
		        {yaxis}
		        {bars}
			{leftlabels}
                    </g>
		</g>
		</svg>);
	
    }
    
}

class LargeHorizontalBars extends React.Component {

    constructor(props) {
	super(props);
	this.state = {
	    sortorder: "byExpressionTPM",
	    datascale: "logTPM"
	};
    }

    sortSelect(){
         return (
	     <div className="col-md-4">
	         Choose sort order:&nbsp;
	         <select ref="sortorder" defaultValue={"byExpressionTPM"}
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
	     </div>);
     }

    dataScale(){
        return (
	    <div className="col-md-4">
	        Data:&nbsp;
	        <select ref="datascale" defaultValue={"logTPM"}
	          onChange={() => {this.setState({datascale: this.refs.datascale.value})}}>
		    <option value="logTPM">log2&#40;TPM + 0.01&#41;</option>
		    <option value="rawTPM">TPM</option>
		    <option value="logFPKM">log2&#40;FPKM + 0.01&#41;</option>
		    <option value="rawFPKM">FPKM</option>
	        </select>
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

        return (
            <div style={{display: (isFetching ? "none" : "block")}}>
                <span className="geTissueOfOrigin">Tissue of origin</span>
		<div ref="container" style={{width: width + "px"}}>
		    <BarPlot itemsets={this.props.items[this.state.sortorder]} width={this.props.width}
	                barheight={this.props.barheight} datascale={this.state.datascale} />
		</div>
            </div>);
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
