import fetch from 'isomorphic-fetch';
import * as Actions from '../actions/facetboxen_actions';

const facetboxen_reducers = (state, action) => {
    switch (action.type) {

    case Actions.SET_CELL_TYPE: return {...state, cellType: action.cellType };
    case Actions.SET_CHROM: return {...state, coord_chrom: action.chrom };
    case Actions.SET_COORDS: return {...state, coord_start: action.start,
                                     coord_end: action.end };
    case Actions.TOGGLE_TF: {
        let tfs = new Set(state.tfs_selection);
        let tf = action.tf;
        if(tfs.has(tf)){
            tfs.delete(tf);
        } else {
            tfs.add(tf);
        }
        return { ...state, tfs_selection: tfs}
    }
    case Actions.SET_TFS_MODE: return { ...state, tfs_mode: action.mode};
    case Actions.SET_ACCESSIONS: return {...state, accessions: action.accs};

    case Actions.SET_GENE_ALL_DISTANCE:
        return {...state, gene_all_start: action.start, gene_all_end: action.end };
    case Actions.SET_GENE_PC_DISTANCE:
        return {...state, gene_pc_start: action.start, gene_pc_end: action.end };

    default:
      return state;
  }
};

export default facetboxen_reducers;
