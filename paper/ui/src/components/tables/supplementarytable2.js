let React = require('react');
import ResultsTable from '../results_table';
import { lines, cols } from '../../common/tables/supplementarytable2';

const SupplementaryTable2 = () => (
    <ResultsTable bFilter={true} cols={cols} data={lines.map( d => ({ chr: d[0], start: d[1], stop: d[2], midbrain: d[3], hindbrain: d[4], limb: d[5], neuraltube: d[6] }) )} />
);
export default SupplementaryTable2;
