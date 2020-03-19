/*
 * SPDX-License-Identifier: MIT
 * Copyright (c) 2016-2020 Michael Purcaro, Henry Pratt, Zhiping Weng
 */

import React from 'react';
import $ from 'jquery';

import Ztable from './ztable/ztable';
import {ListItem} from './list';

class LongListFacet extends React.Component {
    _td_handler = (td, cellObj) => {
	if (this.props.onTdClick) {
            this.props.onTdClick(cellObj.value, td, cellObj);
        }
    }

    _clear = () => {
	if (this.props.onTdClick) {
            this.props.onTdClick(null);
        }
	$(this.refs.container).empty();
    }

    render() {
	const s = this.props.selection;
	const table_display = (!s || 0 === s.length ? "block" : "none");
	const sdisplay = (!s || 0 === s.length ? "none" : "block");

	let title = this.props.selection;
        if(title && this.props.friendlySelectionLookup){
            title = this.props.friendlySelectionLookup(title)
        }
	
	return (
	    <div>
		<div style={{display: table_display}}>
		    <Ztable
			cols={this.props.cols}
			data={this.props.data}
			order={this.props.order}
			buttonsOff={this.props.buttonsOff}
			onTdClick={this._td_handler}
			bFilter={true}
			bLengthChange={false}
			pageLength={this.props.pageLength}
                    />
		</div>
		
                <div style={{display: sdisplay}}>
		    <ListItem value={title}
			      selected="true"
			      n="0"
			      onclick={this._clear}
		    />
		</div>
		
            </div>);
    }

}
export default LongListFacet;
