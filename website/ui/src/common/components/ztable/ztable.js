import React from 'react';
import * as Render from '../../../common/renders'

import ReactiveTable from './table/reactivetable';
import generateTableComponents from './table/tablecomponents/generatetablecomponents';

import SearchBar from './table/search/searchbar';

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
        renderOn: ''
      }, {
        column: 'info',
        value: 'accession',
        filterSearch: '',
        renderOn: ''
      }, {
        column: 'ctspecifc',
        value: '',
        filterSearch: 'disabled',
        renderOn: ''

      }, {
        column: 'in_cart',
        value: '',
        filterSearch: 'disabled',
        renderOn: ''

      }, {
        column: null,
        value: '',
        filterSearch: 'disabled',
        renderOn: ''

      }],
      prevValue: undefined,
      //customSearch: [{column: undefined, value: '', filterSearch: ''}],
      searchedData: [],
      rowIndex: [],

      // variables for sorting
      columnSort: [{
        column: "info",
        direction: 'asc',
        sortOn: 'inactive',
        customSort: 'on',
        custumFunction: function(data,  columnSortType){

          // case when it is a string
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

      }],
      columnSortType: []
    };

    // binds event handler
    this.handleSelect = this.handleSelect.bind(this);
    this.handleChange = this.handleChange.bind(this);
    this.handleClick = this.handleClick.bind(this);

  }

  render() {


    // temp variables
    let data = this.props.data,
      searchedData = this.state.searchedData,
      searchCondition = this.state.searchCondition,
      prevValue = this.state.prevValue;

    //console.log("data", data.length);
    let cols = this.props.cols,
      columnkey = this.props.columnkey,
      columnlabel = this.props.columnlabel,
      columnSort = this.state.columnSort;


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
    let tc = generateTableComponents(current_page,
      per_page, value, prevValue, cols, data, searchedData,
      searchCondition, columnkey, columnlabel,
      columnSort, this.handleClick, customSearch);

    let headerComponents = tc.headerComponents,
      rowComponents = tc.rowComponents,
      dataLength = tc.dataLength,
      pages = tc.pages;

    // updates seached data, search data packages the searched results
    this.state.searchedData = tc.searchedData;
    this.state.rowIndex = tc.rowIndex;
this.state.prevValue = tc.prevValue;
    // returns search box and result table
    return (
      <div>
      <SearchBar value = { this.state.value }
        searchEvent = { this.handleChange }/>
      <ReactiveTable headerComponents = { headerComponents }
        rowComponents = { rowComponents }
        pages = { pages }
        current_page = { current_page }
        pageChange = { this.handleSelect }
        dataLength = { dataLength }/>
      </div>
    );
  }

  handleChange(e) {
    // sets current state of text entered on search box
    this.setState({ value: e.target.value });

    // case when search is true
    if (e.target.value != '') {
      this.setState({ searchCondition: true });

      // set active page for pagination to 1
      this.setState({ activeSearchPage: 1 });
    } else {
      this.setState({ searchCondition: false });
    }
  }

  handleSelect(eventKey) {
    // changes active page of pagination
    // for both cases when search is true
    // and when search is false
    if (this.state.searchCondition)
      this.setState({ activeSearchPage: eventKey });
    else
      this.setState({ activePage: eventKey });
  }

  handleClick(columnKey) {
    // rerender if sorting is true
    this.setState({ columnSortType: [] });

    // resets search data when sorting, needs to refresh


      this.setState({ searchedData: [] });


    // checks whether columnSort is empty
    let condition = false;

    // variables for column sorting
    let columnSort = this.state.columnSort,
      columnSortType = this.state.columnSortType,
      data = this.props.data;

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
            Object.assign(columnSortType, columnSort[i]);

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
        Object.assign(columnSortType,
          columnSort[columnSort.length - 1]);
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
