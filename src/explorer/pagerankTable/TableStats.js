import React from "react";

export class TableStats extends React.PureComponent {
  render() {
    const {topLevelFilter, adapters} = this.props;

    const names = new Map();

    for (const adapter of adapters.adapters()) {
      for (const type of adapter.static().declaration().nodeTypes) {
        names.set(type.prefix, type.name);
      }
    }

    const filter = names.get(topLevelFilter);

    return (
      <div style={{display: "flex", justifyContent: "space-between"}}>
        <div
          style={{
            width: "45%",
            backgroundColor: "red",
          }}
        >
          <CurrentNodeStats filter={filter} />
        </div>
        <div
          style={{
            width: "45%",
            backgroundColor: "blue",
          }}
        >
          <AllNodeStats />
        </div>
      </div>
    );
  }
}

class CurrentNodeStats extends React.PureComponent {
  render() {
    const {filter} = this.props;
    return (
      <React.Fragment>
        <p>{filter} stats</p>
        <ul>
          <li>stat one</li>
        </ul>
      </React.Fragment>
    );
  }
}

class AllNodeStats extends React.PureComponent {
  render() {
    return (
      <React.Fragment>
        <p>Graph Stats</p>
        <ul>
          <li>stat one</li>
        </ul>
      </React.Fragment>
    );
  }
}
