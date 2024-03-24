import type { PluginObj } from '@babel/core'
import { name } from '../package.json'

export default function declare(): PluginObj {
  return {
    name,
    visitor: {
        
    }
  }
}
