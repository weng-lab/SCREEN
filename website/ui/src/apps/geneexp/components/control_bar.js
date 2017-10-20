import React from 'react'

import {panelize} from '../../../common/utility';
import {CHECKLIST_MATCH_ANY} from '../../../common/components/checklist'
import LongChecklist from '../../../common/components/longchecklist'

class CellCompartmentsBox extends React.Component {
    render(){
	const compartments = this.props.globals.cellCompartments;
	const compartments_selected = this.props.compartments_selected;
	return panelize("Cellular Compartments",
			<LongChecklist
			    title={""}
			    data={compartments.map((e) => {
				    return {key: e, selected: compartments_selected.has(e)}})}
			    cols={[{
				    title: "", data: "key",
				    className: "nopadding"
			    }]}
			    order={[]}
			    buttonsOff={true}
			    noSearchBox={true}
			    checkBoxClassName={"nopadding"}
			    noTotal={true}
			    mode={CHECKLIST_MATCH_ANY}
			    onTdClick={(c) => {
				    this.props.actions.toggleCompartment(c) } }
			/>);
    }
}

class BiosampleTypesBox extends React.Component {
    render(){
	const biosample_types = this.props.globals.geBiosampleTypes;
	const biosample_types_selected = this.props.biosample_types_selected;
	return panelize("Biosample Types",
			<LongChecklist
                            title={""}
                            data={biosample_types.map((e) => {
                                    return {key: e,
                                            selected: biosample_types_selected.has(e)
                                    }})}
                            cols={[{
		                    title: "", data: "key",
		                    className: "nopadding"
	                    }]}
                            order={[]}
			    noSearchBox={true}
			    checkBoxClassName={"nopadding"}
			    noTotal={true}
			    buttonsOff={true}
        	            mode={CHECKLIST_MATCH_ANY}
                            onTdClick={(c) => { 
				    this.props.actions.toggleBiosampleType(c) 
			    } }
			/>);
    }
}

class ControlBar extends React.Component {
    constructor(props) {
	super(props);
	this.sortSelect = this.sortSelect.bind(this);
	this.dataScale = this.dataScale.bind(this);
    }

    sortSelect(){
        return panelize("Sort order",
			<select
			    defaultValue={this.props.sortOrder}
			    onChange={this.props.changeSortOrder}
			>
			    <option value="byExpressionTPM">
				by expression &#40;TPM&#41;</option>
			    <option value="byExpressionFPKM">
				by expression &#40;FPKM&#41;</option>
			    <option value="byTissue">
				by tissue</option>
			    <option value="byTissueMaxTPM">
				by tissue max &#40;TPM&#41;</option>
			    <option value="byTissueMaxFPKM">
				by tissue max &#40;FPKM&#41;</option>
			</select>);
    }
    
    dataScale(){
        return panelize("Data",
			<select
			    defaultValue={this.props.dataScale}
			    onChange={this.props.changeDataScale}
			>
			    <option value="logTPM">log2&#40;TPM + 0.01&#41;</option>
			    <option value="rawTPM">TPM</option>
			    <option value="logFPKM">log2&#40;FPKM + 0.01&#41;</option>
			    <option value="rawFPKM">FPKM</option>
			</select>);
    }
    
    render(){
	if(!this.props.useBoxes){
	    return (
	        <div className="row">
                    {this.sortSelect()}
                    {this.dataScale()}
	        </div>);
	}
	return(
	    <div className="row">
		<div className="col-md-3">
		    {this.sortSelect()}
		    {this.dataScale()}
		</div>
		<div className="col-md-3">
	 	    {React.createElement(BiosampleTypesBox, this.props)}
		</div>
		<div className="col-md-3">
		    {React.createElement(CellCompartmentsBox, this.props)}
		</div>
	    </div>
	);
    }
}

export default ControlBar;
