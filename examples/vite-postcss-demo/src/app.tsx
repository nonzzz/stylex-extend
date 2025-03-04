import { injectGlobalStyle } from '@stylex-extend/core'
import React, { useState } from 'react'
import { Aliases } from '~/component/aliases'
import { colors } from '~/themes/colors.stylex'

injectGlobalStyle({
  body: {
    margin: 0,
    border: '1px solid pink',
    backgroundColor: colors.gray
  }
})

interface ButtonProps {
  color: string
  onClick: () => void
}

function Button(props: React.PropsWithChildren<ButtonProps>) {
  return <div onClick={props.onClick} stylex={{ color: props.color, fontSize: '15px' }}>{props.children}</div>
}

export function App() {
  const [color, setColor] = useState('red')

  return (
    <div>
      <div>
        With macro
        <p stylex={{ fontSize: '30px' }}>
          <span stylex={{ color: colors.blue }}>Blue</span>
          <span stylex={{ color: 'yellow' }}>Green</span>
        </p>
      </div>
      <Aliases />
      <Button color={color} onClick={() => setColor((pre) => pre === 'red' ? 'blue' : 'red')}>Action</Button>
    </div>
  )
}
