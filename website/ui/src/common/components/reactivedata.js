import React from 'react';
import ReactiveTable from './reactivetable';

class ReactiveData extends React.Component {

  constructor() {
    super();

    this.state = {
      cols: [{
        key: 'accession',
        label: "accession"
      }, {
        key: 'k562',
        label: "k562"
      }, {
        key: 'dnase_zscore',
        label: "DNase Z"
      }, {
        key: 'promoter_zscore',
        label: "H3K4me3<br/> Z"
      }, {
        key: 'enhancer_zscore',
        label: "H3K27ac Z"
      }, {
        key: 'ctcf_zscore',
        label: "CTCF Z"
      }, {
        key: 'chrom',
        label: "chr"
      }, {
        key: 'start',
        label: "start"
      }, {
        key: 'len',
        label: "length"
      }, {
        key: 'genesallpc',
        label: "geneHelp"
      }, {
        key: 'in_cart',
        label: "cart"
      }, {
        key: 'genomebrowsers',
        label: "genome browsers"
      }],
    }
  }

    render() {
	return (
		<div>
	 <ReactiveTable data = {this.props.data} 
cols={this.state.cols} columnkey={"key"} 
columnlabel={"label"}/>
		<br></br><br></br><br></br>
	    </div> );
    }

}

export default ReactiveData;
