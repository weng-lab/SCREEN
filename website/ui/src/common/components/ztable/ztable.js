import React from 'react';

import ReactiveTable from './table/reactivetable';
import generateTableComponents from './table/tablecomponents/generatetablecomponents';

import SearchBar from './table/search/searchbar';

import customSort from './table/sort/customsort';
import sortData from './table/sort/sortdata';

class ZTable extends React.Component {

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
      customSearch: [{column: 'genesallpc', value: 'accession'}],

      // variables for sorting
      columnSort: [],
      columnSortType: []

    };

    // binds event handler
    this.handleSelect = this.handleSelect.bind(this);
    this.handleChange = this.handleChange.bind(this);
    this.handleClick = this.handleClick.bind(this);

  }


  render() {

    // temp variables
    var data = this.props.data; // stores data to be entered in table

    console.log("data", data);
    var cols = this.props.cols,
      columnkey = this.props.columnkey,
      columnlabel = this.props.columnlabel,
      columnSort = this.state.columnSort;

      var customSearch = this.state.customSearch;

    // value from search box
    var value = this.state.value;

    // divides pages in per_page for pagination
    const per_page = 10;

    // obtain the current page that user clicked on
    if (this.state.searchCondition)
      var current_page = this.state.activeSearchPage;
    else
      var current_page = this.state.activePage;

    var tableComponents = generateTableComponents(current_page,
      per_page, value, cols, data, columnkey,
      columnlabel, columnSort, this.handleClick, customSearch);

    var headerComponents = tableComponents.headerComponents,
      rowComponents = tableComponents.rowComponents,
      dataLength = tableComponents.dataLength,
      pages = tableComponents.pages;

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
    this.setState({
      value: e.target.value
    });
    // case when search is true
    if (e.target.value != '') {
      this.setState({
        searchCondition: true
      });
      // set active page for pagination to 1
      this.setState({
        activeSearchPage: 1
      });
    } else {
      this.setState({
        searchCondition: false
      });
    }
  }

  handleSelect(eventKey) {
    // changes active page of pagination
    // for both cases when search is true
    // and when search is false
    if (this.state.searchCondition)
      this.setState({
        activeSearchPage: eventKey
      });
    else
      this.setState({
        activePage: eventKey
      });
  }


  handleClick(columnKey) {
    // rerender if sorting is true
    this.setState({
      columnSortType: []
    });

    // checks whether columnSort is empty
    var condition = false;

    // variables for column sorting
    var columnSort = this.state.columnSort,
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
        if (typeof(data[0][columnKey]) == 'string'
        || typeof(data[0][columnKey]) == 'number') {
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
      if (columnSortType.customSort) {
        customSort(data, columnSortType);
      } else {
        sortData(data, columnSortType);
      }
    }
  }

}

export default ZTable;
