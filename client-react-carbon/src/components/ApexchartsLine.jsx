import React, { Component } from "react";
import Chart from "react-apexcharts";

class ApexchartsLine extends Component {
  constructor(props) {
    super(props);

    this.state = {
      options: {
        chart: {
          id: "line",
        },
        stroke: {
          curve: "stepline",
        },
        xaxis: {
          type: "datetime",
        },
        legend: {
          showForSingleSeries: true,
          position: "top",
          horizontalAlign: "left",
        },
      },
      series: [
        {
          name: "Cumulative points spent on Todos",
          data: [],
        },
      ],
    };
  }

  componentDidMount() {
    this.setState((state, props) => {
      return props.hassupportdata
        ? {
            series: [
              {
                name: "Cumulative points spent on Todos",
                data: props.jsonchartdata,
              },
              {
                name: "Cumulative points spent in Support",
                data: props.jsonsupportdata,
              },
            ],
          }
        : {
            series: [
              {
                name: "Cumulative points spent on Todos",
                data: props.jsonchartdata,
              },
            ],
          };
    });
  }

  componentDidUpdate(prevProps) {
    if (
      this.props.jsonchartdata !== prevProps.jsonchartdata ||
      (this.props.hassupportdata &&
      this.props.jsonsupportdata !== prevProps.jsonsupportdata)
    ) {
      this.setState((state, props) => {
        return props.hassupportdata
          ? {
              series: [
                {
                  name: "Cumulative points spent on Todos",
                  data: props.jsonchartdata,
                },
                {
                  name: "Cumulative points spent in Support",
                  data: props.jsonsupportdata,
                },
              ],
            }
          : {
              series: [
                {
                  name: "Cumulative points spent on Todos",
                  data: props.jsonchartdata,
                },
              ],
            };
      });
    }
  }

  render() {
    return (
      <Chart
        options={this.state.options}
        series={this.state.series}
        type="line"
        width="100%"
        height="350"
      />
    );
  }
}

export default ApexchartsLine;
