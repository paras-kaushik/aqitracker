import React from "react";
import { Container, Table } from "reactstrap";
import "../assets/App.css";
export default class App extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      socketObject: null,
      data: [],
    };
  }
  componentDidMount() {
    this.connect();
  }
  pollingInterval = 1000;
  URL = `ws://city-ws.herokuapp.com/`;
  connect = () => {
    var socketObject = new WebSocket(this.URL);
    var connectInterval;
    let thisref = this;

    socketObject.onopen = () => {
      this.setState({ socketObject });
      thisref.pollingInterval = 1000;
      clearTimeout(connectInterval);
    };
    socketObject.onmessage = (e) => {
      const live_data = JSON.parse(e.data);
      var { data } = this.state;
      const currentTime = new Date();

      live_data.forEach((liveObj, index) => {
        let row = data.filter((obj) => obj.city === liveObj.city)[0];
        /*For each object in live data we check if there exists its entry in data  */
        liveObj.updatedAt = currentTime;

        if (row) {
          // liveObj data city already had an entry aginst it
          row.aqi = liveObj.aqi;
          row.updatedAt = liveObj.updatedAt;
        } else {
          data.push(liveObj);
        }
      });
      data.sort((a, b) => b.aqi - a.aqi);
      this.setState({ data });
    };
    socketObject.onclose = (e) => {
      let pi = thisref.pollingInterval;
      pi *= 2;
      connectInterval = setTimeout(() => {
        const { socketObject } = this.state;
        if (!socketObject || socketObject.readyState === WebSocket.CLOSED)
          this.connect();
      }, Math.min(10000, pi));
    };
    socketObject.onerror = (err) => {
      console.error(
        "Socket encountered error: ",
        err.message,
        "Closing socket"
      );
      socketObject.close();
    };
  };

  getColorAccordingToAqi = (aqi) => {
    var className;
    switch (true) {
      case aqi <= 50:
        className = "good";
        break;
      case aqi <= 100:
        className = "satisfactory";
        break;
      case aqi <= 200:
        className = "moderate";
        break;
      case aqi <= 300:
        className = "poor";
        break;
      case aqi <= 400:
        className = "very-poor";
        break;
      default:
        className = "severe";
    }
    return `primary-text ${className}`;
  };

  getUpdatedAt = (obj) => {
    const currentTime = new Date();
    // current timestamps
    const currentHour = currentTime.getHours();
    const currentMinute = currentTime.getMinutes();
    const currentSecond = currentTime.getSeconds();
    //object data time stamps
    const objectDataHour = obj.updatedAt.getHours();
    const objectDataMinute = obj.updatedAt.getMinutes();
    const objectDataSecond = obj.updatedAt.getSeconds();
    var updatedAt;
    switch (
      true // switch case on expressions rather than values
    ) {
      case currentHour !== objectDataHour:
        updatedAt = `${obj.updatedAt.getHours()}:00`;
        break;
      case objectDataMinute !== currentMinute &&
        objectDataMinute + 1 !== currentMinute:
        updatedAt = "Few minutes ago";
        break;
      case objectDataMinute + 1 === currentMinute ||
        currentSecond > 30 + objectDataSecond:
        updatedAt = "A minute ago";
        break;
      case objectDataSecond === currentSecond:
        updatedAt = "Just now";
        break;
      case objectDataSecond - 10 < currentSecond < objectDataSecond + 10:
        updatedAt = "few seconds ago";
        break;
      default:
        updatedAt = "A Day ago";
    }
    return updatedAt;
  };

  render() {
    let { data } = this.state;
    return (
      <Container className="mt-3 p-4">
        <Table className="align-items-center" responsive bordered hover>
          <thead>
            <tr>
              <th className="text-center spaced-text">City</th>
              <th className="text-center spaced-text">Current AQI</th>
              <th className="text-center spaced-text">Last Updated</th>
            </tr>
          </thead>
          <tbody>
            {data.map((obj, index) => (
              <tr>
                <th className="text-center spaced-text">{obj.city}</th>
                <td
                  className={
                    this.getColorAccordingToAqi(obj.aqi) + " spaced-text"
                  }
                >
                  {obj.aqi.toFixed(2)}
                </td>
                <td className="text-center spaced-text">
                  {this.getUpdatedAt(obj)}
                </td>
              </tr>
            ))}
            {data.length === 0 ? (
              <tr>
                <td colSpan="3" className="p-4 text-center">
                  No data available
                </td>
              </tr>
            ) : null}
          </tbody>
        </Table>
      </Container>
    );
  }
}
