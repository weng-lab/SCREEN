let React = require('react');
import ResultsTable from '../results_table';
import * as top from '../../common/tables/supplementarytable4top';
import * as mid from '../../common/tables/supplementarytable4mid';
import * as bottom from '../../common/tables/supplementarytable4bottom';

const SupplementaryTable4 = () => (
    <div className="row">
	<div className="col-xs-4">
	    <h2>Top Tier</h2>
	    <ResultsTable cols={top.cols} data={top.data} bFilter={true} />
	</div>
	<div className="col-xs-4">
	    <h2>Middle Tier</h2>
	    <ResultsTable cols={mid.cols} data={mid.data} bFilter={true} />
	</div>
	<div className="col-xs-4">
	    <h2>Bottom Tier</h2>
 	    <ResultsTable cols={bottom.cols} data={bottom.data} bFilter={true} />
	</div>
    </div>
);
export default SupplementaryTable4;
