let React = require('react');
import ResultsTable from '../results_table';
import { cols, data } from '../../common/tables/supplementarytable5';

const SupplementaryTable5 = () => (
    <ResultsTable bFilter={true} cols={cols} data={data} />
);
export default SupplementaryTable5;
