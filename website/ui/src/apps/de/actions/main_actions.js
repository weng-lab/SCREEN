/*
 * SPDX-License-Identifier: MIT
 * Copyright (c) 2016-2020 Michael Purcaro, Henry Pratt, Jill Moore, Zhiping Weng
 */

export const SET_MAIN_TAB = 'SET_MAIN_TAB'
export const setMainTab = (name) => ({ type: SET_MAIN_TAB, name });

export const SET_CT1 = 'SET_CT1';
export const setCt1 = (ct) => ({ type: SET_CT1, ct });
export const SET_CT2 = 'SET_CT2';
export const setCt2 = (ct) => ({ type: SET_CT2, ct });

export const SET_DES = 'SET_DES';
export const setDes = (des) => ({ type: SET_DES, des });
