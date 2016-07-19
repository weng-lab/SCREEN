function RE_table(){
};

RE_table.prototype.genStrCol = function(field){
    return { data: field, className: "dt-right"};
}

RE_table.prototype.genFloatCol = function(field){
    return { data: field, className: "dt-right",
             render: $.fn.dataTable.render.number( ',', '.', 1, '' ) };
}

RE_table.prototype.genIntCol = function(field){
    return { data: field, className: "dt-right",
             render: $.fn.dataTable.render.number( ',', '.', 0, '' ) };
}

RE_table.prototype.genButtonGroupCol = function(names){
    var bg = '<div class="btn-group" role="group">';
    for(i = 0; i < names.length; i++){
        bg += '<button type="button" class="btn btn-default btn-xs">' + names[i] +
            '</button>';
    }
    bg += '</div>';
    return { targets: -1, data: null, className: "dt-right", orderable: false,
             defaultContent : bg };
}

RE_table.prototype.setupColumns = function(){
    var ret = {Accession : this.genStrCol("_source.accession"),
	       Confidence : this.genFloatCol("_source.confidence"),
               //Genome : this.genStrCol("_source.genome"),
	       Chr : this.genStrCol("_source.position.chrom"),
               Start : this.genIntCol("_source.position.start"),
	       End : this.genIntCol("_source.position.end")}

    if(searchquery.has_cell_line_filter()){
        var cellType = searchquery.cell_line;
        ret["Nearest gene"] = this.genStrCol("_source.genes.nearest-all.gene-id");
        ret["Nearest protein-coding gene"] =
            this.genStrCol("_source.genes.nearest-pc.gene-id");
    }

    ret["genome browsers"] = this.genButtonGroupCol(["UCSC", "WashU", "Ensembl"]);

    return ret;
}

RE_table.prototype.makeEmptyTable = function(cols){
    var colNames = _.keys(cols);

    var frag = document.createDocumentFragment();
    for(i = 0; i < colNames.length; i++){
        var th = document.createElement("th");
        th.innerHTML = colNames[i];
        frag.appendChild(th);
    }
    var tr = document.createElement("tr");
    tr.appendChild(frag)
    var thead = document.createElement("thead");
    thead.appendChild(tr);
    var table = document.createElement("table");
    table.id = "searchresults_table";
    table.appendChild(thead);

    return table;
}

RE_table.prototype.makeEmptyDetailsDiv = function(){
    var div = document.createElement("div");
    div.style.width = "100%";
    div.id = "details_view"

    var td = document.createElement("td");
    td.appendChild(div);

    var tr = document.createElement("tr");
    tr.style.display = "none";
    tr.appendChild(td)

    var table = document.getElementById("details_view_table");
    table.insertBefore(tr, table.firstChild);

    regelm_details_view.bind("details_view");
    regelm_details_view.table_row = tr;
}

RE_table.prototype.renderTable = function(){
    var cols = this.setupColumns();

    $("#searchresults_div").html(this.makeEmptyTable(cols));

    var dtable = $("#searchresults_table").DataTable( {
        destroy: true,
        processing: true,
        data: results.results.hits,
        columns: _.values(cols),
        order: [[1, "desc"],
        	[3, "asc"],
        	[4, "asc"]
               ]
    } );

    this.makeEmptyDetailsDiv();
    
    // deal w/ genome browser button click
    $('#searchresults_table tbody').on( 'click', 'button', function () {
        var reAccession = get_accession($(this));
        //console.log(whichBrowser, reAccession);
    } );

    // deal w/ RE row click
    $('#searchresults_table').on( 'click', 'td', function() {
	regelm_details_view.table_row.style.display = 'table-row';
	request_details(get_accession($(this)));
    } );

}

function get_accession(t)
{
    var whichBrowser = t.html();
    var data = dtable.row(t.parents('tr')).data();
    return data["_source"]["accession"];
}
