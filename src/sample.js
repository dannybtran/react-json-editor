import React from 'react'
import { render } from 'react-dom'
import JsonEditor from '../lib/json_editor.js'

const json = {"hello":"world"}

class App extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      rawMode: true,
      editorJson: json
    }
  }

  render() {
    return (
      <div>
        <nav>
          <a key="raw" href="#" className={this.state.rawMode ? "selected": ""}
              onClick={() => {
                this.setState({
                  rawMode: true,
                  editorJson: JSON.parse(document.getElementById('rawJson').value)
                })
              }}>Raw</a>
          <a key="editor" href="#" className={this.state.rawMode ? "": "selected"}
              onClick={() => {
                this.setState({
                  rawMode: false,
                  editorJson: JSON.parse(document.getElementById('rawJson').value)
                })
              }}>Editor</a>
        </nav>
        <textarea id="rawJson"
            onChange={(e) => {
              let newJson
              try {
                 newJson = JSON.parse(e.target.value);
              } catch (e) {
                alert('invalid json');
                return
              }
              this.setState({editorJson: newJson})
            }}
            style={{"display":this.state.rawMode ? "block" : "none"}}
            defaultValue={JSON.stringify(this.state.editorJson, null, '\t')}></textarea>
        <JsonEditor key="jsonEditor"
            onChange={(editorJson) => {
              document.getElementById('rawJson').value = JSON.stringify(editorJson, null, '\t')
            }}
            style={{"display":this.state.rawMode ? "none" : "block"}}
            json={this.state.editorJson}/>
      </div>
    )
  }
}

render(
  <App />,
  document.getElementById('root')
)
