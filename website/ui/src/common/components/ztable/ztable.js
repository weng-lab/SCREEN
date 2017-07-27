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

        positionText: "text-left ",
        columnkey: "data",
        columnlabel: "title",

        activePage: 1,
        activeSearchPage: 1,
        pageLength: 10,

        value: '',
        searchCondition: false,
        prevValue: undefined,
        searchedResultsIndex: [],
        // variables for sorting
        columnSort: [],

      };

      // binds event handler
      this.handleSelect = this.handleSelect.bind(this);
      this.handleChange = this.handleChange.bind(this);
      this.handleColumnClicks = this.handleColumnClicks.bind(this);
      this.handleCellClicks = this.handleCellClicks.bind(this);

    }

    render() {

        let data = this.props.data;
        let cols = this.props.cols;

        if (this.props.table) {
          var table = this.props.table;
          if (table.cols) {
            cols = table.cols;
          }
        }

        if (this.props.columnkey)
          var columnkey = this.props.columnkey;
        else
          var columnkey = this.state.columnkey;

        if (this.props.columnlabel)
          var columnlabel = this.props.columnlabel;
        else
          var columnlabel = this.state.columnlabel;

        if (this.props.positionText)
          var positionText = this.props.positionText;
        else
          var positionText = this.state.positionText;

        // divides pages in per_page for pagination
        if (this.props.pageLength)
          var per_page = this.props.pageLength;
        else
          var per_page = this.state.pageLength;

        if (this.props.bPaginate != undefined && this.props.bPaginate != null) {
          if (!this.props.bPaginate) {
            per_page = data.length;
          }
        }

        if (this.state.searchCondition)
          var current_page = this.state.activeSearchPage;
        else
          var current_page = this.state.activePage;

        let columnSort = this.state.columnSort;

        let searchedResultsIndex = this.state.searchedResultsIndex,
          searchCondition = this.state.searchCondition,
          prevValue = this.state.prevValue;

        // value from search box
        let value = this.state.value;

        if (this.props.bFilter != undefined && this.props.bFilter != null) {
          if (this.props.bFilter) {

            var searchBar = ( <
              SearchBar value = {
                this.state.value
              }
              searchEvent = {
                this.handleChange
              }
              />); } else {

              var searchBar = undefined;

            }
          } else {
            var searchBar = ( <
              SearchBar value = {
                this.state.value
              }
              searchEvent = {
                this.handleChange
              }
              />);
            }

            let rc = generateRows(this.handleCellClicks, positionText, cols,
              columnkey, columnlabel, data, value, prevValue,
              searchedResultsIndex, current_page, per_page);

            // generates row components
            let rowComponents = rc.rowComponents,
              dataLength = rc.dataLength;

              // generates header amd row components
              let hc = generateHeaders(this.handleColumnClicks, positionText,
                cols, columnkey, columnlabel, columnSort, dataLength);
              let headerComponents = hc.columnHeader,
                columnSortTypes = hc.columnSortTypes;

            let pages = Math.ceil(dataLength / per_page);

            // updates seached data, search data packages the searched results
            this.state.searchedResultsIndex = rc.searchedResultsIndex;
            this.state.prevValue = rc.prevValue;
            if (columnSortTypes.length == cols.length) {
              this.state.columnSort = columnSortTypes;
            }

            // returns search box and result table
            return ( <
              div > {
                searchBar
              } <
              ReactiveTable headerComponents = {
                headerComponents
              }
              rowComponents = {
                rowComponents
              }
              per_page = {
                per_page
              }
              pages = {
                pages
              }
              current_page = {
                current_page
              }

              bPaginate = {
                this.props.bPaginate
              }
              pageChange = {
                this.handleSelect
              }
              dataLength = {
                dataLength
              }
              searchCondition = { searchCondition }
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
                searchCondition: true,
                activeSearchPage: 1
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

          handleCellClicks(rowIndex, columnIndex, columnkey, kclass) {
            var data = this.props.data[rowIndex];
            var cols = this.props.cols[columnIndex];

            if (this.props.onTdClick) {
              var onTdClick = this.props.onTdClick;
              onTdClick(kclass, data);
            }
            if (this.props.onButtonClick) {
              var onButtonClick = this.props.onButtonClick;
              onButtonClick(kclass, data);
            }
            if (this.props.rowClicks) {
              var rowClicks = this.props.rowClicks;
              rowClicks(kclass, cols[columnkey], data);
            }
          }

          handleColumnClicks(columnName, index) {
            // rerender if sorting is true
            this.setState({
              searchedResultsIndex: [],
              prevValue: undefined
            });

            let columnSort = this.state.columnSort,
              data = this.props.data,
              cols = this.props.cols;

            if (data.length > 1) {
              let columnSortType = [];
              if (columnSort.length > 0) {
                if (columnSort[index]['sortOn'] != 'disabled') {
                  for (let i = 0; i < columnSort.length; i++) {
                    if (columnSort[i]['sortOn'] != 'disabled') {
                      Object.assign(columnSort[i], {
                        sortOn: 'inactive'
                      });
                    }
                  }
                  columnSortType = columnSort[index];
                  Object.assign(columnSort[index], {
                    sortOn: 'active'
                  });

                  if (columnSortType["customSort"]) {
                    customSort(data, columnSortType, columnName);
                  } else {
                    sortData(data, columnSortType, columnName);
                  }
                  if (columnSort[index].direction == 'asc') {
                    Object.assign(columnSort[index], {
                      direction: 'desc'
                    });
                  } else {
                    Object.assign(columnSort[index], {
                      direction: 'asc'
                    });
                  }
                }
              }
            }
          }
        }
