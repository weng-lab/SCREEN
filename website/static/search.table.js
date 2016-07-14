function genStrCol(field){
    return { data: field, className: "dt-right"};
}

function genFloatCol(field){
    return { data: field, className: "dt-right",
             render: $.fn.dataTable.render.number( ',', '.', 1, '' ) };
}

function genIntCol(field){
    return { data: field, className: "dt-right",
             render: $.fn.dataTable.render.number( ',', '.', 0, '' ) };
}

function genButtonCol(name){
    return { "targets": -1, "data": null, className: "dt-right", "orderable": false,
             "defaultContent":
             '<button type="button" class="btn btn-success btn-xs">' + name + '</button>' };
}

function setupColumns(){
    var ret = {Accession : genStrCol("_source.accession"),
	       Confidence : genFloatCol("_source.confidence"),
               Genome : genStrCol("_source.genome"),
	       Chr : genStrCol("_source.position.chrom"),
               Start : genIntCol("_source.position.start"),
	       End : genIntCol("_source.position.end")}

    if(searchquery.has_cell_line_filter()){
        var cellType = searchquery.cell_line;
        var ret2 = {
            "Nearest gene" : genStrCol("_source.genes.nearest-all.gene-id"),
            "Nearest protein-coding gene" : genStrCol("_source.genes.nearest-pc.gene-id"),
            "Enhancer rank" : genIntCol("_source.ranks.enhancer." + cellType + ".rank"),
            "Promoter rank" : genIntCol("_source.ranks.promoter." + cellType + ".rank"),
            "DNase rank" : genIntCol("_source.ranks.dnase." + cellType + ".rank"),
            "CTCF rank" : genIntCol("_source.ranks.ctcf." + cellType + ".rank")};
        _.extend(ret, ret2);
    }

    ret.UCSC = genButtonCol("UCSC");
    ret.WashU = genButtonCol("WashU");
    ret.Ensembl = genButtonCol("Ensembl");

    return ret;
}

function renderTable(){
    var cols = setupColumns();
    var colNames = _.keys(cols);

    var table = '<table id="searchresults_table"><thead><tr>';
    for(i=0; i < colNames.length; i++){
        table += '<th>' + colNames[i] + '</th>';
    }
    table += '</tr></thead><tfoot><tr>';
    for(i=0; i < colNames.length; i++){
        table += '<th>' + colNames[i] + '</th>';
    }
    table += '</tr></tfoot></table>';

    $("#searchresults_div").html(table);
    var rtable = $("#searchresults_table");

    var dtable = rtable.DataTable( {
	destroy: true,
        processing: true,
        data: results.results.hits,
        columns: _.values(cols),
	order: [[1, "desc"],
		[3, "asc"],
		[4, "asc"]
	       ]
    } );

    $('#searchresults_table tbody').on( 'click', 'button', function () {
        var data = dtable.row( $(this).parents('tr') ).data();
        console.log(data);
    } );
}
