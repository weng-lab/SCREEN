/*
 * SPDX-License-Identifier: MIT
 * Copyright (c) 2016-2020 Michael Purcaro, Henry Pratt, Zhiping Weng
 */

import React from 'react';
import * as Render from '../../../common/zrenders';

export const Legend = props => (
	    <div className="panel panel-default">
		<div className="panel-body legendPanel">
		    <div className="row">
			<div className="col-md-2">
			    {Render.sctGroupIconLegend(props.globals, 'P')}
			</div>
			<div className="col-md-2">
			    {Render.sctGroupIconLegend(props.globals, 'E')}
			</div>
			<div className="col-md-2">
			    {Render.sctGroupIconLegend(props.globals, 'C')}
			</div>
			<div className="col-md-2">
			    {Render.sctGroupIconLegend(props.globals, 'D')}
			</div>
			<div className="col-md-2">
			    {Render.sctGroupIconLegend(props.globals, 'I')}
			</div>
			<div className="col-md-2">
			    {Render.sctGroupIconLegend(props.globals, 'U')}
			</div>
		    </div>
		    <div className="row">
		    </div>
		    <div className="row">
			<div className="col-md-4">
			    <small><b>{"P/D"}</b>
				{" Proximal/Distal to a Transcription Start Site"}
			    </small>
			</div>
			<div className="col-md-8">
			    <span className="glyphicon glyphicon-star concordantStar" aria-hidden="true"></span>{" "}
			    <small>
				High DNase and High H3K4me3, H3K27ac, or CTCF in the same cell type
			    </small>
			</div>
		    </div>
		</div>
	    </div>
);
export default Legend;
