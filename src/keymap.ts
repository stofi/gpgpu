const Keymap = {
  forward: 'forward',
  back: 'back',
  left: 'left',
  right: 'right',
  jump: 'jump',
} as const

export type TKeymap = typeof Keymap[keyof typeof Keymap]

export default Keymap
