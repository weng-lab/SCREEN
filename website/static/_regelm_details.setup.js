var regelm_GUI = new regelm_gui();

regelm_GUI.bind("regelm_detail_container");
regelm_GUI.set_header("EEXXXXXX");
regelm_GUI.set_coordinates("chr1:1,293,293-1,295,294");

regelm_GUI.ranking_view.load_cell_lines({
    "promoter":	[
	{"id": "GM12878",
	 "absolute": 10,
	 "total": 100000},
	{"id": "K562",
	 "absolute": 50000,
	 "total": 100000}
    ]
});

regelm_GUI.genes_view.load_list([
    {
	"name": "ENSG000000000",
	"distance": 1000
    },
    {
	"name": "ENSG000000000",
	"distance": 100
    }
]);

regelm_GUI.snp_view.load_list([
    {
	"name": "rsXXXXXXXXXXX",
	"distance": 10
    },
    {
	"name": "rsXXXXXXXXXXX",
	"distance": 30
    }
]);

regelm_GUI.re_view.load_list([
    {
	"name": "EE000000000",
	"distance": 100
    },
    {
	"name": "EE094930294",
	"distance": 30
    }
]);
