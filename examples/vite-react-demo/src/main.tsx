import { id } from '@stylex-extend/core'
import * as stylex from '@stylexjs/stylex'
import React, { useState } from 'react'
import ReactDOM from 'react-dom/client'
import 'virtual:stylex.css'

interface ButtonProps {
  color: string
  onClick: () => void
}

const myId = id()
const myId2 = id(true)

const basic = stylex.create({
  base: {
    [myId]: {
      default: 'green',
      ':hover': 'purple'
    }
  },
  font: {
    [myId]: {
      default: '20px'
    }
  }
})

function Button(props: React.PropsWithChildren<ButtonProps>) {
  return <div onClick={props.onClick} stylex={{ color: props.color, fontSize: '15px' }}>{props.children}</div>
}

export function App() {
  const [color, setColor] = useState('red')

  return (
    <div>
      <div>
        This is a Base Case
        <p {...stylex.props(basic.base)}>
          <span stylex={{ color: myId }}>Green Text</span>
          <span {...stylex.props(basic.font)}>
            <span stylex={{ fontSize: myId, marginLeft: '6px' }}>Large Font</span>
          </span>
        </p>
      </div>
      <div>
        With macro
        <p stylex={{ [myId2]: { default: '30px' } }}>
          <span stylex={{ fontSize: myId2 }}>Text</span>
          <span stylex={{ [myId2]: { default: 'purple' } }}>
            <span stylex={{ color: myId2, [myId2]: { default: 'green' } }}>Purple</span>
            <span stylex={{ color: myId2 }}>Green</span>
          </span>
        </p>
      </div>
      <Button color={color} onClick={() => setColor((pre) => pre === 'red' ? 'blue' : 'red')}>Action</Button>
    </div>
  )
}

ReactDOM.createRoot(document.querySelector('#app')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
