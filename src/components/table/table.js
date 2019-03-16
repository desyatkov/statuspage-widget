import { h, render, Component } from "preact";
import dayjs from 'dayjs';
import axios from 'axios';
import shortid from 'shortid';
import {filter, some}  from 'lodash';
import cx from 'classnames';
// @ts-ignore
import cls from "./style.scss";

const API_HOST = process.env.NODE_ENV !== 'production' ? 'https://s3.amazonaws.com/status-ni-temp/index.json' : '/index.json';
const PAGEID = '8j8cgh0rb4yx';
const API_KEY = process.env.PREACT_APP_SECRET_CODE;
const API_INCEDENT_PROD = `https://8j8cgh0rb4yx.statuspage.io/api/v2/incidents/unresolved.json`
const API_INCEDENT_DEV = `https://api.statuspage.io/v1/pages/${PAGEID}/incidents/unresolved?api_key=08599542-e735-445c-bc2b-b346e329387c`;
const API_INCEDENT = process.env.NODE_ENV !== 'production' ? API_INCEDENT_DEV : API_INCEDENT_DEV;

const Tooltip = (source) => {
    const { data, date } = source;
    if (data.length === 0) return <div className={cls['empty']}></div>

    const checkStatusAndDate = (data, isbefore) => {
        const validation = filter(data, (o)=>{
            let isBeforeCurentDate;
            if(isbefore) {
                isBeforeCurentDate = dayjs(o.created_at).isBefore(date.date, 'date');
            } else {
                isBeforeCurentDate = dayjs(o.created_at).isSame(date.date, 'date');
            }
            return o.status != 'completed' && o.status != 'resolved' && isBeforeCurentDate; 
        });
        return !!validation.length;
    }

    const clasesForIcon = [
        cls.incedent,
        { [cls.activeOutdated]: checkStatusAndDate(data, true) },
        { [cls.activeCurrent]:  checkStatusAndDate(data, false) }
    ];

    return (
        <div className={cls['incedent_elem_main']}>
            <div className={cx(clasesForIcon)}></div>
            <div className={cls["incedent_elem_wrap"]}>
                <ul className={cls["incedent_elem_list"]} >
                    {data.map(incedent=>{
                        const isOutdated = dayjs(incedent.created_at).isBefore(date.date, 'date');
                        return (
                            <li key={shortid.generate()}>
                                <div className={cls["incedent_elem_list__name"]}><strong>{incedent.name}</strong></div>
                                <div className={cx([cls.incedentBox, cls.dateTooltip, {[cls.dateTooltipOutdated]: isOutdated}])}>Created: {dayjs(incedent.created_at).format('DD/MMMM')}</div>
                                <div className={cx([cls.incedentBox,cls[incedent.impact]])}>Impact: {incedent.impact}</div>
                                <div className={cx([cls.incedentBox, cls[incedent.status]])}>Status: {incedent.status}</div>
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
}

const Legend = () => {
    return (
        <div className={cls.legend}>
            <div className={cls.legendItem}>
                <div className={cls.empty}></div>
                <div>Service Healthy</div>
            </div>
            <div className={cls.legendItem}>
                <div className={cls.incedent}></div>
                <div>Incidents Complited</div>
            </div>
            <div className={cls.legendItem}>
                <div className={cx([cls.incedent,cls.activeOutdated])}></div>
                <div>Outdated Incidents</div>
            </div>
            <div className={cls.legendItem}>
                <div className={cx([cls.incedent,cls.activeCurrent])}></div>
                <div>Daily Active Incidents</div>
            </div>
        </div>
    )
}

export default class Table extends Component {
    constructor(props) {
        super(props);

        const blacklist = props.blacklist.map(item=>item.toLowerCase().trim())

        this.state = {
            rows: [],
            rowHeaders: {},
            incidents: {},
            blacklist: blacklist,
            incedentResponse: [],
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

        axios.all([axios.get(API_HOST), axios.get(API_INCEDENT)])
            .then(axios.spread( (response, unresolvedResponse) => {
                const {components, incidents} = response.data;
                const unresolvedIncident = unresolvedResponse.data;

                const mergedIncedents = incidents.concat(unresolvedIncident)
                const filerTo = id => {   
                    return objectDates.map((date) => {
                        return filter(mergedIncedents, function(incedent) { 
                            const incedentDate = dayjs(incedent.created_at)
                            const arrayDate = date.date
                            const groupid = some(incedent.components, { 'group_id': id });

                            return (
                                arrayDate.isSame(incedentDate, 'date') || (arrayDate.isAfter(incedentDate, 'date') && incedent.status !== 'completed' && incedent.status !== 'resolved' ) ) && groupid; 
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
                    incidents: response.data.incidents.concat(unresolvedResponse.data),
                    rows: rows,
                    unresolvedResponse: unresolvedResponse.data
                })
            }).bind(this))
            .catch(function (error) {
                console.log(error)
            })
    }

    
    
    render() {
        const { rowHeaders, rows } = this.state;

        if (!rowHeaders.length) { return <p>Loading...</p>; }
        return (
            <div>
                <Legend />
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
                                    
                                    {row.incedents.map( (element, index) =>{
                                        return (
                                            <td key={shortid.generate()}>
                                                <div className={cls["incedent_elem"]}>
                                                    { <Tooltip data={element} date={this.state.headers[index]}/> }
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