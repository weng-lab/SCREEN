import {HelpTooltip} from '../../../common/components/help_icon'
import * as Render from '../../../common/zrenders'

const TableColumns = (cts) => {

    let klassLeft = "dt-body-left dt-head-left ";
    let klassCenter = "dt-body-center dt-head-center ";


    let accHelp = <span> accession<br/> {HelpTooltip("CellTypeTableAccessionCol")} </span>;

    let sctHelp = <span>{cts} {HelpTooltip("CellTypeSpecifiedClassification")}</span>;

    let geneHelp = <span>nearest genes:<br/>protein-coding / all&nbsp;&nbsp; </span>
    if("mm10" == GlobalAssembly){
        geneHelp += HelpTooltip("DifferentialGeneMouse");
    }




    return [
	{
	    title: accHelp, data: "info", className: klassCenter,
            render: Render.creTableAccession, customSearch: {
          value: 'accession',
          filterSearch: true,
        }, columnSort: {
          column: "info",
          direction: 'asc',
          sortOn: 'active',
          customSort: 'on',
          custumFunction: function(data, columnSortType) {

            //case when it is a string
            if (columnSortType.direction == 'asc') {
              data.sort(function(a, b) {
                let nameA = a[columnSortType.column].accession.toLowerCase(); // ignore upper and lowercase
                let nameB = b[columnSortType.column].accession.toLowerCase(); // ignore upper and lowercase
                if (nameA < nameB) {
                  return -1;
                }
                if (nameA > nameB) {
                  return 1;
                }
                // names must be equal
                return 0;
              });
            } else {
              data.sort(function(a, b) {
                let nameA = a[columnSortType.column].accession.toLowerCase(); // ignore upper and lowercase
                let nameB = b[columnSortType.column].accession.toLowerCase(); // ignore upper and lowercase
                if (nameA > nameB) {
                  return -1;
                }
                if (nameA < nameB) {
                  return 1;
                }

                // names must be equal
                return 0;
              });
            }

          }

        }
	}, {
            title: sctHelp, data: "ctspecifc", className: klassCenter,
	    render: Render.creTableCellTypeSpecific, name: "sctv", width: "12%", columnSort: {
          column: "ctspecifc",
          direction: 'asc',
          sortOn: 'active',
          customSort: 'on',
          custumFunction: function(data, columnSortType) {

            if (!isNaN(data[0][columnSortType.column].ctcf_zscore)) {

              if (columnSortType.direction == 'asc') {
                data.sort(function(a, b) {
                  return a[columnSortType.column].ctcf_zscore - b[columnSortType.column].ctcf_zscore;
                });
              } else {
                data.sort(function(a, b) {
                  return b[columnSortType.column].ctcf_zscore - a[columnSortType.column].ctcf_zscore;
                });
              }
          }

        } }
	}, {
	    title: "DNase Z", data: "dnase_zscore", className: klassCenter,
	    render: Render.real, width: "7%", name: "dnase"
	}, {
	    title: "H3K4me3 Z", data: "promoter_zscore", className: klassCenter,
	    render: Render.real, width: "7%", name: "promoter"
	}, {
	    title: "H3K27ac Z", data: "enhancer_zscore", className: klassCenter,
	    render: Render.real, width: "7%", name: "enhancer"
	}, {
	    title: "CTCF Z", data: "ctcf_zscore", className: klassCenter,
	    render: Render.real, width: "7%", name: "ctcf"
	}, {
	    title: "chr", data: "chrom", className: klassCenter
	}, {
	    title: "start", data: "start", className: klassCenter,
            render: Render.integer
	}, {
	    title: "length", data: "len", className: klassCenter,
            render: Render.integer
	}, {
            title: geneHelp, data: "genesallpc",
	    className: klassCenter + "geneexp", render: Render.geneDeLinks,
            orderable: false,
	}, {
	    title: "cart", data: "in_cart", className: klassCenter + "cart",
            render: (d) => Render.cart_img(d, false),
            orderable: false,
	}, {
	    title: "genome browsers", data: null,
	    className: klassCenter + "browser",
	    targets: -1,
	    defaultContent: Render.browser_buttons(["UCSC"]), customSearch: {
        value: '',
        filterSearch: true,
      }

	    //, "Ensembl"
	}
    ];
}

export default TableColumns;

export const table_order = [];
//    [2, "desc"],
//    [3, "asc"],
//    [4, "asc"],
//    [5, "asc"]

export const columnDefs = [{ "orderData": 2, "targets": 1 }]
//                           { "orderData": 4, "targets": 3 }]
