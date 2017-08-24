import React from 'react';

const ITEMS_PER_ROW = 8.0;

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
      let subrows = Array(Math.ceil(this.props.globals.tables.length / ITEMS_PER_ROW)).fill().map( () => [] );
      this.props.globals.tables.map( (f, i) => {
	  subrows[Math.floor(i / ITEMS_PER_ROW)].push(f);
      } );
      return (
	  <div>
	    <div className="row">
	      {subrows.map( (s, _i) => (
		  <ul className="nav nav-pills col-xs-12" key={_i}>
	            {s.map( (t, i) => (
	              <li key={"li" + _i + "_" + i} className={i + (_i * ITEMS_PER_ROW) === this.state.selected_table ? "active" : ""} style={{width: Math.floor(100.0 / ITEMS_PER_ROW) + "%"}}>
	                  <a href="#" onClick={() => {this.setSelection(i + (_i * ITEMS_PER_ROW))}}>{t.title.split(":")[0]}</a>
	  	      </li>
		    ) )}
 	          </ul>
		) )}
            </div>
	    <div className="row">
		<div className="col-xs-12">
	          {this.props.globals.tables.map( (t, i) => ( i !== this.state.selected_table ? null : 
	              <div><h2>{t.title.replace(/Supp./g, "Supplementary")}</h2><t.component key={i} /></div>
		  ) )}
	        </div>
	    </div>	      
	  </div>
      );
	
    }
    
}

export default TabTables;
