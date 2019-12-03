import React from 'react';

export const Legend = props => (
	    <div className="panel panel-default">
		<div className="panel-body legendPanel">
		    <div className="row">
			<div className="col-md-2">
			    {Render.sctGroupIconLegend(this.props.globals, 'P')}
			</div>
			<div className="col-md-2">
			    {Render.sctGroupIconLegend(this.props.globals, 'E')}
			</div>
			<div className="col-md-2">
			    {Render.sctGroupIconLegend(this.props.globals, 'C')}
			</div>
			<div className="col-md-2">
			    {Render.sctGroupIconLegend(this.props.globals, 'D')}
			</div>
			<div className="col-md-2">
			    {Render.sctGroupIconLegend(this.props.globals, 'I')}
			</div>
			<div className="col-md-2">
			    {Render.sctGroupIconLegend(this.props.globals, 'U')}
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
