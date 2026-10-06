export const usd = (n, { sign = false, decimals = 0 } = {}) => {
  const abs = Math.abs(n).toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })
  if (n < 0) return `-$${abs}`
  return `${sign ? '+' : ''}$${abs}`
}

export const num = (n, decimals = 0) =>
  n.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })

export const pct = (n, { sign = true, decimals = 1 } = {}) =>
  `${sign && n > 0 ? '+' : ''}${n.toFixed(decimals)}%`

export const cx = (...classes) => classes.filter(Boolean).join(' ')
