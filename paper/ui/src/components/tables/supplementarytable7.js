let React = require('react');
import ResultsTable from '../results_table';
import { cols, data } from '../../common/tables/supplementarytable7';

const SupplementaryTable7 = () => (
    <ResultsTable bFilter={true} cols={cols} data={data} />
);
export default SupplementaryTable7;
