import { h, Component } from "preact";
import Table from '../table/table'
import Header from  '../header/header'

export default class App extends Component {
  render(props) {
    return (
      <div>
        <Header />
        <Table blacklist={props.blacklist}/>
      </div>
    );
  }
}
