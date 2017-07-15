export const SET_MAIN_TAB = 'SET_MAIN_TAB'
export const setMainTab = (name) => ({ type: SET_MAIN_TAB, name });

export const SET_LOADING = 'SET_LOADING';
export const setloading = () => ({type: SET_LOADING});

export const SET_CHROMOSOME = 'SET_CHROMOSOME';
export const setchromosome = chr => ({ type: SET_CHROMOSOME, chr });
