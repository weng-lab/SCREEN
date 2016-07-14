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
    var b = '<button type="button" class="btn btn-success btn-xs">' + name + '</button>';
    return { targets: -1, data: null, className: "dt-right", orderable: false,
             defaultContent : b };
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

function makeEmptyTable(cols){
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

function renderTable(){
    var cols = setupColumns();

    $("#searchresults_div").html(makeEmptyTable(cols));

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

    $('#searchresults_table tbody').on( 'click', 'button', function () {
        var data = dtable.row( $(this).parents('tr') ).data();
        console.log(data);
    } );
}
