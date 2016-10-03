var React = require('react');
import {connect} from 'react-redux';

import ResultsTable from '../../../common/components/results_table'

class DetailsApp extends React.Component {

    constructor(props) {
	super(props);
    }
    
    render() {
	var tabs = this.props.tabs;
	var tables = this.props.tables;
	var data = this.props.data;
	return (<div className="container" style={{width: "100%"}}>
		    <h3>{this.props.q.accession}</h3>
		    <ul className="nav nav-tabs">
  		        {Object.keys(tabs).map((k) => (
			    <li key={"tab_" + k} className={k == 0 ? "active" : ""} ><a href={"#tab_" + k} data-toggle="tab">
			        {tabs[k].title}</a></li>
		        ))}
		    </ul>
		    <div className="tab-content clearfix">
		        {Object.keys(tabs).map((k) => {
		            var tab = tabs[k];
			    return (<div className={k == 0 ? "tab-pane active" : "tab-pane"} id={"tab_" + k} key={"tpane_" + k}>
		                       {Object.keys(tab.tables).map((key) => {
		                           var table = tab.tables[key];
					   return (<div className="col-md-3" key={key}>
			  	               <h4>{table.title}</h4>
				               <ResultsTable cols={table.cols} order={table.order} data={data[key]} /><br/>
				           </div>);
		                       })}
				    </div>);
			})}
		    </div>
		</div>);
    }
    
}
export default DetailsApp;

const props_map = (state) => {
    return {
	q: state.re_detail.q,
	data: state.re_detail.data
    };
};

export const details_connector = connect(props_map);
