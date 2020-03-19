/*
 * SPDX-License-Identifier: MIT
 * Copyright (c) 2016-2020 Michael Purcaro, Henry Pratt, Zhiping Weng
 */

import SortOrder from './sort_order';

class DataSource {
    constructor(data, cols) {
	this.data = data;
	this.cols = cols;

	this.colsByData = {}
	this.cols.forEach((col) => {
	    this.colsByData[col.data] = col;
	});
    }

    filterAndSort(state){
	this._searchFilter(state.search);
	this._sort(state.sortCols);

	this.numPages = Math.ceil(this.rowIDs.length / state.pageSize);
	// page indexes are 1-based
	this.rowStart = (state.pageNum - 1) * state.pageSize;
	this.rowEnd = state.pageNum * state.pageSize;
    }

    _searchFilter(s){
	let ret = [];
	if(this.data){
	    for(let i = 0; i < this.data.length; i++){
		if(!s){
		    ret.push(i);
		    continue;
		}
		s = s.toLowerCase().trim();
		for(let colInfo of this.cols){
		    const t = String(this.data[i][colInfo.data]).toLowerCase();
		    if(t.includes(s)){
			ret.push(i);
			break;
		    }
		}
	    }
	}
	this.rowIDs = ret;
    }

    _sortByColNumeric(sortCol, sortOrder, sortDataF){
	if(SortOrder.ASC === sortOrder){
	    if(sortDataF){
		this.rowIDs.sort((a,b) => sortDataF(this.data[a][sortCol]) -
					sortDataF(this.data[b][sortCol]));
	    } else {
		this.rowIDs.sort((a,b) => this.data[a][sortCol] -
					this.data[b][sortCol]);
	    }
	} else {
	    if(sortDataF){
		this.rowIDs.sort((a,b) => sortDataF(this.data[b][sortCol]) -
					sortDataF(this.data[a][sortCol]));
	    } else {
		this.rowIDs.sort((a,b) => this.data[b][sortCol] -
					this.data[a][sortCol]);
	    }
	}
    }

    _sortByColStr(sortCol, sortOrder, sortDataF){
	// sort by strings, from https://stackoverflow.com/a/9645447
	if(SortOrder.ASC === sortOrder){
	    if(sortDataF){
		//console.log("sorting", sortCol, "by text, asceding, with custom data");
		this.rowIDs.sort((a,b) => {
		    if (null === this.data[a][sortCol]) {
			return 1;
		    }
		    if(null === this.data[b][sortCol]){
			return 0;
		    }
		    return sortDataF(this.data[a][sortCol]).toLowerCase().localeCompare(
			sortDataF(this.data[b][sortCol]).toLowerCase());
		})
	    } else {
		//console.log("sorting", sortCol, "by text, asceding, without custom data");
		this.rowIDs.sort((a,b) => {
		    if (null === this.data[a][sortCol]) {
			return 1;
		    }
		    if(null === this.data[b][sortCol]){
			return 0;
		    }
		    return this.data[a][sortCol].toLowerCase().localeCompare(
			this.data[b][sortCol].toLowerCase());
		})
	    }
	} else {
	    //console.log("sorting by", sortCol, "text, descending, with custom data");
	    if(sortDataF){
		this.rowIDs.sort((a,b) => {
		    if (null === this.data[a][sortCol]) {
			return 0;
		    }
		    if(null === this.data[b][sortCol]){
			return 1;
		    }
		    return sortDataF(this.data[b][sortCol]).toLowerCase().localeCompare(
			sortDataF(this.data[a][sortCol]).toLowerCase());
		})
	    } else {
		//console.log("sorting", sortCol, "by text, descending, without custom data");
		this.rowIDs.sort((a,b) => {
		    if (null === this.data[a][sortCol]) {
			return 0;
		    }
		    if(null === this.data[b][sortCol]){
			return 1;
		    }
		    return this.data[b][sortCol].toLowerCase().localeCompare(
			this.data[a][sortCol].toLowerCase());
		})
	    }
	}
    }
    
    _sort(sortCols){
	if(!sortCols.shouldSort()){
	    return;
	}
	if(0 === this.rowIDs.length){
	    return;
	}

	const sortOrder = sortCols.sortCols[1];
	const sortCol = sortCols.sortCols[0];
	
	let sample = this.data[this.rowIDs[0]][sortCol];
	const colInfo = this.colsByData[sortCol];
	if(!colInfo){
	    throw new Error("missing column " + sortCol + " in ztable");
	}
	
	let sortDataF = null;
	if("sortDataF" in colInfo){
	    sortDataF = colInfo.sortDataF;
	    sample = sortDataF(sample);
	}

	// https://stackoverflow.com/a/16655847
	const isNumArray = Number(sample) === sample;
	if(isNumArray){
	    this._sortByColNumeric(sortCol, sortOrder, sortDataF);
	} else {
	    this._sortByColStr(sortCol, sortOrder, sortDataF);
	}
    }
}

export default DataSource;
