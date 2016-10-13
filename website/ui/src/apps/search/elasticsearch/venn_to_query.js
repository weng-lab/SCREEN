import {selected_cell_line} from './helpers'

const VennQueryMap = (state) => {
    return {
	cell_lines: [state.venn.cell_line, selected_cell_line(state)],
	rank_type: state.venn.rank_type,
	rank: state.venn.rank
    }
};
export default VennQueryMap;
