import React from 'react';
import ZTable from './ztable';

export default class ZData extends React.Component {

  constructor() {
    super();

    this.state = {
      cols: [{
        key: 'info',
        label: "accession"
      }, {
        key: 'ctspecifc',
        label: "k562"
      }, {
        key: 'dnase_zscore',
        label: "DNase Z"
      }, {
        key: 'promoter_zscore',
        label: "H3K4me3 Z"
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
	 <ZTable data = {this.props.data}
cols={this.state.cols} columnkey={"key"} columnData={this.props.cols}
columnlabel={"label"} />
		<br></br><br></br><br></br>
	    </div> );
    }

}
