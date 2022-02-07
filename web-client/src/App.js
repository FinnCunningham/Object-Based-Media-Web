import React from 'react';
import './App.css';

function App() {
  const [data, setData] = React.useState(null);

  React.useEffect(() => {
    // fetch("/api")
    // .then((res) => res.json())
    // .then((data) => setData(data.message));

    fetch("/data")
    .then((response) => response.json())
    .then((data) => setData(data.message));
  })
  return (
    <div className="App">
      <header className="app-header">
      <p>{!data ? "Loading..." : data}</p>
      <p>Woah</p>
      </header>
    </div>
  );
}

export default App;
