let React = require('react');
import ResultsTable from '../results_table';
import { data, cols } from '../../common/tables/supplementarytable1';

const SupplementaryTable1 = () => (
    <ResultsTable bFilter={true} cols={cols} data={data.map( d => ({ accession: d[0], ct: d[1], target: d[2] }) )} />
);
export default SupplementaryTable1;
