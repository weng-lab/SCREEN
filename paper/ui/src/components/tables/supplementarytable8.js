let React = require('react');
import ResultsTable from '../results_table';
import { cols, data } from '../../common/tables/supplementarytable8';

const SupplementaryTable8 = () => (
    <ResultsTable bFilter={true} cols={cols} data={data} />
);
export default SupplementaryTable8;
