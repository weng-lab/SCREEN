

import React from 'react';
import ReactDOM from 'react-dom';
//import DataTable from 'react-data-components';
var DataTable = require('react-data-components').DataTable;
const {Table, Column, Cell} = require('fixed-data-table');


class ZFixedTableRow extends React.Component {

  constructor(props) {
    super(props);

    let geneHelp = "nearest genes:<br/>protein-coding / all&nbsp;&nbsp;";
    if("mm10" == GlobalAssembly){
        geneHelp += HelpTooltip("DifferentialGeneMouse");
    }



    this.state = {
      cols: [
	{
	    prop:"accession", title: "accession"
	}, {
            prop: 'k562', title: "k562"
	}, {
	    prop: 'dnase_zscore', title: "DNase Z"
	}, {
	    prop: 'H3K4me3', title: "H3K4me3<br/> Z" 
	}, {
	    prop: 'enhancer_zscore', title: "H3K27ac Z"
	}, {
	    prop: 'promoter_zscore', title: "CTCF Z"
	}, {
	    prop: 'chrom', title: "chr"
	}, {
	    prop: 'start', title: "start"
	}, {
	    prop: 'len', title: "length"
	}, {
            prop: 'geneHelp', title: geneHelp
	}, {
	    prop: 'cart', title: "cart"
	}, {
	    prop: 'genomebrowsers', title: "genome browsers"
	}
    ],

	  data: [
	      { id: 1, accession: 'John', k562: 'Doe', DNaseZ: 'Doe',
		H3K4me3: 'Doe', H3K27ac: 'Doe', CTCFZ: 'Doe',
		chr: 'Doe', start: 'Doe', length: 'Doe',
		nearestgenesproteinsodingall: 'Doe', cart: 'Doe', genomebrowsers: 'Doe'},
  { id: 4, accession: 'J33ohn', k562: '3Doe', DNaseZ: <a href="https://www.w3schools.com/html/">Visit our HTML tutorial</a>,
		H3K4me3: 'D3oe', H3K27ac: 'Do3e', CTCFZ: 'Doe3',
		chr: 'Do333e', start: 'Doe', length: 'Doe',
		nearestgenesproteinsodingall: 'Doe', cart: 'Doe', genomebrowsers: 'Doe'},
	      
  { id: 2, accession: 'Joh333n', k562: '33Doe', DNaseZ: <a href="https://www.w3schools.com/html/">Visit our HTML tutorial</a>,
		H3K4me3: 'Doe', H3K27ac: 'Doe', CTCFZ: 'Doe',
		chr: 'Doe', start: 'Doe', length: 'Doe',
		nearestgenesproteinsodingall: 'Doe', cart: 'Doe', genomebrowsers: 'Doe'},


	  ]


    };
  }

  render() {
    return (
<div>
    <DataTable
      className="container"
      //keys={[ 'id']}
      columns={this.state.cols}
      initialData={this.state.data}
      initialPageLength={5}
  
     pageLengthOptions={[ 5, 20, 50 ]}
    />

      <Table
        rowsCount={100}
        rowHeight={50}
        width={1000}
        height={500}>
        <Column
          cell={<Cell>Basic content</Cell>}
          width={200}
        />
      </Table>


</div>

    );
  }
}

export default ZFixedTableRow;


