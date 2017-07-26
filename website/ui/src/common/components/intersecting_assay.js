import React from 'react'

import * as Render from '../zrenders'
import ResultsTable from './results_table'
import ZTable from './ztable/ztable'

const _renders = {
    peak: Render.dccLinkAndIconSplit,
    cistrome: Render.cistromeLink
};

class IntersectingAssay extends React.Component {
    constructor(props, url, table) {
	super(props);
        this.url = url;
        this.table = table;
        this.state = { target: null, isFetching: true, isError: false,
                       jq : null}
        this.loadTarget = this.loadTarget.bind(this);
    }

    componentWillReceiveProps(nextProps){
        //console.log("in componentWillReceiveProps");
        this.loadTarget(nextProps, this.state.target);
    }

    loadTarget({cre_accession_detail, table}, target) {
	if(!target) { return; }
        if(target in this.state){
            this.setState({target});
            return;
        }
        let q = {GlobalAssembly, accession: cre_accession_detail, target, eset: table.eset};
        var jq = JSON.stringify(q);
        if (this.state.jq == jq) { return; } // http://www.mattzeunert.com/2016/01/28/javascript-deep-equal.html
        this.setState({jq, isFetching: true});
        $.ajax({
            url: this.url,
            type: "POST",
	    data: jq,
	    dataType: "json",
	    contentType: "application/json",
            error: function(jqxhr, status, error) {
                console.log("err loading target for table");
                this.setState({target: null,
                               jq: null, isFetching: false, isError: true});
            }.bind(this),
            success: function(r) {
                this.setState({target, ...r,
                               jq, isFetching: false, isError: false});
            }.bind(this)
        });
    }

    render() {
        let data = this.props.data
        let table = this.props.table;


console.log("this table data", table, "data", data);

        let onTdClick = (i, d) => {
            this.loadTarget(this.props, d.name);
        };

        let details = "";
        let target = this.state.target;
        if(target && target in this.state){
            let table = {title: "ChIP-seq " + target + " Experiments",
	                 cols: [
	                     {title: "cell type", data: "biosample_term_name"},
                             {title: "experiment / file", data: "expID",
	                      render: _renders[this.props.table.eset ? this.props.table.eset : "peak"] }
                             ],
	                 order: [[0, "asc"]]
                        }
            details = (<div id={this.table}>
                       <br />
	               <h4>{table.title}</h4>
                       {React.createElement(ZTable,
                                            {data : this.state[target],
                                             ...table})}
                       </div>);
        }



console.log("this table data", table, "data", data);
	return (<div className={"intersectionTable"} >
                {React.createElement(ZTable, {data, ...table,
                                                    onTdClick,
		                                    onMouseEnter: true,
                                                    onMouseExit: true
                                                   })}
                {details}
                </div>);
    }
}

export default IntersectingAssay;
