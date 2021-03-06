export function hexToRGB(hex) {
  const shorthand = /^#?([a-f\d])([a-f\d])([a-f\d])$/i
  if(hex.match(shorthand)) {
    hex = hex.replace(shorthand, (m, r, g, b) => {
      return r + r + g + g + b + b
    })
  }

  const result = hex.match(/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i)

  return [
    parseInt(result[1], 16),
    parseInt(result[2], 16),
    parseInt(result[3], 16),
  ]
}