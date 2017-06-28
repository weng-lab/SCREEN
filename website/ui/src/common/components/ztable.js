import React from 'react';
import ZTableRow from './zrow';



import {HelpTooltip} from './help_icon'
import * as Render from '../renders'



class ZTable extends React.Component {




  constructor() {
      super();


    let geneHelp = "nearest genes:<br/>protein-coding / all&nbsp;&nbsp;";
    if("mm10" == GlobalAssembly){
        geneHelp += HelpTooltip("DifferentialGeneMouse");
    }


      this.state = {
	  cols: [
	{
	    key:"accession", label: "accession"
	}, {
            key: 'k562', label: "k562"
	}, {
	    key: 'dnase_zscore', label: "DNase Z"
	}, {
	    key: 'H3K4me3', label: "H3K4me3<br/> Z" 
	}, {
	    key: 'enhancer_zscore', label: "H3K27ac Z"
	}, {
	    key: 'promoter_zscore', label: "CTCF Z"
	}, {
	    key: 'chrom', label: "chr"
	}, {
	    key: 'start', label: "start"
	}, {
	    key: 'len', label: "length"
	}, {
            key: 'geneHelp', label: geneHelp
	}, {
	    key: 'cart', label: "cart"
	}, {
	    key: 'genomebrowsers', label: "genome browsers"
	}
    ],




      }

      
  }

    render() { 

console.log(this.props.data);
console.log(this.props.cols);


	return (

		<div > 
	 <ZTableRow data={this.props.data} cols={this.props.cols}/>

		<br></br><br></br><br></br>
	    </div> );
    
    }



}

export default ZTable;
