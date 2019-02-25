/// <reference types="node" />
/// <reference types="react" />
/// <reference types="react-dom" />

declare namespace NodeJS {
  interface ProcessEnv {
    NODE_ENV: 'development' | 'production' | 'test'
    PUBLIC_URL: string
  }
}

// IMAGES
declare module '*.gif' {
  const src: string
  export default src
}
declare module '*.jpg' {
  const src: string
  export default src
}
declare module '*.jpeg' {
  const src: string
  export default src
}
declare module '*.png' {
  const src: string
  export default src
}
declare module '*.webp' {
  const src: string
  export default src
}

// VIDEOS
declare module '*.mp4' {
  const src: string
  export default src
}
declare module '*.webm' {
  const src: string
  export default src
}

// SHADERS
declare module '*.glsl' {
  const src: string
  export default src
}
declare module '*.frag' {
  const src: string
  export default src
}
declare module '*.vert' {
  const src: string
  export default src
}

// VARIOUS
declare module '*.pdf' {
  const src: string
  export default src
}

declare module '*.json5' {
  const src: {}
  export default src
}

declare module '*.svg' {
  import * as React from 'react'

  export const ReactComponent: React.SFC<React.SVGProps<SVGSVGElement>>

  const src: string
  export default src
}

declare module '*.module.css' {
  const classes: { [key: string]: string }
  export default classes
}

declare module '*.csv' {
  const src: Array<{}>
  export default src
}
