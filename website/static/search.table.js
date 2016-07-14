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

function renderTable(){
    var colNames = ["Accession",
	            "Confidence",
	            "Genome",
	            "Chr",
	            "Start",
	            "End"];

    var cols = [ genStrCol("_source.accession"),
                 genFloatCol("_source.confidence"),
                 genStrCol("_source.genome"),
                 genStrCol("_source.position.chrom"),
                 genIntCol("_source.position.start"),
                 genIntCol("_source.position.end")
               ];

    if(searchquery.has_cell_line_filter()){
        var cellType = searchquery.cell_line;
        cols.push(genStrCol("_source.genes.nearest-all.gene-id"));
        colNames.push("Nearest gene");
        cols.push(genStrCol("_source.genes.nearest-pc.gene-id"));
        colNames.push("Nearest protein-coding gene");

        cols.push(genIntCol("_source.ranks.enhancer." + cellType + ".rank"));
        colNames.push("Enhancer rank");
        cols.push(genIntCol("_source.ranks.promoter." + cellType + ".rank"));
        colNames.push("Promoter rank");
        cols.push(genIntCol("_source.ranks.dnase." + cellType + ".rank"));
        colNames.push("DNase rank");
        cols.push(genIntCol("_source.ranks.ctcf." + cellType + ".rank"));
        colNames.push("CTCF rank");
    }

    cols.push(genButtonCol("UCSC"));
    colNames.push("UCSC");
    cols.push(genButtonCol("WashU"));
    colNames.push("WashU");
    cols.push(genButtonCol("Ensembl"));
    colNames.push("Ensembl");

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
        "processing": true,
        "data": results.results.hits,
        "aoColumns": cols,
	"order": [[ 1, "desc" ],
		  [3, "asc"],
		  [4, "asc"]
		 ]
    } );

    $('#searchresults_table tbody').on( 'click', 'button', function () {
        var data = dtable.row( $(this).parents('tr') ).data();
        console.log(data);
    } );
}
