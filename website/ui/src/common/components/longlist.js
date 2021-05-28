/*
 * SPDX-License-Identifier: MIT
 * Copyright (c) 2016-2020 Michael Purcaro, Henry Pratt, Jill Moore, Zhiping Weng
 */

import React from "react";

import { DataTable } from 'ts-ztable';
import { ListItem } from "./list";

class LongListFacet extends React.Component {
  _td_handler = (td, cellObj) => {
    if (this.props.onTdClick) {
      this.props.onTdClick(cellObj.value, td, cellObj);
    }
  };

  _clear = () => {
    if (this.props.onTdClick) {
      this.props.onTdClick(null);
    }
  };

  render() {
    const s = this.props.selection;
    const table_display = !s || 0 === s.length ? "block" : "none";
    const sdisplay = !s || 0 === s.length ? "none" : "block";

    let title = this.props.selection;
    if (title && this.props.friendlySelectionLookup) {
      title = this.props.friendlySelectionLookup(title);
    }

    console.log(this.props)

    return (
      <div>
        <div style={{ display: table_display }}>


          <DataTable
            key={this.props.key}
            columns={this.props.cols}
            rows={this.props.data}
            searchable
            sortColumn={this.props.sortColumn}
            sortDescending={true}
            itemsPerPage={this.props.pageLength}
          />

          {/* 
          <Ztable
            cols={this.props.cols}
            data={this.props.data}
            order={this.props.order}
            buttonsOff={this.props.buttonsOff}
            onTdClick={this._td_handler}
            bFilter={true}
            bLengthChange={false}
            pageLength={this.props.pageLength}
          /> */}
        </div>

        <div style={{ display: sdisplay }}>
          <ListItem value={title} selected="true" n="0" onclick={this._clear} />
        </div>
      </div>
    );
  }
}
export default LongListFacet;
