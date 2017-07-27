import React from 'react';
import { Table, Pagination } from 'react-bootstrap';
import { Button, HelpBlock } from 'react-bootstrap';

export default class ReactiveTable extends React.Component {

    render() {
        let headerComponents = this.props.headerComponents,
          rowComponents = this.props.rowComponents,
          per_page = this.props.per_page,
          pages = this.props.pages,
          current_page = this.props.current_page,
          pageChange = this.props.pageChange,
          dataLength = this.props.dataLength,
          searchCondition = this.props.searchCondition;

          let tableKlass = "table table-bordered-bottom table-condensed table-hover";

        if (this.props.bPaginate != undefined
          && this.props.bPaginate != null) {
          if (this.props.bPaginate) {

            var pagination = (
              <Pagination className = "users-pagination pull-right"
              bsSize = "medium"
              maxButtons = { 3 }
              first last next prev boundaryLinks
              items = { pages }
              activePage = { current_page }
              onSelect = { pageChange } />);
            }
            else {
              var pagination = undefined;
            }
          } else {
            var pagination = (
              <Pagination className = "users-pagination pull-right"
              bsSize = "medium"
              maxButtons = { 3 }
              first last next prev boundaryLinks
              items = { pages }
              activePage = { current_page }
              onSelect = { pageChange }/>);
            }
            if ((dataLength == 0 || dataLength <= per_page) && !searchCondition) {
              var helpBlock = undefined;
            } else {
              var helpBlock = (
                <HelpBlock> Found { dataLength } result(s) </HelpBlock>);
              }
              return (
                <div>
                  <table className = { tableKlass }>
                  <thead> { headerComponents } </thead>
                    <tbody> { rowComponents }
                    </tbody>
                  </table>
                { pagination }
                { helpBlock }
                </div>);
              }
            }
