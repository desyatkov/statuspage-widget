import { h, render, Component } from "preact";
import dayjs from 'dayjs';
import axios from 'axios';
import shortid from 'shortid';
import {filter, some}  from 'lodash';
import cls from "./style.scss";
import mock from './index.json';

async function apiHost() {
    if (process.env.NODE_ENV !== 'production') {
        return mock
    } else {
        return axios.get('/index.json');
    }
}

const Tooltip = (data) => {
    const source = data.data;
    if (source.length === 0) return <div className={cls['empty']}></div>
    const status1 = some(source, {'status': 'completed'} );
    const status2 = some(source, {'status': 'resolved' } );
    let classNames = [cls['incedent']]
    if (!(status1 || status2)) classNames.push(cls['active'])

    return (
        <div className={cls['incedent_elem_main']}>
            <div className={classNames.join(" ")}></div>
            <div className={cls["incedent_elem_wrap"]}>
                <ul className={cls["incedent_elem_list"]} >
                    {source.map(incedent=>{
                        return (
                            <li key={shortid.generate()}>
                                <div className={cls["incedent_elem_list__name"]}><strong>{incedent.name}</strong></div>
                                <div>Created: {dayjs(incedent.created_at).format('DD/MMMM')}</div>
                                <div className={cls[incedent.impact]}>Impact: {incedent.impact}</div>
                                <div className={cls[incedent.status]}>Status: {incedent.status}</div>
                                <div>
                                    <a href={incedent.shortlink}>Incident Link</a>
                                </div>
                            </li>
                        )
                    })}
                </ul>
            </div>
        </div>
    )
};

export default class Table extends Component {

    constructor(props) {
        super(props);

        const blacklist = props.blacklist.map(item=>item.toLowerCase().trim())

        this.state = {
            rows: [],
            rowHeaders: {},
            incidents: {},
            blacklist: blacklist
        }
    }

    componentDidMount() {
        let objectDates = []
        for(let i=0; i<=5; i++){
            let startdate = dayjs().subtract(i, "day");
            objectDates.push({
                id: shortid.generate(),
                date: startdate,
                dateFormated: startdate.format('DD/MM')
            })
        }
        objectDates.reverse()

        this.setState({
            headers: objectDates
        });

        apiHost()
            .then(function (response) {
                const {components, incidents} = response.data;


                const filerTo = id => {
                    return objectDates.map((date) => {
                        return filter(incidents, function(incedent) {
                            const incedentDate = dayjs(incedent.created_at)
                            const arrayDate = date.date

                            const groupid = some(incedent.components, { 'group_id': id });

                            return arrayDate.isSame(incedentDate, 'date') && groupid
                            });
                    })
                };

                const rows = [];

                components.forEach( ({name, id, position}) =>{
                    rows.push({
                        rowName: name,
                        rowId: id,
                        rowPosition: position,
                        incedents: filerTo(id)
                    })
                })

                this.setState({
                    rowHeaders: response.data.components,
                    incidents: response.data.incidents,
                    rows: rows
                })
            }.bind(this))
            .catch(function (error) {
                console.log(error)
            })
    }



    render() {
        const { rowHeaders, rows } = this.state;

        if (!rowHeaders.length) {
            return <p>Loading...</p>;
        }

        return (
            <div>
                <table>
                    <thead>
                        <tr>
                            <td className={cls['service_name']}>Service</td>
                            {this.state.headers.map((item)=>{
                                return (
                                    <td className={cls['service_status']} id={item.id} key={item.id}>
                                        {item.dateFormated}
                                    </td>
                                )
                            })}
                        </tr>
                    </thead>
                    <tbody>
                        {rows.map( (row) => {
                            if(
                                this.state.blacklist.includes(row.rowId.toLowerCase()) || this.state.blacklist.includes(row.rowName.toLowerCase().trim())
                            ) return;
                            return (
                                <tr key={row.rowId} id={row.rowId}>
                                    <td>{row.rowName}</td>

                                    {row.incedents.map( element =>{
                                        return (
                                            <td key={shortid.generate()}>
                                                <div className={cls["incedent_elem"]}>
                                                    { <Tooltip data={element}/> }
                                                </div>
                                            </td>
                                        )
                                    })}
                                </tr>
                            )
                        })}
                    </tbody>
                </table>

                <div className={cls['link-wrap']}>
                    <a href="/history">History page</a>
                </div>
            </div>
        )
    }
}
