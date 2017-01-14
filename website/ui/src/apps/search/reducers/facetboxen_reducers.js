import fetch from 'isomorphic-fetch';
import * as Actions from '../actions';

const facetboxen_reducers = (state, action) => {
    switch (action.type) {

    case Actions.SET_CELL_TYPE: return {...state, cellType: action.cellType };
    case Actions.SET_CHROM: return {...state, coord_chrom: action.chrom };
    case Actions.SET_COORDS: return {...state, coord_start: action.start,
                                     coord_end: action.end };

    default:
      return state;
  }
};

export default facetboxen_reducers;
