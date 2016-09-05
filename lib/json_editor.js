import React from 'react'

const _ID     = '__~id~__'
const _KEY    = '__~key~__'
const _PARENT = '__~parent~__'
const _VALUE  = '__~value~__'
const _TYPE   = '__~type~__'

let lastKeyId = 0
const nextId = () => {
  return "simple-cms-" + lastKeyId++
}

let keyInc = 0
const nextKey = () => {
  return "key-" + keyInc++
}

const newValue = (parent, index) => {
  index = index || nextKey()
  return {
    [_ID]: nextId(),
    [_KEY]: index,
    [_PARENT]: parent,
    [_VALUE]: 'value',
    [_TYPE]: 'string'
  }
}

const TypeSelect = ({ type, onChange }) => {
  const map = {
    'object': 'Object',
    'array': 'Array',
    'string': 'String',
    'number': 'Number',
    'null': 'Null'
  }
  return (
    <select defaultValue={map[type]} onChange={onChange}>
      <option>Object</option>
      <option>Array</option>
      <option>String</option>
      <option>Number</option>
      <option>Null</option>
    </select>
  )
}

const notify = (msg) => {
  alert(msg)
}

class JsonEditor extends React.Component {
  constructor(props) {
    super(props)
    this.changeTimeout = 0
    this.state = {
      json: this.recurseFormat(props.json || {})
    }
  }

  updateJson(newJson) {
    this.setState({json: newJson})
    this.props.onChange(this.recurseUnformat(newJson))
  }

  componentWillReceiveProps(props) {
    this.setState({json: this.recurseFormat(props.json)})
  }

  recurseFormat(json, key, parent_id, depth) {
    depth = depth || 0
    if (json instanceof Array) {
      let id = nextId()
      return {
        [_ID]: id,
        [_TYPE]: 'array',
        [_KEY]: depth === 0 ? "root" : key,
        [_PARENT]: parent_id,
        [_VALUE]: json.map((item, i) => {
          return this.recurseFormat(item, i, id, depth + 1)
        })
      }
    } else if (json instanceof Object) {
      let id = nextId()
      return {
        [_ID]: id,
        [_TYPE]: 'object',
        [_KEY]: depth === 0 ? "root" : key,
        [_PARENT]: parent_id,
        [_VALUE]: Object.keys(json).map(k => {
           return this.recurseFormat(json[k], k, id, depth + 1)
         })
      }
    } else if (key !== undefined) {
      let type
      if (json === null || json === undefined) {
        type = 'null'
        json = null
      } else if (typeof(json) === 'string') {
        type = 'string'
      } else if (typeof(json) === 'number') {
        type = 'number'
        json = isNaN(json) ? 0 : json
      }
      return {
        [_ID]: nextId(),
        [_KEY]: key,
        [_PARENT]: parent_id,
        [_TYPE]: type,
        [_VALUE]: json
      }
    } else {
      return json
    }
  }

  recurseUnformat(json, parentType) {
    if (json === null) { return json }
    if (json[_TYPE] == 'array') {
      return json[_VALUE].map(item => {
        return this.recurseUnformat(item, 'array')
      })
    } else if (json[_TYPE] == 'object') {
      return json[_VALUE].reduce((memo, v, i, arr) => {
        memo[v[_KEY]] = this.recurseUnformat(v[_VALUE], v[_TYPE])
        return memo
      }, {})
    } else {
      if (json instanceof Array) {
        if (parentType == 'array') {
          return json.map(item => {
            return this.recurseUnformat(item)
          })
        } else {
          return json.reduce((memo, v, i, arr) => {
            memo[v[_KEY]] = this.recurseUnformat(v[_VALUE], v[_TYPE])
            return memo
          }, {})
        }
      } else {
        if (json instanceof Object) {
          return json[_VALUE]
        }
        return json
      }
    }
  }

  recurseFind(id, json) {
    let result
    if (json instanceof Array) {
      for(let i = 0; i < json.length; i++) {
        let item = json[i]
        if (item[_ID] == id) { return item }
        result = this.recurseFind(id, item[_VALUE])
        if (result) { return result }
      }
    } else if (json) {
      if (json[_ID] == id) { return json }
      result = this.recurseFind(id, json[_VALUE])
      return result
    }
    return false
  }

  throttle(fn, time) {

  }

