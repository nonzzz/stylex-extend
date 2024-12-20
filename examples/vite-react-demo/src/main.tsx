import { inline } from '@stylex-extend/core'
import * as stylex from '@stylexjs/stylex'
import React, { useState } from 'react'
import ReactDOM from 'react-dom/client'
import 'virtual:stylex.css'

interface ButtonProps {
  color: string
  onClick: () => void
}

stylex.props(inline({ color: 'red' }))

function Button(props: React.PropsWithChildren<ButtonProps>) {
  return <div onClick={props.onClick} stylex={{ color: props.color, fontSize: '15px' }}>{props.children}</div>
}

function App() {
  const [color, setColor] = useState('red')

  return (
    <div>
      <Button color={color} onClick={() => setColor((pre) => pre === 'red' ? 'blue' : 'red')}>Action</Button>
    </div>
  )
}

ReactDOM.createRoot(document.querySelector('#app')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
