let React = require('react');
import ResultsTable from '../results_table';
import { cols, data } from '../../common/tables/supplementarytable10';

const SupplementaryTable10 = () => (
    <ResultsTable cols={cols} data={data} />
);
export default SupplementaryTable10;
