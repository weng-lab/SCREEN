import fetch from 'isomorphic-fetch';
import * as Actions from '../actions';

const facetboxen_reducers = (state, action) => {
    switch (action.type) {
    case Actions.SET_CELL_TYPE: return {...state, cellType: action.cellType };
    case Actions.SET_CHROM:
        return {...state,
                coord : Object.assign(state.coord, {"chrom": action.chrom })};

    default:
      return state;
  }
};

export default facetboxen_reducers;
