import { h, Component } from "preact";
import Table from '../table/table'


export default class App extends Component {
  render(props) {
    return (
      <div>
        <Table blacklist={props.blacklist}/>
      </div>
    );
  }
}
