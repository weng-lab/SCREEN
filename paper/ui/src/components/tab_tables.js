import React from 'react';
import Tab from '../common/components/tab'

const CustomPagination = ({ items, active, onClick }) => (
    <div style={{"width": "100%"}}>
	<ul className="users-pagination pagination pagination-md">
	  {items.map( (item, i) => (
  	    <li key={i} className={i === active ? "active" : ""}>
	        <a role="button" href="#" onClick={() => {onClick(i)}}>{item}</a>
	    </li>
	  ) )}
        </ul>
    </div>
);
    
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

    _format(title) {
	if (title === "Table 1") { return "T1"; }
	return title.replace(/Supp. Table /g, "S");
    }

    render() {
      return (
	  <Tab>
	      <div className="row">
	          <CustomPagination items={this.props.globals.tables.map(t => this._format(t.title.split(":")[0]))} active={this.state.selected_table}
	            onClick={this.setSelection.bind(this)} />
              </div>
	      <div className="row">
	        <div className="col-xs-12">
	          <div className="alert alert-info" style={{fontSize: "16pt"}}>
	              <span className="glyphicon glyphicon-info-sign" style={{marginRight: "10px"}}></span>These tables are interactive. Click the column headers to sort, use the textboxes to search, and click the CSV buttons to download the table contents in CSV format.
	          </div>
	          {this.state.selected_table !== 6 ? null : (
	            <div className="alert alert-info" style={{fontSize: "16pt"}}>
	              <span className="glyphicon glyphicon-info-sign" style={{marginRight: "10px"}}></span>The colors in this table correspond to the bar colors in <b>Extended Data Figure 9</b>.
	            </div>
		  )}	  
	          {this.props.globals.tables.map( (t, i) => ( i !== this.state.selected_table ? null : 
		      <div key={i}><h2>{t.title.replace(/Supp./g, "Supplementary")}</h2><t.component /></div>
		  ) )}
	        </div>
	      </div>	      
	  </Tab>
      );
	
    }
    
}

export default TabTables;