  handleKeyChange(value, id) {
    let whole = this.state.json
    let object = this.recurseFind(id, whole)
    object[_KEY] = value
    this.updateJson(whole)
  }

  handleValueChange(e, id) {
    clearTimeout(this.changeTimeout)
    e.persist()
    this.changeTimeout = setTimeout(() => {
      let whole = this.state.json
      let object = this.recurseFind(id, whole)
      let value = e.target.value
      switch(object[_TYPE]) {
        case 'number':
          if (isNaN(value) || value === null || value === "") {
            notify("sorry, a number must be a number!")
            value = 0
          } else {
            value = parseFloat(value)
          }
          break;
        case 'string':
          value = String(value)
          break;
        case 'null':
          value = null
          break;
      }
      e.target.value = value
      object[_VALUE] = value
      this.updateJson(whole)
    }, 300)
  }

  addRoot() {
    let json = this.state.json
    json[_VALUE].push(newValue(json[_ID]))
    this.updateJson(json)
  }

  addKey(id) {
    let whole = this.state.json
    let object = this.recurseFind(id, whole)
    if (object[_TYPE] == 'object') {
      object[_VALUE].push(newValue(object[_ID]))
    } else {
      object[_VALUE] = object[_VALUE].map((item,i) => {
        item[_KEY] = i
        return item
      })
      object[_VALUE].push(newValue(object[_ID], object[_VALUE].length))
    }
    this.updateJson(whole)
  }

  removeValue(id) {
    let whole = this.state.json
    let object = this.recurseFind(id, whole)
    let parent = this.recurseFind(object[_PARENT], whole)
    let value = parent[_VALUE]
    value.splice(value.indexOf(object), 1)
    if (parent[_TYPE] == 'array') {
      parent[_VALUE] = parent[_VALUE].map((item,i) => {
        item[_KEY] = i
        return item
      })
    }
    this.updateJson(whole)
  }

  changeType(e, id) {
    let whole = this.state.json
    let object = this.recurseFind(id, whole)
    if (e.target.value == 'Object') {
      if (['string', 'number', 'null'].indexOf(object[_TYPE]) > -1) {
        object[_VALUE] = [{
          [_ID]:nextId(),
          [_VALUE]: object[_VALUE],
          [_TYPE]: object[_TYPE],
          [_PARENT]: object[_ID],
          [_KEY]: 0
        }]
      } else if (object[_TYPE] == 'array') {
        object[_VALUE] = object[_VALUE].map(item => {
          item[_KEY] = String("key-" + item[_KEY])
          return item
        })
      }
      object[_TYPE] = 'object'
    } else if (e.target.value == 'Array') {
      if (object[_TYPE] == 'object') {
        object[_VALUE] = object[_VALUE].map((item, i) => {
          item[_KEY] = i
          return item
        })
      } else if (['string', 'number', 'null'].indexOf(object[_TYPE]) > -1) {
        object[_VALUE] = [{
          [_ID]:nextId(),
          [_VALUE]: object[_VALUE],
          [_TYPE]: object[_TYPE],
          [_PARENT]: object[_ID],
          [_KEY]: 0
        }]
      }
      object[_TYPE] = "array"
    } else if (e.target.value == "String") {
      object[_TYPE] = "string"
      object[_VALUE] = String(object[_VALUE])
    } else if (e.target.value == "Number") {
      object[_TYPE] = "number"
      object[_VALUE] = isNaN(parseFloat(object[_VALUE])) ? 0 : parseFloat(object[_VALUE])
    } else if (e.target.value == "Null") {
      object[_TYPE] = "null"
      object[_VALUE] = null
    }
    this.updateJson(whole)
  }

