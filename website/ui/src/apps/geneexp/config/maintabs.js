import GeneExp from '../components/gene_exp'
import ConfigureGenomeBrowser from '../../search/components/configure_genome_browser'

const MainTabInfo = () => ({
    gene_expression: {title: "Gene Expression", visible: true,
                      f: GeneExp},
    configgb: {title: "Configure Genome Browser", visible: false,
	       f: ConfigureGenomeBrowser}
});

export default MainTabInfo;
