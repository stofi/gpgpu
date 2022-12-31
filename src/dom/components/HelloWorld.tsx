import type { ReactNode } from 'react'

export default function HelloWorld({ children }: { children?: ReactNode }) {
  return <div className='HelloWorld'>{children}</div>
}
