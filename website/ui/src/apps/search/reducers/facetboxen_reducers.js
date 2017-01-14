import fetch from 'isomorphic-fetch';
import * as Actions from '../actions';

const facetboxen_reducers = (state, action) => {
    switch (action.type) {

    case Actions.SET_CELL_TYPE: return {...state, cellType: action.cellType };
    case Actions.SET_CHROM: return {...state, coord_chrom: action.chrom };
    case Actions.SET_COORDS: return {...state, coord_start: action.start,
                                     coord_end: action.end };
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
