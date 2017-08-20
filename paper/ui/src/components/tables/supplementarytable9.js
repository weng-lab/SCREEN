let React = require('react');
import ResultsTable from '../results_table';
import { cols, data } from '../../common/tables/supplementarytable9';

const SupplementaryTable9 = () => (
    <ResultsTable bFilter={true} cols={cols} data={data} />
);
export default SupplementaryTable9;
