import React, { Component, PropTypes } from 'react';
import { connect } from 'react-redux';
import { Cell, Column, ColumnGroup, Table } from 'fixed-data-table';
import '../../../node_modules/fixed-data-table/dist/fixed-data-table.css';
import _ from 'lodash';

@connect(
    state => ({rows: state.rows, cols: state.cols || new Array(10)})
)

export default class App extends Component {

  constructor(props) {
    super(props);
    this.state = {
      rows: [],
      prevRows: [],
      cols: new Array(10)
    };
    this.onSnapshotReceived = this.onSnapshotReceived.bind(this);
    this.onUpdateReceived = this.onUpdateReceived.bind(this);
    this._cell = this._cell.bind(this);
    this._headerCell = this._headerCell.bind(this);
    this._generateCols = this._generateCols.bind(this);
    this.throttleData = this.throttleData.bind(this);
    this.handleConnect = this.handleConnect.bind(this);
  }

  // throttleData returns a function that is executed <= 2 times a sec
  throttleData = _.throttle(this.onUpdateReceived, 5000);

  handleConnect() {

    if(socket.connected){
      socket.disconnect();
    }else{
      console.log('connect socket', socket)
      socket.connect();
    }

  };

  onSnapshotReceived(data) {
    let rows = [];
    data.forEach(row => {
      rows[row.id] = row;
    });
    // const rows = this.state.rows.concat(data);
    console.log('snapshot' + rows);
    const cols = Object.keys(rows[0]);
    this.setState({rows, cols});
  };

  onUpdateReceived(data) {
    // const rows = this.state.rows.concat(data);
    console.log('updated received.............')
    let rows = this.state.rows;

    data.forEach(newRow => {

      const id = newRow.id;
      const oldRow = rows.filter( row => row.id === id )[0];
      const keys = Object.keys( oldRow );

      keys.forEach( key => {
        if( key !== 'id' ){
          let newKey = key + '-color';
          if( Number(newRow[key]) > Number(oldRow[key]) ){
            newRow[newKey] = 'green';
          }else if( Number(newRow[key]) < Number(oldRow[key]) ){
            newRow[newKey] = 'red';
          }else{
            newRow[newKey] = '';
          }
        }
      });

      rows[newRow.id] = newRow;

    });

    this.setState({rows});
  };

  _cell(cellProps) {
    const rowIndex = cellProps.rowIndex;
    const rowData = this.state.rows[rowIndex];
    const col = this.state.cols[cellProps.columnKey];
    const content = rowData[col];
    let customColor = '';

    if( cellProps.columnKey !== 0 ){
      let rows = this.state.rows;
      let key = col + '-color';
      customColor = rows[cellProps.rowIndex][key];
    }

    return (
      <Cell style = {{ 'backgroundColor': customColor }}>{content}</Cell>
    );
  }

  _headerCell(cellProps) {
    const col = this.state.cols[cellProps.columnKey];
    return (
      <Cell>{col}</Cell>
    );
  }

  _generateCols() {
    let cols = [];
    this.state.cols.forEach((row, index) => {
      cols.push(
        <Column
          width={100}
          flexGrow={1}
          cell={this._cell}
          header={this._headerCell}
          columnKey={index}
          />
      );
    });
    console.log(cols);
    return cols;
  };

  componentDidMount() {
    if (socket) {
      socket.on('snapshot', this.onSnapshotReceived);
      // adding throttling of the data
      socket.on('updates', this.throttleData);
      // socket.on('updates', this.onUpdateReceived);
    }
  };

  componentWillUnmount() {
    if (socket) {
      socket.removeListener('snapshot', this.onSnapshotReceived);
      socket.removeListener('updates', this.onUpdateReceived);
    }
  };

  render() {

    const columns = this._generateCols();
    return (
      <div>
      <button className='btn btn-danger' onClick = { this.handleConnect }>Connect/Disconnect</button>
      <Table
        rowHeight={30}
        width={window.innerWidth}
        maxHeight={window.innerHeight}
        headerHeight={35}
        rowsCount={this.state.rows.length}
        >
        {columns}
      </Table>
      </div>
    );
  }
}
