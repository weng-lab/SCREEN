import React from 'react';
import ZFixedTableRow from './zfixedrow';



import {HelpTooltip} from './help_icon'
import * as Render from '../renders'





class ZFixedTable extends React.Component {
  constructor() {
      super();

      
  }

    render() { 


console.log('testing data: ', this.props.data);
	return (

		<div> 
	 <ZFixedTableRow data={this.props.data} cols={this.props.cols}/>

		<br></br><br></br><br></br>
	    </div> );
    
    }



}

export default ZFixedTable;

