import React from 'react';

import ReactiveTable from './table/reactivetable';
import generateRows from './table/tablecomponents/generaterows';
import generateHeaders from './table/tablecomponents/generateheaders';

import SearchBar from './table/searchbar';

import customSort from './table/sort/customsort';
import sortData from './table/sort/sortdata';

export default class ZTable extends React.Component {

  constructor(props) {
    super(props);

    // initializes state of variable
    this.state = {
      // pagination variables
      activePage: 1,
      activeSearchPage: 1, // when search is true

      // variables for search box
      value: '',
      searchCondition: false,
      customSearch: [{
        column: 'genesallpc',
        value: '',
        filterSearch: '',
      }, {
        column: 'info',
        value: 'accession',
        filterSearch: '',
      }],
      prevValue: undefined,
      //customSearch: [{column: undefined, value: '', filterSearch: ''}],
      searchedResultsIndex: [],

      // variables for sorting
      columnSort: [{
          column: "info",
          direction: 'asc',
          sortOn: 'inactive',
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

        }, {
          column: "ctspecifc",
          direction: 'asc',
          sortOn: 'inactive',
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

        } }, {
          column: "dnase_zscore",
          direction: 'asc',
          sortOn: 'inactive',
        }, {
          column: "promoter_zscore",
          direction: 'asc',
          sortOn: 'inactive',
        }, {
          column: "enhancer_zscore",
          direction: 'asc',
          sortOn: 'inactive',
        }, {
          column: "ctcf_zscore",
          direction: 'asc',
          sortOn: 'inactive',
        }, {
          column: "chrom",
          direction: 'asc',
          sortOn: 'inactive',
        }, {
          column: "start",
          direction: 'asc',
          sortOn: 'inactive',
        }, {
          column: "len",
          direction: 'asc',
          sortOn: 'inactive',
        },

      ]
    };

    // binds event handler
    this.handleSelect = this.handleSelect.bind(this);
    this.handleChange = this.handleChange.bind(this);
    this.handleColumnClicks = this.handleColumnClicks.bind(this);
    this.handleRowClicks = this.handleRowClicks.bind(this);
  }

  render() {





    let data = this.props.data;
    let cols = this.props.cols,
      columnkey = this.props.columnkey,
      columnlabel = this.props.columnlabel;

      let columnSort = this.state.columnSort;

      let searchedResultsIndex = this.state.searchedResultsIndex,
      searchCondition = this.state.searchCondition,
      prevValue = this.state.prevValue;

    let customSearch = this.state.customSearch;

    // value from search box
    let value = this.state.value;


    // divides pages in per_page for pagination
    const per_page = 10;

    // obtain the current page that user had clicked
    if (this.state.searchCondition)
      var current_page = this.state.activeSearchPage;
    else
      var current_page = this.state.activePage;

    // generates header amd row components


      let headerComponents = generateHeaders(this.handleColumnClicks,
        cols, columnkey, columnlabel, columnSort);

        let rc = generateRows(this.handleRowClicks, cols,
          columnkey, data, value, prevValue, customSearch,
          searchedResultsIndex, current_page, per_page);

        // generates row components
        let rowComponents = rc.rowComponents,
        dataLength = rc.dataLength;

        let pages = Math.ceil(dataLength / per_page);

    // updates seached data, search data packages the searched results
    this.state.searchedResultsIndex = rc.searchedResultsIndex;
    this.state.prevValue = rc.prevValue;


    // returns search box and result table
    return ( <
      div >
      <
      SearchBar value = {
        this.state.value
      }
      searchEvent = {
        this.handleChange
      }
      /> <
      ReactiveTable headerComponents = {
        headerComponents
      }
      rowComponents = {
        rowComponents
      }
      pages = {
        pages
      }
      current_page = {
        current_page
      }
      pageChange = {
        this.handleSelect
      }
      dataLength = {
        dataLength
      }
      /> < /
      div >
    );
  }

  handleChange(e) {
    // sets current state of text entered on search box
    this.setState({
      value: e.target.value
    });

    // case when search is true
    if (e.target.value != '') {
      this.setState({
        searchCondition: true, activeSearchPage: 1
      });
    } else {
      this.setState({
        searchCondition: false
      });
    }
  }

  handleSelect(eventKey) {

    if (this.state.searchCondition)
      this.setState({
        activeSearchPage: eventKey
      });
    else
      this.setState({
        activePage: eventKey
      });
  }

  handleRowClicks(rowIndex, columnIndex, search) {



    var onTdClick = this.props.onTdClick;
  	var onButtonClick = this.props.onButtonClick;
console.log(search.addEventListener('click'));

if(columnIndex == 11) {
onButtonClick(this, this.props.data[rowIndex]);
}

  }


  handleColumnClicks(columnKey) {
    // rerender if sorting is true
    this.setState({
      searchedResultsIndex: [],
      prevValue: undefined
    });


    let condition = false;

    // variables for column sorting
    let columnSort = this.state.columnSort,
      data = this.props.data;


      let columnSortType = [];

    // condition when columnSort is not empty,
    // rechecks array to modify value based on key
    if (data.length > 1) {
      if (columnSort.length > 0) {
        for (let i = 0; i < columnSort.length; i++) {

          // inactivates filtering
          if (columnSort[i].sortOn != 'disabled') {
            Object.assign(columnSort[i], {
              sortOn: 'inactive'
            });
          }

          // if columnKey found change column sorting direction
          if (columnSort[i].column == columnKey) {
            condition = true;

            // activates sorting
            if (columnSort[i].sortOn != 'disabled') {
              Object.assign(columnSort[i], {
                sortOn: 'active'
              });

              if (columnSort[i].direction == 'asc')
                Object.assign(columnSort[i], {
                  direction: 'desc',
                });
              else
                Object.assign(columnSort[i], {
                  direction: 'asc',
                });
            }
            columnSortType = columnSort[i];

          }
        }
      }

      // case when columnSort is empty, push in new data
      if (!condition) {
        if (typeof(data[0][columnKey]) == 'string' ||
          typeof(data[0][columnKey]) == 'number') {
          columnSort.push({
            column: columnKey,
            direction: 'asc',
            sortOn: 'active'
          });
        } else {
          columnSort.push({
            column: columnKey,
            direction: 'asc',
            sortOn: 'disabled'
          });

        }
      columnSortType = columnSort[columnSort.length - 1];
      }
      // sorts data either by default or custom function
      if (columnSortType.customSort !== undefined &&
        columnSortType.customSort !== null) {
        customSort(data, columnSortType);
      } else {
        sortData(data, columnSortType);
      }
    }
  }
}
