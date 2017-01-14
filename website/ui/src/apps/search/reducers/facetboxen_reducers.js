import fetch from 'isomorphic-fetch'


import { SET_CELL_TYPE, TOGGLE_CELL } from '../actions';

const facetboxen_reducers = (state, action) => {
  switch (action.type) {
    case SET_CELL_TYPE:
      return {
        ...state,
          cellType: action.cellType
      };

    case TOGGLE_CELL:
      return {
        ...state,
        cells
      };

    default:
      return state;
  }
};

export default facetboxen_reducers;
