import React from 'react';
import SupplementaryTable1 from './tables/supplementarytable1';
import SupplementaryTable2 from './tables/supplementarytable2';

class TabTables extends React.Component {

    constructor(props) {
	super(props);
	this.state = {
	    selected_table: 0
	};
    }

    setSelection(i) {
	this.setState({ selected_table: i });
    }
    
    render() {
	
      return (
	  <div>
	    <div className="row">
	        <ul className="nav nav-pills col-xs-12">
	          {this.props.globals.tables.map( (t, i) => (
		    <li key={"li" + i} className={i === this.state.selected_table ? "active" : ""} style={{width: Math.floor(100.0 / (this.props.globals.tables.length + 1)) + "%"}}>
	                <a href="#" onClick={() => {this.setSelection(i)}}>{t.title}</a>
	  	    </li>
		  ) )}
	        </ul>
            </div>
	    <div className="row">
		<div className="col-xs-12">
	          {this.props.globals.tables.map( (t, i) => ( i !== this.state.selected_table ? null : 
 		    <t.component />
		  ) )}
	        </div>
	    </div>	      
	  </div>
      );
	
    }
    
}

export default TabTables;
