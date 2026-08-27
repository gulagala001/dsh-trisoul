/** CSS Modules（tsdown 预设 dsh-css-modules-inline 内联注入，类名表为 local → hashed）。仅供 tsc 类型检查。 */
declare module '*.module.css' {
  const classes: Readonly<Record<string, string>>
  export default classes
}
