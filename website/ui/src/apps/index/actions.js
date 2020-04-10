/*
 * SPDX-License-Identifier: MIT
 * Copyright (c) 2016-2020 Michael Purcaro, Henry Pratt, Jill Moore, Zhiping Weng
 */

export const SET_MAIN_TAB = 'SET_MAIN_TAB'
export const setMainTab = (name) => ({ type: SET_MAIN_TAB, name });

export const SET_GENES = 'SET_GENES'
export const setGenes = (genes) => ({ type: SET_GENES, genes });
