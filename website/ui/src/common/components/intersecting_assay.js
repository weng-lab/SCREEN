import React from 'react'

import * as Render from '../renders'
import ResultsTable from './results_table'

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

    loadTarget({cre_accession_detail}, target){
	if(!target){
	    return;
	}
        if(target in this.state){
            this.setState({target});
            return;
        }
        let q = {GlobalAssembly, accession: cre_accession_detail, target};
        var jq = JSON.stringify(q);
        if(this.state.jq == jq){
            // http://www.mattzeunert.com/2016/01/28/javascript-deep-equal.html
            return;
        }
        //console.log("loadTarget....", this.state.jq, jq);
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
	                      render: Render.dccLinkAndIconSplit }
                             ],
	                 order: [[0, "asc"]]
                        }
            details = (<div id={this.table}>
                       <br />
	               <h4>{table.title}</h4>
                       {React.createElement(ResultsTable,
                                            {data : this.state[target],
                                             ...table})}
                       </div>);
        }

	return (<div className={"intersectionTable"} >
                {React.createElement(ResultsTable, {data, ...table,
                                                    onTdClick,
		                                    onMouseEnter: true,
                                                    onMouseExit: true
                                                   })}
                {details}
                </div>);
    }
}

export default IntersectingAssay;
