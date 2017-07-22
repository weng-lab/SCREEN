import React from 'react';
import { Table, Pagination } from 'react-bootstrap';
import { Button, HelpBlock } from 'react-bootstrap';

export default class ReactiveTable extends React.Component {

    render() {
        let headerComponents = this.props.headerComponents,
          rowComponents = this.props.rowComponents,
          pages = this.props.pages,
          current_page = this.props.current_page,
          pageChange = this.props.pageChange,
          dataLength = this.props.dataLength;

        return (
          <div>
          <Table>
            <thead>{headerComponents}</thead>
            <tbody>{rowComponents}</tbody>
          </Table>
          <Pagination className = "users-pagination pull-right"
            bsSize = "medium"
            maxButtons = { 3 }
            first last next prev boundaryLinks
            items = { pages }
            activePage = { current_page }
            onSelect = { pageChange }/>

            <HelpBlock> Found { dataLength } result(s) < /HelpBlock>
            </div>);
          }
}
