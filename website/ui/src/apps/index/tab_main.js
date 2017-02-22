import React from 'react';

class TabMain extends React.Component {
    constructor(props) {
	super(props);
	this.userQueries = {};
	this.searchHg19 = this.searchHg19.bind(this);
	this.searchMm10 = this.searchMm10.bind(this);
    }
    
    searchHg19() {
	$("#searchformassembly").attr("value", "hg19")
	$("#searchform").submit();
    }
    
    searchMm10() {
	$("#searchformassembly").attr("value", "mm10")
	$("#searchform").submit();
    }

    textBox() {
	return (<div>
		{"SCREEN is a web interface for searching and visualizing the Registry of candidate Regulatory Elements (cREs) derived from "}
		<a href={"https://encodeproject.org/"} target={"_blank"}>ENCODE data</a>
		{". The Registry contains 2.67M human cREs in hg19 and 1.67M mouse cREs in mm10, with orthologous cREs cross-referenced.  SCREEN presents the data that support biochemical activities of the cREs and the expression of nearby genes in specific cell and tissue types."}
		<hr />
		{"You may launch SCREEN using the search box below or browse a curated list of SNPs from the NHGRI-EBI GWAS catalog to annotate genetic variants using cREs."}
		
		<div id={"gwasGroup"}>
		<a className={"btn btn-primary"} href={"/gwasApp/hg19/"} role={"button"}>
		{"Browse GWAS"}
		</a>
		</div>

		</div>);
    }
    
    logo(){
	return (<img
		className={"img-responsive mainLogo"}
		src={"/static/encode/classic-image.jpg"}
		alt={"ENCODE logo"} />);
    }

    searchErr() {
	return (<span
		style={{color : "#ff0000", fontWeight : "bold"}}>
		{"failedsearch"}
		</span>);
    }
    
    searchBox(){
	return (
		<div>
		<form action={"search"} method={"get"} id={"searchform"}>
		{this.searchErr()}
		<br />

		<div className={"form-group text-center"}>
		<input ref="searchBox" id={"mainSearchbox"} type={"text"} name={"q"} defaultValue={"K562 chr11:5226493-5403124"} />
		<input id={"searchformassembly"} name={"assembly"} value={"hg19"} type={"hidden"} />
		</div>
		
		<div id={"mainButtonGroup"}>

		<a className={"btn btn-primary btn-lg"} onClick={this.searchHg19} role={"button"}>Search hg19</a>
		{" "}
		<a className={"btn btn-success btn-lg"} onClick={this.searchMm10} role={"button"}>Search mm10</a>
		<br />
		<br />
		<i>{'Examples: "K562 chr11:5226493-5403124", "SOX4 TSS", "rs4846913"'}</i>
		</div>
		
            </form>
		
            </div>);
    }

    componentDidMount(){
	const loadAuto = (userQuery, callback_f) => {
	    let jq = JSON.stringify({userQuery});
	    if(jq in this.userQueries){
		console.log("getting cached");
		callback_f(this.userQueries[jq]);
		return;
	    }
	    $.ajax({
		url: "/autows/suggestions",
		type: "POST",
		data: jq,
		dataType: "json",
		contentType : "application/json",
		error: function(jqxhr, status, error) {
                    console.log("err during load");
		}.bind(this),
		success: function(r){
		    this.userQueries[jq] = r;
		    callback_f(r);
		}.bind(this)
	    });
	}

	let sb = $("#mainSearchbox");
	sb.autocomplete({
	    source: function (userQuery, callback_f) {
		loadAuto(userQuery.term, callback_f)
	    },
	    select: function(event, ui) {
		sb.val(ui.item.value);
		return false;
	    },
	    change: function() {
	    }
	});
    }
    
    render() {
	return (<div>

		<div className={"row vertical-align"}>

		<div className={"col-md-6"}>
		{this.logo()}
		</div>
		
		<div className={"col-md-6"}>
		<div className={"jumbotron"} id={"mainDesc"}>
		{this.textBox()}
		</div>
		</div>
		
		</div>
		
		<div className={"row"}>
		<div className={"col-md-12 text-center"}>
		{this.searchBox()}
		</div>
		</div>
		
		</div>);
    }
}

export default TabMain;
