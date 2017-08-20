let React = require('react');
import ResultsTable from '../results_table';
import * as DNase from '../../common/tables/supplementarytable3_dnase';
import * as Peaks from '../../common/tables/supplementarytable3_peaks';

const SupplementaryTable3 = () => (
    <div>
        <h2>Across different peak sets</h2>	
        <ResultsTable bFilter={true} cols={Peaks.cols} data={Peaks.data} />
	<br/>
	<h2>Using DNase peaks</h2>
	<ResultsTable bFilter={true} cols={DNase.cols} data={DNase.data} />
    </div>
);
export default SupplementaryTable3;
