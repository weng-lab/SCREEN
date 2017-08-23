import Table1 from '../components/tables/table1'
import SupplementaryTable1 from '../components/tables/supplementarytable1'
import SupplementaryTable2 from '../components/tables/supplementarytable2'
import SupplementaryTable3 from '../components/tables/supplementarytable3'
import SupplementaryTable4 from '../components/tables/supplementarytable4'
import SupplementaryTable5 from '../components/tables/supplementarytable5'
import SupplementaryTable6 from '../components/tables/supplementarytable6'
import SupplementaryTable7 from '../components/tables/supplementarytable7'
import SupplementaryTable8 from '../components/tables/supplementarytable8'
import SupplementaryTable9 from '../components/tables/supplementarytable9'
import SupplementaryTable10 from '../components/tables/supplementarytable10'

const SupplementaryTables = () => ([
    {component: Table1, title: "Table 1: Experiment Matrix"},
    {component: SupplementaryTable1, title: "Supplementary Table 1: Surveyed RBPs"},
    {component: SupplementaryTable2, title: "Supplementary Table 2: VISTA regions for PR curves"},
    {component: SupplementaryTable3, title: "Supplementary Table 3: PR curve results"},
    {component: SupplementaryTable4, title: "Supplementary Table 4: Newly tested enhancers"},
    {component: SupplementaryTable5, title: "Supplementary Table 5: Promoter prediction"},
    {component: SupplementaryTable6, title: "Supplementary Table 6: Histone peak overlap"},
    {component: SupplementaryTable7, title: "Supplementary Table 7: GWAS studies"},
    {component: SupplementaryTable8, title: "Supplementary Table 8: Registry datasets"},
    {component: SupplementaryTable9, title: "Supplementary Table 9: Consolidated ChromHMM states"},
    {component: SupplementaryTable10, title: "Supplementary Table 10: MAF quartiles"}
]);
export default SupplementaryTables;
