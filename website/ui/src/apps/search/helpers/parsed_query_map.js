const range_presets = {
    "promoter": (facetboxes) => {
	facetboxes.ranks.facets.promoter.state.selection_range = [0, 10000];
	facetboxes.ranks.facets.dnase.state.selection_range = [0, 10000];
	facetboxes.ranks.facets.enhancer.state.selection_range = [20000, 1000000];
	facetboxes.ranks.facets.ctcf.state.selection_range = [20000, 1000000];
    },
    "enhancer": (facetboxes) => {
	facetboxes.ranks.facets.enhancer.state.selection_range = [0, 10000];
	facetboxes.ranks.facets.dnase.state.selection_range = [0, 10000];
	facetboxes.ranks.facets.promoter.state.selection_range = [20000, 1000000];
	facetboxes.ranks.facets.ctcf.state.selection_range = [20000, 1000000];
    },
    "insulator": (facetboxes) => {
	facetboxes.ranks.facets.ctcf.state.selection_range = [0, 10000];
	facetboxes.ranks.facets.dnase.state.selection_range = [20000, 1000000];
	facetboxes.ranks.facets.enhancer.state.selection_range = [20000, 1000000];
	facetboxes.ranks.facets.promoter.state.selection_range = [20000, 1000000];
    }
};
    

const ParsedQueryMap = (parsed_query, _facetboxes) => {
    var facetboxes = Object.assign({}, _facetboxes);
    facetboxes.cell_lines.facets.cell_lines.state.selection = parsed_query.cellType;
    if (parsed_query.coord) {
	facetboxes.chromosome.facets.chromosome.state.selection = parsed_query.coord.chrom;
	facetboxes.coordinates.facets.coordinates.state.selection_range = [parsed_query.coord.start,
									   parsed_query.coord.end];
    }
    if (parsed_query.range_preset) range_presets[parsed_query.range_preset](facetboxes);
    return facetboxes;
};
export default ParsedQueryMap;
