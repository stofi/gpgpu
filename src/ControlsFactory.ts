import * as THREE from 'three'

import type { Schema } from 'leva/src/types'

export type TUniform = {
  [uniform: string]: THREE.IUniform<any>
}

export type TControl =
  | {
      value: number | THREE.Vector2 | THREE.Vector3 | boolean | string
      min?: number
      max?: number
      step?: number
      options?: Record<string, number>
      uniformOnly?: boolean
      controlOnly?: boolean
      label?: string
    }
  | {
      image: any
      controlOnly: true
      uniformOnly: false
    }

export class ControlsFactory<T extends string> {
  constructor(public options: Record<T, TControl>) {
    this.setUniforms()
    this.setControls()
  }

  private $uniforms: TUniform = {}
  private $controls: Record<T, TControl> = {} as Record<T, TControl>

  setUniforms() {
    Object.entries<TControl>(this.options).forEach(([name, control]) => {
      if (!control.controlOnly) {
        this.$uniforms[name] = { value: control.value }
      }
    })
  }

  setControls() {
    const ctrls = Object.entries<TControl>(this.options).reduce(
      (acc, [name, control]) => {
        if (!control.uniformOnly) {
          acc[name] = control
        }

        return acc
      },
      {} as Record<string, TControl>,
    )
    this.$controls = ctrls
  }

  getUniforms() {
    type TUniformItem = TUniform[keyof TUniform]

    type TUniformSchema = Record<keyof typeof this.$controls, TUniformItem>

    return this.$uniforms as TUniformSchema
  }

  getControls() {
    // type of return is Schema but with keys of this.$controls
    type TSchemaItemWithOptions = Schema[keyof Schema]

    type TSchema = Record<keyof typeof this.$controls, TSchemaItemWithOptions>

    return this.$controls as TSchema
  }
}
