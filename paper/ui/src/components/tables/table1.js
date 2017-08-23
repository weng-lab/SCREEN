let React = require('react');
import ResultsTable from '../results_table';
import * as humantranscriptome from '../../common/tables/table1_human_transcriptome';
import * as humantransreg from '../../common/tables/table1_human_transcriptionalreg';
import * as humanposttrans from '../../common/tables/table1_human_posttranscriptionalreg';
import * as humangenotyping from '../../common/tables/table1_human_genotyping';
import * as mousetranscriptome from '../../common/tables/table1_mouse_transcriptome';
import * as mousetransreg from '../../common/tables/table1_mouse_transcriptionalreg';

const HumanTab = () => (
    <div>
	<h3>Transcriptome</h3>
        <ResultsTable bFilter={true} cols={humantranscriptome.cols} data={humantranscriptome.data} /><br/>
	<h3>Transcriptional Regulation and Replication</h3>
        <ResultsTable bFilter={true} cols={humantransreg.cols} data={humantransreg.data} /><br/>
	<h3>Post-Transcriptional Regulation via RBPs</h3>
        <ResultsTable bFilter={true} cols={humanposttrans.cols} data={humanposttrans.data} /><br/>
	<h3>Genotyping</h3>
        <ResultsTable bFilter={true} cols={humangenotyping.cols} data={humangenotyping.data} /><br/>
    </div>
);

const MouseTab = () => (
    <div>
	<h3>Transcriptome</h3>
        <ResultsTable bFilter={true} cols={mousetranscriptome.cols} data={mousetranscriptome.data} /><br/>
	<h3>Transcriptional Regulation and Replication</h3>
        <ResultsTable bFilter={true} cols={mousetransreg.cols} data={mousetransreg.data} /><br/>
    </div>
);
    
class Table1 extends React.Component {

    constructor(props) {
	super(props);
	this.state = { selection: 0 };
    }

    render() {
	return (
	    <div>
	        <ul className="nav nav-tabs">
	            <li className={this.state.selection ? "" : "active"}><a href="#" onClick={ () => {this.setState({ selection: 0 }); }}>Human</a></li>
  	            <li className={this.state.selection ? "active" : ""}><a href="#" onClick={ () => {this.setState({ selection: 1 }); }}>Mouse</a></li>
	        </ul>
	        <div className="tab-content">
	            <div id="tabhuman" className={"tab-pane " + (this.state.selection ? "" : "active")}>
	                <HumanTab/>
	            </div>
	            <div id="tabmouse" className={"tab-pane " + (this.state.selection ? "active" : "")}>
	                <MouseTab/>
	            </div>
	        </div>
            </div>
	);
    }
    
}	
export default Table1;
