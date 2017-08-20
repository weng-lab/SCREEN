let React = require('react');
import ResultsTable from '../results_table';
import { cols, data } from '../../common/tables/supplementarytable6';

const SupplementaryTable6 = () => (
    <ResultsTable bFilter={true} cols={cols} data={data} />
);
export default SupplementaryTable6;