  recurse(data, showKey) {
    showKey = showKey === undefined ? true : showKey

    if (data[_KEY] === "root") {
      return (
        <table key={data[_ID]}>
          <tbody>
            {data[_VALUE].map((datum, i) => {
              return this.recurse(datum)
            })}
            <tr className="bottomBar">
              <td>
                <a href="#" onClick={() => { this.addRoot() }} className="addChild">+</a>
              </td>
            </tr>
          </tbody>
        </table>
      )
    } else if (data[_VALUE] instanceof Array) {
      if (showKey) {
        return (
          <tr key={data[_ID]}>
            <td>
              <input key={"key-"+data[_TYPE]} type="text" onChange={(e) => { this.handleKeyChange(e.target.value, data[_ID]) }} defaultValue={data[_KEY]} />
              <TypeSelect type={data[_TYPE]} onChange={(e) => {this.changeType(e, data[_ID])}} />
              <a href="#" onClick={() => { this.removeValue(data[_ID]) }} className="remove">x</a>
              :
            </td>
            <td>
              <table>
                <tbody>
                  {data[_VALUE].map((datum, i) => {
                    return this.recurse(datum, data[_TYPE] !== 'array')
                  })}
                  <tr className="bottomBar">
                    <td>
                      <a href="#" onClick={() => { this.addKey(data[_ID]) }} className="addChild">+</a>
                    </td>
                  </tr>
                </tbody>
              </table>
            </td>
          </tr>
        )
      } else {
        return (
          <tr key={data[_ID]}>
            <td className="arrayIndex">
              {data[_KEY]}
            </td>
            <td>
              <table>
                <tbody>
                  {data[_VALUE].map((datum, i) => {
                    return this.recurse(datum, data[_TYPE] !== 'array')
                  })}
                  <tr className="bottomBar">
                    <td>
                      <a href="#" onClick={() => { this.addKey(data[_ID]) }} className="addChild">+</a>
                      <a href="#" onClick={() => { this.removeValue(data[_ID]) }} className="remove">x</a>
                      <TypeSelect type={data[_TYPE]} onChange={(e) => {this.changeType(e, data[_ID])}} />
                    </td>
                  </tr>
                </tbody>
              </table>
            </td>
          </tr>
        )
      }
    } else {
      if (showKey) {
        if (data[_TYPE] == "null") {
          return (
            <tr key={[data[_ID],data[_TYPE]].join('-')}>
              <td>
                <input key={"key-"+data[_TYPE]} type="text" onChange={(e) => { this.handleKeyChange(e.target.value, data[_ID]) }} defaultValue={data[_KEY]} />
                :
              </td>
              <td>
                <TypeSelect type={data[_TYPE]} onChange={(e) => {this.changeType(e, data[_ID])}} />
                <a href="#" onClick={() => { this.removeValue(data[_ID]) }} className="remove">x</a>
              </td>
            </tr>
          )
        } else {
          return (
            <tr key={[data[_ID],data[_TYPE]].join('-')}>
              <td>
                <input key={"key-"+data[_TYPE]} type="text" onChange={(e) => { this.handleKeyChange(e.target.value, data[_ID]) }} defaultValue={data[_KEY]} />
                :
              </td>
              <td>
                <input key={"value-"+data[_TYPE]} type="text" onChange={(e) => { this.handleValueChange(e, data[_ID]) }} defaultValue={data[_VALUE]} />
                <TypeSelect type={data[_TYPE]} onChange={(e) => {this.changeType(e, data[_ID])}} />
                <a href="#" onClick={() => { this.removeValue(data[_ID]) }} className="remove">x</a>
              </td>
            </tr>
          )
        }
      } else {
        if (data[_TYPE] == "null") {
          return (
            <tr key={data[_ID]}>
              <td className="arrayIndex">
                {data[_KEY]}
              </td>
              <td>
                <TypeSelect type={data[_TYPE]} onChange={(e) => {this.changeType(e, data[_ID])}} />
                <a href="#" onClick={() => { this.removeValue(data[_ID]) }} className="remove">x</a>
              </td>
            </tr>
          )
        } else {
          return (
            <tr key={data[_ID]}>
              <td className="arrayIndex">
                {data[_KEY]}
              </td>
              <td>
                <input key={"value-"+data[_TYPE]} type="text" onChange={(e) => { this.handleValueChange(e, data[_ID]) }} defaultValue={data[_VALUE]} />
                <TypeSelect type={data[_TYPE]} onChange={(e) => {this.changeType(e, data[_ID])}} />
                <a href="#" onClick={() => { this.removeValue(data[_ID]) }} className="remove">x</a>
              </td>
            </tr>
          )
        }
      }
    }
  }

  render() {
    return (
      <div style={this.props.style}>
        <div>
          {this.recurse(this.state.json)}
        </div>
        {/*<pre>{JSON.stringify(this.state.json,null,'\t')}</pre>*/}
      </div>
    )
  }
}

export default JsonEditor
