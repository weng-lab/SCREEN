export const SET_CELL_TYPE = 'SET_CELL_TYPE';
export const SET_CHROM = 'SET_CHROM';
export const TOGGLE_CELL = 'TOGGLE_CELL';

export const setCellType = (cellType) => ({
    type: SET_CELL_TYPE,
    cellType
});

export const setChrom = (chrom) => ({
    type: SET_CHROM,
    chrom
});

export const toggleCell = ({x, y}) => ({
    type: TOGGLE_CELL,
    x,
  y
});

